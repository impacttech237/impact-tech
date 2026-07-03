/* ------------------------------------------------------------------
   IMPACT TECH — Script client unique.
   Regroupe : smooth scroll (Lenis + GSAP ScrollTrigger), toutes les
   animations d'entrée/scroll par section, et l'interactivité qui ne
   peut pas être du pur CSS (menu mobile, header au scroll, carousel
   services, accordéon FAQ, filtre portfolio, formulaires AJAX).
   Remplace les hooks React (useLayoutEffect/useState) des anciens
   composants "use client".
------------------------------------------------------------------- */
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ================= Smooth scroll (Lenis + GSAP) ================= */
function initSmoothScroll() {
  if (reduced) return;
  const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
  lenis.on("scroll", ScrollTrigger.update);
  const raf = (time) => lenis.raf(time * 1000);
  gsap.ticker.add(raf);
  gsap.ticker.lagSmoothing(0);
}

/* ================= Header : solide au scroll + masquage ================= */
function initHeader() {
  const header = document.querySelector("[data-header]");
  if (!header) return;
  let lastY = 0;

  const onScroll = () => {
    const y = window.scrollY;
    header.classList.toggle("header--solid", y > 50);
    header.classList.toggle("header--hidden", y > 300 && y > lastY);
    lastY = y;
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  const burger = document.querySelector("[data-burger]");
  const mobileMenu = document.querySelector("[data-mobile-menu]");
  if (burger && mobileMenu) {
    const closeMenu = () => {
      burger.setAttribute("aria-expanded", "false");
      header.classList.remove("header--menu-open");
      mobileMenu.classList.remove("is-open");
      document.body.style.overflow = "";
    };
    burger.addEventListener("click", () => {
      const open = burger.getAttribute("aria-expanded") === "true";
      if (open) return closeMenu();
      burger.setAttribute("aria-expanded", "true");
      header.classList.add("header--solid", "header--menu-open");
      mobileMenu.classList.add("is-open");
      document.body.style.overflow = "hidden";
    });
    mobileMenu.querySelectorAll("a").forEach((a) => a.addEventListener("click", closeMenu));
  }
}

/* ================= Hero ================= */
function initHero() {
  const hero = document.querySelector(".hero");
  if (!hero) return;

  if (reduced) {
    gsap.set(".hero-word, .gsap-hidden", { clearProps: "all", opacity: 1, y: 0 });
    return;
  }

  const ctx = gsap.context(() => {
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    tl.from(".hero-word", { y: 60, opacity: 0, duration: 0.9, stagger: 0.08 })
      .to(".hero__badge", { opacity: 1, y: 0, duration: 0.7 }, 0.15)
      .to(".hero__subtitle", { opacity: 1, y: 0, duration: 0.7 }, 0.3)
      .to(".hero__pill", { opacity: 1, y: 0, duration: 0.6, stagger: 0.09 }, 0.45)
      .to(".hero__cta", { opacity: 1, y: 0, duration: 0.7 }, 0.6)
      .to(".hero__scroll", { opacity: 1, duration: 0.8 }, 0.9);

    gsap.set([".hero__badge", ".hero__subtitle", ".hero__pill", ".hero__cta"], { y: 24 });

    const bg = hero.querySelector(".hero__bg");
    gsap.to(bg, {
      yPercent: 14,
      ease: "none",
      scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true },
    });

    gsap.to(".hero__content", {
      opacity: 0.25,
      yPercent: -8,
      ease: "none",
      scrollTrigger: { trigger: hero, start: "40% top", end: "bottom top", scrub: true },
    });
  }, hero);
}

/* ================= Reveal générique (fade-up au scroll) ================= */
function revealOnScroll(selector, opts = {}) {
  document.querySelectorAll(selector).forEach((container) => {
    const targets = opts.targetSelector ? container.querySelectorAll(opts.targetSelector) : [container];
    if (!targets.length) return;
    gsap.from(targets, {
      y: opts.y ?? 50,
      opacity: 0,
      duration: opts.duration ?? 0.8,
      stagger: opts.stagger ?? 0,
      ease: "power2.out",
      scrollTrigger: { trigger: container, start: opts.start ?? "top 85%" },
    });
  });
}

/* ================= Sections marketing (fade-up standard) ================= */
function initStandardSections() {
  if (reduced) return;

  revealOnScroll(".services-head > *", { targetSelector: null, stagger: 0.1, start: "top 88%" });
  revealOnScroll(".service-card", { stagger: 0.12, start: "top 85%" });

  revealOnScroll(".offers-head > *", { stagger: 0.1, start: "top 88%" });
  revealOnScroll(".offer-card", { y: 60, stagger: 0.12, duration: 0.9 });

  gsap.from(".cta-banner__card", {
    y: 50, opacity: 0, scale: 0.97, duration: 0.9, ease: "power2.out",
    scrollTrigger: { trigger: ".cta-banner", start: "top 82%" },
  });

  revealOnScroll(".process-head > *", { stagger: 0.1, start: "top 85%" });
  gsap.from(".process-step", {
    x: -40, opacity: 0, duration: 0.8, stagger: 0.14, ease: "power2.out",
    scrollTrigger: { trigger: ".process-steps", start: "top 78%" },
  });
  if (document.querySelector(".process-visual")) {
    gsap.from(".process-visual", {
      clipPath: "inset(8% 8% 8% 8% round 30px)", opacity: 0, duration: 1.1, ease: "power2.out",
      scrollTrigger: { trigger: ".process-visual", start: "top 80%" },
    });
    gsap.fromTo(".process-visual img", { yPercent: -6 }, {
      yPercent: 6, ease: "none",
      scrollTrigger: { trigger: ".process-visual", start: "top bottom", end: "bottom top", scrub: true },
    });
    gsap.fromTo(".process-progress__bar", { scaleY: 0 }, {
      scaleY: 1, ease: "none",
      scrollTrigger: { trigger: ".process-steps", start: "top 70%", end: "bottom 45%", scrub: true },
    });
  }

  revealOnScroll(".stats", { targetSelector: ".stat-item", stagger: 0.1, start: "top 82%" });
  revealOnScroll(".stats-thumbs", { targetSelector: ".stat-thumb", y: 60, stagger: 0.08, start: "top 90%" });
  document.querySelectorAll(".stat-num").forEach((el) => {
    const target = parseFloat(el.dataset.value);
    const obj = { val: 0 };
    gsap.to(obj, {
      val: target, duration: 2.5, ease: "power2.out",
      scrollTrigger: { trigger: el, start: "top 85%", once: true },
      onUpdate: () => {
        el.textContent = Math.round(obj.val).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
      },
    });
  });

  revealOnScroll(".testi-head > *", { stagger: 0.1, start: "top 85%" });
  document.querySelectorAll(".testi-col-inner").forEach((el, i) => {
    const dir = i === 1 ? 1 : -1;
    const dist = el.scrollHeight / 2;
    gsap.fromTo(el, { y: dir === 1 ? -dist : 0 }, { y: dir === 1 ? 0 : -dist, duration: 38 + i * 6, ease: "none", repeat: -1 });
  });

  gsap.from(".bigtitle-char", {
    yPercent: 110, duration: 0.8, stagger: 0.03, ease: "power3.out",
    scrollTrigger: { trigger: ".bigtitle", start: "top 75%", toggleActions: "play none none reverse" },
  });
  if (document.querySelector(".bigtitle-line--2")) {
    gsap.fromTo(".bigtitle-line--2", { x: 40 }, {
      x: -40, ease: "none",
      scrollTrigger: { trigger: ".bigtitle", start: "top bottom", end: "bottom top", scrub: true },
    });
  }

  revealOnScroll(".blog-card", { stagger: 0.12, start: "top 85%", duration: 0.9, y: 60 });
  if (document.querySelector(".blog-title-word")) {
    gsap.fromTo(".blog-title-word", { opacity: 0.16 }, {
      opacity: 1, stagger: 0.08, ease: "none",
      scrollTrigger: { trigger: ".blog-head", start: "top 80%", end: "top 45%", scrub: true },
    });
  }

  if (document.querySelector(".about-story__media")) {
    gsap.from(".about-story__media", { x: -60, opacity: 0, duration: 0.9, ease: "power2.out", scrollTrigger: { trigger: ".about-story", start: "top 78%" } });
    gsap.from(".about-story__content > *", { y: 30, opacity: 0, duration: 0.7, stagger: 0.09, ease: "power2.out", scrollTrigger: { trigger: ".about-story", start: "top 75%" } });
    gsap.from(".value-card", { y: 50, opacity: 0, duration: 0.8, stagger: 0.1, ease: "power2.out", scrollTrigger: { trigger: ".about-values", start: "top 82%" } });
  }

  if (document.querySelector(".sd-block")) {
    document.querySelectorAll(".sd-block").forEach((block) => {
      const media = block.querySelector(".sd-media");
      const content = block.querySelector(".sd-content");
      const reversed = block.classList.contains("sd-block--reverse");
      gsap.from(media, { x: reversed ? 60 : -60, opacity: 0, duration: 0.9, ease: "power2.out", scrollTrigger: { trigger: block, start: "top 78%" } });
      gsap.from(content.children, { y: 30, opacity: 0, duration: 0.7, stagger: 0.08, ease: "power2.out", scrollTrigger: { trigger: block, start: "top 75%" } });
    });
  }

  if (document.querySelector(".pf-filters")) {
    gsap.from(".pf-filters", { y: 24, opacity: 0, duration: 0.7, ease: "power2.out", scrollTrigger: { trigger: ".portfolio", start: "top 85%" } });
    gsap.from(".pf-card", { y: 60, opacity: 0, duration: 0.9, stagger: 0.1, ease: "power2.out", scrollTrigger: { trigger: ".pf-grid", start: "top 85%" } });
  }

  if (document.querySelector(".blog-featured")) {
    gsap.from(".blog-featured", { y: 50, opacity: 0, duration: 0.9, ease: "power2.out", scrollTrigger: { trigger: ".bloglist", start: "top 85%" } });
    gsap.from(".bl-card", { y: 60, opacity: 0, duration: 0.9, stagger: 0.1, ease: "power2.out", scrollTrigger: { trigger: ".bl-grid", start: "top 85%" } });
  }

  if (document.querySelector(".contact-channel")) {
    gsap.from(".contact-channel", { y: 40, opacity: 0, duration: 0.8, stagger: 0.1, ease: "power2.out", scrollTrigger: { trigger: ".contact", start: "top 82%" } });
    gsap.from(".contact-form", { y: 50, opacity: 0, duration: 0.9, ease: "power2.out", scrollTrigger: { trigger: ".contact-form", start: "top 85%" } });
  }

  if (document.querySelector(".faq-item")) {
    gsap.from(".faq-item", { y: 30, opacity: 0, duration: 0.7, stagger: 0.08, ease: "power2.out", scrollTrigger: { trigger: ".faq", start: "top 80%" } });
  }

  if (document.querySelector(".newsletter")) {
    gsap.from(".newsletter__inner > *", { y: 30, opacity: 0, duration: 0.8, stagger: 0.1, ease: "power2.out", scrollTrigger: { trigger: ".newsletter", start: "top 82%" } });
  }

  /* Promise : titre scrubbé + blobs flottants */
  if (document.querySelector(".promise-word")) {
    gsap.fromTo(".promise-word", { opacity: 0.16 }, {
      opacity: 1, stagger: 0.06, ease: "none",
      scrollTrigger: { trigger: ".promise-title", start: "top 80%", end: "top 40%", scrub: true },
    });
    gsap.from(".promise-badge", { y: 24, opacity: 0, duration: 0.7, ease: "power2.out", scrollTrigger: { trigger: ".promise", start: "top 85%" } });
    gsap.from(".blob", { scale: 0.4, opacity: 0, duration: 0.8, stagger: 0.1, ease: "back.out(1.6)", scrollTrigger: { trigger: ".promise", start: "top 75%" } });
    document.querySelectorAll(".blob").forEach((el) => {
      gsap.to(el, { y: "+=12", rotation: "+=2", duration: gsap.utils.random(3, 4), ease: "sine.inOut", repeat: -1, yoyo: true, delay: gsap.utils.random(0, 1.5) });
    });
  }

  /* CTA banner : avion + étincelles */
  if (document.querySelector(".cta-plane")) {
    gsap.to(".cta-plane", { y: "-=10", rotation: "+=4", duration: 3, ease: "sine.inOut", repeat: -1, yoyo: true });
    document.querySelectorAll(".cta-spark").forEach((el, i) => {
      gsap.to(el, { scale: 0.6, opacity: 0.4, duration: 1.6, ease: "sine.inOut", repeat: -1, yoyo: true, delay: i * 0.5 });
    });
  }
}

/* ================= PageHero (pages intérieures) ================= */
function initPageHero() {
  const el = document.querySelector(".page-hero");
  if (!el) return;
  if (reduced) {
    gsap.set(".ph-word, .ph-fade", { opacity: 1, y: 0 });
    return;
  }
  const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
  tl.from(".ph-word", { y: 50, opacity: 0, duration: 0.8, stagger: 0.07 })
    .to(".ph-fade", { opacity: 1, y: 0, duration: 0.7, stagger: 0.12 }, 0.25);
  gsap.set(".ph-fade", { y: 20 });
}

/* ================= Services : carousel drag + pagination ================= */
function initServicesCarousel() {
  const track = document.querySelector(".services-track");
  const dotsWrap = document.querySelector(".services-dots");
  if (!track) return;

  let pageCount = 1;
  let page = 0;

  const goTo = (i) => {
    const max = track.scrollWidth - track.clientWidth;
    track.scrollTo({ left: (max / (pageCount - 1 || 1)) * i, behavior: "smooth" });
  };

  const renderDots = () => {
    dotsWrap.innerHTML = "";
    for (let i = 0; i < pageCount; i++) {
      const btn = document.createElement("button");
      btn.className = `services-dot ${page === i ? "is-active" : ""}`;
      btn.setAttribute("role", "tab");
      btn.setAttribute("aria-selected", String(page === i));
      btn.setAttribute("aria-label", `Page ${i + 1}`);
      btn.addEventListener("click", () => goTo(i));
      dotsWrap.appendChild(btn);
    }
  };

  const computePages = () => {
    const max = track.scrollWidth - track.clientWidth;
    pageCount = max <= 4 ? 1 : Math.ceil(track.scrollWidth / track.clientWidth);
    page = Math.min(pageCount - 1, Math.round(((track.scrollLeft / max) || 0) * (pageCount - 1)));
    renderDots();
  };

  computePages();
  track.addEventListener("scroll", () => computePages(), { passive: true });
  window.addEventListener("resize", computePages);

  document.querySelectorAll('[data-carousel="prev"], [data-carousel="next"]').forEach((btn) => {
    btn.addEventListener("click", () => {
      const dir = btn.dataset.carousel === "next" ? 1 : -1;
      const card = track.querySelector(".service-card");
      const delta = card ? card.offsetWidth + 24 : track.clientWidth * 0.5;
      track.scrollBy({ left: dir * delta, behavior: "smooth" });
    });
  });

  let down = false, startX = 0, startScroll = 0, moved = false;
  track.addEventListener("mousedown", (e) => {
    down = true; moved = false; startX = e.pageX; startScroll = track.scrollLeft;
    track.classList.add("is-dragging");
  });
  window.addEventListener("mousemove", (e) => {
    if (!down) return;
    const dx = e.pageX - startX;
    if (Math.abs(dx) > 4) moved = true;
    track.scrollLeft = startScroll - dx;
  });
  window.addEventListener("mouseup", () => { down = false; track.classList.remove("is-dragging"); });
  track.addEventListener(
    "click",
    (e) => {
      if (moved) { e.preventDefault(); e.stopPropagation(); }
    },
    true
  );
}

/* ================= FAQ : accordéon ================= */
function initFaq() {
  document.querySelectorAll("[data-faq-item]").forEach((item) => {
    const btn = item.querySelector("[data-faq-btn]");
    const panel = item.querySelector("[data-faq-panel]");
    btn?.addEventListener("click", () => {
      const isOpen = item.classList.contains("is-open");
      document.querySelectorAll("[data-faq-item]").forEach((other) => {
        other.classList.remove("is-open");
        other.querySelector("[data-faq-btn]")?.setAttribute("aria-expanded", "false");
      });
      if (!isOpen) {
        item.classList.add("is-open");
        btn.setAttribute("aria-expanded", "true");
      }
    });
  });
}

/* ================= Portfolio : filtre par catégorie ================= */
function initPortfolioFilter() {
  const filters = document.querySelectorAll("[data-pf-filter]");
  const grid = document.querySelector("[data-pf-grid]");
  if (!filters.length || !grid) return;

  filters.forEach((btn) => {
    btn.addEventListener("click", () => {
      const cat = btn.dataset.pfFilter;
      filters.forEach((b) => {
        b.classList.toggle("is-active", b === btn);
        b.setAttribute("aria-selected", String(b === btn));
      });
      grid.querySelectorAll(".pf-card").forEach((card) => {
        const show = cat === "Tous" || card.dataset.pfCat === cat;
        card.style.display = show ? "" : "none";
      });
    });
  });
}

/* ================= Formulaires AJAX (contact + newsletter) ================= */
function initAjaxForms() {
  document.querySelectorAll("[data-ajax-form]").forEach((form) => {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const submitBtn = form.querySelector("[data-form-submit]");
      const errorEl = form.querySelector("[data-form-error]");
      const doneEl = form.parentElement.querySelector("[data-form-done]");
      const originalLabel = submitBtn ? submitBtn.textContent : "";

      if (errorEl) { errorEl.style.display = "none"; errorEl.textContent = ""; }
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "Envoi en cours..."; }

      try {
        const fd = new FormData(form);
        const res = await fetch(form.getAttribute("action"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(Object.fromEntries(fd.entries())),
        });
        const data = await res.json();
        if (!res.ok || !data.ok) throw new Error(data.error || "Erreur d'envoi");

        form.style.display = "none";
        if (doneEl) doneEl.style.display = "";
      } catch (err) {
        if (errorEl) {
          errorEl.textContent = err.message || "Erreur d'envoi, réessayez ou écrivez-nous sur WhatsApp.";
          errorEl.style.display = "";
        } else if (doneEl) {
          doneEl.style.display = "";
          doneEl.textContent = "✓ Merci !";
        }
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = originalLabel; }
      }
    });
  });
}

/* ================= Boot ================= */
function boot() {
  initSmoothScroll();
  initHeader();
  initHero();
  initPageHero();
  initStandardSections();
  initServicesCarousel();
  initFaq();
  initPortfolioFilter();
  initAjaxForms();
  ScrollTrigger.refresh();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
