import { DEFAULTS } from "../lib/defaults";

/* L'accordéon (ouverture/fermeture) est géré par client/main.ts via
   les attributs data-faq-btn / data-faq-panel et aria-expanded. */
export default function Faq({ items }) {
  const FAQ = items?.length ? items : DEFAULTS.faqs;

  return (
    <section className="faq" data-anim="faq">
      <div className="container-it">
        <div className="faq__grid">
          <div className="faq__head">
            <span className="section-badge">
              <span className="dot" /> FAQ <span className="dot" />
            </span>
            <h2>Les questions qu'on nous pose <span className="accent">souvent</span></h2>
            <p>Une autre question ? Écrivez-nous sur WhatsApp, on répond rapidement et sans jargon.</p>
          </div>

          <div className="faq__list">
            {FAQ.map((item, i) => (
              <div key={i} className={`faq-item ${i === 0 ? "is-open" : ""}`} data-faq-item>
                <button
                  className="faq-item__btn"
                  aria-expanded={i === 0 ? "true" : "false"}
                  aria-controls={`faq-panel-${i}`}
                  id={`faq-btn-${i}`}
                  data-faq-btn
                >
                  <span>{item.q}</span>
                  <span className="faq-item__icon" aria-hidden="true">
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M8 3v10M3 8h10" />
                    </svg>
                  </span>
                </button>
                <div id={`faq-panel-${i}`} role="region" aria-labelledby={`faq-btn-${i}`} className="faq-item__panel" data-faq-panel>
                  <p>{item.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
