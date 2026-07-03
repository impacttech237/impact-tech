"use client";

/* ------------------------------------------------------------------
   Hero — plein écran, fond sombre + parallax léger
   Animations d'entrée :
   - Titre : split par mots → y:40, opacity:0, stagger:0.08, power3.out
   - Badge / sous-titre / pills / CTA : fade-up séquencé
------------------------------------------------------------------- */
import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import PillButton from "./PillButton";

gsap.registerPlugin(ScrollTrigger);

import { DEFAULTS } from "@/lib/defaults";

/* Split "maison" par mots : chaque mot est enveloppé dans un span
   (équivalent SplitText, sans dépendance au plugin payant).
   Les mots accentués gardent leur style serif italique. */
function SplitWords({ children, accentWord }) {
  return children.split(" ").map((word, i) => {
    const clean = word.replace(/[.,!?']/g, "");
    const isAccent = accentWord && clean.toLowerCase().includes(accentWord);
    return (
      <span key={i} className="inline-block overflow-hidden align-bottom">
        <span className={`hero-word inline-block ${isAccent ? "accent" : ""}`}>
          {word}
          {"\u00A0"}
        </span>
      </span>
    );
  });
}

export default function Hero({ pills }) {
  const rootRef = useRef(null);
  const bgRef = useRef(null);
  const PILLS = pills?.length ? pills : DEFAULTS.settings.hero_pills;

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (reduced) {
        gsap.set(".hero-word, .gsap-hidden", { clearProps: "all", opacity: 1, y: 0 });
        return;
      }

      /* --- Entrée : timeline séquencée --- */
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.from(".hero-word", {
        y: 60,
        opacity: 0,
        duration: 0.9,
        stagger: 0.08,
      })
        .to(".hero__badge", { opacity: 1, y: 0, duration: 0.7 }, 0.15)
        .to(".hero__subtitle", { opacity: 1, y: 0, duration: 0.7 }, 0.3)
        .to(".hero__pill", { opacity: 1, y: 0, duration: 0.6, stagger: 0.09 }, 0.45)
        .to(".hero__cta", { opacity: 1, y: 0, duration: 0.7 }, 0.6)
        .to(".hero__scroll", { opacity: 1, duration: 0.8 }, 0.9);

      // Position de départ des éléments en fade-up
      gsap.set(
        [".hero__badge", ".hero__subtitle", ".hero__pill", ".hero__cta"],
        { y: 24 }
      );

      /* --- Parallax léger du fond au scroll --- */
      gsap.to(bgRef.current, {
        yPercent: 14,
        ease: "none",
        scrollTrigger: {
          trigger: rootRef.current,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });

      /* --- Le contenu s'estompe doucement en quittant le hero --- */
      gsap.to(".hero__content", {
        opacity: 0.25,
        yPercent: -8,
        ease: "none",
        scrollTrigger: {
          trigger: rootRef.current,
          start: "40% top",
          end: "bottom top",
          scrub: true,
        },
      });
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={rootRef} className="hero">
      {/* Fond photo + voile */}
      <div ref={bgRef} className="hero__bg" role="img" aria-label="Équipe IMPACT TECH au travail, Douala, Cameroun" />
      <div className="hero__overlay" aria-hidden="true" />

      <div className="hero__content">
        {/* Badge */}
        <div className="hero__badge gsap-hidden">
          <span className="dot" aria-hidden="true" />
          Le digital accessible — depuis le Cameroun
        </div>

        {/* Titre — split par mots, "impact" en serif italique rouge */}
        <h1 className="hero__title">
          <SplitWords accentWord="impact">
            Un digital qui a de l'impact, à prix juste
          </SplitWords>
        </h1>

        {/* Sous-titre */}
        <p className="hero__subtitle gsap-hidden">
          Sites, applications et solutions sur-mesure pensés pour les
          entreprises et entrepreneurs qui veulent du concret, sans exploser
          leur budget.
        </p>

        {/* Pills d'arguments */}
        <ul className="hero__pills" aria-label="Nos engagements">
          {PILLS.map((p) => (
            <li key={p} className="hero__pill gsap-hidden">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M2.5 8.5 6 12l7.5-8" />
              </svg>
              {p}
            </li>
          ))}
        </ul>

        {/* CTA */}
        <div className="hero__cta gsap-hidden">
          <PillButton href="/contact" variant="cream">
            Démarrer un projet
          </PillButton>
          <PillButton href="#services" variant="outline" className="!text-cream !border-cream/30 hover:!border-red">
            Découvrir nos services
          </PillButton>
        </div>
      </div>

      {/* Indicateur de scroll */}
      <div className="hero__scroll gsap-hidden" aria-hidden="true">
        <span>Scroll</span>
        <span className="hero__scroll-line" />
      </div>
    </section>
  );
}
