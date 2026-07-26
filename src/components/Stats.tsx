export default function Stats({ items }) {
  if (!items?.length) return null;
  const STATS = items;

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
          {STATS.map((s, index) => (
            <div key={s.label} className="stat-item">
              <svg className="stat-ring" viewBox="0 0 160 160" fill="none" aria-hidden="true">
                <circle className="stat-ring__track" cx="80" cy="80" r="70" />
                <circle className="stat-ring__value" cx="80" cy="80" r="70" data-ring={index} />
              </svg>
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
        <div className="stats__axis" aria-hidden="true"><span>IMPACT</span><span>MESURABLE</span></div>
      </div>
    </section>
  );
}
