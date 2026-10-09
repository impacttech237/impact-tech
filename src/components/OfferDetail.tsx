import PillButton from "./PillButton";
import ArrowIcon from "./ArrowIcon";
import { DEFAULTS } from "../lib/defaults";

function slugify(str) {
  const noAccents = str
    .toLowerCase()
    .normalize("NFD")
    .split("")
    .filter((ch) => ch.codePointAt(0) < 0x0300 || ch.codePointAt(0) > 0x036f)
    .join("");
  return noAccents.replace(/\s+/g, "-");
}

function toBlock(o) {
  return {
    id: slugify(o.tag), img: o.image, tag: o.tag, title: o.title, hook: o.hook,
    desc: o.description, features: o.features, valueStack: o.valueStack,
    totalValue: o.totalValue, ideal: o.ideal, price: o.price, currency: o.currency || "FCFA",
    priceEur: o.priceEur || "", isQuote: o.isQuote, delay: o.delay,
  };
}

/* Calcule le % d'économie réel à partir des chiffres déjà en base (pas une
   valeur inventée) — fonctionne pour FR (montants exacts) et EN (les totaux
   approximatifs "€3,500+" donnent, une fois arrondis, exactement les % cités
   dans la grille tarifaire v2 : vérifié 3500->1490 = 57%, 8000->3490 = 56%). */
function savingsPercent(totalValue, price) {
  const total = parseInt(String(totalValue).replace(/\D/g, ""), 10);
  const current = parseInt(String(price).replace(/\D/g, ""), 10);
  if (!total || !current || current >= total) return null;
  return Math.round(((total - current) / total) * 100);
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2.5 8.5 6 12l7.5-8" />
    </svg>
  );
}

/* Détail des 3 packs (fusion Services/Offres) : accroche (Problem/Agitate),
   value stack chiffré (Hormozi), inclusions, idéal pour, délai, CTA dédié.
   Remplace l'ancienne présentation "6 services" — chaque pack EST le service. */
export default function OfferDetail({ items, locale = "fr" }) {
  const en = locale === "en";
  const OFFERS = (items?.length ? items : DEFAULTS.offers).map(toBlock);
  const contactHref = en ? "/en/contact" : "/contact";

  return (
    <section className="services-detail section-pad" data-anim="services-detail">
      <div className="sd-grid-bg" aria-hidden="true" />
      <div className="container-it">
        <header className="sd-intro">
          <span className="sd-intro__eyebrow">01 — {en ? "OUR PLANS" : "NOS PACKS"}</span>
          <h2>{en ? <>Three clear plans, <span className="accent">zero jargon</span></> : <>Trois formules claires, <span className="accent">zéro jargon</span></>}</h2>
          <p>
            {en
              ? "Every plan is a complete offer: design, development, hosting, training. You only pay on delivery."
              : "Chaque pack est une offre complète : design, développement, hébergement, formation. Vous ne payez qu'à la livraison."}
          </p>
        </header>

        <nav className="sd-anchors" aria-label={en ? "Jump to a plan" : "Aller à un pack"}>
          {OFFERS.map((o, i) => (
            <a key={o.id} href={`#${o.id}`} className={`sd-anchor ${i === 0 ? "is-active" : ""}`} data-sd-anchor={i}>
              <span className="sd-anchor__num">{String(i + 1).padStart(2, "0")}</span>
              <span className="sd-anchor__label">{o.tag}</span>
            </a>
          ))}
        </nav>

        <div className="sd-chapter-progress" aria-hidden="true">
          <span className="sd-chapter-progress__line"><i /></span>
          <strong>01</strong>
          <em>/ {String(OFFERS.length).padStart(2, "0")}</em>
        </div>

        <div className="sd-list">
          {OFFERS.map((o, i) => (
            <article
              key={o.id}
              id={o.id}
              data-sd-index={i}
              className={`sd-block ${i % 2 === 1 ? "sd-block--reverse" : ""}`}
            >
              <span className="sd-block__ghost" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
              <div className="sd-media">
                <img src={o.img} alt={o.tag} loading="lazy" draggable="false" />
                <span className="sd-media__tag">{o.tag}</span>
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
                  <span>{en ? "PLAN" : "PACK"} / {o.tag}</span>
                </div>
                <h2>{o.title}</h2>
                {o.hook && <p className="sd-desc sd-hook">{o.hook}</p>}
                <p className="sd-desc">{o.desc}</p>

                {!!o.valueStack?.length && (
                  <ul className="sd-features sd-value-stack">
                    {o.valueStack.map((f) => (
                      <li key={f}>
                        <span className="sd-check"><CheckIcon /></span>
                        {f}
                      </li>
                    ))}
                  </ul>
                )}
                {!o.valueStack?.length && !!o.features?.length && (
                  <ul className="sd-features">
                    {o.features.map((f) => (
                      <li key={f}>
                        <span className="sd-check"><CheckIcon /></span>
                        {f}
                      </li>
                    ))}
                  </ul>
                )}

                {o.totalValue && (
                  <p className="sd-total-value">
                    {en ? (
                      <>
                        Total value: <s>{o.totalValue}</s> — your price: <strong>{o.isQuote ? o.price : `€${o.price}`}</strong>
                        {!o.isQuote && savingsPercent(o.totalValue, o.price) != null && (
                          <> <span className="sd-savings">(−{savingsPercent(o.totalValue, o.price)}%)</span></>
                        )}
                      </>
                    ) : (
                      <>
                        Valeur totale : <s>{o.totalValue}</s> — votre prix : <strong>{o.isQuote ? o.price : `${o.price} FCFA`}</strong>
                        {!o.isQuote && savingsPercent(o.totalValue, o.price) != null && (
                          <> <span className="sd-savings">(−{savingsPercent(o.totalValue, o.price)}%)</span></>
                        )}
                      </>
                    )}
                  </p>
                )}

                {o.ideal && <p className="sd-ideal"><strong>{en ? "Ideal for:" : "Idéal pour :"}</strong> {o.ideal}</p>}

                <div className="sd-footer">
                  <div className="sd-meta">
                    <p className="sd-price">
                      {o.isQuote ? (
                        <strong>{o.price}</strong>
                      ) : o.currency === "EUR" ? (
                        <strong>€{o.price}</strong>
                      ) : (
                        <>
                          <strong>{o.price} FCFA</strong>
                          {o.priceEur && <span className="sd-price__eur">≈ {o.priceEur} €</span>}
                        </>
                      )}
                    </p>
                    {o.delay && (
                      <p className="sd-delay">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                          <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" />
                        </svg>
                        {o.delay}
                      </p>
                    )}
                  </div>
                  <div className="sd-actions">
                    <a href={`${contactHref}?offre=${o.id}`} className="sd-offer-link">{en ? "Request this plan" : "Demander ce pack"} <ArrowIcon /></a>
                    <PillButton href={`${contactHref}?offre=${o.id}`} variant="dark">
                      {o.isQuote ? (en ? "Discuss my project" : "Discuter de mon projet") : (en ? "Start my project" : "Démarrer mon projet")}
                    </PillButton>
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
