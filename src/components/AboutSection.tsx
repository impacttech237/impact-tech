import PillButton from "./PillButton";

const VALUES = [
  {
    title: "Accessibilité",
    desc: "Des prix justes et transparents, des paiements échelonnés : le digital ne doit exclure personne.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M8 12h8M12 8v8" /></svg>
    ),
  },
  {
    title: "Proximité",
    desc: "On parle votre langue, on connaît votre marché. Support local, réactif, sur WhatsApp s'il le faut.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s7-5.1 7-11a7 7 0 1 0-14 0c0 5.9 7 11 7 11Z" /><circle cx="12" cy="10" r="2.6" /></svg>
    ),
  },
  {
    title: "Exigence",
    desc: "Prix accessible ne veut pas dire qualité au rabais : design soigné, code propre, performances au rendez-vous.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m12 2 2.6 5.5 6 .6-4.5 4 1.3 5.9L12 15l-5.4 3 1.3-5.9-4.5-4 6-.6L12 2Z" /></svg>
    ),
  },
  {
    title: "Impact",
    desc: "Notre réussite se mesure à la vôtre : plus de clients, plus de ventes, plus de temps pour votre métier.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 17 9 11l4 4 8-8" /><path d="M14 7h7v7" /></svg>
    ),
  },
];

export default function AboutSection() {
  return (
    <section className="about section-pad" data-anim="about">
      <div className="about-orbit" aria-hidden="true">
        <span /><span /><span />
      </div>
      <div className="container-it">
        <header className="about-intro">
          <span>02 — MANIFESTE</span>
          <h2>On ne construit pas seulement des sites. On rend les idées <em>visibles.</em></h2>
          <p>Faites défiler notre histoire : chaque étape rapproche une ambition locale d’un impact sans frontières.</p>
        </header>

        <div className="about-story">
          <div className="about-story__media">
            <img src="/images/about-team.jpg" alt="L'équipe IMPACT TECH dans son studio à Douala" loading="lazy" />
            <svg className="about-story__symbol" viewBox="0 0 160 120" aria-hidden="true">
              <path className="about-symbol__shape" d="M20 22H76c8 0 13 9 8 16L59 77c-5 8-15 8-20 0L14 38c-5-7-1-16 6-16Z" />
              <path className="about-symbol__target" d="M80 8 103 44 148 54 116 84 120 116 80 98 40 116 44 84 12 54 57 44Z" />
              <path className="about-symbol__route" d="M10 96C42 62 53 39 83 52s39 42 69 15" />
            </svg>
            <div className="about-story__badge">
              <strong>Depuis Douala</strong>
              <span>pour tout le Cameroun & au-delà</span>
            </div>
            <div className="about-story__meter" aria-hidden="true"><i /><span>01 / 03</span></div>
          </div>

          <div className="about-story__content">
            <span className="section-badge">
              <span className="dot" /> Notre histoire <span className="dot" />
            </span>
            <h2>Née d'un constat <span className="accent">simple</span></h2>
            <p data-about-step="1">
              Autour de nous, des commerçants, artisans et PME pleins de talent restaient invisibles en ligne. Pas
              par choix — mais parce que les devis qu'on leur proposait étaient inaccessibles, opaques, ou remplis
              de jargon.
            </p>
            <p data-about-step="2">
              IMPACT TECH est né pour changer ça : une équipe de designers et développeurs camerounais qui livre des
              outils digitaux de niveau international, à des prix pensés pour notre marché. Des packs clairs, tout
              inclus, sans mauvaise surprise.
            </p>
            <p data-about-step="3">
              Aujourd'hui, chaque projet livré est une entreprise de plus qui existe en ligne, vend plus loin et
              grandit. C'est ça, notre définition de l'impact.
            </p>
            <div className="about-story__cta">
              <PillButton href="/contact" variant="dark">Travaillons ensemble</PillButton>
            </div>
          </div>
        </div>

        <div className="about-values">
          <div className="about-values__head">
            <span className="section-badge">
              <span className="dot" /> Nos valeurs <span className="dot" />
            </span>
            <h2>Ce qui nous <span className="accent">guide</span></h2>
          </div>
          <div className="about-values__stage">
            <div className="about-values__track">
              {VALUES.map((v, index) => (
                <div key={v.title} className="value-card" data-value-index={index + 1}>
                  <span className="value-card__index">{String(index + 1).padStart(2, "0")}</span>
                  <span className="value-card__icon">{v.icon}</span>
                  <h3>{v.title}</h3>
                  <p>{v.desc}</p>
                  <span className="value-card__line" aria-hidden="true" />
                </div>
              ))}
            </div>
            <div className="about-values__progress" aria-hidden="true"><span /></div>
          </div>
        </div>
      </div>
    </section>
  );
}
