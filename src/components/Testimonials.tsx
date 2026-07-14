function Card({ t }) {
  return (
    <article className="testi-card">
      <div className="testi-stars" aria-label="5 étoiles sur 5">
        {Array.from({ length: 5 }).map((_, i) => (
          <svg key={i} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path d="M10 1.5 12.6 7l6 .6-4.5 4 1.3 5.9L10 14.4l-5.4 3.1L5.9 11.6l-4.5-4 6-.6L10 1.5Z" />
          </svg>
        ))}
      </div>
      <p className="testi-text">« {t.text} »</p>
      <footer className="testi-author">
        <span className="testi-avatar" aria-hidden="true">{t.initials}</span>
        <div>
          <strong>{t.name}</strong>
          <span>{t.role}</span>
        </div>
      </footer>
    </article>
  );
}

export default function Testimonials({ items }) {
  if (!items?.length) return null;
  const TESTIMONIALS = items;
  const cols = [[], [], []];
  TESTIMONIALS.forEach((t, i) => cols[i % 3].push(t));

  return (
    <section className="testimonials section-pad" data-anim="testimonials">
      <div className="container-it">
        <div className="testi-head">
          <span className="section-badge">
            <span className="dot" /> Témoignages <span className="dot" />
          </span>
          <h2 className="testi-title">
            Ils nous ont fait <span className="accent">confiance</span>
          </h2>
          <p className="testi-sub">
            Des entrepreneurs et entreprises qui ont donné vie à leurs projets avec IMPACT TECH.
          </p>
        </div>
      </div>

      <div className="testi-wall">
        {cols.map((col, i) => (
          <div key={i} className={`testi-col ${i === 2 ? "testi-col--desktop" : ""}`}>
            <div className="testi-col-inner">
              {[...col, ...col].map((t, j) => (
                <Card key={`${t.name}-${j}`} t={t} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
