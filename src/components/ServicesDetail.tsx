import PillButton from "./PillButton";
import ArrowIcon from "./ArrowIcon";
import { DEFAULTS } from "../lib/defaults";

function toBlock(s) {
  return {
    id: s.slug, img: s.image, tag: s.tag, title: s.title, accent: s.accent,
    headline: s.headline, desc: s.description, features: s.features,
    ideal: s.ideal, price: s.price, delay: s.delay,
  };
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2.5 8.5 6 12l7.5-8" />
    </svg>
  );
}

export default function ServicesDetail({ items }) {
  const SERVICES = (items?.length ? items : DEFAULTS.services).map(toBlock);

  return (
    <section className="services-detail section-pad" data-anim="services-detail">
      <div className="sd-grid-bg" aria-hidden="true" />
      <div className="container-it">
        <header className="sd-intro">
          <span className="sd-intro__eyebrow">01 — EXPERTISES</span>
          <h2>Six façons de faire avancer <span className="accent">votre activité</span></h2>
          <p>Chaque mouvement révèle une expertise, son usage concret et la valeur qu’elle crée pour votre entreprise.</p>
        </header>

        <nav className="sd-anchors" aria-label="Aller à un service">
          {SERVICES.map((s, i) => (
            <a key={s.id} href={`#${s.id}`} className={`sd-anchor ${i === 0 ? "is-active" : ""}`} data-sd-anchor={i}>
              <span className="sd-anchor__num">{String(i + 1).padStart(2, "0")}</span>
              <span className="sd-anchor__label">{s.title}</span>
            </a>
          ))}
        </nav>

        <div className="sd-chapter-progress" aria-hidden="true">
          <span className="sd-chapter-progress__line"><i /></span>
          <strong>01</strong>
          <em>/ {String(SERVICES.length).padStart(2, "0")}</em>
        </div>

        <div className="sd-list">
          {SERVICES.map((s, i) => (
            <article
              key={s.id}
              id={s.id}
              data-sd-index={i}
              className={`sd-block ${i % 2 === 1 ? "sd-block--reverse" : ""}`}
            >
              <span className="sd-block__ghost" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
              <div className="sd-media">
                <img src={s.img} alt={s.title} loading="lazy" draggable="false" />
                <span className="sd-media__tag">{s.tag}</span>
                <svg className="sd-media__route" viewBox="0 0 640 540" fill="none" aria-hidden="true">
                  <path
                    className="sd-route-path"
                    id={`sd-route-${i}`}
                    d={i % 2 === 0
                      ? "M52 423C118 153 335 88 574 169C424 245 501 410 278 463C181 486 112 465 52 423Z"
                      : "M70 112C259 32 496 118 564 355C434 291 357 459 162 407C78 385 42 241 70 112Z"}
                  />
                  <circle className="sd-route-runner" cx="0" cy="0" r="9" />
                </svg>
              </div>

              <div className="sd-content">
                <div className="sd-content__chapter">
                  <span className="sd-num" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
                  <span>CHAPITRE / {s.tag}</span>
                </div>
                <h2>
                  {s.headline.split(s.accent).map((part, j, arr) => (
                    <span key={j}>
                      {part}
                      {j < arr.length - 1 && <span className="accent">{s.accent}</span>}
                    </span>
                  ))}
                </h2>
                <p className="sd-desc">{s.desc}</p>

                <ul className="sd-features">
                  {s.features.map((f) => (
                    <li key={f}>
                      <span className="sd-check"><CheckIcon /></span>
                      {f}
                    </li>
                  ))}
                </ul>

                <p className="sd-ideal"><strong>Idéal pour :</strong> {s.ideal}</p>

                <div className="sd-footer">
                  <div className="sd-meta">
                    <p className="sd-price">
                      {s.price === "Sur devis" ? (
                        <strong>Sur devis</strong>
                      ) : (
                        <>
                          <span>à partir de</span>
                          <strong>{s.price}</strong>
                        </>
                      )}
                    </p>
                    <p className="sd-delay">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                        <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" />
                      </svg>
                      {s.delay}
                    </p>
                  </div>
                  <div className="sd-actions">
                    <a href="#offres" className="sd-offer-link">Voir nos formules <ArrowIcon /></a>
                    <PillButton href="/contact" variant="dark">Demander un devis</PillButton>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
