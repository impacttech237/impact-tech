"use client";

/* ------------------------------------------------------------------
   À PROPOS — histoire, mission, valeurs
   Bloc histoire (visuel + texte) puis 4 cartes valeurs.
------------------------------------------------------------------- */
import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import PillButton from "./PillButton";

gsap.registerPlugin(ScrollTrigger);

const VALUES = [
  {
    title: "Accessibilité",
    desc: "Des prix justes et transparents, des paiements échelonnés : le digital ne doit exclure personne.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M8 12h8M12 8v8" /></svg>
    ),
  },
  {
    title: "Proximité",
    desc: "On parle votre langue, on connaît votre marché. Support local, réactif, sur WhatsApp s'il le faut.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s7-5.1 7-11a7 7 0 1 0-14 0c0 5.9 7 11 7 11Z" /><circle cx="12" cy="10" r="2.6" /></svg>
    ),
  },
  {
    title: "Exigence",
    desc: "Prix accessible ne veut pas dire qualité au rabais : design soigné, code propre, performances au rendez-vous.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m12 2 2.6 5.5 6 .6-4.5 4 1.3 5.9L12 15l-5.4 3 1.3-5.9-4.5-4 6-.6L12 2Z" /></svg>
    ),
  },
  {
    title: "Impact",
    desc: "Notre réussite se mesure à la vôtre : plus de clients, plus de ventes, plus de temps pour votre métier.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 17 9 11l4 4 8-8" /><path d="M14 7h7v7" /></svg>
    ),
  },
];

export default function AboutSection() {
  const rootRef = useRef(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) return;

      gsap.from(".about-story__media", {
        x: -60,
        opacity: 0,
        duration: 0.9,
        ease: "power2.out",
        scrollTrigger: { trigger: ".about-story", start: "top 78%" },
      });
      gsap.from(".about-story__content > *", {
        y: 30,
        opacity: 0,
        duration: 0.7,
        stagger: 0.09,
        ease: "power2.out",
        scrollTrigger: { trigger: ".about-story", start: "top 75%" },
      });
      gsap.from(".value-card", {
        y: 50,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: "power2.out",
        scrollTrigger: { trigger: ".about-values", start: "top 82%" },
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={rootRef} className="about section-pad">
      <div className="container-it">
        {/* --- Histoire / mission --- */}
        <div className="about-story">
          <div className="about-story__media">
            <img src="/images/about-team.jpg" alt="L'équipe IMPACT TECH dans son studio à Douala" loading="lazy" />
            <div className="about-story__badge">
              <strong>Depuis Douala</strong>
              <span>pour tout le Cameroun & au-delà</span>
            </div>
          </div>

          <div className="about-story__content">
            <span className="section-badge">
              <span className="dot" /> Notre histoire <span className="dot" />
            </span>
            <h2>
              Née d'un constat <span className="accent">simple</span>
            </h2>
            <p>
              Autour de nous, des commerçants, artisans et PME pleins de talent
              restaient invisibles en ligne. Pas par choix — mais parce que les
              devis qu'on leur proposait étaient inaccessibles, opaques, ou
              remplis de jargon.
            </p>
            <p>
              IMPACT TECH est né pour changer ça : une équipe de designers et
              développeurs camerounais qui livre des outils digitaux de niveau
              international, à des prix pensés pour notre marché. Des packs
              clairs, tout inclus, sans mauvaise surprise.
            </p>
            <p>
              Aujourd'hui, chaque projet livré est une entreprise de plus qui
              existe en ligne, vend plus loin et grandit. C'est ça, notre
              définition de l'impact.
            </p>
            <div className="about-story__cta">
              <PillButton href="/contact" variant="dark">
                Travaillons ensemble
              </PillButton>
            </div>
          </div>
        </div>

        {/* --- Valeurs --- */}
        <div className="about-values">
          <div className="about-values__head">
            <span className="section-badge">
              <span className="dot" /> Nos valeurs <span className="dot" />
            </span>
            <h2>
              Ce qui nous <span className="accent">guide</span>
            </h2>
          </div>
          <div className="about-values__grid">
            {VALUES.map((v) => (
              <div key={v.title} className="value-card">
                <span className="value-card__icon">{v.icon}</span>
                <h3>{v.title}</h3>
                <p>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
