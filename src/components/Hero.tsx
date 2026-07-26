import PillButton from "./PillButton";
import { DEFAULTS } from "../lib/defaults";

/* Split "maison" par mots : chaque mot dans un span (masque overflow).
   L'animation d'entrée est jouée par client/main.ts sur .hero-word. */
function SplitWords({ children, accentWord }) {
  const words = children.split(" ");
  return (
    <>
      {words.map((word, i) => {
        const clean = word.replace(/[.,!?']/g, "");
        const isAccent = accentWord && clean.toLowerCase().includes(accentWord);
        return (
          <span key={i}>
            <span className="inline-block overflow-hidden align-bottom">
              <span className={`hero-word inline-block ${isAccent ? "accent" : ""}`}>{word}</span>
            </span>
            {i < words.length - 1 ? " " : ""}
          </span>
        );
      })}
    </>
  );
}

export default function Hero({ pills }) {
  const PILLS = pills?.length ? pills : DEFAULTS.settings.hero_pills;

  return (
    <section className="hero" data-anim="hero">
      <div className="hero__bg" role="img" aria-label="Équipe IMPACT TECH au travail, Douala, Cameroun" />
      <div className="hero__overlay" aria-hidden="true" />
      <div className="hero__kinetic" aria-hidden="true">
        <svg className="hero__orbit" viewBox="0 0 1200 760" fill="none">
          <path className="hero__orbit-path hero__orbit-path--outer" d="M72 450C168 92 488 24 765 118c277 94 421 349 304 507-117 158-416 134-655 58C175 607-4 734 72 450Z" />
          <path id="hero-motion-path" className="hero__orbit-path hero__orbit-path--route" d="M96 570C238 708 437 671 540 488 643 305 709 82 1038 168" />
          <circle className="hero__orbit-ring hero__orbit-ring--one" cx="600" cy="380" r="260" />
          <circle className="hero__orbit-ring hero__orbit-ring--two" cx="600" cy="380" r="142" />
          <circle className="hero__runner" cx="0" cy="0" r="8" />
          <circle className="hero__pulse hero__pulse--one" cx="1038" cy="168" r="7" />
          <circle className="hero__pulse hero__pulse--two" cx="96" cy="570" r="5" />
        </svg>
        <div className="hero__impact-mark">
          <img src="/images/icone-transparent.png" alt="" />
        </div>
        <span className="hero__chapter">01 — IMPACT EN MOUVEMENT</span>
      </div>

      <div className="hero__content">
        <div className="hero__badge gsap-hidden">
          <span className="dot" aria-hidden="true" />
          <span className="hero__badge-label">Le digital accessible — depuis le Cameroun</span>
        </div>

        <h1 className="hero__title">
          <SplitWords accentWord="impact">Un digital qui a de l'impact, à prix juste</SplitWords>
        </h1>

        <p className="hero__subtitle gsap-hidden">
          Sites, applications et solutions sur-mesure pensés pour les entreprises et entrepreneurs qui veulent du
          concret, sans exploser leur budget.
        </p>

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

        <div className="hero__cta gsap-hidden">
          <PillButton href="/contact" variant="cream">
            Démarrer un projet
          </PillButton>
          <PillButton href="#services" variant="outline" className="!text-cream !border-cream/30 hover:!border-red">
            Découvrir nos services
          </PillButton>
        </div>
      </div>

      <div className="hero__scroll gsap-hidden" aria-hidden="true">
        <span>Scroll</span>
        <span className="hero__scroll-line" />
      </div>
    </section>
  );
}
