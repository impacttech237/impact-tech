"use client";

/* ------------------------------------------------------------------
   11. GRAND TITRE ANIMÉ — "Le digital, pour *tous*."
   Révélation type SplitText : split par caractères, montée en
   stagger depuis le bas (masque overflow), scrubbée légèrement.
------------------------------------------------------------------- */
import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/* Découpe un mot en caractères enveloppés (masque + inner) */
function SplitChars({ word, accent = false }) {
  return word.split("").map((ch, i) => (
    <span key={i} className="bigtitle-mask">
      <span className={`bigtitle-char ${accent ? "accent" : ""}`}>{ch}</span>
    </span>
  ));
}

export default function BigTitle() {
  const rootRef = useRef(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) return;

      gsap.from(".bigtitle-char", {
        yPercent: 110,
        duration: 0.8,
        stagger: 0.03,
        ease: "power3.out",
        scrollTrigger: {
          trigger: rootRef.current,
          start: "top 75%",
          toggleActions: "play none none reverse",
        },
      });

      /* Légère dérive horizontale du bloc au scroll (profondeur) */
      gsap.fromTo(
        ".bigtitle-line--2",
        { x: 40 },
        {
          x: -40,
          ease: "none",
          scrollTrigger: {
            trigger: rootRef.current,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        }
      );
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={rootRef} className="bigtitle" aria-label="Le digital, pour tous.">
      <div className="container-it">
        <h2 aria-hidden="true">
          <span className="bigtitle-line bigtitle-line--1">
            <SplitChars word="Le" />
            <span className="bigtitle-space" />
            <SplitChars word="digital," />
          </span>
          <span className="bigtitle-line bigtitle-line--2">
            <SplitChars word="pour" />
            <span className="bigtitle-space" />
            <SplitChars word="tous." accent />
          </span>
        </h2>
      </div>
    </section>
  );
}
