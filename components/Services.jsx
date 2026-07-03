"use client";

/* ------------------------------------------------------------------
   03. SERVICES — cartes "en arche" (façon Tripora), carousel
   drag/scroll-snap + pagination à points + flèches.
   Apparition : gsap.from { y:60, opacity:0, stagger:0.12 }
------------------------------------------------------------------- */
import { useEffect, useLayoutEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import PillButton from "./PillButton";
import ArrowIcon from "./ArrowIcon";

gsap.registerPlugin(ScrollTrigger);

import { DEFAULTS } from "@/lib/defaults";

export default function Services({ items }) {
  /* Contenu issu de la BD (D1) — fallback local si indisponible */
  const SERVICES = items?.length
    ? items.map((s) => ({ img: s.image, tag: s.tag, title: s.title, desc: s.shortDesc }))
    : DEFAULTS.services.map((s) => ({ img: s.image, tag: s.tag, title: s.title, desc: s.shortDesc }));

  const rootRef = useRef(null);
  const trackRef = useRef(null);
  const [page, setPage] = useState(0);
  const [pageCount, setPageCount] = useState(1);

  /* ----- Apparition des cartes au scroll ----- */
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) return;

      gsap.from(".service-card", {
        y: 60,
        opacity: 0,
        duration: 0.9,
        stagger: 0.12,
        ease: "power2.out",
        scrollTrigger: { trigger: rootRef.current, start: "top 85%" },
      });

      gsap.from(".services-head > *", {
        y: 30,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: "power2.out",
        scrollTrigger: { trigger: rootRef.current, start: "top 88%" },
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  /* ----- Pagination : nombre de pages + page courante ----- */
  const computePages = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    // 1 "page" = la largeur visible ; au moins 1
    const count = max <= 4 ? 1 : Math.ceil(el.scrollWidth / el.clientWidth);
    setPageCount(count);
    setPage(Math.min(count - 1, Math.round((el.scrollLeft / max || 0) * (count - 1))));
  }, []);

  useEffect(() => {
    computePages();
    const el = trackRef.current;
    const onScroll = () => computePages();
    el?.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", computePages);
    return () => {
      el?.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", computePages);
    };
  }, [computePages]);

  const goTo = (i) => {
    const el = trackRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    el.scrollTo({ left: (max / (pageCount - 1 || 1)) * i, behavior: "smooth" });
  };

  const step = (dir) => {
    const el = trackRef.current;
    if (!el) return;
    // Avance d'une carte (largeur carte + gap)
    const card = el.querySelector(".service-card");
    const delta = card ? card.offsetWidth + 24 : el.clientWidth * 0.5;
    el.scrollBy({ left: dir * delta, behavior: "smooth" });
  };

  /* ----- Drag à la souris (desktop) ----- */
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    let down = false,
      startX = 0,
      startScroll = 0,
      moved = false;

    const onDown = (e) => {
      down = true;
      moved = false;
      startX = e.pageX;
      startScroll = el.scrollLeft;
      el.classList.add("is-dragging");
    };
    const onMove = (e) => {
      if (!down) return;
      const dx = e.pageX - startX;
      if (Math.abs(dx) > 4) moved = true;
      el.scrollLeft = startScroll - dx;
    };
    const onUp = () => {
      down = false;
      el.classList.remove("is-dragging");
    };
    // Empêche le clic parasite après un drag
    const onClick = (e) => {
      if (moved) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    el.addEventListener("mousedown", onDown);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    el.addEventListener("click", onClick, true);
    return () => {
      el.removeEventListener("mousedown", onDown);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      el.removeEventListener("click", onClick, true);
    };
  }, []);

  return (
    <section id="services" ref={rootRef} className="services section-pad">
      <div className="container-it">
        {/* En-tête de section */}
        <div className="services-head">
          <span className="section-badge">
            <span className="dot" /> Nos services <span className="dot" />
          </span>
          <h2 className="services-title">
            Des solutions <span className="accent">pensées</span>
            <br />
            pour votre croissance
          </h2>
          <p className="services-sub">
            Du site vitrine au logiciel complet : on construit l'outil digital
            qu'il vous faut, au prix juste.
          </p>
        </div>

        {/* Carousel */}
        <div className="services-carousel">
          <ul ref={trackRef} className="services-track" aria-label="Liste de nos services">
            {SERVICES.map((s) => (
              <li key={s.title} className="service-card">
                <a href="/contact" className="service-card__inner">
                  {/* Visuel en arche */}
                  <div className="service-card__media">
                    <img src={s.img} alt={s.title} loading="lazy" draggable="false" />
                    <span className="service-card__tag">{s.tag}</span>
                  </div>
                  <div className="service-card__body">
                    <h3>{s.title}</h3>
                    <p>{s.desc}</p>
                    <span className="service-card__link">
                      En savoir plus
                      <ArrowIcon />
                    </span>
                  </div>
                </a>
              </li>
            ))}
          </ul>

          {/* Contrôles : dots + flèches */}
          <div className="services-controls">
            <div className="services-dots" role="tablist" aria-label="Pagination des services">
              {Array.from({ length: pageCount }).map((_, i) => (
                <button
                  key={i}
                  role="tab"
                  aria-selected={page === i}
                  aria-label={`Page ${i + 1}`}
                  className={`services-dot ${page === i ? "is-active" : ""}`}
                  onClick={() => goTo(i)}
                />
              ))}
            </div>
            <div className="services-arrows">
              <button className="services-arrow" aria-label="Précédent" onClick={() => step(-1)}>
                <ArrowIcon style={{ transform: "rotate(-135deg)" }} />
              </button>
              <button className="services-arrow" aria-label="Suivant" onClick={() => step(1)}>
                <ArrowIcon style={{ transform: "rotate(45deg)" }} />
              </button>
            </div>
          </div>
        </div>

        {/* CTA global */}
        <div className="services-cta">
          <PillButton href="/services" variant="outline">
            Voir tous nos services
          </PillButton>
        </div>
      </div>
    </section>
  );
}
