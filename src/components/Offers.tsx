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

function toCard(o) {
  return {
    img: o.image, tag: o.tag, title: o.title, price: o.price,
    isQuote: o.isQuote, popular: o.popular, features: o.features,
    slug: slugify(o.tag),
  };
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2.5 8.5 6 12l7.5-8" />
    </svg>
  );
}

export default function Offers({ items }) {
  const OFFERS = (items?.length ? items : DEFAULTS.offers).map(toCard);

  return (
    <section id="realisations" className="offers section-pad" data-anim="offers">
      <div className="container-it">
        <div className="offers-head">
          <span className="section-badge">
            <span className="dot" /> Offres phares <span className="dot" />
          </span>
          <h2 className="offers-title">
            Des packs <span className="accent">tout inclus</span>,<br />zéro mauvaise surprise
          </h2>
          <p className="offers-sub">
            Design, développement, nom de domaine, hébergement, sécurité : tout est compris dans le prix. Vous
            n'avez rien d'autre à payer.
          </p>
        </div>

        <div className="offers-grid">
          {OFFERS.map((o) => (
            <article key={o.tag} className={`offer-card ${o.popular ? "offer-card--popular" : ""}`}>
              {o.popular && <span className="offer-card__flag">Le plus demandé</span>}

              <div className="offer-card__media">
                <img src={o.img} alt={o.tag} loading="lazy" draggable="false" />
                <span className="offer-card__tag">{o.tag}</span>
              </div>

              <div className="offer-card__body">
                <h3 className="offer-card__name">{o.tag}</h3>
                <p className="offer-card__tagline">{o.title}</p>

                <ul className="offer-card__features">
                  {o.features.map((f) => (
                    <li key={f}>
                      <span className="offer-card__check"><CheckIcon /></span>
                      {f}
                    </li>
                  ))}
                </ul>

                <div className="offer-card__footer">
                  <p className="offer-card__price">
                    {o.isQuote ? (
                      <strong>{o.price}</strong>
                    ) : (
                      <>
                        <span>à partir de</span>
                        <strong>{o.price} <em>FCFA</em></strong>
                      </>
                    )}
                  </p>
                  <a href={`/contact?offre=${o.slug}`} className="offer-card__cta" aria-label={`Demander le ${o.tag}`}>
                    <ArrowIcon />
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>

        <p className="offers-note">* Paiement échelonné possible. Chaque pack est ajustable selon vos besoins réels.</p>
        <div className="offers-cta">
          <PillButton href="/contact" variant="dark">Demander mon devis gratuit</PillButton>
        </div>
      </div>
    </section>
  );
}
