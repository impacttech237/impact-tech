"use client";

/* ------------------------------------------------------------------
   08. COMMENT ON TRAVAILLE — carte dark + visuel
   Étapes 1→4 : Échange → Devis → Design & Dev → Livraison & suivi
   - Apparition des étapes en stagger au scroll
   - Étape "active" surlignée au fil du scroll (progress line)
------------------------------------------------------------------- */
import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import PillButton from "./PillButton";

gsap.registerPlugin(ScrollTrigger);

import { DEFAULTS } from "@/lib/defaults";

export default function Process({ steps }) {
  const rootRef = useRef(null);
  /* Étapes gérées depuis le dashboard admin (table process_steps) */
  const STEPS = (steps?.length ? steps : DEFAULTS.processSteps).map((s) => ({
    num: s.num,
    title: s.title,
    desc: s.description,
  }));

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) return;

      /* En-tête */
      gsap.from(".process-head > *", {
        y: 30,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: "power2.out",
        scrollTrigger: { trigger: rootRef.current, start: "top 85%" },
      });

      /* Étapes : slide-in gauche, stagger */
      gsap.from(".process-step", {
        x: -40,
        opacity: 0,
        duration: 0.8,
        stagger: 0.14,
        ease: "power2.out",
        scrollTrigger: { trigger: ".process-steps", start: "top 78%" },
      });

      /* Visuel : révélation clip + léger parallax interne */
      gsap.from(".process-visual", {
        clipPath: "inset(8% 8% 8% 8% round 30px)",
        opacity: 0,
        duration: 1.1,
        ease: "power2.out",
        scrollTrigger: { trigger: ".process-visual", start: "top 80%" },
      });
      gsap.fromTo(
        ".process-visual img",
        { yPercent: -6 },
        {
          yPercent: 6,
          ease: "none",
          scrollTrigger: {
            trigger: ".process-visual",
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        }
      );

      /* Ligne de progression verticale scrubbée */
      gsap.fromTo(
        ".process-progress__bar",
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: "none",
          scrollTrigger: {
            trigger: ".process-steps",
            start: "top 70%",
            end: "bottom 45%",
            scrub: true,
          },
        }
      );
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <section id="methode" ref={rootRef} className="process section-pad">
      <div className="container-it">
        <div className="process__card">
          {/* Colonne contenu */}
          <div className="process__content">
            <div className="process-head">
              <span className="section-badge section-badge--light">
                <span className="dot" /> Notre méthode <span className="dot" />
              </span>
              <h2 className="process-title">
                Comment on <span className="accent">travaille</span>
              </h2>
              <p className="process-sub">
                Un process simple et transparent, du premier échange jusqu'au
                suivi après livraison.
              </p>
            </div>

            <div className="process-steps">
              {/* Ligne de progression */}
              <div className="process-progress" aria-hidden="true">
                <span className="process-progress__bar" />
              </div>

              <ol>
                {STEPS.map((s) => (
                  <li key={s.num} className="process-step">
                    <span className="process-step__num" aria-hidden="true">
                      {s.num}
                    </span>
                    <div>
                      <h3>{s.title}</h3>
                      <p>{s.desc}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="process-cta">
              <PillButton href="/contact" variant="cream">
                Lancer la première étape
              </PillButton>
            </div>
          </div>

          {/* Colonne visuel */}
          <div className="process-visual">
            <img
              src="/images/process-visual.jpg"
              alt="Session de cadrage projet avec une cliente chez IMPACT TECH à Douala"
              loading="lazy"
            />
            {/* Badge flottant sur le visuel */}
            <div className="process-visual__badge">
              <span className="process-visual__badge-dot" />
              Devis sous 48h
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
