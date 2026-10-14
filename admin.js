const storageKey = 'bakigroup_projects';
const defaultPassword = '123456';

const loginScreen = document.getElementById('loginScreen');
const adminApp = document.getElementById('adminApp');
const loginForm = document.getElementById('loginForm');
const passwordInput = document.getElementById('passwordInput');
const loginError = document.getElementById('loginError');
const successToast = document.getElementById('successToast');

const form = document.getElementById('projectForm');
const projectList = document.getElementById('projectList');
const saveStatus = document.getElementById('saveStatus');
const saveLocalBtn = document.getElementById('saveLocalBtn');
const resetBtn = document.getElementById('resetBtn');
const logoutBtn = document.getElementById('logoutBtn');
const imageUpload = document.getElementById('imageUpload');

const githubConfig = {
  owner: 'your-github-username',
  repo: 'your-repo-name',
  branch: 'main',
  token: 'your-personal-access-token'
};

function setStatus(message, isError = false) {
  saveStatus.textContent = message;
  saveStatus.className = isError ? 'text-xs text-red-600' : 'text-xs text-slate-500';
}

function showToast() {
  successToast.classList.remove('hidden');
  clearTimeout(showToast.timeoutId);
  showToast.timeoutId = setTimeout(() => {
    successToast.classList.add('hidden');
  }, 2500);
}

function getProjectsFromLocalStorage() {
  const raw = localStorage.getItem(storageKey);
  return raw ? JSON.parse(raw) : [];
}

function saveProjectsToLocalStorage(projects) {
  localStorage.setItem(storageKey, JSON.stringify(projects, null, 2));
}

function renderProjectList(projects) {
  if (!projectList) return;

  if (!projects.length) {
    projectList.innerHTML = '<p class="text-sm text-slate-500">Henüz proje yok.</p>';
    return;
  }

  projectList.innerHTML = projects
    .map(
      (project) => `
        <div class="border border-slate-200 rounded-xl p-3 bg-white">
          <div class="flex gap-3">
            <img src="${project.image || 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=500&q=80'}" alt="${project.title}" class="w-20 h-20 object-cover rounded-lg" />
            <div class="flex-1 min-w-0">
              <h3 class="font-semibold text-slate-900 truncate">${project.title}</h3>
              <p class="text-xs text-slate-500 mt-1">${project.price || 'Fiyat belirtilmedi'}</p>
              <p class="text-sm text-slate-600 mt-2 line-clamp-3">${project.description}</p>
            </div>
          </div>
        </div>
      `
    )
    .join('');
}

function decodeBase64(input) {
  const normalized = input.replace(/\s/g, '');
  return decodeURIComponent(
    Array.from(atob(normalized), (char) => {
      return '%' + ('00' + char.charCodeAt(0).toString(16)).slice(-2);
    }).join('')
  );
}

function encodeBase64(input) {
  return btoa(unescape(encodeURIComponent(input)));
}

async function fetchRepoProjects() {
  const { owner, repo, branch, token } = githubConfig;

  if (!owner || !repo || !token) {
    return getProjectsFromLocalStorage();
  }

  const url = `https://api.github.com/repos/${owner}/${repo}/contents/projeler.json?ref=${branch}`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });

    if (!response.ok) {
      throw new Error('GitHub dosya bilgisi alınamadı.');
    }

    const data = await response.json();
    const parsed = JSON.parse(decodeBase64(data.content));
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error(error);
    return getProjectsFromLocalStorage();
  }
}

async function saveToGitHub(projects) {
  const { owner, repo, branch, token } = githubConfig;

  if (!owner || !repo || !token) {
    return false;
  }

  try {
    const infoUrl = `https://api.github.com/repos/${owner}/${repo}/contents/projeler.json?ref=${branch}`;
    const infoResponse = await fetch(infoUrl, {
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });

    let sha = null;

    if (infoResponse.ok) {
      const fileData = await infoResponse.json();
      sha = fileData.sha;
    } else if (infoResponse.status !== 404) {
      throw new Error('Mevcut dosya kontrol edilemedi.');
    }

    const payload = {
      message: 'Update project list',
      content: encodeBase64(JSON.stringify(projects, null, 2)),
      branch
    };

    if (sha) payload.sha = sha;

    const response = await fetch(infoUrl.replace(/\?.*$/, ''), {
      method: 'PUT',
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'GitHub API yazma işlemi başarısız oldu.');
    }

    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}

function setupLogin() {
  const sessionKey = 'bakigroup_admin_logged_in';

  const isLoggedIn = sessionStorage.getItem(sessionKey) === 'true';
  if (isLoggedIn) {
    loginScreen.classList.add('hidden');
    adminApp.classList.remove('hidden');
  }

  loginForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const enteredPassword = passwordInput.value.trim();
    if (enteredPassword === defaultPassword) {
      sessionStorage.setItem(sessionKey, 'true');
      loginScreen.classList.add('hidden');
      adminApp.classList.remove('hidden');
      loginError.classList.add('hidden');
      passwordInput.value = '';
      return;
    }

    loginError.classList.remove('hidden');
    passwordInput.value = '';
  });

  logoutBtn.addEventListener('click', () => {
    sessionStorage.removeItem(sessionKey);
    adminApp.classList.add('hidden');
    loginScreen.classList.remove('hidden');
    loginError.classList.add('hidden');
    passwordInput.focus();
  });
}

function readImageAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Resim okunamadı.'));
    reader.readAsDataURL(file);
  });
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const title = document.getElementById('title').value.trim();
  const description = document.getElementById('description').value.trim();
  const price = document.getElementById('price').value.trim();
  const uploadedImage = imageUpload.files[0];
  let image = document.getElementById('image').value.trim();

  if (!title || !description) {
    alert('Başlık ve açıklama alanları boş bırakılamaz.');
    return;
  }

  if (!image && uploadedImage) {
    try {
      image = await readImageAsDataUrl(uploadedImage);
    } catch (error) {
      console.error(error);
      alert('Resim yükleme sırasında hata oluştu.');
      return;
    }
  }

  if (!image) {
    alert('Lütfen resim URL si girin veya bir dosya yükleyin.');
    return;
  }

  const newProject = {
    id: Date.now(),
    title,
    description,
    image,
    price: price || 'Fiyat belirtilmedi'
  };

  const currentProjects = getProjectsFromLocalStorage();
  const updatedProjects = [newProject, ...currentProjects];
  saveProjectsToLocalStorage(updatedProjects);
  renderProjectList(updatedProjects);

  setStatus('Yerel hafızaya kaydedildi.');

  const githubSaved = await saveToGitHub(updatedProjects);
  if (githubSaved) {
    setStatus('GitHub güncellendi.');
  }

  showToast();
  form.reset();
  imageUpload.value = '';
});

saveLocalBtn.addEventListener('click', () => {
  const projects = getProjectsFromLocalStorage();
  saveProjectsToLocalStorage(projects);
  renderProjectList(projects);
  setStatus('Yerel hafıza güncellendi.');
});

resetBtn.addEventListener('click', () => {
  form.reset();
  imageUpload.value = '';
  setStatus('Form temizlendi.');
});

setupLogin();
renderProjectList(getProjectsFromLocalStorage());
