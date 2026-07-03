"use client";

/* ------------------------------------------------------------------
   SERVICES DÉTAIL — page /services
   6 blocs alternés (visuel / contenu) : description complète,
   inclusions, "idéal pour", prix, délai, CTA.
   Apparition : slide latéral + fade au scroll.
------------------------------------------------------------------- */
import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import PillButton from "./PillButton";

gsap.registerPlugin(ScrollTrigger);

import { DEFAULTS } from "@/lib/defaults";

/* Mappe un service (BD ou défaut) vers la forme du bloc détail */
function toBlock(s) {
  return {
    id: s.slug,
    img: s.image,
    tag: s.tag,
    title: s.title,
    accent: s.accent,
    headline: s.headline,
    desc: s.description,
    features: s.features,
    ideal: s.ideal,
    price: s.price,
    delay: s.delay,
  };
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2.5 8.5 6 12l7.5-8" />
    </svg>
  );
}

export default function ServicesDetail({ items }) {
  const rootRef = useRef(null);
  const SERVICES = (items?.length ? items : DEFAULTS.services).map(toBlock);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) return;

      gsap.utils.toArray(".sd-block").forEach((block) => {
        const media = block.querySelector(".sd-media");
        const content = block.querySelector(".sd-content");
        const reversed = block.classList.contains("sd-block--reverse");

        gsap.from(media, {
          x: reversed ? 60 : -60,
          opacity: 0,
          duration: 0.9,
          ease: "power2.out",
          scrollTrigger: { trigger: block, start: "top 78%" },
        });
        gsap.from(content.children, {
          y: 30,
          opacity: 0,
          duration: 0.7,
          stagger: 0.08,
          ease: "power2.out",
          scrollTrigger: { trigger: block, start: "top 75%" },
        });
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={rootRef} className="services-detail section-pad">
      <div className="container-it">
        {/* Sommaire ancres */}
        <nav className="sd-anchors" aria-label="Aller à un service">
          {SERVICES.map((s) => (
            <a key={s.id} href={`#${s.id}`} className="sd-anchor">
              {s.title}
            </a>
          ))}
        </nav>

        <div className="sd-list">
          {SERVICES.map((s, i) => (
            <article
              key={s.id}
              id={s.id}
              className={`sd-block ${i % 2 === 1 ? "sd-block--reverse" : ""}`}
            >
              {/* Visuel */}
              <div className="sd-media">
                <img src={s.img} alt={s.title} loading="lazy" draggable="false" />
                <span className="sd-media__tag">{s.tag}</span>
              </div>

              {/* Contenu */}
              <div className="sd-content">
                <span className="sd-num" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h2>
                  {s.headline.split(s.accent).map((part, j, arr) => (
                    <span key={j}>
                      {part}
                      {j < arr.length - 1 && <span className="accent">{s.accent}</span>}
                    </span>
                  ))}
                </h2>
                <p className="sd-desc">{s.desc}</p>

                <ul className="sd-features">
                  {s.features.map((f) => (
                    <li key={f}>
                      <span className="sd-check">
                        <CheckIcon />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>

                <p className="sd-ideal">
                  <strong>Idéal pour :</strong> {s.ideal}
                </p>

                <div className="sd-footer">
                  <div className="sd-meta">
                    <p className="sd-price">
                      {s.price === "Sur devis" ? (
                        <strong>Sur devis</strong>
                      ) : (
                        <>
                          <span>à partir de</span>
                          <strong>{s.price}</strong>
                        </>
                      )}
                    </p>
                    <p className="sd-delay">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                        <circle cx="12" cy="12" r="9" />
                        <path d="M12 7v5l3 3" />
                      </svg>
                      {s.delay}
                    </p>
                  </div>
                  <PillButton href="/contact" variant="dark">
                    Demander un devis
                  </PillButton>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
