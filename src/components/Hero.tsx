import PillButton from "./PillButton";
import { DEFAULTS } from "../lib/defaults";

/* Split "maison" par mots : chaque mot dans un span (masque overflow).
   L'animation d'entrée est jouée par client/main.ts sur .hero-word. */
function SplitWords({ children, accentWord }) {
  return (
    <>
      {children.split(" ").map((word, i) => {
        const clean = word.replace(/[.,!?']/g, "");
        const isAccent = accentWord && clean.toLowerCase().includes(accentWord);
        return (
          <span key={i} className="inline-block overflow-hidden align-bottom">
            <span className={`hero-word inline-block ${isAccent ? "accent" : ""}`}>
              {word}
              {" "}
            </span>
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

      <div className="hero__content">
        <div className="hero__badge gsap-hidden">
          <span className="dot" aria-hidden="true" />
          Le digital accessible — depuis le Cameroun
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
