import { DEFAULTS } from "../lib/defaults";
import PillButton from "./PillButton";

const NAV_LINKS = [
  { label: "Accueil", href: "/" },
  { label: "Services", href: "/services" },
  { label: "Réalisations", href: "/realisations" },
  { label: "À propos", href: "/a-propos" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
];

export default function Footer({ settings }) {
  const s = { ...DEFAULTS.settings, ...(settings || {}) };
  const waLink = `https://wa.me/${(s.phone_link || "").replace("+", "")}`;
  const socials = [
    { label: "Facebook", href: s.facebook },
    { label: "Instagram", href: s.instagram },
    { label: "LinkedIn", href: s.linkedin },
    { label: "TikTok", href: s.tiktok },
  ].filter((item) => item.href);

  return (
    <footer id="contact" className="footer-wrap" data-anim="footer">
      <section className="newsletter">
        <div className="container-it">
          <div className="newsletter__card">
            <div className="newsletter__shape newsletter__shape--one" />
            <div className="newsletter__shape newsletter__shape--two" />
            <div className="newsletter__shape newsletter__shape--three" />
            <div className="newsletter__inner">
              <span className="section-badge"><span className="dot" /> La dose d’impact <span className="dot" /></span>
              <h2 className="newsletter__title">Des idées digitales qui font <span className="accent">avancer.</span></h2>
              <p className="newsletter__sub">Conseils concrets, tendances et offres réservées, une fois par mois. Zéro spam.</p>
              <form className="newsletter__form" data-ajax-form="newsletter" action="/api/newsletter" method="post">
                <label htmlFor="nl-email" className="sr-only">Votre adresse e-mail</label>
                <input id="nl-email" name="email" type="email" required placeholder="Votre adresse e-mail" autoComplete="email" />
                <button type="submit" data-form-submit>S’abonner</button>
              </form>
              <p className="newsletter__done" data-form-done style={{ display: "none" }}>Merci ! Vous recevrez notre prochaine édition.</p>
            </div>
          </div>
        </div>
      </section>

      <div className="footer">
        {/* Emblème SORTI de la carte : enfant direct de .footer (hors du
            contexte isolation:isolate de .footer__card qui le coupait au bord
            supérieur). Il flotte ainsi au-dessus, jamais rogné. */}
        <div className="footer__emblem">
          <img src="/images/icone.png" alt="" aria-hidden="true" />
        </div>
        <div className="container-it">
          <div className="footer__card">
            <div className="footer__brand">
              <a href="/" className="footer__logo" aria-label="Impact Tech — Accueil">
                <img src="/images/logo.png" alt="Impact Tech" />
              </a>
              <p className="footer__tagline">Un digital qui a de l’impact, <span>à prix juste.</span></p>
              <div className="footer__cta">
                <PillButton href="/contact" variant="red">Démarrer un projet</PillButton>
                <PillButton href={waLink} variant="cream">Parler sur WhatsApp</PillButton>
              </div>
            </div>

            <div className="footer__cols">
              <div className="footer__col footer__contact">
                <p className="footer__eyebrow">Nous trouver</p>
                <h3>Contact</h3>
                <ul>
                  <li>{s.address}</li>
                  <li><a href={`tel:${s.phone_link}`}>{s.phone_display}</a></li>
                  <li><a href={`mailto:${s.email}`}>{s.email}</a></li>
                  <li>{s.hours}</li>
                </ul>
              </div>

              <div className="footer__col footer__nav">
                <p className="footer__eyebrow">Explorer</p>
                <h3>Navigation</h3>
                <ul>
                  {NAV_LINKS.map((link) => (
                    <li key={link.label}><a href={link.href}>{link.label}<span aria-hidden="true">↗</span></a></li>
                  ))}
                </ul>
              </div>

              <div className="footer__col footer__socials">
                <p className="footer__eyebrow">Restons connectés</p>
                <h3>Suivez-nous</h3>
                <ul>
                  {socials.map((social) => (
                    <li key={social.label}><a href={social.href} target="_blank" rel="noopener noreferrer">{social.label}<span aria-hidden="true">↗</span></a></li>
                  ))}
                  <li><a href={waLink} target="_blank" rel="noopener noreferrer">WhatsApp<span aria-hidden="true">↗</span></a></li>
                </ul>
              </div>
            </div>

            <div className="footer__bottom">
              <p>Fait avec <span aria-hidden="true">♥</span> à Douala</p>
              <div className="footer__legal">
                <a href="/mentions-legales">Mentions légales</a>
                <a href="/confidentialite">Confidentialité</a>
                <span>© 2026 Impact Tech</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
