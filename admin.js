const apiBaseUrl = 'https://holy-snow-cf17.bkrdilann.workers.dev';
const sessionKey = 'bakigroup_admin_session';

const loginScreen = document.getElementById('loginScreen');
const adminApp = document.getElementById('adminApp');
const loginForm = document.getElementById('loginForm');
const passwordInput = document.getElementById('passwordInput');
const loginError = document.getElementById('loginError');
const successToast = document.getElementById('successToast');
const form = document.getElementById('projectForm');
const projectList = document.getElementById('projectList');
const saveStatus = document.getElementById('saveStatus');
const resetBtn = document.getElementById('resetBtn');
const logoutBtn = document.getElementById('logoutBtn');
const imageUpload = document.getElementById('imageUpload');

function setStatus(message, isError = false) {
  saveStatus.textContent = message;
  saveStatus.className = isError ? 'text-xs text-red-600' : 'text-xs text-slate-500';
}

function showToast() {
  successToast.classList.remove('hidden');
  clearTimeout(showToast.timeoutId);
  showToast.timeoutId = setTimeout(() => {
    successToast.classList.add('hidden');
  }, 3500);
}

async function request(path, options = {}) {
  const headers = new Headers(options.headers || {});
  headers.set('Accept', 'application/json');

  if (options.body) {
    headers.set('Content-Type', 'application/json');
  }

  const token = sessionStorage.getItem(sessionKey);
  if (token) {
    headers.set('Authorization', 'Bearer ' + token);
  }

  const response = await fetch(`${apiBaseUrl}${path}`, { ...options, headers });
  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(result.error || 'İşlem tamamlanamadı. Lütfen tekrar deneyin.');
  }

  return result;
}

function renderProjectList(projects) {
  projectList.replaceChildren();

  if (!projects.length) {
    const emptyMessage = document.createElement('p');
    emptyMessage.className = 'text-sm text-slate-500';
    emptyMessage.textContent = 'Henüz proje yok.';
    projectList.append(emptyMessage);
    return;
  }

  projects.forEach((project) => {
    const card = document.createElement('div');
    card.className = 'border border-slate-200 rounded-xl p-3 bg-white';
    const row = document.createElement('div');
    row.className = 'flex gap-3';
    const image = document.createElement('img');
    image.src = project.image;
    image.alt = project.title;
    image.className = 'w-20 h-20 object-cover rounded-lg';
    const content = document.createElement('div');
    content.className = 'flex-1 min-w-0';
    const title = document.createElement('h3');
    title.className = 'font-semibold text-slate-900 truncate';
    title.textContent = project.title;
    const price = document.createElement('p');
    price.className = 'text-xs text-slate-500 mt-1';
    price.textContent = project.price || 'Fiyat belirtilmedi';
    const description = document.createElement('p');
    description.className = 'text-sm text-slate-600 mt-2 line-clamp-3';
    description.textContent = project.description;
    content.append(title, price, description);
    row.append(image, content);
    card.append(row);
    projectList.append(card);
  });
}

async function loadProjects() {
  try {
    const result = await request('/api/projects');
    renderProjectList(result.projects);
    setStatus('Projeler yüklendi.');
  } catch (error) {
    setStatus(error.message, true);
  }
}

function readImageAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Resim okunamadı.'));
      }
    };
    reader.onerror = () => reject(new Error('Resim okunamadı.'));
    reader.readAsDataURL(file);
  });
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  loginError.classList.add('hidden');

  try {
    const result = await request('/api/login', {
      method: 'POST',
      body: JSON.stringify({ password: passwordInput.value })
    });
    sessionStorage.setItem(sessionKey, result.token);
    passwordInput.value = '';
    loginScreen.classList.add('hidden');
    adminApp.classList.remove('hidden');
    await loadProjects();
  } catch (error) {
    loginError.textContent = error.message;
    loginError.classList.remove('hidden');
    passwordInput.value = '';
  }
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const submitButton = form.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  setStatus('Proje GitHub’a gönderiliyor…');

  try {
    const uploadedImage = imageUpload.files[0];
    let image = document.getElementById('image').value.trim();

    if (uploadedImage) {
      if (!uploadedImage.type.startsWith('image/')) {
        throw new Error('Lütfen geçerli bir resim dosyası seçin.');
      }
      if (uploadedImage.size > 3 * 1024 * 1024) {
        throw new Error('Resim boyutu en fazla 3 MB olabilir.');
      }
      image = await readImageAsDataUrl(uploadedImage);
    }

    if (!image) {
      throw new Error('Bir resim URL’si girin veya resim dosyası yükleyin.');
    }

    const project = {
      id: crypto.randomUUID(),
      title: document.getElementById('title').value.trim(),
      description: document.getElementById('description').value.trim(),
      image,
      price: document.getElementById('price').value.trim() || 'Fiyat belirtilmedi'
    };

    const result = await request('/api/publish', {
      method: 'POST',
      body: JSON.stringify({ project })
    });
    renderProjectList(result.projects);
    setStatus('GitHub güncellendi. Sitenin yayınlanması birkaç dakika sürebilir.');
    showToast();
    form.reset();
  } catch (error) {
    setStatus(error.message, true);
  } finally {
    submitButton.disabled = false;
  }
});

resetBtn.addEventListener('click', () => {
  form.reset();
  setStatus('Form temizlendi.');
});

logoutBtn.addEventListener('click', () => {
  sessionStorage.removeItem(sessionKey);
  adminApp.classList.add('hidden');
  loginScreen.classList.remove('hidden');
  projectList.replaceChildren();
  passwordInput.focus();
});

if (sessionStorage.getItem(sessionKey)) {
  loginScreen.classList.add('hidden');
  adminApp.classList.remove('hidden');
  loadProjects();
}
