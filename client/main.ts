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
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { CustomEase } from "gsap/CustomEase";
import { Flip } from "gsap/Flip";
import { SplitText } from "gsap/SplitText";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { MorphSVGPlugin } from "gsap/MorphSVGPlugin";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import { Draggable } from "gsap/Draggable";
import { InertiaPlugin } from "gsap/InertiaPlugin";
import { Observer } from "gsap/Observer";
import { Physics2DPlugin } from "gsap/Physics2DPlugin";
import Lenis from "lenis";

gsap.registerPlugin(
  ScrollTrigger, ScrollToPlugin, CustomEase, Flip, SplitText,
  DrawSVGPlugin, MotionPathPlugin, MorphSVGPlugin, ScrambleTextPlugin,
  Draggable, InertiaPlugin, Observer, Physics2DPlugin
);

CustomEase.create("impact-out", "M0,0 C0.18,0.82 0.22,1 1,1");
CustomEase.create("impact-snap", "M0,0 C0.65,0 0.12,1 1,1");

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
let lenisInstance = null;

/* ================= Smooth scroll (Lenis + GSAP) ================= */
function initSmoothScroll() {
  if (reduced) return;
  const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
  lenisInstance = lenis;
  lenis.on("scroll", ScrollTrigger.update);
  const raf = (time) => lenis.raf(time * 1000);
  gsap.ticker.add(raf);
  gsap.ticker.lagSmoothing(0);
}

/* ================= Système motion global ================= */
/* Tracé vectoriel exact de l'icône Impact Tech (public/images/icone.png),
   obtenu par potrace. Le loader le « redessine » (drawSVG) puis le remplit. */
const ICON_MARK_PATH = "M 209.500 224.397 C 185.207 232.134, 175.436 259.552, 189.775 279.747 C 192.934 284.196, 203.909 297.900, 225.216 324 C 227.686 327.025, 236.828 338.275, 245.531 349 C 254.235 359.725, 264.107 371.875, 267.469 376 C 280.182 391.600, 316.914 436.952, 345.756 472.660 C 358.667 488.644, 366.411 497.371, 369.256 499.144 C 380.291 506.017, 396.905 504.256, 405.118 495.342 C 406.558 493.779, 417.351 480.125, 429.102 465 C 449.097 439.265, 484.874 393.586, 504.684 368.500 C 514.986 355.454, 535.071 329.803, 543.500 318.926 C 546.800 314.668, 554.450 304.803, 560.500 297.004 C 566.550 289.204, 574.326 279.160, 577.781 274.682 C 583.873 266.786, 588.035 257.382, 587.979 251.645 C 587.893 242.874, 580.612 231.265, 572 226.165 L 567.500 223.500 390.500 223.311 C 249.465 223.161, 212.687 223.381, 209.500 224.397 M 708.235 224.590 C 698.761 227.911, 699.582 227.071, 661.436 272.500 C 656.062 278.900, 604.725 340.745, 573.030 379 C 559.588 395.225, 543.359 414.800, 536.966 422.500 C 512.987 451.381, 501.974 465.634, 500.263 470 C 498.613 474.211, 498.483 483.552, 498.233 615.410 C 497.941 769.531, 497.751 764.051, 503.662 771.801 C 508.148 777.682, 553.915 831.416, 663.902 959.933 C 736.215 1044.429, 728.623 1036.579, 737.231 1035.752 C 744.082 1035.093, 746.583 1032.267, 747.348 1024.317 C 747.656 1021.118, 747.886 898.627, 747.860 752.116 L 747.813 485.732 750.429 483.116 L 753.044 480.500 862.772 479.951 L 972.500 479.403 983.377 476.725 C 1024.665 466.561, 1054.503 442.013, 1072.674 403.259 C 1087.320 372.023, 1089.576 336.715, 1078.966 304.804 C 1064.533 261.398, 1027.675 230.208, 983.566 224.072 C 970.251 222.220, 713.619 222.703, 708.235 224.590";

function initMotionShell() {
  document.body.classList.add("motion-ready");

  const shell = document.createElement("div");
  shell.className = "motion-shell";
  shell.setAttribute("aria-hidden", "true");
  shell.innerHTML = `
    <div class="motion-progress"><span></span></div>
    <div class="motion-cursor"><span class="motion-cursor__core"></span><span class="motion-cursor__ring"></span></div>
    <div class="motion-wipe">
      <span></span><span></span><span></span>
      <div class="motion-loader-mark">
        <svg viewBox="0 0 1254 1254" role="img" aria-label="Impact Tech">
          <path d="${ICON_MARK_PATH}" />
        </svg>
      </div>
    </div>
  `;
  document.body.appendChild(shell);

  const progress = shell.querySelector(".motion-progress span");
  gsap.set(progress, { scaleX: 0, transformOrigin: "left center" });
  gsap.to(progress, {
    scaleX: 1,
    ease: "none",
    scrollTrigger: { start: 0, end: "max", scrub: 0.25 },
  });

  const wipeBars = shell.querySelectorAll(".motion-wipe > span");
  const loaderMark = shell.querySelector(".motion-loader-mark");
  const loaderPaths = shell.querySelectorAll(".motion-loader-mark path");

  // Arrivée via navigation interne ? L'icône a déjà été dessinée sur la page
  // précédente (avant le départ) : on se contente ici de lever le voile, sans
  // la redessiner. => l'icône ne se forme qu'UNE seule fois par écran de chargement.
  let cameFromInternalNav = false;
  try { cameFromInternalNav = sessionStorage.getItem("it-nav") === "1"; sessionStorage.removeItem("it-nav"); } catch {}

  if (!reduced) {
    if (cameFromInternalNav) {
      gsap.set(loaderMark, { autoAlpha: 0 });
      gsap.timeline({ defaults: { ease: "impact-snap" } })
        .set(wipeBars, { scaleY: 1, transformOrigin: "top center" })
        .to(wipeBars, { scaleY: 0, duration: .42, stagger: .04, ease: "power3.inOut" }, .08);
    } else {
      gsap.timeline({ defaults: { ease: "impact-snap" } })
        .set(wipeBars, { scaleY: 1, transformOrigin: "top center" })
        .set(loaderMark, { autoAlpha: 1 })
        .fromTo(loaderMark,
          { scale: .72, rotation: -8 },
          { scale: 1, rotation: 0, duration: .5, ease: "back.out(1.7)" },
          0,
        )
        .fromTo(loaderPaths,
          { drawSVG: "0% 0%", fill: "rgba(192,32,43,0)" },
          { drawSVG: "0% 100%", fill: "rgba(192,32,43,1)", duration: .62, ease: "power2.out" },
          0,
        )
        .to(loaderMark, { scale: 1.12, autoAlpha: 0, duration: .24, ease: "power2.in" }, .78)
        .to(wipeBars, { scaleY: 0, duration: .38, stagger: .03, ease: "power3.inOut" }, .92);
    }
  } else {
    gsap.set(wipeBars, { scaleY: 0 });
    gsap.set(loaderMark, { autoAlpha: 0 });
  }

  if (!finePointer || reduced) return;

  const cursor = shell.querySelector(".motion-cursor");
  const core = shell.querySelector(".motion-cursor__core");
  const ring = shell.querySelector(".motion-cursor__ring");
  const cursorX = gsap.quickTo(core, "x", { duration: 0.16, ease: "power3.out" });
  const cursorY = gsap.quickTo(core, "y", { duration: 0.16, ease: "power3.out" });
  const ringX = gsap.quickTo(ring, "x", { duration: 0.48, ease: "power3.out" });
  const ringY = gsap.quickTo(ring, "y", { duration: 0.48, ease: "power3.out" });

  window.addEventListener("pointermove", (event) => {
    cursorX(event.clientX);
    cursorY(event.clientY);
    ringX(event.clientX);
    ringY(event.clientY);
    cursor.classList.add("is-visible");
  }, { passive: true });
  document.documentElement.addEventListener("mouseleave", () => cursor.classList.remove("is-visible"));
  window.addEventListener("pointerdown", () => cursor.classList.add("is-pressed"));
  window.addEventListener("pointerup", () => cursor.classList.remove("is-pressed"));

  document.querySelectorAll("a, button, input, select, textarea, .motion-card").forEach((el) => {
    el.addEventListener("pointerenter", () => cursor.classList.add("is-active"));
    el.addEventListener("pointerleave", () => cursor.classList.remove("is-active"));
  });
}

function initPageTransitions() {
  if (reduced) return;
  const bars = document.querySelectorAll(".motion-wipe span");
  const loaderMark = document.querySelector(".motion-loader-mark");
  const loaderPaths = document.querySelectorAll(".motion-loader-mark path");

  document.querySelectorAll('a[href]').forEach((link) => {
    link.addEventListener("click", (event) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (link.target === "_blank" || link.hasAttribute("download")) return;
      const destination = new URL(link.href, window.location.href);
      if (destination.origin !== window.location.origin || destination.hash || destination.href === window.location.href) return;

      event.preventDefault();
      // Même loader que le chargement initial : les barres couvrent l'écran
      // pendant que l'icône Impact Tech se dessine, puis on navigue. Le drapeau
      // "it-nav" indique à la page suivante que l'icône a déjà été dessinée
      // (elle se contentera de lever le voile) => un seul écran de chargement.
      try { sessionStorage.setItem("it-nav", "1"); } catch {}
      const tl = gsap.timeline({ onComplete: () => window.location.assign(destination.href) });
      tl.set(bars, { transformOrigin: "bottom center" })
        .to(bars, { scaleY: 1, duration: 0.5, stagger: 0.05, ease: "impact-snap" }, 0);
      if (loaderMark && loaderPaths.length) {
        tl.set(loaderMark, { autoAlpha: 1 }, 0)
          .fromTo(loaderMark, { scale: .72, rotation: -8 }, { scale: 1, rotation: 0, duration: .5, ease: "back.out(1.7)" }, .18)
          .fromTo(loaderPaths,
            { drawSVG: "0% 0%", fill: "rgba(192,32,43,0)" },
            { drawSVG: "0% 100%", fill: "rgba(192,32,43,1)", duration: .55, ease: "power2.out" }, .18);
      }
    });
  });

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const target = document.querySelector(link.getAttribute("href"));
      if (!target) return;
      event.preventDefault();
      if (lenisInstance) lenisInstance.scrollTo(target, { offset: -70, duration: 1.35 });
      else gsap.to(window, { scrollTo: { y: target, offsetY: 70 }, duration: 1.1, ease: "impact-out" });
    });
  });
}

function initMagneticElements() {
  if (!finePointer || reduced) return;
  const targets = gsap.utils.toArray(".btn-pill, .services-arrow, .sd-anchor, .pf-filter, .header__nav a, .cta-banner__whatsapp, .contact-form__next, .contact-form__back, .contact-form__submit, .bl-newsletter__form button, .article-reading__tools button");

  targets.forEach((el) => {
    const xTo = gsap.quickTo(el, "x", { duration: 0.45, ease: "elastic.out(1, 0.45)" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.45, ease: "elastic.out(1, 0.45)" });
    el.addEventListener("pointermove", (event) => {
      const rect = el.getBoundingClientRect();
      xTo((event.clientX - rect.left - rect.width / 2) * 0.22);
      yTo((event.clientY - rect.top - rect.height / 2) * 0.22);
    });
    el.addEventListener("pointerleave", () => {
      xTo(0);
      yTo(0);
    });
  });
}

function initMotionCards() {
  const selectors = [
    ".service-card__inner", ".offer-card", ".value-card", ".pf-card__inner",
    ".blog-card__inner", ".blog-featured__inner", ".contact-channel", ".faq-item", ".article-related__card > a",
  ];
  const cards = gsap.utils.toArray(selectors.join(",")).filter((card) => {
    return !(document.body.classList.contains("immersive-home") && card.classList.contains("offer-card"));
  });
  cards.forEach((card) => {
    card.classList.add("motion-card");
    const glow = document.createElement("span");
    glow.className = "motion-card__glow";
    glow.setAttribute("aria-hidden", "true");
    card.appendChild(glow);
  });

  if (!finePointer || reduced) return;
  cards.forEach((card) => {
    const image = card.querySelector("img");
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      const nx = (event.clientX - rect.left) / rect.width - 0.5;
      const ny = (event.clientY - rect.top) / rect.height - 0.5;
      card.style.setProperty("--pointer-x", `${(nx + 0.5) * 100}%`);
      card.style.setProperty("--pointer-y", `${(ny + 0.5) * 100}%`);
      gsap.to(card, {
        rotationY: nx * 7,
        rotationX: ny * -7,
        z: 18,
        transformPerspective: 900,
        duration: 0.55,
        ease: "power3.out",
        overwrite: "auto",
      });
      if (image) gsap.to(image, { xPercent: nx * 3, yPercent: ny * 3, scale: 1.07, duration: 0.7, ease: "power3.out", overwrite: "auto" });
    });
    card.addEventListener("pointerleave", () => {
      gsap.to(card, { rotationX: 0, rotationY: 0, z: 0, duration: 0.8, ease: "elastic.out(1, .45)", overwrite: "auto" });
      if (image) gsap.to(image, { xPercent: 0, yPercent: 0, scale: 1, duration: 0.8, ease: "power3.out", overwrite: "auto" });
    });
  });
}

function initKineticTypography() {
  if (reduced) return;
  const titles = gsap.utils.toArray(
    ".services-title, .offers-title, .process-title, .stats-title, .testi-title, .cta-banner__title, .newsletter__title, .about-values__head h2, .contact-form h2"
  );

  titles.forEach((title) => {
    if (document.body.classList.contains("experience-a-propos") && title.closest(".about-values")) return;
    if (document.body.classList.contains("experience-contact") && title.closest(".contact-form")) return;
    const split = new SplitText(title, { type: "lines,words", linesClass: "motion-line", wordsClass: "motion-word" });
    gsap.from(split.lines, {
      yPercent: 115,
      rotation: 2.5,
      opacity: 0,
      duration: 1.05,
      stagger: 0.11,
      ease: "impact-out",
      scrollTrigger: { trigger: title, start: "top 88%", toggleActions: "play none none reverse" },
    });
  });
}

function initScrollMotionGraphics() {
  if (reduced) return;

  gsap.utils.toArray("main > section").forEach((section, index) => {
    const inner = section.querySelector(":scope > .container-it");
    const dedicatedInternalScene =
      (section.classList.contains("services-detail") && document.body.classList.contains("experience-services"))
      || (section.classList.contains("portfolio") && document.body.classList.contains("experience-realisations"))
      || (section.classList.contains("about") && document.body.classList.contains("experience-a-propos"))
      || (section.classList.contains("bloglist") && document.body.classList.contains("experience-blog"))
      || (section.classList.contains("contact") && document.body.classList.contains("experience-contact"))
      || (section.classList.contains("faq") && document.body.classList.contains("experience-contact"))
      || document.body.classList.contains("experience-article");
    if (inner && !section.classList.contains("hero") && !dedicatedInternalScene) {
      gsap.fromTo(inner,
        { y: 34, rotationX: 2.2, transformPerspective: 1000, transformOrigin: "50% 100%" },
        {
          y: -18,
          rotationX: 0,
          ease: "none",
          scrollTrigger: { trigger: section, start: "top bottom", end: "bottom top", scrub: 1.1 },
        }
      );
    }
    const direction = index % 2 === 0 ? 1 : -1;
    gsap.to(section, {
      "--motion-drift": `${direction * 36}px`,
      ease: "none",
      scrollTrigger: { trigger: section, start: "top bottom", end: "bottom top", scrub: 1.6 },
    });
  });

  document.querySelectorAll(".section-badge").forEach((badge) => {
    gsap.to(badge, {
      y: -5,
      rotation: gsap.utils.random(-1.2, 1.2),
      duration: gsap.utils.random(2.2, 3.4),
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });
  });

  const marquee = document.querySelector(".marquee__stage");
  if (marquee) {
    gsap.fromTo(marquee, { rotation: -5, scale: 1.08 }, {
      rotation: 1.5,
      scale: 1,
      ease: "none",
      scrollTrigger: { trigger: ".marquee", start: "top bottom", end: "bottom top", scrub: 1 },
    });
  }

  const newsletter = document.querySelector(".newsletter");
  if (newsletter) {
    gsap.to(".newsletter__shape--one", { xPercent: 28, rotation: 70, ease: "none", scrollTrigger: { trigger: newsletter, start: "top bottom", end: "bottom top", scrub: 1.2 } });
    gsap.to(".newsletter__shape--two", { xPercent: -24, yPercent: 18, scale: 1.18, ease: "none", scrollTrigger: { trigger: newsletter, start: "top bottom", end: "bottom top", scrub: 1.4 } });
    gsap.to(".footer__emblem", { y: -10, rotation: 2.5, duration: 2.8, repeat: -1, yoyo: true, ease: "sine.inOut" });
  }
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
    if (!document.body.classList.contains("immersive-home")) {
      gsap.to(bg, {
        yPercent: 14,
        ease: "none",
        scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true },
      });
      gsap.to(".hero__content", {
        opacity: 0.25,
        yPercent: -8,
        scale: 0.94,
        ease: "none",
        scrollTrigger: { trigger: hero, start: "40% top", end: "bottom top", scrub: true },
      });
      gsap.fromTo(hero, { borderRadius: "0 0 30px 30px" }, {
        borderRadius: "0 0 90px 90px",
        scale: 0.94,
        transformOrigin: "center bottom",
        ease: "none",
        scrollTrigger: { trigger: hero, start: "55% top", end: "bottom top", scrub: 1 },
      });
    }

    gsap.to(".hero__scroll-line", {
      scaleY: 0.25,
      transformOrigin: "top center",
      duration: 1,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });

    if (finePointer) {
      hero.addEventListener("pointermove", (event) => {
        const nx = event.clientX / window.innerWidth - 0.5;
        const ny = event.clientY / window.innerHeight - 0.5;
        gsap.to(bg, { xPercent: nx * -2.5, y: ny * 16, duration: 1.8, ease: "power3.out", overwrite: "auto" });
        gsap.to(".hero__content", { x: nx * 18, y: ny * 12, duration: 1.2, ease: "power3.out", overwrite: "auto" });
        gsap.to(".hero__badge", { x: nx * 25, y: ny * 18, duration: 1, ease: "power3.out", overwrite: "auto" });
      });
    }
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

  if (document.querySelector(".cta-banner__card")) {
    gsap.from(".cta-banner__card", {
      y: 50, opacity: 0, scale: 0.97, duration: 0.9, ease: "power2.out",
      scrollTrigger: { trigger: ".cta-banner", start: "top 82%" },
    });
  }

  revealOnScroll(".process-head > *", { stagger: 0.1, start: "top 85%" });
  if (document.querySelector(".process-step")) {
    gsap.from(".process-step", {
      x: -40, opacity: 0, duration: 0.8, stagger: 0.14, ease: "power2.out",
      scrollTrigger: { trigger: ".process-steps", start: "top 78%" },
    });
  }
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

  if (document.querySelector(".bigtitle-char")) {
    gsap.from(".bigtitle-char", {
      yPercent: 110, duration: 0.8, stagger: 0.03, ease: "power3.out",
      scrollTrigger: { trigger: ".bigtitle", start: "top 75%", toggleActions: "play none none reverse" },
    });
  }
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

  if (document.querySelector(".about-story__media") && !document.body.classList.contains("experience-a-propos")) {
    gsap.from(".about-story__media", { x: -60, opacity: 0, duration: 0.9, ease: "power2.out", scrollTrigger: { trigger: ".about-story", start: "top 78%" } });
    gsap.from(".about-story__content > *", { y: 30, opacity: 0, duration: 0.7, stagger: 0.09, ease: "power2.out", scrollTrigger: { trigger: ".about-story", start: "top 75%" } });
    gsap.from(".value-card", { y: 50, opacity: 0, duration: 0.8, stagger: 0.1, ease: "power2.out", scrollTrigger: { trigger: ".about-values", start: "top 82%" } });
  }

  if (document.querySelector(".sd-block") && !document.body.classList.contains("experience-services")) {
    document.querySelectorAll(".sd-block").forEach((block) => {
      const media = block.querySelector(".sd-media");
      const content = block.querySelector(".sd-content");
      const reversed = block.classList.contains("sd-block--reverse");
      gsap.from(media, { x: reversed ? 60 : -60, opacity: 0, duration: 0.9, ease: "power2.out", scrollTrigger: { trigger: block, start: "top 78%" } });
      gsap.from(content.children, { y: 30, opacity: 0, duration: 0.7, stagger: 0.08, ease: "power2.out", scrollTrigger: { trigger: block, start: "top 75%" } });
    });
  }

  if (document.querySelector(".pf-filters") && !document.body.classList.contains("experience-realisations")) {
    gsap.from(".pf-filters", { y: 24, opacity: 0, duration: 0.7, ease: "power2.out", scrollTrigger: { trigger: ".portfolio", start: "top 85%" } });
    gsap.from(".pf-card", { y: 60, opacity: 0, duration: 0.9, stagger: 0.1, ease: "power2.out", scrollTrigger: { trigger: ".pf-grid", start: "top 85%" } });
  }

  if (document.querySelector(".blog-featured") && !document.body.classList.contains("experience-blog")) {
    gsap.from(".blog-featured", { y: 50, opacity: 0, duration: 0.9, ease: "power2.out", scrollTrigger: { trigger: ".bloglist", start: "top 85%" } });
    gsap.from(".bl-card", { y: 60, opacity: 0, duration: 0.9, stagger: 0.1, ease: "power2.out", scrollTrigger: { trigger: ".bl-grid", start: "top 85%" } });
  }

  if (document.querySelector(".contact-channel") && !document.body.classList.contains("experience-contact")) {
    gsap.from(".contact-channel", { y: 40, opacity: 0, duration: 0.8, stagger: 0.1, ease: "power2.out", scrollTrigger: { trigger: ".contact", start: "top 82%" } });
    gsap.from(".contact-form", { y: 50, opacity: 0, duration: 0.9, ease: "power2.out", scrollTrigger: { trigger: ".contact-form", start: "top 85%" } });
  }

  if (document.querySelector(".faq-item") && !document.body.classList.contains("experience-contact")) {
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

/* ================= Expérience home immersive ================= */
function wrapBadgeLabels() {
  document.querySelectorAll(".section-badge").forEach((badge) => {
    if (badge.querySelector(".badge-label")) return;
    const textNodes = Array.from(badge.childNodes).filter((node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
    textNodes.forEach((node) => {
      const span = document.createElement("span");
      span.className = "badge-label";
      span.textContent = node.textContent.trim();
      node.replaceWith(span);
    });
  });
}

function initScrambleLabels() {
  wrapBadgeLabels();
  if (reduced) return;
  document.querySelectorAll(".badge-label, .hero__badge-label").forEach((label) => {
    const original = label.textContent;
    ScrollTrigger.create({
      trigger: label,
      start: "top 92%",
      once: true,
      onEnter: () => gsap.to(label, {
        duration: 0.9,
        scrambleText: { text: original, chars: "01IMPACT", revealDelay: 0.16, speed: 0.45 },
        ease: "none",
      }),
    });
  });
}

function initHeroImmersiveScene() {
  const hero = document.querySelector(".hero");
  if (!hero || reduced) return;

  gsap.set(".hero__orbit-path, .hero__orbit-ring", { drawSVG: "0% 0%" });
  const intro = gsap.timeline({ defaults: { ease: "impact-out" } });
  intro
    .to(".hero__orbit-path--outer", { drawSVG: "0% 100%", duration: 1.7 }, 0.15)
    .to(".hero__orbit-ring", { drawSVG: "0% 100%", duration: 1.4, stagger: 0.16 }, 0.3)
    .to(".hero__orbit-path--route", { drawSVG: "0% 100%", duration: 1.5 }, 0.42)
    .from(".hero__impact-mark", { scale: 0, rotation: -120, autoAlpha: 0, duration: 1.1 }, 0.45)
    .from(".hero__chapter", { x: -30, autoAlpha: 0, duration: 0.8 }, 0.75);

  gsap.to(".hero__runner", {
    duration: 7,
    repeat: -1,
    ease: "none",
    motionPath: { path: "#hero-motion-path", align: "#hero-motion-path", alignOrigin: [0.5, 0.5] },
  });
  gsap.to(".hero__pulse", { scale: 2.4, autoAlpha: 0, duration: 1.5, stagger: 0.5, repeat: -1, ease: "power2.out" });

  const scrollTl = gsap.timeline({
    scrollTrigger: {
      trigger: hero,
      start: "top top",
      end: "+=145%",
      pin: true,
      scrub: 1,
      anticipatePin: 1,
    },
  });
  scrollTl
    .to(".hero__orbit", { rotation: 95, scale: 1.34, transformOrigin: "50% 50%", duration: 1 }, 0)
    .to(".hero__impact-mark", { scale: 5.2, autoAlpha: 0.035, rotation: 90, duration: 1 }, 0)
    .to(".hero__content", { yPercent: -46, scale: 0.68, autoAlpha: 0, duration: 0.72 }, 0.12)
    .to(".hero__bg", { scale: 1.22, filter: "blur(8px)", duration: 1 }, 0)
    .to(".hero__overlay", { backgroundColor: "rgba(14,14,12,.92)", duration: 1 }, 0.18)
    .to(".hero__chapter", { yPercent: -160, autoAlpha: 0, duration: .45 }, .25);
}

function initHorizontalServices() {
  const scene = document.querySelector(".services__scene");
  const track = document.querySelector(".services-track");
  const carousel = document.querySelector(".services-carousel");
  const cards = gsap.utils.toArray(".service-card");
  if (!scene || !track || !carousel || !cards.length || reduced) return;

  const mm = gsap.matchMedia();
  mm.add("(min-width: 992px)", () => {
    const getDistance = () => Math.max(0, track.scrollWidth - carousel.clientWidth + window.innerWidth * 0.08);
    const horizontalTween = gsap.to(track, {
      x: () => -getDistance(),
      ease: "none",
      scrollTrigger: {
        trigger: scene,
        start: "top top",
        end: () => `+=${Math.max(window.innerWidth * 2.2, getDistance() * 1.15)}`,
        pin: true,
        scrub: 1,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        snap: cards.length > 1 ? {
          snapTo: 1 / (cards.length - 1),
          duration: { min: 0.12, max: 0.35 },
          delay: 0.08,
          ease: "power2.inOut",
        } : false,
        onUpdate: (self) => {
          const index = Math.min(cards.length - 1, Math.round(self.progress * (cards.length - 1)));
          const count = document.querySelector(".services__rail-count");
          if (count) count.textContent = `${String(index + 1).padStart(2, "0")} / ${String(cards.length).padStart(2, "0")}`;
          gsap.to(".services__rail-line", { scaleX: Math.max(.06, self.progress), transformOrigin: "left center", duration: .2, overwrite: true });
        },
      },
    });

    cards.forEach((card) => {
      const image = card.querySelector("img");
      const body = card.querySelector(".service-card__body");
      gsap.fromTo(card, { rotationY: 12, scale: .84, autoAlpha: .35 }, {
        rotationY: -8,
        scale: 1,
        autoAlpha: 1,
        ease: "none",
        scrollTrigger: {
          trigger: card,
          containerAnimation: horizontalTween,
          start: "left 92%",
          end: "right 16%",
          scrub: 1,
        },
      });
      if (image) gsap.fromTo(image, { scale: 1.2, xPercent: -8 }, {
        scale: 1.03,
        xPercent: 8,
        ease: "none",
        scrollTrigger: {
          trigger: card,
          containerAnimation: horizontalTween,
          start: "left right",
          end: "right left",
          scrub: true,
        },
      });
      if (body) gsap.from(body.children, {
        y: 36,
        autoAlpha: 0,
        stagger: .08,
        duration: .7,
        ease: "impact-out",
        scrollTrigger: {
          trigger: card,
          containerAnimation: horizontalTween,
          start: "left 72%",
          toggleActions: "play none none reverse",
        },
      });
    });
  });
}

function initPromiseMorphScene() {
  const section = document.querySelector(".promise");
  const stage = section?.querySelector(".promise__stage");
  const words = gsap.utils.toArray(".promise-word");
  const blobs = gsap.utils.toArray(".promise .blob");
  if (!section || !stage || !words.length || reduced) return;

  gsap.set(words, {
    x: () => gsap.utils.random(-260, 260),
    y: () => gsap.utils.random(-170, 170),
    rotation: () => gsap.utils.random(-35, 35),
    scale: () => gsap.utils.random(.25, .7),
    autoAlpha: 0,
  });
  gsap.set(blobs, { scale: 0, autoAlpha: 0 });

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: "top top",
      end: "+=230%",
      pin: stage,
      scrub: 1,
      anticipatePin: 1,
      snap: { snapTo: [0, .34, .68, 1], duration: { min: .12, max: .3 }, delay: .06 },
    },
  });
  tl
    .to(words, { x: 0, y: 0, rotation: 0, scale: 1, autoAlpha: 1, stagger: { amount: .5, from: "random" }, ease: "impact-snap", duration: 1 }, 0)
    .to(blobs, { scale: 1, autoAlpha: 1, stagger: .1, ease: "back.out(1.7)", duration: .55 }, .35)
    .to("#promise-shape", { morphSVG: { shape: "#promise-shape-two", type: "rotational" }, duration: 1, ease: "power2.inOut" }, .72)
    .to(".promise__morph-wrap", { rotation: 80, scale: 1.12, duration: 1 }, .72)
    .to(".promise__mark", { rotation: -80, scale: .74, duration: 1 }, .72)
    .to(words, { color: (i, el) => el.classList.contains("accent") ? "#c0202b" : "#1a1a17", stagger: { amount: .25, from: "center" }, duration: .45 }, 1.25)
    .to("#promise-shape", { morphSVG: { shape: "#promise-shape-three", type: "rotational" }, duration: 1, ease: "power2.inOut" }, 1.45)
    .to(blobs, {
      x: (i) => Math.cos((i / blobs.length) * Math.PI * 2) * 90,
      y: (i) => Math.sin((i / blobs.length) * Math.PI * 2) * 55,
      rotation: (i) => i % 2 ? 13 : -13,
      duration: .8,
      ease: "power2.inOut",
    }, 1.45);
}

function initOffersDeck() {
  const section = document.querySelector(".offers");
  const scene = section?.querySelector(".offers__scene");
  const cards = gsap.utils.toArray(".offers .offer-card");
  const indicators = gsap.utils.toArray(".offers__progress span");
  if (!section || !scene || cards.length < 2 || reduced) return;

  const mm = gsap.matchMedia();
  mm.add("(min-width: 992px)", () => {
    gsap.set(cards.slice(1), { yPercent: 112, rotation: (i) => 7 + i * 3, scale: .88, autoAlpha: 0 });
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: `+=${cards.length * 105}%`,
        pin: scene,
        scrub: 1,
        anticipatePin: 1,
        snap: { snapTo: 1 / (cards.length - 1), duration: { min: .12, max: .35 }, delay: .08 },
        onUpdate: (self) => {
          const active = Math.min(cards.length - 1, Math.round(self.progress * (cards.length - 1)));
          indicators.forEach((item, index) => item.classList.toggle("is-active", index === active));
        },
      },
    });
    cards.forEach((card, index) => {
      if (index === 0) return;
      const previous = cards[index - 1];
      tl.to(previous, { xPercent: -72, yPercent: -8, rotation: -10, scale: .72, autoAlpha: .16, duration: 1, ease: "power2.inOut" }, index - 1)
        .to(card, { yPercent: 0, rotation: 0, scale: 1, autoAlpha: 1, duration: 1, ease: "impact-snap" }, index - 1);
    });
  });
}

function initCtaMotionPath() {
  const section = document.querySelector(".cta-banner");
  if (!section || reduced) return;
  gsap.set("#cta-motion-path", { drawSVG: "0% 0%" });
  const tl = gsap.timeline({
    scrollTrigger: { trigger: section, start: "top 78%", end: "bottom 25%", scrub: 1 },
  });
  tl
    .to("#cta-motion-path", { drawSVG: "0% 100%", duration: 1, ease: "none" }, 0)
    .fromTo(".cta-banner__card",
      { clipPath: "circle(5% at 50% 50%)", scale: .86 },
      { clipPath: "circle(76% at 50% 50%)", scale: 1, duration: 1, ease: "power3.inOut" },
      0,
    )
    .to(".cta-plane", {
      duration: 1,
      ease: "none",
      motionPath: { path: "#cta-motion-path", align: "#cta-motion-path", alignOrigin: [.5, .5], autoRotate: true },
    }, 0)
    .from(".cta-banner__title .motion-word", { yPercent: 120, rotation: 8, autoAlpha: 0, stagger: .035, duration: .55, ease: "impact-out" }, .18)
    .from(".cta-banner__actions", { scale: .6, autoAlpha: 0, duration: .45, ease: "back.out(1.7)" }, .55);
}

function initVelocityMarquee() {
  const section = document.querySelector(".marquee");
  const tracks = gsap.utils.toArray(".marquee-track");
  if (!section || !tracks.length || reduced) return;

  const loops = tracks.map((track, index) => gsap.to(track, {
    xPercent: index % 2 ? 50 : -50,
    duration: 26 + index * 5,
    repeat: -1,
    ease: "none",
  }));
  const kick = (direction) => {
    loops.forEach((loop, index) => gsap.to(loop, { timeScale: direction * (index % 2 ? -2.4 : 2.4), duration: .18, overwrite: true }));
    gsap.to(loops, { timeScale: 1, duration: 1.2, ease: "power3.out", delay: .18 });
    gsap.to(".marquee__stage", { skewY: direction * 2.2, rotation: direction * 1.2, duration: .22, yoyo: true, repeat: 1, ease: "power2.out" });
  };
  Observer.create({ target: window, type: "wheel,touch", tolerance: 24, onUp: () => kick(1), onDown: () => kick(-1) });
}

function initProcessTimeline() {
  const section = document.querySelector(".process");
  const card = section?.querySelector(".process__card");
  const steps = gsap.utils.toArray(".process-step");
  if (!section || !card || !steps.length || reduced) return;

  const mm = gsap.matchMedia();
  mm.add("(min-width: 992px)", () => {
    gsap.set("#process-draw-path", { drawSVG: "0% 0%" });
    gsap.set(steps, { autoAlpha: .24, scale: .88, x: -20 });
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: `+=${steps.length * 82}%`,
        pin: card,
        scrub: 1,
        anticipatePin: 1,
        snap: { snapTo: 1 / Math.max(1, steps.length - 1), duration: { min: .1, max: .28 }, delay: .06 },
        onUpdate: (self) => {
          const active = Math.min(steps.length - 1, Math.floor(self.progress * steps.length));
          steps.forEach((step, index) => step.classList.toggle("is-active", index === active));
        },
      },
    });
    tl.to("#process-draw-path", { drawSVG: "0% 100%", duration: steps.length, ease: "none" }, 0);
    steps.forEach((step, index) => {
      tl.to(step, { autoAlpha: 1, scale: 1, x: 0, duration: .42, ease: "impact-out" }, index)
        .to(step, { autoAlpha: index === steps.length - 1 ? 1 : .24, scale: index === steps.length - 1 ? 1 : .88, duration: .35 }, index + .58)
        .to(".process-visual img", { scale: 1.05 + index * .025, xPercent: (index % 2 ? -1 : 1) * (index + 1), duration: 1, ease: "none" }, index);
    });
  });
  mm.add("(max-width: 991px)", () => {
    gsap.fromTo("#process-draw-path", { drawSVG: "0% 0%" }, {
      drawSVG: "0% 100%",
      ease: "none",
      scrollTrigger: { trigger: ".process-visual", start: "top 82%", end: "bottom 30%", scrub: 1 },
    });
    gsap.fromTo(steps, { x: -24, autoAlpha: .2 }, {
      x: 0,
      autoAlpha: 1,
      stagger: .12,
      duration: .7,
      ease: "impact-out",
      scrollTrigger: { trigger: ".process-steps", start: "top 82%" },
    });
  });
}

function initStatsConstellation() {
  const section = document.querySelector(".stats");
  const container = section?.querySelector(".container-it");
  const stats = gsap.utils.toArray(".stat-item");
  const rings = gsap.utils.toArray(".stat-ring__value");
  const thumbs = gsap.utils.toArray(".stat-thumb");
  if (!section || !container || !stats.length || reduced) return;

  const mm = gsap.matchMedia();
  mm.add("(min-width: 992px)", () => {
    gsap.set(rings, { drawSVG: "0% 0%" });
    gsap.set(stats, { scale: 0, rotation: (i) => i % 2 ? 55 : -55, autoAlpha: 0 });
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: "+=190%",
        pin: container,
        scrub: 1,
        anticipatePin: 1,
      },
    });
    tl
      .to(stats, { scale: 1, rotation: 0, autoAlpha: 1, stagger: .12, duration: .9, ease: "back.out(1.45)" }, 0)
      .to(rings, { drawSVG: (i) => `0% ${68 + i * 8}%`, stagger: .09, duration: 1.1, ease: "none" }, .16)
      .from(thumbs, { scale: 0, autoAlpha: 0, stagger: { amount: .5, from: "random" }, ease: "back.out(1.7)", duration: .6 }, .32)
      .to(thumbs, { rotation: (i) => i % 2 ? 24 : -24, x: (i) => i % 2 ? 45 : -45, y: (i) => i % 3 ? -34 : 34, duration: 1, ease: "none" }, 1.1);
  });
  mm.add("(max-width: 991px)", () => {
    gsap.from(stats, {
      y: 70,
      scale: .78,
      autoAlpha: 0,
      stagger: .12,
      duration: .85,
      ease: "impact-out",
      scrollTrigger: { trigger: ".stats-grid", start: "top 82%" },
    });
    gsap.fromTo(rings, { drawSVG: "0% 0%" }, {
      drawSVG: "0% 82%",
      stagger: .1,
      duration: 1,
      scrollTrigger: { trigger: ".stats-grid", start: "top 82%" },
    });
  });

  document.querySelectorAll(".stat-num").forEach((el) => {
    const target = Number(el.dataset.value) || 0;
    const value = { current: 0 };
    gsap.to(value, {
      current: target,
      duration: 1.6,
      ease: "power3.out",
      scrollTrigger: { trigger: el, start: "top 84%", once: true },
      onUpdate: () => { el.textContent = Math.round(value.current).toLocaleString("fr-FR"); },
    });
  });
}

function initTestimonialsDraggable() {
  const stage = document.querySelector(".testi-stage");
  const track = document.querySelector(".testi-track");
  if (!stage || !track || reduced) return;

  const getMinX = () => Math.min(0, stage.clientWidth - track.scrollWidth);
  Draggable.create(track, {
    type: "x",
    bounds: { minX: getMinX(), maxX: 0 },
    inertia: true,
    edgeResistance: .82,
    dragResistance: .08,
    onDragStart: () => gsap.to(".testi-drag-hint", { scale: .82, autoAlpha: .35, duration: .22 }),
    onDragEnd: () => gsap.to(".testi-drag-hint", { scale: 1, autoAlpha: 1, duration: .45, ease: "back.out(1.7)" }),
  });
  gsap.from(".testi-track .testi-card", {
    y: 150,
    rotation: (i) => i % 2 ? 9 : -9,
    autoAlpha: 0,
    stagger: .08,
    duration: 1,
    ease: "impact-out",
    scrollTrigger: { trigger: stage, start: "top 82%" },
  });
  gsap.to(".testi-drag-hint", { x: 9, duration: .7, repeat: -1, yoyo: true, ease: "sine.inOut" });
}

function initBigTitleScene() {
  const section = document.querySelector(".bigtitle");
  const chars = gsap.utils.toArray(".bigtitle-char");
  if (!section || !chars.length || reduced) return;
  gsap.set(chars, {
    x: () => gsap.utils.random(-window.innerWidth * .55, window.innerWidth * .55),
    y: () => gsap.utils.random(-window.innerHeight * .5, window.innerHeight * .5),
    z: () => gsap.utils.random(-600, 300),
    rotationX: () => gsap.utils.random(-180, 180),
    rotationY: () => gsap.utils.random(-180, 180),
    autoAlpha: 0,
  });
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: "top top",
      end: "+=180%",
      pin: true,
      scrub: 1,
      anticipatePin: 1,
      snap: { snapTo: [.52, 1], duration: { min: .12, max: .3 }, delay: .06 },
    },
  });
  tl
    .to(chars, { x: 0, y: 0, z: 0, rotationX: 0, rotationY: 0, autoAlpha: 1, stagger: { amount: .65, from: "random" }, duration: 1, ease: "impact-snap" }, 0)
    .to(".bigtitle__grid", { scale: 1.28, rotation: 5, autoAlpha: .45, duration: 1, ease: "none" }, .45)
    .to(".bigtitle-line--1", { xPercent: -14, duration: .8, ease: "none" }, 1.05)
    .to(".bigtitle-line--2", { xPercent: 14, duration: .8, ease: "none" }, 1.05)
    .to(chars, { y: (i) => i % 2 ? -30 : 30, rotation: (i) => i % 2 ? -3 : 3, duration: .8, ease: "none" }, 1.05);
}

function initBlogHorizontalScene() {
  const section = document.querySelector(".blog");
  const grid = section?.querySelector(".blog-grid");
  const cards = gsap.utils.toArray(".blog-card");
  const progress = section?.querySelector(".blog__progress span");
  if (!section || !grid || !cards.length || reduced) return;
  const mm = gsap.matchMedia();
  mm.add("(min-width: 992px)", () => {
    const distance = () => Math.max(0, grid.scrollWidth - window.innerWidth + window.innerWidth * .12);
    gsap.to(grid, {
      x: () => -distance(),
      ease: "none",
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: () => `+=${Math.max(window.innerWidth * 1.8, distance() * 1.15)}`,
        pin: true,
        scrub: 1,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => progress && gsap.set(progress, { scaleX: self.progress }),
      },
    });
    cards.forEach((card, index) => {
      gsap.from(card, {
        y: index % 2 ? 90 : -90,
        rotation: index % 2 ? 5 : -5,
        autoAlpha: .25,
        duration: 1,
        ease: "none",
        scrollTrigger: { trigger: section, start: "top 82%", end: "top top", scrub: 1 },
      });
    });
  });
}

function initFooterCurtain() {
  const newsletter = document.querySelector(".newsletter");
  const footerCard = document.querySelector(".footer__card");
  if (!newsletter || !footerCard || reduced) return;
  gsap.fromTo(footerCard,
    { clipPath: "inset(0 0 100% 0 round 40px 40px 0 0)" },
    {
      clipPath: "inset(0 0 0% 0 round 40px 40px 0 0)",
      ease: "none",
      scrollTrigger: { trigger: newsletter, start: "45% bottom", end: "bottom 35%", scrub: 1 },
    }
  );
  gsap.from(".footer__emblem", {
    scale: 0,
    rotation: -220,
    duration: 1.1,
    ease: "back.out(1.5)",
    scrollTrigger: { trigger: footerCard, start: "top 82%" },
  });
  gsap.from(".footer__cols > *", {
    y: 70,
    autoAlpha: 0,
    stagger: .12,
    duration: .8,
    ease: "impact-out",
    scrollTrigger: { trigger: ".footer__cols", start: "top 86%" },
  });
}

function initPhysicsBursts() {
  if (reduced) return;
  document.querySelectorAll(".btn-pill, .cta-banner__whatsapp, .offer-card__cta").forEach((button) => {
    button.addEventListener("pointerdown", (event) => {
      const amount = finePointer ? 10 : 6;
      for (let i = 0; i < amount; i++) {
        const particle = document.createElement("span");
        particle.className = "impact-particle";
        particle.style.left = `${event.clientX}px`;
        particle.style.top = `${event.clientY}px`;
        document.body.appendChild(particle);
        gsap.to(particle, {
          duration: gsap.utils.random(.55, .95),
          physics2D: {
            velocity: gsap.utils.random(90, 260),
            angle: gsap.utils.random(200, 340),
            gravity: 420,
          },
          scale: 0,
          rotation: gsap.utils.random(-180, 180),
          ease: "none",
          onComplete: () => particle.remove(),
        });
      }
    });
  });
}

function initImmersiveHome() {
  const start = () => {
    [
      ".services-title", ".offers-title", ".cta-banner__title",
      ".process-title", ".stats-title", ".testi-title", ".blog-head h2",
    ].forEach((selector) => {
      const element = document.querySelector(selector);
      if (!element || element.querySelector(".motion-word")) return;
      SplitText.create(element, { type: "words", wordsClass: "motion-word", aria: "auto" });
    });
    initScrambleLabels();
    if (reduced) return;
    initHeroImmersiveScene();
    initHorizontalServices();
    initPromiseMorphScene();
    initOffersDeck();
    initCtaMotionPath();
    initVelocityMarquee();
    initProcessTimeline();
    initStatsConstellation();
    initTestimonialsDraggable();
    initBigTitleScene();
    initBlogHorizontalScene();
    initFooterCurtain();
    initPhysicsBursts();
    requestAnimationFrame(() => ScrollTrigger.refresh());
  };
  if (document.fonts?.ready) document.fonts.ready.then(start);
  else start();
}

/* ================= PageHero (pages intérieures) ================= */
function initPageHero() {
  const el = document.querySelector(".page-hero");
  if (!el) return;
  if (reduced) {
    gsap.set(".ph-word, .ph-fade", { opacity: 1, y: 0, clearProps: "visibility" });
    gsap.set(".ph-route", { drawSVG: "0% 100%" });
    return;
  }

  const bg = el.querySelector(".page-hero__bg");
  const content = el.querySelector(".page-hero__content");
  const grid = el.querySelector(".page-hero__grid");
  const mark = el.querySelector(".page-hero__mark");
  const route = el.querySelector(".ph-route--outer");
  const runner = el.querySelector(".ph-runner");
  const nodes = el.querySelectorAll(".ph-node");

  gsap.set(".ph-fade", { y: 28 });
  gsap.set(".ph-route", { drawSVG: "0% 0%" });

  // États de départ posés via set() + to() (et non from()/fromTo()). Les tweens
  // .from() sont ré-appliqués par ScrollTrigger.refresh() — déclenché par le pin
  // du hero et par le chargement de l'image de fond — ce qui re-figeait le titre
  // à son état de départ (lettres éclatées et masquées). Les .to() y sont immunisés.
  gsap.set(".ph-word", { yPercent: 125, rotation: 5, autoAlpha: 0 });
  if (mark) gsap.set(mark, { scale: .48, rotation: -24, autoAlpha: 0 });
  if (nodes.length) gsap.set(nodes, { scale: 0, autoAlpha: 0 });
  gsap.set(".page-hero__chapter", { x: -24, autoAlpha: 0 });
  gsap.set(".page-hero__scroll", { x: 24, autoAlpha: 0 });

  const entrance = gsap.timeline({ delay: .28, defaults: { ease: "impact-out" } });
  entrance
    .to(".ph-word", { yPercent: 0, rotation: 0, autoAlpha: 1, duration: 1.05, stagger: .075 }, 0)
    .to(".ph-fade", { autoAlpha: 1, y: 0, duration: .78, stagger: .1 }, .22)
    .to(mark, { scale: 1, rotation: 0, autoAlpha: .18, duration: 1.1 }, .05)
    .to(".ph-route", { drawSVG: "0% 100%", duration: 1.25, stagger: .12, ease: "power2.inOut" }, .05)
    .to(nodes, { scale: 1, autoAlpha: 1, stagger: .12, duration: .55, ease: "back.out(1.8)" }, .52)
    .to(".page-hero__chapter", { x: 0, autoAlpha: 1, duration: .7 }, .58)
    .to(".page-hero__scroll", { x: 0, autoAlpha: 1, duration: .7 }, .65);

  if (route && runner) {
    entrance.to(runner, {
      duration: 1.25,
      ease: "none",
      motionPath: { path: route, align: route, alignOrigin: [.5, .5], autoRotate: true },
    }, .05);
  }

  gsap.to(nodes, {
    scale: 1.65,
    autoAlpha: .25,
    duration: 1.4,
    stagger: .28,
    repeat: -1,
    yoyo: true,
    ease: "sine.inOut",
  });
  gsap.to(".page-hero__scroll i", { scaleX: .25, duration: 1, repeat: -1, yoyo: true, ease: "sine.inOut" });

  const mm = gsap.matchMedia();
  mm.add("(min-width: 992px)", () => {
    const scrollTl = gsap.timeline({
      scrollTrigger: {
        trigger: el,
        start: "top top",
        end: "+=105%",
        pin: true,
        scrub: 1,
        anticipatePin: 1,
      },
    });
    scrollTl
      .to(bg, { scale: 1.24, yPercent: 12, filter: "saturate(.45) contrast(1.18) blur(5px)", duration: 1 }, 0)
      .to(content, { yPercent: -38, scale: .76, autoAlpha: 0, duration: .72 }, .1)
      .to(grid, { scale: 1.28, rotation: 5, autoAlpha: .06, duration: 1 }, 0)
      .to(mark, { scale: 6.2, rotation: 110, autoAlpha: .035, duration: 1 }, 0)
      .to(".page-hero__motion", { scale: 1.12, rotation: -3, autoAlpha: .18, duration: 1 }, 0)
      .to(".page-hero__chapter, .page-hero__scroll", { autoAlpha: 0, duration: .32 }, .2);
  });
  mm.add("(max-width: 991px)", () => {
    gsap.to(bg, {
      yPercent: 12,
      scale: 1.12,
      ease: "none",
      scrollTrigger: { trigger: el, start: "top top", end: "bottom top", scrub: 1 },
    });
    gsap.to(content, {
      yPercent: -10,
      autoAlpha: .3,
      ease: "none",
      scrollTrigger: { trigger: el, start: "45% top", end: "bottom top", scrub: 1 },
    });
  });
}

/* ================= Services Experience : chapitres scrollés ================= */
function initServicesPageExperience() {
  const section = document.querySelector(".services-detail");
  const intro = section?.querySelector(".sd-intro");
  const blocks = gsap.utils.toArray(".sd-block");
  const anchors = gsap.utils.toArray(".sd-anchor");
  const progressLine = section?.querySelector(".sd-chapter-progress__line i");
  const progressCount = section?.querySelector(".sd-chapter-progress strong");
  if (!section || !intro || !blocks.length || reduced) return;

  const start = () => {
    const introSplit = SplitText.create(intro.querySelector("h2"), {
      type: "words,lines",
      wordsClass: "sd-intro-word",
      linesClass: "sd-intro-line",
      mask: "lines",
      aria: "auto",
    });
    gsap.from(introSplit.lines, {
      yPercent: 115,
      rotation: 3,
      autoAlpha: 0,
      stagger: .1,
      duration: 1,
      ease: "impact-out",
      scrollTrigger: { trigger: intro, start: "top 78%", toggleActions: "play none none reverse" },
    });
    gsap.from(".sd-intro__eyebrow, .sd-intro > p", {
      y: 30,
      autoAlpha: 0,
      stagger: .14,
      duration: .8,
      ease: "power3.out",
      scrollTrigger: { trigger: intro, start: "top 78%" },
    });

    ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: "bottom bottom",
      toggleClass: { targets: section, className: "is-tracking" },
    });
    if (progressLine) {
      gsap.to(progressLine, {
        scaleY: 1,
        ease: "none",
        scrollTrigger: { trigger: section, start: "top top", end: "bottom bottom", scrub: .5 },
      });
    }

    blocks.forEach((block, index) => {
      const media = block.querySelector(".sd-media");
      const image = media?.querySelector("img");
      const content = block.querySelector(".sd-content");
      const title = content?.querySelector("h2");
      const route = block.querySelector(".sd-route-path");
      const runner = block.querySelector(".sd-route-runner");
      if (!media || !image || !content || !title || !route || !runner) return;

      const split = SplitText.create(title, {
        type: "words,lines",
        wordsClass: "sd-motion-word",
        linesClass: "sd-motion-line",
        mask: "lines",
        aria: "auto",
      });
      const details = content.querySelectorAll(".sd-content__chapter, .sd-desc, .sd-features li, .sd-ideal, .sd-footer");
      gsap.set(route, { drawSVG: "0% 0%" });

      const chapterTl = gsap.timeline({
        scrollTrigger: {
          trigger: block,
          start: "top 82%",
          end: "bottom 22%",
          scrub: .9,
        },
      });
      chapterTl
        .fromTo(media,
          {
            clipPath: index % 2
              ? "polygon(12% 0,100% 8%,92% 100%,0 90%)"
              : "polygon(0 10%,90% 0,100% 92%,8% 100%)",
            scale: .88,
            rotationY: index % 2 ? -10 : 10,
          },
          { clipPath: "polygon(0 0,100% 0,100% 100%,0 100%)", scale: 1, rotationY: 0, duration: 1, ease: "power3.out" },
          0,
        )
        .from(split.lines, { yPercent: 115, autoAlpha: 0, stagger: .1, duration: .75, ease: "impact-out" }, .08)
        .from(details, { y: 46, autoAlpha: 0, stagger: .055, duration: .72, ease: "power3.out" }, .2)
        .to(route, { drawSVG: "0% 100%", duration: 1.1, ease: "none" }, .02)
        .fromTo(image, { yPercent: -7, scale: 1.13 }, { yPercent: 7, scale: 1.03, duration: 1.25, ease: "none" }, 0);

      chapterTl.to(runner, {
        duration: 1.1,
        ease: "none",
        motionPath: { path: route, align: route, alignOrigin: [.5, .5], autoRotate: true },
      }, .02);

      ScrollTrigger.create({
        trigger: block,
        start: "top center",
        end: "bottom center",
        onToggle: (self) => {
          if (!self.isActive) return;
          anchors.forEach((anchor, anchorIndex) => anchor.classList.toggle("is-active", anchorIndex === index));
          if (progressCount) progressCount.textContent = String(index + 1).padStart(2, "0");
        },
      });
    });

    const mm = gsap.matchMedia();
    mm.add("(min-width: 992px)", () => {
      gsap.to(".sd-grid-bg", {
        backgroundPosition: "68px 102px",
        ease: "none",
        scrollTrigger: { trigger: section, start: "top bottom", end: "bottom top", scrub: 1.4 },
      });
    });

    requestAnimationFrame(() => ScrollTrigger.refresh());
  };
  if (document.fonts?.ready) document.fonts.ready.then(start);
  else start();
}

/* ================= Réalisations Experience : bento + vitesse + curseur ================= */
function initPortfolioExperience() {
  const section = document.querySelector(".portfolio");
  const intro = section?.querySelector(".pf-intro");
  const grid = section?.querySelector(".pf-grid");
  const cards = gsap.utils.toArray(".pf-card");
  if (!section || !intro || !grid || !cards.length || reduced) return;

  const start = () => {
    const introSplit = SplitText.create(intro.querySelector("h2"), {
      type: "words,lines",
      wordsClass: "pf-intro-word",
      linesClass: "pf-intro-line",
      mask: "lines",
      aria: "auto",
    });
    gsap.from(introSplit.lines, {
      yPercent: 120,
      rotation: -2,
      autoAlpha: 0,
      stagger: .1,
      duration: 1,
      ease: "impact-out",
      scrollTrigger: { trigger: intro, start: "top 78%" },
    });
    gsap.from(".pf-intro > span, .pf-intro > p", {
      y: 28,
      autoAlpha: 0,
      stagger: .13,
      duration: .75,
      ease: "power3.out",
      scrollTrigger: { trigger: intro, start: "top 78%" },
    });
    gsap.from(".pf-filters", {
      y: 30,
      scale: .92,
      autoAlpha: 0,
      duration: .8,
      ease: "back.out(1.5)",
      scrollTrigger: { trigger: ".pf-filters", start: "top 90%" },
    });

    const mm = gsap.matchMedia();
    mm.add("(min-width: 992px)", () => {
      gsap.from(cards, {
        y: (index) => 170 + (index % 3) * 60,
        rotation: (index) => index % 2 ? 7 : -7,
        scale: .78,
        autoAlpha: 0,
        stagger: { amount: .65, from: "random" },
        ease: "power3.out",
        scrollTrigger: { trigger: grid, start: "top 92%", end: "top 28%", scrub: .9 },
      });

      cards.forEach((card, index) => {
        const image = card.querySelector("img");
        if (!image) return;
        gsap.fromTo(image,
          { yPercent: -7, scale: 1.12 },
          {
            yPercent: 7,
            scale: 1.03,
            ease: "none",
            scrollTrigger: { trigger: card, start: "top bottom", end: "bottom top", scrub: 1 },
          },
        );
      });

      const skewTo = gsap.quickTo(grid, "skewY", { duration: .28, ease: "power3.out" });
      const settleSkew = gsap.delayedCall(.12, () => skewTo(0)).pause();
      ScrollTrigger.create({
        trigger: section,
        start: "top bottom",
        end: "bottom top",
        onUpdate: (self) => {
          skewTo(gsap.utils.clamp(-3.2, 3.2, self.getVelocity() / -900));
          settleSkew.restart(true);
        },
      });

      const cursor = section.querySelector(".pf-cursor-preview");
      if (cursor && finePointer) {
        const cursorX = gsap.quickTo(cursor, "x", { duration: .3, ease: "power3.out" });
        const cursorY = gsap.quickTo(cursor, "y", { duration: .3, ease: "power3.out" });
        section.addEventListener("pointermove", (event) => {
          cursorX(event.clientX);
          cursorY(event.clientY);
        });
        cards.forEach((card) => {
          card.addEventListener("pointerenter", () => {
            const label = cursor.querySelector("strong");
            if (label) label.textContent = card.dataset.pfTitle || "LE PROJET";
            gsap.to(cursor, { autoAlpha: 1, scale: 1, duration: .3, ease: "back.out(1.8)" });
          });
          card.addEventListener("pointerleave", () => {
            gsap.to(cursor, { autoAlpha: 0, scale: .65, duration: .22, ease: "power2.out" });
          });
        });
      }

      gsap.to(".pf-backdrop span", {
        y: (index) => index % 2 ? -180 : 180,
        x: (index) => index % 2 ? 90 : -90,
        rotation: (index) => index % 2 ? 35 : -35,
        ease: "none",
        stagger: .08,
        scrollTrigger: { trigger: section, start: "top bottom", end: "bottom top", scrub: 1.5 },
      });
    });

    mm.add("(max-width: 991px)", () => {
      ScrollTrigger.batch(cards, {
        start: "top 88%",
        once: true,
        interval: .08,
        batchMax: 2,
        onEnter: (batch) => gsap.from(batch, {
          y: 80,
          scale: .9,
          autoAlpha: 0,
          stagger: .12,
          duration: .85,
          ease: "impact-out",
        }),
      });
    });

    requestAnimationFrame(() => ScrollTrigger.refresh());
  };
  if (document.fonts?.ready) document.fonts.ready.then(start);
  else start();
}

/* ================= À propos Experience : manifeste + histoire horizontale ================= */
function initAboutPageExperience() {
  const section = document.querySelector(".about");
  const intro = section?.querySelector(".about-intro");
  const story = section?.querySelector(".about-story");
  const media = story?.querySelector(".about-story__media");
  const image = media?.querySelector("img");
  const steps = gsap.utils.toArray("[data-about-step]");
  const meterLine = story?.querySelector(".about-story__meter i");
  const meterCount = story?.querySelector(".about-story__meter span");
  const valuesStage = section?.querySelector(".about-values__stage");
  const valuesTrack = section?.querySelector(".about-values__track");
  const valueCards = gsap.utils.toArray(".experience-a-propos .value-card");
  if (!section || !intro || !story || !media || !steps.length) return;

  if (reduced) {
    steps.forEach((step) => step.classList.add("is-active"));
    return;
  }

  const start = () => {
    const introSplit = SplitText.create(intro.querySelector("h2"), {
      type: "words,lines",
      linesClass: "about-intro-line",
      wordsClass: "about-intro-word",
      mask: "lines",
      aria: "auto",
    });
    gsap.timeline({
      scrollTrigger: { trigger: intro, start: "top 76%" },
      defaults: { ease: "impact-out" },
    })
      .from(introSplit.lines, { yPercent: 120, rotation: 2, autoAlpha: 0, stagger: .1, duration: 1 })
      .from(".about-intro > span, .about-intro > p", { y: 26, autoAlpha: 0, stagger: .12, duration: .7 }, .18);

    gsap.to(".about-orbit span", {
      y: (index) => index % 2 ? -190 : 210,
      x: (index) => index % 2 ? 80 : -70,
      rotation: (index) => index % 2 ? 35 : -30,
      ease: "none",
      stagger: .08,
      scrollTrigger: { trigger: section, start: "top bottom", end: "bottom top", scrub: 1.4 },
    });

    const shape = media.querySelector(".about-symbol__shape");
    const target = media.querySelector(".about-symbol__target");
    const route = media.querySelector(".about-symbol__route");
    if (route) {
      gsap.fromTo(route, { drawSVG: "0% 0%" }, {
        drawSVG: "0% 100%",
        ease: "none",
        scrollTrigger: { trigger: story, start: "top 78%", end: "bottom 28%", scrub: 1 },
      });
    }
    if (shape && target) {
      gsap.to(shape, {
        morphSVG: { shape: target, type: "rotational" },
        rotation: 120,
        svgOrigin: "80 60",
        ease: "none",
        scrollTrigger: { trigger: story, start: "top 70%", end: "bottom 30%", scrub: 1.1 },
      });
    }

    steps.forEach((step, index) => {
      ScrollTrigger.create({
        trigger: step,
        start: "top 58%",
        end: "bottom 42%",
        onToggle: (self) => {
          if (!self.isActive) return;
          steps.forEach((item, itemIndex) => item.classList.toggle("is-active", itemIndex === index));
          if (meterLine) gsap.to(meterLine, { scaleX: (index + 1) / steps.length, duration: .45, ease: "power3.out" });
          if (meterCount) {
            gsap.to(meterCount, {
              duration: .45,
              scrambleText: { text: `${String(index + 1).padStart(2, "0")} / ${String(steps.length).padStart(2, "0")}`, chars: "0123456789", speed: .6 },
            });
          }
        },
      });
    });

    const mm = gsap.matchMedia();
    mm.add("(min-width: 992px)", () => {
      gsap.fromTo(media,
        { clipPath: "polygon(8% 0,100% 5%,94% 100%,0 92%)", scale: .9 },
        {
          clipPath: "polygon(0 0,100% 0,100% 100%,0 100%)",
          scale: 1,
          ease: "none",
          scrollTrigger: { trigger: story, start: "top 88%", end: "top 18%", scrub: 1 },
        },
      );
      if (image) {
        gsap.fromTo(image, { yPercent: -7, scale: 1.12 }, {
          yPercent: 7,
          scale: 1.02,
          ease: "none",
          scrollTrigger: { trigger: story, start: "top bottom", end: "bottom top", scrub: 1.2 },
        });
      }

      if (valuesStage && valuesTrack && valueCards.length) {
        const distance = () => Math.max(0, valuesTrack.scrollWidth - valuesStage.clientWidth);
        const horizontalTween = gsap.to(valuesTrack, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: {
            trigger: valuesStage,
            start: "top top+=90",
            end: () => `+=${Math.max(window.innerWidth * 2.2, distance() * 1.2)}`,
            pin: true,
            scrub: 1,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => gsap.set(".about-values__progress span", { scaleX: self.progress }),
          },
        });
        valueCards.forEach((card, index) => {
          const icon = card.querySelector(".value-card__icon");
          const line = card.querySelector(".value-card__line");
          gsap.from(card, {
            y: index % 2 ? 90 : -90,
            rotation: index % 2 ? 3.5 : -3.5,
            autoAlpha: .45,
            ease: "none",
            scrollTrigger: {
              trigger: card,
              containerAnimation: horizontalTween,
              start: "left 92%",
              end: "center 64%",
              scrub: 1,
            },
          });
          if (icon) {
            gsap.to(icon, {
              rotation: index % 2 ? 220 : -220,
              scale: 1.15,
              ease: "none",
              scrollTrigger: {
                trigger: card,
                containerAnimation: horizontalTween,
                start: "left right",
                end: "right left",
                scrub: 1,
              },
            });
          }
          if (line) {
            gsap.from(line, {
              scaleX: 0,
              ease: "none",
              scrollTrigger: {
                trigger: card,
                containerAnimation: horizontalTween,
                start: "left 80%",
                end: "center 55%",
                scrub: 1,
              },
            });
          }
        });
      }
    });

    mm.add("(max-width: 991px)", () => {
      ScrollTrigger.batch(valueCards, {
        start: "top 88%",
        once: true,
        interval: .08,
        batchMax: 2,
        onEnter: (batch) => gsap.from(batch, { y: 70, rotation: 2, autoAlpha: 0, stagger: .12, duration: .85, ease: "impact-out" }),
      });
    });

    const statItems = gsap.utils.toArray(".experience-a-propos .stat-item");
    if (statItems.length) {
      gsap.from(statItems, {
        y: 80,
        scale: .82,
        autoAlpha: 0,
        stagger: .1,
        duration: 1,
        ease: "impact-out",
        scrollTrigger: { trigger: ".experience-a-propos .stats-grid", start: "top 82%" },
      });
      gsap.fromTo(".experience-a-propos .stat-ring__value", { drawSVG: "0% 0%" }, {
        drawSVG: "0% 82%",
        stagger: .12,
        duration: 1.4,
        ease: "power2.out",
        scrollTrigger: { trigger: ".experience-a-propos .stats-grid", start: "top 80%" },
      });
    }

    requestAnimationFrame(() => ScrollTrigger.refresh());
  };
  if (document.fonts?.ready) document.fonts.ready.then(start);
  else start();
}

/* ================= Blog Experience : magazine cinétique ================= */
function initBlogPageExperience() {
  const section = document.querySelector(".bloglist");
  const intro = section?.querySelector(".bl-intro");
  const featured = section?.querySelector(".blog-featured");
  const featuredInner = featured?.querySelector(".blog-featured__inner");
  const featuredImage = featured?.querySelector("img");
  const cards = gsap.utils.toArray(".experience-blog .bl-card");
  const reader = section?.querySelector(".bl-reader");
  const count = section?.querySelector(".bl-scroll-count strong");
  if (!section || !intro || !featured || !featuredInner) return;
  if (reduced) return;

  const start = () => {
    const introSplit = SplitText.create(intro.querySelector("h2"), {
      type: "words,lines",
      linesClass: "bl-intro-line",
      wordsClass: "bl-intro-word",
      mask: "lines",
      aria: "auto",
    });
    gsap.timeline({
      scrollTrigger: { trigger: intro, start: "top 78%" },
      defaults: { ease: "impact-out" },
    })
      .from(introSplit.lines, { yPercent: 120, autoAlpha: 0, rotation: -2, stagger: .1, duration: 1 })
      .from(".bl-intro > span", { y: 24, autoAlpha: 0, duration: .65 }, .12)
      .from(".bl-intro__rail span", { x: 90, autoAlpha: 0, stagger: .07, duration: .65 }, .3);

    const featureTitle = featured.querySelector("h2");
    const featureSplit = SplitText.create(featureTitle, {
      type: "lines,words",
      linesClass: "bl-feature-line",
      mask: "lines",
      aria: "auto",
    });
    gsap.timeline({
      scrollTrigger: { trigger: featured, start: "top 86%", end: "top 24%", scrub: .9 },
    })
      .fromTo(featuredInner,
        { clipPath: "inset(12% 5% 12% 5% round 64px)", scale: .9 },
        { clipPath: "inset(0% 0% 0% 0% round 64px)", scale: 1, duration: 1, ease: "power3.out" },
        0,
      )
      .from(featureSplit.lines, { yPercent: 120, autoAlpha: 0, stagger: .12, duration: .75, ease: "impact-out" }, .15)
      .from(".blog-featured__eyebrow, .blog-featured__body .blog-card__meta, .blog-featured__excerpt, .blog-featured__body .blog-card__link", {
        y: 32,
        autoAlpha: 0,
        stagger: .08,
        duration: .65,
        ease: "power3.out",
      }, .25);
    if (featuredImage) {
      gsap.fromTo(featuredImage, { yPercent: -8, scale: 1.16 }, {
        yPercent: 8,
        scale: 1.03,
        ease: "none",
        scrollTrigger: { trigger: featured, start: "top bottom", end: "bottom top", scrub: 1 },
      });
    }

    cards.forEach((card, index) => {
      const image = card.querySelector("img");
      const title = card.querySelector("h3");
      const split = title ? SplitText.create(title, { type: "lines", linesClass: "bl-card-line", mask: "lines", aria: "auto" }) : null;
      const timeline = gsap.timeline({
        scrollTrigger: { trigger: card, start: "top 88%", end: "top 42%", scrub: .8 },
      });
      timeline
        .from(card, { y: 130, x: index % 2 ? 70 : -70, rotation: index % 2 ? 4 : -4, scale: .88, autoAlpha: 0, duration: 1, ease: "power3.out" })
        .from(split?.lines || [], { yPercent: 110, autoAlpha: 0, stagger: .08, duration: .55, ease: "impact-out" }, .25);
      if (image) {
        gsap.fromTo(image, { yPercent: -6, scale: 1.13 }, {
          yPercent: 6,
          scale: 1.03,
          ease: "none",
          scrollTrigger: { trigger: card, start: "top bottom", end: "bottom top", scrub: 1 },
        });
      }
      ScrollTrigger.create({
        trigger: card,
        start: "top center",
        end: "bottom center",
        onToggle: (self) => {
          if (self.isActive && count) count.textContent = String(index + 2).padStart(2, "0");
        },
      });
    });

    ScrollTrigger.create({
      trigger: section,
      start: "top 15%",
      end: "bottom 85%",
      toggleClass: { targets: section, className: "is-reading" },
    });

    const grid = section.querySelector(".bl-grid");
    if (grid) {
      const skewTo = gsap.quickTo(grid, "skewY", { duration: .28, ease: "power3.out" });
      const settle = gsap.delayedCall(.12, () => skewTo(0)).pause();
      ScrollTrigger.create({
        trigger: grid,
        start: "top bottom",
        end: "bottom top",
        onUpdate: (self) => {
          skewTo(gsap.utils.clamp(-2.8, 2.8, self.getVelocity() / -1100));
          settle.restart(true);
        },
      });
    }

    if (reader && finePointer) {
      const xTo = gsap.quickTo(reader, "x", { duration: .3, ease: "power3.out" });
      const yTo = gsap.quickTo(reader, "y", { duration: .3, ease: "power3.out" });
      section.addEventListener("pointermove", (event) => {
        xTo(event.clientX);
        yTo(event.clientY);
      });
      [featured, ...cards].forEach((card) => {
        card.addEventListener("pointerenter", () => {
          const label = reader.querySelector("strong");
          if (label) label.textContent = card.dataset.blTitle || "À LA UNE";
          gsap.to(reader, { autoAlpha: 1, scale: 1, duration: .3, ease: "back.out(1.8)" });
        });
        card.addEventListener("pointerleave", () => gsap.to(reader, { autoAlpha: 0, scale: .6, duration: .22, ease: "power2.out" }));
      });
    }

    gsap.to(".bl-backdrop span", {
      y: (index) => index % 2 ? -220 : 180,
      x: (index) => index % 2 ? 90 : -80,
      rotation: (index) => index % 2 ? 40 : -35,
      ease: "none",
      stagger: .08,
      scrollTrigger: { trigger: section, start: "top bottom", end: "bottom top", scrub: 1.5 },
    });
    gsap.from(".bl-newsletter", {
      clipPath: "inset(18% 8% 18% 8% round 64px)",
      scale: .9,
      duration: 1,
      ease: "impact-out",
      scrollTrigger: { trigger: ".bl-newsletter", start: "top 82%" },
    });
    gsap.to(".bl-newsletter__pulse", {
      scale: 1.28,
      rotation: 80,
      ease: "none",
      scrollTrigger: { trigger: ".bl-newsletter", start: "top bottom", end: "bottom top", scrub: 1 },
    });

    requestAnimationFrame(() => ScrollTrigger.refresh());
  };
  if (document.fonts?.ready) document.fonts.ready.then(start);
  else start();
}

/* ================= Contact Experience : parcours guidé ================= */
function initContactPageExperience() {
  const section = document.querySelector(".contact");
  const intro = section?.querySelector(".contact-intro");
  const formShell = section?.querySelector(".contact-form");
  const form = formShell?.querySelector("form");
  const formSteps = gsap.utils.toArray(".contact-form__step");
  const next = form?.querySelector("[data-contact-next]");
  const back = form?.querySelector("[data-contact-back]");
  const counter = form?.querySelector(".contact-form__counter strong");
  const progress = form?.querySelector(".contact-form__progress span");
  if (!section || !intro || !formShell || !form || formSteps.length < 2) return;

  const setStep = (nextIndex, direction = 1) => {
    const currentIndex = formSteps.findIndex((step) => step.classList.contains("is-active"));
    if (currentIndex === nextIndex) return;
    const current = formSteps[currentIndex];
    const target = formSteps[nextIndex];
    const swap = () => {
      current?.classList.remove("is-active");
      current?.setAttribute("aria-hidden", "true");
      target.classList.add("is-active");
      target.setAttribute("aria-hidden", "false");
      if (reduced) return;
      gsap.fromTo(target,
        { xPercent: direction * 18, autoAlpha: 0 },
        { xPercent: 0, autoAlpha: 1, duration: .55, ease: "impact-out", clearProps: "transform,opacity,visibility" },
      );
    };
    if (reduced || !current) swap();
    else gsap.to(current, { xPercent: direction * -14, autoAlpha: 0, duration: .28, ease: "power2.in", onComplete: swap });
    if (counter) {
      if (reduced) counter.textContent = String(nextIndex + 1).padStart(2, "0");
      else gsap.to(counter, { duration: .45, scrambleText: { text: String(nextIndex + 1).padStart(2, "0"), chars: "0123456789", speed: .7 } });
    }
    if (progress) gsap.to(progress, { scaleX: (nextIndex + 1) / formSteps.length, duration: .55, ease: "impact-out" });
  };

  next?.addEventListener("click", () => {
    const required = Array.from(formSteps[0].querySelectorAll("[required]"));
    const invalid = required.find((field) => !field.checkValidity());
    if (invalid) {
      invalid.reportValidity();
      gsap.fromTo(invalid, { x: -7 }, { x: 0, duration: .45, ease: "elastic.out(1, .25)", clearProps: "transform" });
      return;
    }
    setStep(1, 1);
  });
  back?.addEventListener("click", () => setStep(0, -1));

  if (reduced) return;
  const start = () => {
    const introSplit = SplitText.create(intro.querySelector("h2"), {
      type: "words,lines",
      linesClass: "contact-intro-line",
      wordsClass: "contact-intro-word",
      mask: "lines",
      aria: "auto",
    });
    gsap.timeline({
      scrollTrigger: { trigger: intro, start: "top 78%" },
      defaults: { ease: "impact-out" },
    })
      .from(introSplit.lines, { yPercent: 120, rotation: 2, autoAlpha: 0, stagger: .1, duration: 1 })
      .from(".contact-intro > span, .contact-intro > p", { y: 26, autoAlpha: 0, stagger: .12, duration: .7 }, .18);

    const route = section.querySelector(".contact-route");
    const dot = section.querySelector(".contact-route__dot");
    if (route) {
      gsap.fromTo(route, { drawSVG: "0% 0%" }, {
        drawSVG: "0% 100%",
        ease: "none",
        scrollTrigger: { trigger: intro, start: "top 82%", end: "bottom 24%", scrub: 1 },
      });
    }
    if (route && dot) {
      gsap.to(dot, {
        ease: "none",
        motionPath: { path: route, align: route, alignOrigin: [.5, .5], autoRotate: true },
        scrollTrigger: { trigger: intro, start: "top 82%", end: "bottom 24%", scrub: 1 },
      });
    }

    gsap.timeline({
      scrollTrigger: { trigger: ".contact__grid", start: "top 86%", end: "top 28%", scrub: .9 },
    })
      .from(".contact__side", { x: -110, rotation: -3, scale: .88, autoAlpha: 0, duration: 1, ease: "power3.out" }, 0)
      .from(formShell, { x: 110, rotation: 3, scale: .88, autoAlpha: 0, duration: 1, ease: "power3.out" }, 0)
      .from(".contact-channel", { y: 52, autoAlpha: 0, stagger: .09, duration: .7, ease: "impact-out" }, .28)
      .from(".contact__info > div", { y: 32, autoAlpha: 0, stagger: .1, duration: .55, ease: "power3.out" }, .45)
      .from(".contact-form__top, .contact-form__progress, .contact-form__step.is-active", { y: 36, autoAlpha: 0, stagger: .1, duration: .65, ease: "power3.out" }, .25);

    document.querySelectorAll(".experience-contact .form-field").forEach((field) => {
      const input = field.querySelector("input, select, textarea");
      input?.addEventListener("focus", () => gsap.to(field, { x: 6, duration: .25, ease: "power2.out" }));
      input?.addEventListener("blur", () => gsap.to(field, { x: 0, duration: .4, ease: "power3.out" }));
    });

    const faqItems = gsap.utils.toArray(".experience-contact .faq-item");
    if (faqItems.length) {
      gsap.from(faqItems, {
        x: 100,
        rotation: 2,
        autoAlpha: 0,
        stagger: .1,
        duration: .85,
        ease: "impact-out",
        scrollTrigger: { trigger: ".experience-contact .faq__list", start: "top 82%" },
      });
    }
    requestAnimationFrame(() => ScrollTrigger.refresh());
  };
  if (document.fonts?.ready) document.fonts.ready.then(start);
  else start();
}

/* ================= Article Experience : lecture immersive ================= */
function initArticlePageExperience() {
  const page = document.querySelector(".article-page");
  const hero = page?.querySelector(".article-hero");
  const reading = page?.querySelector(".article-reading");
  const content = page?.querySelector(".article-content");
  const chapters = gsap.utils.toArray(".article-chapter");
  const tocLinks = gsap.utils.toArray("[data-article-toc]");
  const progressLine = page?.querySelector(".article-progress span");
  const progressRing = page?.querySelector(".article-aside__progress-value");
  const progressLabel = page?.querySelector(".article-aside__progress strong");
  if (!page || !hero || !reading || !content || !chapters.length) return;

  let articleFontSize = 1.16;
  const updateFontSize = (delta) => {
    articleFontSize = gsap.utils.clamp(.98, 1.42, articleFontSize + delta);
    page.style.setProperty("--article-font-size", `${articleFontSize.toFixed(2)}rem`);
    requestAnimationFrame(() => ScrollTrigger.refresh());
  };
  page.querySelector('[data-font-size="down"]')?.addEventListener("click", () => updateFontSize(-.08));
  page.querySelector('[data-font-size="up"]')?.addEventListener("click", () => updateFontSize(.08));

  tocLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      const target = document.querySelector(link.getAttribute("href"));
      if (!target) return;
      event.preventDefault();
      if (lenisInstance) {
        lenisInstance.scrollTo(target, {
          offset: -94,
          duration: reduced ? 0 : .9,
          easing: (value) => 1 - Math.pow(1 - value, 4),
        });
      } else {
        gsap.to(window, {
          duration: reduced ? 0 : .9,
          scrollTo: { y: target, offsetY: 94 },
          ease: "impact-out",
        });
      }
    });
  });

  const shareButton = page.querySelector("[data-share-article]");
  shareButton?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      if (reduced) shareButton.textContent = "Lien copié";
      else gsap.to(shareButton, { duration: .5, scrambleText: { text: "Lien copié", chars: "IMPACT2026", speed: .65 } });
      gsap.delayedCall(1.8, () => {
        if (reduced) shareButton.textContent = "Partager";
        else gsap.to(shareButton, { duration: .45, scrambleText: { text: "Partager", chars: "IMPACT2026", speed: .65 } });
      });
    } catch {
      shareButton.textContent = "Copiez l’URL";
    }
  });

  ScrollTrigger.create({
    trigger: reading,
    start: "top 72%",
    end: "bottom bottom",
    toggleClass: { targets: reading, className: "is-reading" },
    onUpdate: (self) => {
      if (progressLine) gsap.set(progressLine, { scaleY: self.progress });
      if (progressRing) gsap.set(progressRing, { drawSVG: `0% ${self.progress * 100}%` });
      if (progressLabel) progressLabel.textContent = `${Math.round(self.progress * 100)}%`;
    },
  });
  if (progressRing) gsap.set(progressRing, { drawSVG: "0% 0%" });

  chapters.forEach((chapter, index) => {
    ScrollTrigger.create({
      trigger: chapter,
      start: "top 45%",
      end: "bottom 45%",
      onToggle: (self) => {
        if (!self.isActive) return;
        tocLinks.forEach((link, linkIndex) => link.classList.toggle("is-active", linkIndex === index));
      },
    });
  });

  if (reduced) return;
  const start = () => {
    const heroTitle = hero.querySelector("h1");
    const heroSplit = SplitText.create(heroTitle, {
      type: "words,lines",
      linesClass: "article-hero-line",
      wordsClass: "article-hero-word",
      mask: "lines",
      aria: "auto",
    });
    const heroMedia = hero.querySelector(".article-hero__media");
    const heroImage = heroMedia?.querySelector("img");
    const route = hero.querySelector(".article-hero__route path");
    const runner = hero.querySelector(".article-hero__runner");

    gsap.timeline({ defaults: { ease: "impact-out" } })
      .from(".article-hero__crumb", { y: 18, autoAlpha: 0, duration: .55 })
      .from(".article-hero__meta span", { y: 24, scale: .88, autoAlpha: 0, stagger: .07, duration: .55 }, .12)
      .from(heroSplit.lines, { yPercent: 120, rotation: 1.5, autoAlpha: 0, stagger: .1, duration: 1.05 }, .18)
      .from(".article-hero__footer > *", { y: 30, autoAlpha: 0, stagger: .12, duration: .7 }, .4)
      .fromTo(heroMedia,
        { clipPath: "inset(18% 8% 18% 8% round 60px)", scale: .88, autoAlpha: 0 },
        { clipPath: "inset(0% 0% 0% 0% round 60px)", scale: 1, autoAlpha: 1, duration: 1.15 },
        .3,
      );

    if (route) {
      gsap.fromTo(route, { drawSVG: "0% 0%" }, { drawSVG: "0% 100%", duration: 1.5, ease: "power2.inOut", delay: .2 });
    }
    if (route && runner) {
      gsap.to(runner, {
        duration: 1.5,
        delay: .2,
        ease: "power2.inOut",
        motionPath: { path: route, align: route, alignOrigin: [.5, .5], autoRotate: true },
      });
    }

    const heroScrollTl = gsap.timeline({
      scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: 1 },
    });
    heroScrollTl
      .to(".article-hero__inner", { yPercent: -18, scale: .92, autoAlpha: .18, duration: 1, ease: "none" }, 0)
      .to(".article-hero__grid", { scale: 1.22, rotation: 4, autoAlpha: .08, duration: 1, ease: "none" }, 0)
      .to(heroMedia, { scale: 1.04, yPercent: -5, duration: 1, ease: "none" }, 0);
    if (heroImage) {
      gsap.fromTo(heroImage, { yPercent: -6, scale: 1.12 }, {
        yPercent: 7,
        scale: 1.03,
        ease: "none",
        scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: 1 },
      });
    }
    gsap.to(".article-hero__scroll i", {
      scaleX: 0,
      ease: "none",
      scrollTrigger: { trigger: hero, start: "top top", end: "45% top", scrub: 1 },
    });

    const lead = content.querySelector(".article-content__lead");
    const leadSplit = SplitText.create(lead, {
      type: "lines",
      linesClass: "article-lead-line",
      mask: "lines",
      aria: "auto",
    });
    gsap.from(leadSplit.lines, {
      yPercent: 115,
      autoAlpha: 0,
      stagger: .1,
      duration: .85,
      ease: "impact-out",
      scrollTrigger: { trigger: lead, start: "top 82%" },
    });

    chapters.forEach((chapter, index) => {
      const title = chapter.querySelector("h2");
      const titleSplit = SplitText.create(title, {
        type: "lines",
        linesClass: "article-chapter-line",
        mask: "lines",
        aria: "auto",
      });
      const details = chapter.querySelectorAll(":scope > p, :scope > ul, :scope > blockquote, :scope > .article-callout");
      gsap.timeline({
        scrollTrigger: { trigger: chapter, start: "top 82%" },
        defaults: { ease: "impact-out" },
      })
        .from(chapter.querySelector(".article-chapter__head > span"), { x: -30, autoAlpha: 0, duration: .6 })
        .from(titleSplit.lines, { yPercent: 115, autoAlpha: 0, stagger: .09, duration: .85 }, .05)
        .from(details, { y: 52, autoAlpha: 0, stagger: .1, duration: .7 }, .22);

      gsap.to(chapter, {
        "--chapter-drift": `${index % 2 ? -28 : 28}px`,
        ease: "none",
        scrollTrigger: { trigger: chapter, start: "top bottom", end: "bottom top", scrub: 1.2 },
      });
    });

    const articleImage = page.querySelector(".article-content__image img");
    if (articleImage) {
      gsap.fromTo(articleImage, { yPercent: -7, scale: 1.12 }, {
        yPercent: 7,
        scale: 1.03,
        ease: "none",
        scrollTrigger: { trigger: articleImage.parentElement, start: "top bottom", end: "bottom top", scrub: 1 },
      });
    }

    gsap.from(".article-content__footer", {
      clipPath: "inset(16% 8% 16% 8% round 52px)",
      scale: .9,
      duration: 1,
      ease: "impact-out",
      scrollTrigger: { trigger: ".article-content__footer", start: "top 82%" },
    });
    gsap.from(".article-related__head > *", {
      y: 46,
      autoAlpha: 0,
      stagger: .12,
      duration: .8,
      ease: "impact-out",
      scrollTrigger: { trigger: ".article-related__head", start: "top 82%" },
    });
    ScrollTrigger.batch(".article-related__card", {
      start: "top 88%",
      once: true,
      interval: .08,
      batchMax: 3,
      onEnter: (batch) => gsap.from(batch, {
        y: 100,
        rotation: (index) => index % 2 ? 4 : -4,
        scale: .86,
        autoAlpha: 0,
        stagger: .12,
        duration: .9,
        ease: "impact-out",
      }),
    });

    requestAnimationFrame(() => ScrollTrigger.refresh());
  };
  if (document.fonts?.ready) document.fonts.ready.then(start);
  else start();
}

/* ================= Services : carousel drag + pagination ================= */
function initServicesCarousel() {
  const track = document.querySelector(".services-track");
  const dotsWrap = document.querySelector(".services-dots");
  if (!track) return;
  if (document.body.classList.contains("immersive-home") && window.matchMedia("(min-width: 992px)").matches) return;

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
      const cards = Array.from(grid.querySelectorAll(".pf-card"));
      const state = Flip.getState(cards);
      filters.forEach((b) => {
        b.classList.toggle("is-active", b === btn);
        b.setAttribute("aria-selected", String(b === btn));
      });
      cards.forEach((card) => {
        const show = cat === "Tous" || card.dataset.pfCat === cat;
        card.style.display = show ? "" : "none";
      });
      Flip.from(state, {
        duration: 0.75,
        ease: "impact-out",
        absolute: true,
        stagger: 0.045,
        scale: true,
        onEnter: (elements) => gsap.fromTo(elements, { autoAlpha: 0, scale: 0.82 }, { autoAlpha: 1, scale: 1, duration: 0.55, stagger: 0.05 }),
        onLeave: (elements) => gsap.to(elements, { autoAlpha: 0, scale: 0.82, duration: 0.35 }),
      });
    });
  });
}

/* ================= Contact : offre -> budget auto + prefill via URL ================= */
const OFFER_BUDGET_MAP = {
  "Impact Vitrine": "Moins de 200 000 FCFA",
  "Impact Gestion": "200 000 – 500 000 FCFA",
  "Impact Signature": "À définir ensemble",
};

function slugifyOfferLabel(label) {
  return label.toLowerCase().replace(/\s+/g, "-");
}

function initOfferBudgetSync() {
  const offerSelect = document.querySelector("[data-offer-select]");
  const budgetSelect = document.querySelector("[data-budget-select]");
  if (!offerSelect || !budgetSelect) return;

  const applyBudgetFor = (offerLabel) => {
    const budget = OFFER_BUDGET_MAP[offerLabel];
    if (budget) budgetSelect.value = budget;
  };

  offerSelect.addEventListener("change", () => applyBudgetFor(offerSelect.value));

  const params = new URLSearchParams(window.location.search);
  const offreParam = params.get("offre");
  if (!offreParam) return;

  const match = Array.from(offerSelect.options).find(
    (opt) => opt.value && slugifyOfferLabel(opt.value) === offreParam
  );
  if (match) {
    offerSelect.value = match.value;
    applyBudgetFor(match.value);
  }
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
  const immersiveHome = Boolean(document.querySelector(".hero"));
  const internalPage = document.querySelector(".page-hero")?.dataset.page;
  const articlePage = Boolean(document.querySelector("[data-article-page]"));
  if (immersiveHome) document.body.classList.add("immersive-home");
  if (internalPage) document.body.classList.add(`experience-${internalPage}`);
  if (articlePage) document.body.classList.add("experience-article");
  initSmoothScroll();
  initMotionShell();
  initHeader();
  initHero();
  initPageHero();
  if (immersiveHome) initImmersiveHome();
  else initStandardSections();
  if (internalPage === "services") initServicesPageExperience();
  if (internalPage === "realisations") initPortfolioExperience();
  if (internalPage === "a-propos") initAboutPageExperience();
  if (internalPage === "blog") initBlogPageExperience();
  if (internalPage === "contact") initContactPageExperience();
  if (articlePage) initArticlePageExperience();
  initMotionCards();
  initMagneticElements();
  if (!immersiveHome) {
    initKineticTypography();
    initScrollMotionGraphics();
  }
  initPageTransitions();
  initServicesCarousel();
  initFaq();
  initPortfolioFilter();
  initOfferBudgetSync();
  initAjaxForms();
  ScrollTrigger.refresh();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
