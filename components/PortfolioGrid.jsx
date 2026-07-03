"use client";

/* ------------------------------------------------------------------
   PORTFOLIO — page /realisations
   Grille de projets filtrable par catégorie (pills), animation
   FLIP légère au filtrage + apparition au scroll.
------------------------------------------------------------------- */
import { useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import ArrowIcon from "./ArrowIcon";

gsap.registerPlugin(ScrollTrigger);

import { DEFAULTS } from "@/lib/defaults";

export default function PortfolioGrid({ items }) {
  const rootRef = useRef(null);
  const gridRef = useRef(null);
  const [filter, setFilter] = useState("Tous");

  /* Projets gérés depuis le dashboard admin (table projects) */
  const PROJECTS = (items?.length ? items : DEFAULTS.projects).map((p) => ({
    img: p.image,
    cat: p.category,
    title: p.title,
    desc: p.description,
    result: p.result,
  }));
  const CATEGORIES = ["Tous", ...new Set(PROJECTS.map((p) => p.cat).filter(Boolean))];

  const visible = PROJECTS.filter((p) => filter === "Tous" || p.cat === filter);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) return;
      gsap.from(".pf-filters", {
        y: 24,
        opacity: 0,
        duration: 0.7,
        ease: "power2.out",
        scrollTrigger: { trigger: rootRef.current, start: "top 85%" },
      });
      gsap.from(".pf-card", {
        y: 60,
        opacity: 0,
        duration: 0.9,
        stagger: 0.1,
        ease: "power2.out",
        scrollTrigger: { trigger: gridRef.current, start: "top 85%" },
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  /* Petit fade lors du changement de filtre */
  const changeFilter = (cat) => {
    if (cat === filter) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || !gridRef.current) {
      setFilter(cat);
      return;
    }
    gsap.to(gridRef.current, {
      opacity: 0,
      y: 14,
      duration: 0.22,
      ease: "power1.in",
      onComplete: () => {
        setFilter(cat);
        gsap.fromTo(
          gridRef.current,
          { opacity: 0, y: 14 },
          { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }
        );
      },
    });
  };

  return (
    <section ref={rootRef} className="portfolio section-pad">
      <div className="container-it">
        {/* Filtres */}
        <div className="pf-filters" role="tablist" aria-label="Filtrer les projets">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              role="tab"
              aria-selected={filter === c}
              className={`pf-filter ${filter === c ? "is-active" : ""}`}
              onClick={() => changeFilter(c)}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Grille */}
        <div ref={gridRef} className="pf-grid">
          {visible.map((p) => (
            <article key={p.title} className="pf-card">
              <a href="/contact" className="pf-card__inner">
                <div className="pf-card__media">
                  <img src={p.img} alt={p.title} loading="lazy" draggable="false" />
                  <span className="pf-card__cat">{p.cat}</span>
                  {/* Overlay hover */}
                  <span className="pf-card__overlay" aria-hidden="true">
                    <span className="pf-card__overlay-btn">
                      Voir le projet <ArrowIcon />
                    </span>
                  </span>
                </div>
                <div className="pf-card__body">
                  <h3>{p.title}</h3>
                  <p>{p.desc}</p>
                  <p className="pf-card__result">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M3 17 9 11l4 4 8-8" />
                      <path d="M14 7h7v7" />
                    </svg>
                    {p.result}
                  </p>
                </div>
              </a>
            </article>
          ))}
        </div>

        <p className="pf-note">
          Projets de démonstration illustrant nos savoir-faire — votre projet
          sera le prochain. *
        </p>
      </div>
    </section>
  );
}
