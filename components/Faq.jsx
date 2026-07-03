"use client";

/* ------------------------------------------------------------------
   FAQ — accordéon accessible (boutons + aria-expanded)
   Utilisé sur /services et /contact.
------------------------------------------------------------------- */
import { useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

import { DEFAULTS } from "@/lib/defaults";

export default function Faq({ items }) {
  const rootRef = useRef(null);
  const [open, setOpen] = useState(0);
  /* Questions gérées depuis le dashboard admin (table faqs) */
  const FAQ = items?.length ? items : DEFAULTS.faqs;

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) return;
      gsap.from(".faq-item", {
        y: 30,
        opacity: 0,
        duration: 0.7,
        stagger: 0.08,
        ease: "power2.out",
        scrollTrigger: { trigger: rootRef.current, start: "top 80%" },
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={rootRef} className="faq section-pad">
      <div className="container-it">
        <div className="faq__grid">
          {/* Colonne titre */}
          <div className="faq__head">
            <span className="section-badge">
              <span className="dot" /> FAQ <span className="dot" />
            </span>
            <h2>
              Les questions qu'on nous pose <span className="accent">souvent</span>
            </h2>
            <p>
              Une autre question ? Écrivez-nous sur WhatsApp, on répond
              rapidement et sans jargon.
            </p>
          </div>

          {/* Accordéon */}
          <div className="faq__list">
            {FAQ.map((item, i) => {
              const isOpen = open === i;
              return (
                <div key={i} className={`faq-item ${isOpen ? "is-open" : ""}`}>
                  <button
                    className="faq-item__btn"
                    aria-expanded={isOpen}
                    aria-controls={`faq-panel-${i}`}
                    id={`faq-btn-${i}`}
                    onClick={() => setOpen(isOpen ? -1 : i)}
                  >
                    <span>{item.q}</span>
                    <span className="faq-item__icon" aria-hidden="true">
                      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M8 3v10M3 8h10" />
                      </svg>
                    </span>
                  </button>
                  <div
                    id={`faq-panel-${i}`}
                    role="region"
                    aria-labelledby={`faq-btn-${i}`}
                    className="faq-item__panel"
                  >
                    <p>{item.a}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
