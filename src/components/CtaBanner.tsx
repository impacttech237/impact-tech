import PillButton from "./PillButton";
import { DEFAULTS } from "../lib/defaults";

export default function CtaBanner({ settings, locale = "fr" }) {
  const en = locale === "en";
  const phone = settings?.phone_link || DEFAULTS.settings.phone_link;
  const waLink = `https://wa.me/${phone.replace("+", "")}`;

  return (
    <section className="cta-banner" data-anim="cta-banner">
      <div className="container-it">
        <div className="cta-banner__card">
          <svg className="cta-route" viewBox="0 0 1000 520" fill="none" aria-hidden="true">
            <path id="cta-motion-path" d="M44 407C168 98 371 71 481 249c110 178 296 238 476 27" />
            <circle cx="44" cy="407" r="8" />
            <circle cx="957" cy="276" r="8" />
          </svg>
          <svg className="cta-plane" viewBox="0 0 48 48" fill="none" aria-hidden="true">
            <path d="M6 24 42 8 30 40l-8-12-16-4Z" stroke="#C0202B" strokeWidth="2.4" strokeLinejoin="round" fill="rgba(192,32,43,.08)" />
            <path d="M22 28 42 8" stroke="#C0202B" strokeWidth="2.4" strokeLinecap="round" />
          </svg>

          <svg className="cta-spark cta-spark--1" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 2v20M2 12h20M5 5l14 14M19 5 5 19" stroke="#C0202B" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <svg className="cta-spark cta-spark--2" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 2v20M2 12h20M5 5l14 14M19 5 5 19" stroke="#C0202B" strokeWidth="1.6" strokeLinecap="round" />
          </svg>

          <span className="section-badge">
            <span className="dot" /> {en ? "Let's talk" : "Parlons-en"} <span className="dot" />
          </span>
          <span className="cta-banner__chapter" aria-hidden="true">05 / {en ? "LET'S GET STARTED" : "PASSONS À L’ACTION"}</span>

          <h2 className="cta-banner__title">
            {en ? (
              <>Your next website starts<br />with a <span className="accent">conversation.</span></>
            ) : (
              <>Votre futur site commence<br />par une <span className="accent">conversation.</span></>
            )}
          </h2>

          <p className="cta-banner__sub">
            {en
              ? "Free 30-minute discovery call. We listen, we advise, zero commitment. Response guaranteed within 24h · No payment before delivery."
              : "Appel découverte gratuit de 30 min. On vous écoute, on vous conseille, zéro engagement. Réponse garantie sous 24h · Pas de paiement avant livraison."}
          </p>

          <div className="cta-banner__actions">
            <PillButton href={en ? "/en/contact" : "/contact"} variant="dark">{en ? "Start my project" : "Démarrer mon projet"}</PillButton>
            <a href={waLink} target="_blank" rel="noopener noreferrer" className="cta-banner__whatsapp">
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5.1-1.3A10 10 0 1 0 12 2Zm5.2 14.2c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.4 0 .6l-.4.6-.5.5c-.2.2-.3.4-.1.7.2.3.8 1.4 1.8 2.2 1.3 1.1 2.3 1.5 2.6 1.6.3.1.5.1.7-.1l1-1.2c.2-.3.4-.2.7-.1l2.1 1c.3.2.5.3.6.4 0 .1 0 .7-.3 1.4Z" />
              </svg>
              {en ? "WhatsApp direct" : "WhatsApp direct"}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
