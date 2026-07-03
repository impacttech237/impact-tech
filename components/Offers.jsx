"use client";

/* ------------------------------------------------------------------
   05. OFFRES PHARES / RÉALISATIONS
   3 cartes "pack tout inclus" : visuel + catégorie + titre
   + inclusions (design, dev, domaine, sécurité...) + prix FCFA.
   Apparition : y:60, opacity:0, stagger:0.12 (ScrollTrigger top 85%)
   Hover : translateY(-6px) + ombre + zoom image.
------------------------------------------------------------------- */
import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import PillButton from "./PillButton";
import ArrowIcon from "./ArrowIcon";

gsap.registerPlugin(ScrollTrigger);

import { DEFAULTS } from "@/lib/defaults";

/* Mappe une offre (BD ou défaut) vers la forme utilisée au rendu */
function toCard(o) {
  return {
    img: o.image,
    tag: o.tag,
    title: o.title,
    price: o.price,
    isQuote: o.isQuote,
    popular: o.popular,
    features: o.features,
  };
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2.5 8.5 6 12l7.5-8" />
    </svg>
  );
}

export default function Offers({ items }) {
  const rootRef = useRef(null);
  const OFFERS = (items?.length ? items : DEFAULTS.offers).map(toCard);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) return;

      gsap.from(".offers-head > *", {
        y: 30,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: "power2.out",
        scrollTrigger: { trigger: rootRef.current, start: "top 88%" },
      });

      gsap.from(".offer-card", {
        y: 60,
        opacity: 0,
        duration: 0.9,
        stagger: 0.12,
        ease: "power2.out",
        scrollTrigger: { trigger: ".offers-grid", start: "top 85%" },
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <section id="realisations" ref={rootRef} className="offers section-pad">
      <div className="container-it">
        {/* En-tête */}
        <div className="offers-head">
          <span className="section-badge">
            <span className="dot" /> Offres phares <span className="dot" />
          </span>
          <h2 className="offers-title">
            Des packs <span className="accent">tout inclus</span>,
            <br />
            zéro mauvaise surprise
          </h2>
          <p className="offers-sub">
            Design, développement, nom de domaine, hébergement, sécurité :
            tout est compris dans le prix. Vous n'avez rien d'autre à payer.
          </p>
        </div>

        {/* Grille des 3 packs */}
        <div className="offers-grid">
          {OFFERS.map((o) => (
            <article key={o.tag} className={`offer-card ${o.popular ? "offer-card--popular" : ""}`}>
              {o.popular && <span className="offer-card__flag">Le plus demandé</span>}

              {/* Visuel */}
              <div className="offer-card__media">
                <img src={o.img} alt={o.tag} loading="lazy" draggable="false" />
                <span className="offer-card__tag">{o.tag}</span>
              </div>

              {/* Contenu */}
              <div className="offer-card__body">
                <h3>{o.title}</h3>

                <ul className="offer-card__features">
                  {o.features.map((f) => (
                    <li key={f}>
                      <span className="offer-card__check">
                        <CheckIcon />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>

                <div className="offer-card__footer">
                  <p className="offer-card__price">
                    {o.isQuote ? (
                      <strong>{o.price}</strong>
                    ) : (
                      <>
                        <span>à partir de</span>
                        <strong>
                          {o.price} <em>FCFA</em>
                        </strong>
                      </>
                    )}
                  </p>
                  <a href="/contact" className="offer-card__cta" aria-label={`Demander le ${o.tag}`}>
                    <ArrowIcon />
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Note + CTA */}
        <p className="offers-note">
          * Paiement échelonné possible. Chaque pack est ajustable selon vos besoins réels.
        </p>
        <div className="offers-cta">
          <PillButton href="/contact" variant="dark">
            Demander mon devis gratuit
          </PillButton>
        </div>
      </div>
    </section>
  );
}
