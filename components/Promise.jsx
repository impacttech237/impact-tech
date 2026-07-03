"use client";

/* ------------------------------------------------------------------
   04. NOTRE PROMESSE
   - Titre mixte révélé MOT PAR MOT au scroll (couleur claire → encre),
     ScrollTrigger { start:"top 80%", end:"top 40%", scrub:true }
     → effet "Stories from the Road" de Tripora.
   - 4 badges "blob" flottants en boucle yoyo (y+=12, rotation+=2,
     sine.inOut, repeat:-1, décalage aléatoire).
------------------------------------------------------------------- */
import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/* Badges blob : position absolue autour du titre (desktop),
   réordonnés en grille sous le titre en mobile. */
const BLOBS = [
  {
    label: "Prix accessible",
    className: "blob--1",
    icon: (
      /* pièce / tarif */
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M14.8 9.2a3.2 3.2 0 1 0 0 5.6M8 10.5h4M8 13.5h4" />
      </svg>
    ),
  },
  {
    label: "Support local",
    className: "blob--2",
    icon: (
      /* pin localisation */
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 21s7-5.1 7-11a7 7 0 1 0-14 0c0 5.9 7 11 7 11Z" />
        <circle cx="12" cy="10" r="2.6" />
      </svg>
    ),
  },
  {
    label: "100% sur-mesure",
    className: "blob--3",
    icon: (
      /* réglages */
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 8h10M18 8h2M4 16h2M10 16h10" />
        <circle cx="16" cy="8" r="2.4" />
        <circle cx="8" cy="16" r="2.4" />
      </svg>
    ),
  },
  {
    label: "Livraison rapide",
    className: "blob--4",
    icon: (
      /* éclair */
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2 4.5 13.5H11L9.5 22 19 10h-6.5L13 2Z" />
      </svg>
    ),
  },
];

/* Titre splitté par mots — les mots accentués restent en serif italique */
const TITLE_WORDS = [
  { t: "On" },
  { t: "ne" },
  { t: "livre" },
  { t: "pas" },
  { t: "juste" },
  { t: "un" },
  { t: "site," },
  { t: "on" },
  { t: "crée" },
  { t: "de" },
  { t: "l'impact", accent: true },
  { t: "qui" },
  { t: "dure." },
];

export default function Promise() {
  const rootRef = useRef(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) {
        gsap.set(".promise-word", { opacity: 1 });
        return;
      }

      /* --- Révélation mot par mot, scrubbée au scroll --- */
      gsap.fromTo(
        ".promise-word",
        { opacity: 0.16 },
        {
          opacity: 1,
          stagger: 0.06,
          ease: "none",
          scrollTrigger: {
            trigger: ".promise-title",
            start: "top 80%",
            end: "top 40%",
            scrub: true,
          },
        }
      );

      /* --- Badge de section : simple fade-up --- */
      gsap.from(".promise-badge", {
        y: 24,
        opacity: 0,
        duration: 0.7,
        ease: "power2.out",
        scrollTrigger: { trigger: rootRef.current, start: "top 85%" },
      });

      /* --- Blobs : pop d'entrée puis flottement yoyo infini --- */
      gsap.from(".blob", {
        scale: 0.4,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: "back.out(1.6)",
        scrollTrigger: { trigger: rootRef.current, start: "top 75%" },
      });

      gsap.utils.toArray(".blob").forEach((el) => {
        gsap.to(el, {
          y: "+=12",
          rotation: "+=2",
          duration: gsap.utils.random(3, 4),
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
          delay: gsap.utils.random(0, 1.5), // décalage aléatoire par blob
        });
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <section id="promesse" ref={rootRef} className="promise section-pad">
      <div className="container-it">
        <div className="promise__stage">
          {/* Blobs flottants (décor desktop) */}
          {BLOBS.map((b) => (
            <div key={b.label} className={`blob ${b.className}`}>
              <span className="blob__icon" aria-hidden="true">
                {b.icon}
              </span>
              {b.label}
            </div>
          ))}

          {/* Contenu central */}
          <div className="promise__content">
            <span className="section-badge promise-badge">
              <span className="dot" /> Notre promesse <span className="dot" />
            </span>

            <h2 className="promise-title" aria-label="On ne livre pas juste un site, on crée de l'impact qui dure.">
              {TITLE_WORDS.map((w, i) => (
                <span key={i} aria-hidden="true" className={`promise-word ${w.accent ? "accent" : ""}`}>
                  {w.t}{" "}
                </span>
              ))}
            </h2>

            <p className="promise-sub">
              Chaque projet est pensé pour durer : un design soigné, un code
              solide et un accompagnement qui ne s'arrête pas à la livraison.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
