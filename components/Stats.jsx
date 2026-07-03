"use client";

/* ------------------------------------------------------------------
   09. NOS CHIFFRES — compteurs animés
   gsap.to({ val:0→cible }, duration:2.5, ease:"power2.out")
   déclenché au scroll, formatage avec séparateur d'espace.
   + bande de vignettes photos sous les chiffres (façon Tripora).
------------------------------------------------------------------- */
import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

import { DEFAULTS } from "@/lib/defaults";

export default function Stats({ items }) {
  const rootRef = useRef(null);
  /* Chiffres gérés depuis le dashboard admin (table stats) */
  const STATS = items?.length ? items : DEFAULTS.stats;

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      const nums = gsap.utils.toArray(".stat-num");

      if (reduced) {
        nums.forEach((el) => (el.textContent = el.dataset.value));
        return;
      }

      /* Compteurs : 0 → cible, formatés (séparateur d'espace) */
      nums.forEach((el) => {
        const target = parseFloat(el.dataset.value);
        const obj = { val: 0 };
        gsap.to(obj, {
          val: target,
          duration: 2.5,
          ease: "power2.out",
          scrollTrigger: { trigger: el, start: "top 85%", once: true },
          onUpdate: () => {
            el.textContent = Math.round(obj.val)
              .toString()
              .replace(/\B(?=(\d{3})+(?!\d))/g, "\u202F");
          },
        });
      });

      /* Apparition des blocs */
      gsap.from(".stat-item", {
        y: 40,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: "power2.out",
        scrollTrigger: { trigger: rootRef.current, start: "top 82%" },
      });

      /* Vignettes photo : montée décalée */
      gsap.from(".stat-thumb", {
        y: 60,
        opacity: 0,
        rotation: (i) => (i % 2 === 0 ? -4 : 4),
        duration: 0.9,
        stagger: 0.08,
        ease: "power2.out",
        scrollTrigger: { trigger: ".stats-thumbs", start: "top 90%" },
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <section id="chiffres" ref={rootRef} className="stats section-pad">
      <div className="container-it">
        {/* Grand chiffre d'appel */}
        <div className="stats-head">
          <span className="section-badge">
            <span className="dot" /> Nos chiffres <span className="dot" />
          </span>
          <h2 className="stats-title">
            Des résultats <span className="accent">concrets</span>
          </h2>
        </div>

        {/* Grille des compteurs */}
        <div className="stats-grid">
          {STATS.map((s) => (
            <div key={s.label} className="stat-item">
              <p className="stat-value">
                <span className="stat-num" data-value={s.value}>
                  0
                </span>
                <span className="stat-suffix">{s.suffix}</span>
              </p>
              <h3>{s.label}</h3>
              <p className="stat-note">{s.note}</p>
            </div>
          ))}
        </div>

        {/* Bande de vignettes (réutilise les visuels existants) */}
        <div className="stats-thumbs" aria-hidden="true">
          {[
            "/images/service-landing.jpg",
            "/images/project-ecommerce.jpg",
            "/images/service-saas.jpg",
            "/images/project-custom.jpg",
            "/images/service-app.jpg",
          ].map((src, i) => (
            <div key={i} className="stat-thumb">
              <img src={src} alt="" loading="lazy" draggable="false" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
