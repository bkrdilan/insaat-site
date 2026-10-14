const menuToggle = document.querySelector(".menu-toggle");
const navigation = document.querySelector(".site-navigation");
const yearLabel = document.querySelector("#current-year");

function setMenuOpen(isOpen) {
  if (!menuToggle || !navigation) {
    return;
  }

  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "Menüyü kapat" : "Menüyü aç");
  navigation.classList.toggle("is-open", isOpen);
  document.body.classList.toggle("menu-open", isOpen);
}

if (menuToggle && navigation) {
  menuToggle.addEventListener("click", () => {
    const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
    setMenuOpen(!isOpen);
  });

  navigation.addEventListener("click", (event) => {
    if (event.target instanceof Element && event.target.closest("a")) {
      setMenuOpen(false);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      setMenuOpen(false);
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 700) {
      setMenuOpen(false);
    }
  });
}

if (yearLabel) {
  yearLabel.textContent = String(new Date().getFullYear());
}

async function loadProjects() {
  const container = document.querySelector("#projects-grid");
  if (!container) {
    return;
  }

  const fallbackProjects = [
    {
      title: "Modern Yaşam Alanı",
      description: "Günlük yaşamı kolaylaştıran, estetiği ön planda tutan modern bir konut tasarımı.",
      image: "https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&w=1200&q=80",
      price: "₺1.250.000",
    },
    {
      title: "Çağdaş Mimari",
      description: "Doğal ışık, sade çizgiler ve yüksek konfor odaklı modern yaşam alanı.",
      image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
      price: "₺1.860.000",
    },
    {
      title: "İş ve Yaşam Merkezi",
      description: "İşlevsellik, kullanıcı deneyimi ve estetik hedeflerin birlikte planlandığı ticari proje.",
      image: "https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=1200&q=80",
      price: "₺2.320.000",
    }
  ];

  try {
    const response = await fetch("projeler.json?t=" + Date.now());
    if (!response.ok) {
      throw new Error("projeler.json yüklenemedi");
    }

    const projects = await response.json();
    renderProjects(projects, container);
  } catch (error) {
    console.error("Project data error:", error);
    renderProjects(fallbackProjects, container);
  }
}

function renderProjects(projects, container) {
  if (!Array.isArray(projects) || !projects.length) {
    container.innerHTML = '<p class="empty-projects">Henüz proje eklenmemiş.</p>';
    return;
  }

  container.innerHTML = projects
    .map(
      (project) => `
        <article class="project-card reveal">
          <div class="project-image">
            <img src="${project.image || "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80"}" alt="${project.title}" loading="lazy">
            <span class="project-tag">${project.price || "Proje"}</span>
          </div>
          <div class="project-info">
            <span class="project-category">PROJE</span>
            <h3>${project.title}</h3>
            <p>${project.description}</p>
            <a class="text-link project-link" href="project-detail.html">
              Detayları gör <span aria-hidden="true">↗</span>
            </a>
          </div>
        </article>
      `
    )
    .join("");

  const revealElements = document.querySelectorAll(".reveal");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if ("IntersectionObserver" in window && !prefersReducedMotion) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    revealElements.forEach((element) => revealObserver.observe(element));
  } else {
    revealElements.forEach((element) => element.classList.add("is-visible"));
  }
}

const filterButtons = document.querySelectorAll(".filter-button");
const projectCards = document.querySelectorAll(".project-card[data-category]");

if (filterButtons.length && projectCards.length) {
  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const activeFilter = button.dataset.filter;

      filterButtons.forEach((item) => {
        item.classList.toggle("is-active", item === button);
      });

      projectCards.forEach((card) => {
        const cardCategory = card.dataset.category;
        const shouldShow = activeFilter === "all" || cardCategory === activeFilter;
        card.classList.toggle("is-hidden", !shouldShow);
      });
    });
  });
}

loadProjects();

const revealElements = document.querySelectorAll(".reveal");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if ("IntersectionObserver" in window && !prefersReducedMotion) {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  revealElements.forEach((element) => revealObserver.observe(element));
} else {
  revealElements.forEach((element) => element.classList.add("is-visible"));
}