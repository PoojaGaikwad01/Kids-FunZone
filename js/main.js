// Kids FunZone — shared site behaviour (vanilla JS, no dependencies)

document.addEventListener("DOMContentLoaded", () => {
  initMobileNav();
  initScrollReveal();
  initBackToTop();
  initAccordion();
  initGalleryFilter();
  initLightbox();
  initContactForm();
  initFooterYear();
});

/* ---------- Mobile navigation ---------- */
function initMobileNav() {
  const toggle = document.querySelector(".hamburger");
  const menu = document.querySelector(".mobile-menu");
  if (!toggle || !menu) return;

  const closeMenu = () => {
    menu.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  };

  toggle.addEventListener("click", () => {
    const isOpen = menu.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(isOpen));
    document.body.style.overflow = isOpen ? "hidden" : "";
  });

  menu.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMenu();
  });
}

/* ---------- Scroll reveal ---------- */
function initScrollReveal() {
  const items = document.querySelectorAll("[data-animate]");
  if (!items.length) return;

  if (!("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("in-view"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
  );

  items.forEach((el) => observer.observe(el));
}

/* ---------- Back to top ---------- */
function initBackToTop() {
  const btn = document.querySelector(".back-to-top");
  if (!btn) return;

  window.addEventListener(
    "scroll",
    () => {
      btn.classList.toggle("is-visible", window.scrollY > 500);
    },
    { passive: true }
  );

  btn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

/* ---------- FAQ accordion ---------- */
function initAccordion() {
  const items = document.querySelectorAll(".accordion-item");
  if (!items.length) return;

  items.forEach((item) => {
    const trigger = item.querySelector(".accordion-trigger");
    const panel = item.querySelector(".accordion-panel");
    if (!trigger || !panel) return;

    trigger.addEventListener("click", () => {
      const isOpen = item.classList.contains("is-open");

      items.forEach((other) => {
        other.classList.remove("is-open");
        other.querySelector(".accordion-trigger")?.setAttribute("aria-expanded", "false");
        const otherPanel = other.querySelector(".accordion-panel");
        if (otherPanel) otherPanel.style.maxHeight = "";
      });

      if (!isOpen) {
        item.classList.add("is-open");
        trigger.setAttribute("aria-expanded", "true");
        panel.style.maxHeight = panel.scrollHeight + "px";
      }
    });
  });
}

/* ---------- Gallery filter ---------- */
function initGalleryFilter() {
  const filterBtns = document.querySelectorAll(".filter-btn");
  const items = document.querySelectorAll(".gallery-item");
  if (!filterBtns.length || !items.length) return;

  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const filter = btn.dataset.filter;

      items.forEach((item) => {
        const match = filter === "all" || item.dataset.category === filter;
        item.classList.toggle("hide", !match);
      });
    });
  });
}

/* ---------- Lightbox ---------- */
function initLightbox() {
  const lightbox = document.querySelector(".lightbox");
  const items = document.querySelectorAll(".gallery-item");
  if (!lightbox || !items.length) return;

  const label = lightbox.querySelector(".ph-label");
  const closeBtn = lightbox.querySelector(".lightbox-close");

  const open = (text) => {
    if (label) label.textContent = text;
    lightbox.classList.add("is-open");
    document.body.style.overflow = "hidden";
  };

  const close = () => {
    lightbox.classList.remove("is-open");
    document.body.style.overflow = "";
  };

  items.forEach((item) => {
    item.addEventListener("click", () => {
      const text = item.querySelector(".ph-label")?.textContent || "Gallery photo";
      open(text);
    });
  });

  closeBtn?.addEventListener("click", close);
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) close();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });
}

/* ---------- Contact form validation ---------- */
function initContactForm() {
  const form = document.querySelector(".contact-form");
  if (!form) return;

  const successMsg = document.querySelector(".form-success");

  const validators = {
    name: (v) => v.trim().length >= 2,
    email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
    phone: (v) => /^[0-9+\-\s]{7,15}$/.test(v.trim()),
    message: (v) => v.trim().length >= 10,
  };

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    let isValid = true;

    Object.keys(validators).forEach((name) => {
      const input = form.elements.namedItem(name);
      if (!input) return;
      const field = input.closest(".field");
      const valid = validators[name](input.value);
      field?.classList.toggle("has-error", !valid);
      if (!valid) isValid = false;
    });

    if (isValid) {
      form.reset();
      successMsg?.classList.add("is-visible");
      form.querySelectorAll(".field").forEach((f) => f.classList.remove("has-error"));
      successMsg?.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      successMsg?.classList.remove("is-visible");
    }
  });
}

/* ---------- Footer year ---------- */
function initFooterYear() {
  const el = document.querySelector("#footer-year");
  if (el) el.textContent = new Date().getFullYear();
}
