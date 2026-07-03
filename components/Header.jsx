"use client";

/* ------------------------------------------------------------------
   Header — transparent sur le hero, devient blanc + ombre au scroll
   (> 50px). Se masque en scrollant vers le bas, réapparaît en remontant.
------------------------------------------------------------------- */
import { useEffect, useRef, useState } from "react";
import PillButton from "./PillButton";

const NAV_LINKS = [
  { label: "Accueil", href: "/" },
  { label: "Services", href: "/services" },
  { label: "Réalisations", href: "/realisations" },
  { label: "À propos", href: "/a-propos" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
];

export default function Header() {
  const [solid, setSolid] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setSolid(y > 50);
      // Masque le header en descendant (après 300px), réaffiche en remontant
      setHidden(y > 300 && y > lastY.current);
      lastY.current = y;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Bloque le scroll body quand le menu mobile est ouvert
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => (document.body.style.overflow = "");
  }, [menuOpen]);

  return (
    <>
      <header
        className={[
          "header",
          solid || menuOpen ? "header--solid" : "",
          hidden && !menuOpen ? "header--hidden" : "",
          menuOpen ? "header--menu-open" : "",
        ].join(" ")}
      >
        <div className="container-it">
          <div className="header__inner">
            {/* Logo */}
            <a href="#" className="logo" aria-label="IMPACT TECH — Accueil">
              impact<span className="logo-dot">.</span>
              <span className="logo-tech">Tech</span>
            </a>

            {/* Navigation desktop */}
            <nav className="header__nav flex items-center gap-8" aria-label="Navigation principale">
              {NAV_LINKS.map((l) => (
                <a key={l.label} href={l.href} className="nav-link">
                  {l.label}
                </a>
              ))}
            </nav>

            {/* CTA desktop */}
            <div className="header__cta">
              <PillButton href="/contact" variant={solid ? "dark" : "cream"}>
                Démarrer un projet
              </PillButton>
            </div>

            {/* Burger mobile */}
            <button
              className="burger"
              aria-expanded={menuOpen}
              aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
              onClick={() => setMenuOpen((o) => !o)}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>
      </header>

      {/* Menu mobile plein écran */}
      <div className={`mobile-menu ${menuOpen ? "is-open" : ""}`}>
        <nav aria-label="Navigation mobile" className="flex flex-col">
          {NAV_LINKS.map((l) => (
            <a key={l.label} href={l.href} onClick={() => setMenuOpen(false)}>
              {l.label}
            </a>
          ))}
        </nav>
        <div className="mt-10">
          <PillButton href="/contact" variant="dark" onClick={() => setMenuOpen(false)}>
            Démarrer un projet
          </PillButton>
        </div>
      </div>
    </>
  );
}
