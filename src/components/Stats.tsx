import { DEFAULTS } from "../lib/defaults";

export default function Stats({ items }) {
  const STATS = items?.length ? items : DEFAULTS.stats;

  return (
    <section id="chiffres" className="stats section-pad" data-anim="stats">
      <div className="container-it">
        <div className="stats-head">
          <span className="section-badge">
            <span className="dot" /> Nos chiffres <span className="dot" />
          </span>
          <h2 className="stats-title">
            Des résultats <span className="accent">concrets</span>
          </h2>
        </div>

        <div className="stats-grid">
          {STATS.map((s) => (
            <div key={s.label} className="stat-item">
              <p className="stat-value">
                <span className="stat-num" data-value={s.value}>0</span>
                <span className="stat-suffix">{s.suffix}</span>
              </p>
              <h3>{s.label}</h3>
              <p className="stat-note">{s.note}</p>
            </div>
          ))}
        </div>

        <div className="stats-thumbs" aria-hidden="true">
          {[
            "/images/service-landing.jpg",
            "/images/project-ecommerce.jpg",
            "/images/service-saas.jpg",
            "/images/project-custom.jpg",
            "/images/service-app.jpg",
          ].map((src, i) => (
            <div key={i} className="stat-thumb">
              <img src={src} alt="" loading="lazy" draggable="false" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
