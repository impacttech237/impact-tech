"use client";

/* ------------------------------------------------------------------
   10. TÉMOIGNAGES — grille de cartes en colonnes défilantes
   3 colonnes en translation verticale continue (sens alterné),
   pause au survol, masque dégradé haut/bas. Effet Tripora.
------------------------------------------------------------------- */
import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

import { DEFAULTS } from "@/lib/defaults";

function Card({ t }) {
  return (
    <article className="testi-card">
      {/* 5 étoiles */}
      <div className="testi-stars" aria-label="5 étoiles sur 5">
        {Array.from({ length: 5 }).map((_, i) => (
          <svg key={i} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path d="M10 1.5 12.6 7l6 .6-4.5 4 1.3 5.9L10 14.4l-5.4 3.1L5.9 11.6l-4.5-4 6-.6L10 1.5Z" />
          </svg>
        ))}
      </div>
      <p className="testi-text">« {t.text} »</p>
      <footer className="testi-author">
        <span className="testi-avatar" aria-hidden="true">
          {t.initials}
        </span>
        <div>
          <strong>{t.name}</strong>
          <span>{t.role}</span>
        </div>
      </footer>
    </article>
  );
}

export default function Testimonials({ items }) {
  const rootRef = useRef(null);
  /* Avis gérés depuis le dashboard admin (table testimonials) */
  const TESTIMONIALS = items?.length ? items : DEFAULTS.testimonials;

  /* Répartition en 3 colonnes */
  const cols = [[], [], []];
  TESTIMONIALS.forEach((t, i) => cols[i % 3].push(t));

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) return;

      gsap.from(".testi-head > *", {
        y: 30,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: "power2.out",
        scrollTrigger: { trigger: rootRef.current, start: "top 85%" },
      });

      /* Défilement vertical continu : chaque colonne contient sa liste
         dupliquée ; on translate de -50% (boucle parfaite).
         Colonne du milieu en sens inverse. */
      gsap.utils.toArray(".testi-col-inner").forEach((el, i) => {
        const dir = i === 1 ? 1 : -1;
        const dist = el.scrollHeight / 2;
        gsap.fromTo(
          el,
          { y: dir === 1 ? -dist : 0 },
          {
            y: dir === 1 ? 0 : -dist,
            duration: 38 + i * 6,
            ease: "none",
            repeat: -1,
          }
        );
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={rootRef} className="testimonials section-pad">
      <div className="container-it">
        <div className="testi-head">
          <span className="section-badge">
            <span className="dot" /> Témoignages <span className="dot" />
          </span>
          <h2 className="testi-title">
            Ils nous ont fait <span className="accent">confiance</span>
          </h2>
          <p className="testi-sub">
            Des entrepreneurs et entreprises qui ont donné vie à leurs projets
            avec IMPACT TECH.
          </p>
        </div>
      </div>

      {/* Colonnes défilantes (pleine largeur, masque dégradé) */}
      <div className="testi-wall">
        {cols.map((col, i) => (
          <div key={i} className={`testi-col ${i === 2 ? "testi-col--desktop" : ""}`}>
            <div className="testi-col-inner">
              {/* Liste x2 pour boucle parfaite */}
              {[...col, ...col].map((t, j) => (
                <Card key={`${t.name}-${j}`} t={t} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
