import ArrowIcon from "./ArrowIcon";
import { DEFAULTS } from "../lib/defaults";

/* Le filtrage par catégorie est géré côté client (client/main.ts) via
   data-pf-filter / data-pf-cat, en montrant/masquant les cartes. */
export default function PortfolioGrid({ items }) {
  const PROJECTS = (items?.length ? items : DEFAULTS.projects).map((p) => ({
    img: p.image, cat: p.category, title: p.title, desc: p.description, result: p.result,
  }));
  const CATEGORIES = ["Tous", ...Array.from(new Set(PROJECTS.map((p) => p.cat).filter(Boolean)))];

  return (
    <section className="portfolio section-pad" data-anim="portfolio">
      <div className="pf-backdrop" aria-hidden="true"><span /><span /><span /></div>
      <div className="container-it">
        <header className="pf-intro">
          <span>02 — PROJETS EN MOUVEMENT</span>
          <h2>Des idées devenues <span className="accent">expériences</span></h2>
          <p>Explorez les projets, filtrez les univers et laissez chaque réalisation révéler son impact.</p>
        </header>

        <div className="pf-filters" role="tablist" aria-label="Filtrer les projets">
          {CATEGORIES.map((c, i) => (
            <button
              key={c}
              role="tab"
              aria-selected={i === 0 ? "true" : "false"}
              className={`pf-filter ${i === 0 ? "is-active" : ""}`}
              data-pf-filter={c}
            >
              <span>{String(i + 1).padStart(2, "0")}</span>
              {c}
            </button>
          ))}
        </div>

        <div className="pf-grid" data-pf-grid>
          {PROJECTS.map((p, index) => (
            <article key={p.title} className="pf-card" data-pf-cat={p.cat} data-pf-title={p.title}>
              <a href="/contact" className="pf-card__inner">
                <div className="pf-card__media">
                  <img src={p.img} alt={p.title} loading="lazy" draggable="false" />
                  <span className="pf-card__index" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                  <span className="pf-card__cat">{p.cat}</span>
                  <span className="pf-card__overlay" aria-hidden="true">
                    <span className="pf-card__overlay-btn">Voir le projet <ArrowIcon /></span>
                  </span>
                </div>
                <div className="pf-card__body">
                  <h3>{p.title}</h3>
                  <p>{p.desc}</p>
                  <p className="pf-card__result">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M3 17 9 11l4 4 8-8" /><path d="M14 7h7v7" />
                    </svg>
                    {p.result}
                  </p>
                </div>
              </a>
            </article>
          ))}
        </div>

        <p className="pf-note">Projets de démonstration illustrant nos savoir-faire — votre projet sera le prochain. *</p>
      </div>

      <div className="pf-cursor-preview" aria-hidden="true">
        <span>VOIR</span>
        <strong>LE PROJET</strong>
      </div>
    </section>
  );
}
