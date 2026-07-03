"use client";

/* ------------------------------------------------------------------
   SmoothScroll — Lenis (lerp 0.1) synchronisé avec GSAP ScrollTrigger
   Monté une seule fois au niveau du layout.
------------------------------------------------------------------- */
import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function SmoothScroll({ children }) {
  useEffect(() => {
    // Respecte prefers-reduced-motion : pas de smooth scroll
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const lenis = new Lenis({
      lerp: 0.1,
      smoothWheel: true,
    });

    // Lenis pilote le rafraîchissement de ScrollTrigger
    lenis.on("scroll", ScrollTrigger.update);

    // On branche Lenis sur le ticker GSAP (une seule boucle rAF)
    const raf = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
    };
  }, []);

  return children;
}
