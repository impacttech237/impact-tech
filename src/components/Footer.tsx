import { DEFAULTS } from "../lib/defaults";

const LINKS = {
  Navigation: [
    { label: "Accueil", href: "/" },
    { label: "Services", href: "/services" },
    { label: "Réalisations", href: "/realisations" },
    { label: "À propos", href: "/a-propos" },
    { label: "Blog", href: "/blog" },
    { label: "Contact", href: "/contact" },
  ],
  Services: [
    { label: "Landing Page", href: "/services#landing-page" },
    { label: "E-commerce", href: "/services#e-commerce" },
    { label: "Blog / Vitrine", href: "/services#blog-vitrine" },
    { label: "SaaS & Applications", href: "/services#saas" },
    { label: "Sur-mesure", href: "/services#sur-mesure" },
  ],
};

export default function Footer({ settings }) {
  const s = { ...DEFAULTS.settings, ...(settings || {}) };
  const waLink = `https://wa.me/${(s.phone_link || "").replace("+", "")}`;

  return (
    <footer id="contact" className="footer-wrap" data-anim="footer">
      <section className="newsletter">
        <div className="container-it">
          <div className="newsletter__card">
            <div className="newsletter__inner">
              <span className="section-badge section-badge--light">
                <span className="dot" /> Newsletter <span className="dot" />
              </span>
              <h2 className="newsletter__title">Des idées digitales, <span className="accent">chaque mois</span></h2>
              <p className="newsletter__sub">
                Conseils concrets, tendances et offres réservées — directement dans votre boîte mail. Zéro spam.
              </p>

              <form className="newsletter__form" data-ajax-form="newsletter" action="/api/newsletter" method="post">
                <label htmlFor="nl-email" className="sr-only">Votre adresse e-mail</label>
                <input id="nl-email" name="email" type="email" required placeholder="Votre adresse e-mail" autoComplete="email" />
                <button type="submit" data-form-submit>S'abonner</button>
              </form>
              <p className="newsletter__done" data-form-done style={{ display: "none" }}>
                ✓ Merci ! Vous recevrez notre prochaine édition.
              </p>
            </div>

            <div className="newsletter__visual" aria-hidden="true">
              <img src="/images/blog-3.jpg" alt="" loading="lazy" />
            </div>
          </div>
        </div>
      </section>

      <div className="footer">
        <div className="container-it">
          <div className="footer__grid">
            <div className="footer__brand">
              <a href="/" className="logo logo--footer" aria-label="IMPACT TECH — Accueil">
                impact<span className="logo-dot">.</span>
                <span className="logo-tech">Tech</span>
              </a>
              <p>Agence web basée au Cameroun. Notre mission : rendre le digital accessible à tous, au prix juste.</p>
              <div className="footer__socials">
                <a href={s.facebook || "#"} aria-label="Facebook" target="_blank" rel="noopener noreferrer">
                  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 21v-7h2.4l.4-3h-2.8V9.1c0-.9.3-1.5 1.6-1.5H16.4V4.9c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4V11H7.7v3h2.5v7h3.3Z" /></svg>
                </a>
                <a href={s.linkedin || "#"} aria-label="LinkedIn" target="_blank" rel="noopener noreferrer">
                  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6.5 8.5H3.6V21h2.9V8.5ZM5 7.2a1.7 1.7 0 1 0 0-3.4 1.7 1.7 0 0 0 0 3.4ZM21 13.9c0-3.2-1.7-4.7-4-4.7-1.8 0-2.6 1-3.1 1.7V8.5H11c0 .8 0 12.5 0 12.5h2.9v-7c0-.4 0-.7.1-1 .2-.7.8-1.4 1.8-1.4 1.3 0 1.8 1 1.8 2.4V21H21v-7.1Z" /></svg>
                </a>
                <a href={waLink} aria-label="WhatsApp" target="_blank" rel="noopener noreferrer">
                  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5.1-1.3A10 10 0 1 0 12 2Zm5.2 14.2c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.4 0 .6l-.4.6-.5.5c-.2.2-.3.4-.1.7.2.3.8 1.4 1.8 2.2 1.3 1.1 2.3 1.5 2.6 1.6.3.1.5.1.7-.1l1-1.2c.2-.3.4-.2.7-.1l2.1 1c.3.2.5.3.6.4 0 .1 0 .7-.3 1.4Z" /></svg>
                </a>
                <a href={s.instagram || "#"} aria-label="Instagram" target="_blank" rel="noopener noreferrer">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" /></svg>
                </a>
              </div>
            </div>

            {Object.entries(LINKS).map(([title, items]) => (
              <nav key={title} className="footer__col" aria-label={title}>
                <h3>{title}</h3>
                <ul>
                  {items.map((l) => (
                    <li key={l.label}><a href={l.href}>{l.label}</a></li>
                  ))}
                </ul>
              </nav>
            ))}

            <div className="footer__col footer__contact">
              <h3>Contact</h3>
              <ul>
                <li>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s7-5.1 7-11a7 7 0 1 0-14 0c0 5.9 7 11 7 11Z" /><circle cx="12" cy="10" r="2.6" /></svg>
                  {s.address}
                </li>
                <li>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 4h4l2 5-2.5 1.5a12 12 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" /></svg>
                  <a href={`tel:${s.phone_link}`}>{s.phone_display}</a>
                </li>
                <li>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="3" /><path d="m3 7 9 6 9-6" /></svg>
                  <a href={`mailto:${s.email}`}>{s.email}</a>
                </li>
                <li>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></svg>
                  {s.hours}
                </li>
              </ul>
            </div>
          </div>

          <div className="footer__bottom">
            <p>© 2026 IMPACT TECH — Tous droits réservés.</p>
            <div className="footer__legal">
              <a href="/mentions-legales">Mentions légales</a>
              <a href="/confidentialite">Confidentialité</a>
            </div>
            <p className="footer__made">Fait avec <span aria-hidden="true">❤</span> à Douala</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
