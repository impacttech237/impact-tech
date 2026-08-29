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
    img: o.image, tag: o.tag, title: o.title, description: o.description, price: o.price,
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
    <section id="offres" className="offers section-pad" data-anim="offers">
      <div className="container-it offers__scene">
        <div className="offers-head">
          <span className="offers__chapter" aria-hidden="true">04 / NOS PACKS</span>
          <span className="section-badge">
            <span className="dot" /> Nos formules <span className="dot" />
          </span>
          <h2 className="offers-title">
            Trois packs clairs, <span className="accent">tout inclus</span><br />zéro mauvaise surprise
          </h2>
          <p className="offers-sub">
            Chaque service se retrouve dans l'un de ces trois packs. Design, développement, nom de domaine,
            hébergement et sécurité sont compris dans le prix — vous n'avez rien d'autre à payer.
          </p>
        </div>

        <div className="offers-grid">
          {OFFERS.map((o, index) => (
            <article key={o.tag} id={`offre-${o.slug}`} className={`offer-card ${o.popular ? "offer-card--popular" : ""}`}>
              <span className="offer-card__index" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
              {o.popular && <span className="offer-card__flag">Le plus demandé</span>}

              <div className="offer-card__media">
                <img src={o.img} alt={o.tag} loading="lazy" draggable="false" />
                <span className="offer-card__tag">{o.tag}</span>
              </div>

              <div className="offer-card__body">
                <h3 className="offer-card__name">{o.tag}</h3>
                <p className="offer-card__tagline">{o.title}</p>
                {o.description && <p className="offer-card__desc">{o.description}</p>}

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
                {!o.isQuote && (
                  <button
                    type="button"
                    className="offer-card__pay"
                    data-pay-trigger
                    data-pay-tag={o.tag}
                    data-pay-label={o.tag}
                    data-pay-price={`${o.price} FCFA`}
                  >
                    Payer maintenant (Mobile Money)
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
        <div className="offers__progress" aria-hidden="true">
          {OFFERS.map((o, index) => <span key={o.tag} className={index === 0 ? "is-active" : ""} />)}
        </div>

        <p className="offers-note">* Paiement échelonné possible. Chaque pack est ajustable selon vos besoins réels.</p>
        <div className="offers-cta">
          <PillButton href="/contact" variant="dark">Demander mon devis gratuit</PillButton>
        </div>
      </div>

      {/* Modale de paiement K-PAY (Mobile Money) — logique dans client/main.ts,
          sélecteurs data-pay-*. Une seule instance, réutilisée pour chaque pack. */}
      <div className="pay-modal" data-pay-modal aria-hidden="true">
        <div className="pay-modal__backdrop" data-pay-close />
        <div className="pay-modal__card" role="dialog" aria-modal="true" aria-labelledby="pay-modal-title">
          <button type="button" className="pay-modal__close" data-pay-close aria-label="Fermer">✕</button>
          <p className="pay-modal__eyebrow">Paiement sécurisé · Mobile Money</p>
          <h3 id="pay-modal-title" data-pay-modal-label>Payer un pack</h3>
          <p className="pay-modal__price" data-pay-modal-price></p>
          <form data-pay-form>
            <label>Nom complet
              <input type="text" name="customerName" required autoComplete="name" placeholder="Votre nom" />
            </label>
            <label>Téléphone (MTN MoMo / Orange Money)
              <input type="tel" name="customerPhone" required autoComplete="tel" placeholder="+237 6XX XXX XXX" />
            </label>
            <label>Email <span>(optionnel, pour le reçu)</span>
              <input type="email" name="customerEmail" autoComplete="email" placeholder="vous@exemple.com" />
            </label>
            <p className="pay-modal__error" data-pay-error style={{ display: "none" }}></p>
            <button type="submit" className="pay-modal__submit" data-pay-submit>Continuer vers le paiement</button>
            <p className="pay-modal__note">Vous choisirez MTN MoMo ou Orange Money sur la page sécurisée K-PAY.</p>
          </form>
        </div>
      </div>
    </section>
  );
}
