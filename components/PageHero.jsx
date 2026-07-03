"use client";

/* ------------------------------------------------------------------
   PageHero — bannière des pages intérieures
   Fond sombre + visuel, badge, titre avec mot accentué, fil d'Ariane.
   Réutilisé par : /services, /realisations, /contact, /blog...
------------------------------------------------------------------- */
import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";

export default function PageHero({
  badge,
  title,        // tableau de mots : [{ t: "Nos" }, { t: "services", accent: true }]
  subtitle,
  crumb,        // ex : "Services"
  image = "/images/hero-bg-africa-1.jpg",
}) {
  const rootRef = useRef(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) {
        gsap.set(".ph-word, .ph-fade", { opacity: 1, y: 0 });
        return;
      }
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from(".ph-word", { y: 50, opacity: 0, duration: 0.8, stagger: 0.07 })
        .to(".ph-fade", { opacity: 1, y: 0, duration: 0.7, stagger: 0.12 }, 0.25);
      gsap.set(".ph-fade", { y: 20 });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={rootRef} className="page-hero">
      <div
        className="page-hero__bg"
        style={{ backgroundImage: `url(${image})` }}
        aria-hidden="true"
      />
      <div className="page-hero__overlay" aria-hidden="true" />

      <div className="container-it page-hero__content">
        {/* Fil d'Ariane */}
        <nav className="page-hero__crumb ph-fade gsap-hidden" aria-label="Fil d'Ariane">
          <a href="/">Accueil</a>
          <span aria-hidden="true">·</span>
          <span>{crumb}</span>
        </nav>

        <div className="page-hero__badge ph-fade gsap-hidden">
          <span className="dot" aria-hidden="true" />
          {badge}
        </div>

        <h1 className="page-hero__title">
          {title.map((w, i) => (
            <span key={i} className="inline-block overflow-hidden align-bottom">
              <span className={`ph-word inline-block ${w.accent ? "accent" : ""}`}>
                {w.t}
                {"\u00A0"}
              </span>
            </span>
          ))}
        </h1>

        {subtitle && <p className="page-hero__sub ph-fade gsap-hidden">{subtitle}</p>}
      </div>
    </section>
  );
}
