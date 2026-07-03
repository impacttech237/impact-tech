import PillButton from "./PillButton";
import ArrowIcon from "./ArrowIcon";
import { DEFAULTS } from "../lib/defaults";

/* Le carousel (drag, pagination, flèches) est piloté par client/main.ts
   via les sélecteurs .services-track / .services-dots / .services-arrow. */
export default function Services({ items }) {
  const SERVICES = items?.length
    ? items.map((s) => ({ img: s.image, tag: s.tag, title: s.title, desc: s.shortDesc }))
    : DEFAULTS.services.map((s) => ({ img: s.image, tag: s.tag, title: s.title, desc: s.shortDesc }));

  return (
    <section id="services" className="services section-pad" data-anim="services">
      <div className="container-it">
        <div className="services-head">
          <span className="section-badge">
            <span className="dot" /> Nos services <span className="dot" />
          </span>
          <h2 className="services-title">
            Des solutions <span className="accent">pensées</span><br />pour votre croissance
          </h2>
          <p className="services-sub">
            Du site vitrine au logiciel complet : on construit l'outil digital qu'il vous faut, au prix juste.
          </p>
        </div>

        <div className="services-carousel">
          <ul className="services-track" aria-label="Liste de nos services">
            {SERVICES.map((s) => (
              <li key={s.title} className="service-card">
                <a href="/services" className="service-card__inner">
                  <div className="service-card__media">
                    <img src={s.img} alt={s.title} loading="lazy" draggable="false" />
                    <span className="service-card__tag">{s.tag}</span>
                  </div>
                  <div className="service-card__body">
                    <h3>{s.title}</h3>
                    <p>{s.desc}</p>
                    <span className="service-card__link">En savoir plus<ArrowIcon /></span>
                  </div>
                </a>
              </li>
            ))}
          </ul>

          <div className="services-controls">
            <div className="services-dots" role="tablist" aria-label="Pagination des services" />
            <div className="services-arrows">
              <button className="services-arrow" aria-label="Précédent" data-carousel="prev">
                <ArrowIcon style={{ transform: "rotate(-135deg)" }} />
              </button>
              <button className="services-arrow" aria-label="Suivant" data-carousel="next">
                <ArrowIcon style={{ transform: "rotate(45deg)" }} />
              </button>
            </div>
          </div>
        </div>

        <div className="services-cta">
          <PillButton href="/services" variant="outline">Voir tous nos services</PillButton>
        </div>
      </div>
    </section>
  );
}
