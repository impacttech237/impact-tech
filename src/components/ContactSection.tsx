import { DEFAULTS } from "../lib/defaults";

/* Le formulaire est intercepté par client/main.ts (data-ajax-form="contact")
   qui POST vers /api/contact et bascule l'affichage idle/sent/error. */
const OFFERS_FR = ["Impact Essentiel", "Impact Business", "Impact Sur Mesure", "Autre / à discuter"];
const OFFERS_EN = ["Essential", "Business", "Custom", "Other / let's discuss"];
const BUDGETS_FR = [
  "Moins de 200 000 FCFA", "200 000 – 500 000 FCFA", "500 000 – 1 500 000 FCFA",
  "Plus de 1 500 000 FCFA", "À définir ensemble",
];
const BUDGETS_EN = [
  "Under €2,000", "€2,000 – €4,000", "€4,000 – €10,000",
  "Over €10,000", "To be defined together",
];

function buildChannels(en, PHONE_DISPLAY, PHONE_LINK, EMAIL) {
  return [
    {
      label: "WhatsApp", value: en ? "Fastest response" : "Réponse la plus rapide",
      href: `https://wa.me/${PHONE_LINK.replace("+", "")}?text=${en ? "Hello%20Impact%20Tech%2C%20I%27d%20like%20to%20discuss%20a%20project." : "Bonjour%20IMPACT%20TECH%2C%20je%20souhaite%20discuter%20d%27un%20projet."}`,
      cta: en ? "Chat on WhatsApp" : "Écrire sur WhatsApp", green: true,
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5.1-1.3A10 10 0 1 0 12 2Zm5.2 14.2c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.4 0 .6l-.4.6-.5.5c-.2.2-.3.4-.1.7.2.3.8 1.4 1.8 2.2 1.3 1.1 2.3 1.5 2.6 1.6.3.1.5.1.7-.1l1-1.2c.2-.3.4-.2.7-.1l2.1 1c.3.2.5.3.6.4 0 .1 0 .7-.3 1.4Z" /></svg>
      ),
    },
    {
      label: en ? "Phone" : "Téléphone", value: PHONE_DISPLAY, href: `tel:${PHONE_LINK}`, cta: en ? "Call now" : "Appeler maintenant",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 4h4l2 5-2.5 1.5a12 12 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" /></svg>
      ),
    },
    {
      label: "Email", value: EMAIL, href: `mailto:${EMAIL}`, cta: en ? "Send an email" : "Envoyer un email",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="3" /><path d="m3 7 9 6 9-6" /></svg>
      ),
    },
  ];
}

export default function ContactSection({ settings, locale = "fr" }) {
  const en = locale === "en";
  const s = { ...DEFAULTS.settings, ...(settings || {}) };
  const CHANNELS = buildChannels(en, s.phone_display, s.phone_link, s.email);
  const OFFERS = en ? OFFERS_EN : OFFERS_FR;
  const BUDGETS = en ? BUDGETS_EN : BUDGETS_FR;

  return (
    <section className="contact section-pad" data-anim="contact">
      <div className="contact-ambient" aria-hidden="true">
        <svg viewBox="0 0 1440 520" preserveAspectRatio="none">
          <path className="contact-route" d="M-20 420C260 120 430 480 700 230S1110 70 1460 250" />
          <circle className="contact-route__dot" r="7" />
        </svg>
      </div>
      <div className="container-it">
        <header className="contact-intro">
          <span>02 — {en ? "FIRST CONTACT" : "PREMIER ÉCHANGE"}</span>
          <h2>{en ? <>A conversation can start <em>everything.</em></> : <>Une conversation peut tout <em>déclencher.</em></>}</h2>
          <p>{en ? "Choose your channel or build your request in two simple steps." : "Choisissez votre canal ou construisez votre demande en deux étapes simples."}</p>
        </header>
        <div className="contact__grid">
          <div className="contact__side">
            <h2>{en ? <>Choose your <span className="accent">channel</span></> : <>Choisissez votre <span className="accent">canal</span></>}</h2>
            <p className="contact__side-sub">{en ? "WhatsApp, call, email or form: we adapt to you." : "WhatsApp, appel, email ou formulaire : on s'adapte à vous."}</p>

            <div className="contact__channels">
              {CHANNELS.map((c) => (
                <a
                  key={c.label}
                  href={c.href}
                  className={`contact-channel ${c.green ? "contact-channel--green" : ""}`}
                  target={c.href.startsWith("http") ? "_blank" : undefined}
                  rel={c.href.startsWith("http") ? "noopener noreferrer" : undefined}
                >
                  <span className="contact-channel__icon">{c.icon}</span>
                  <span className="contact-channel__body">
                    <strong>{c.label}</strong>
                    <span>{c.value}</span>
                  </span>
                  <span className="contact-channel__cta">{c.cta} →</span>
                </a>
              ))}
            </div>

            <div className="contact__info">
              <div>
                <h3>{en ? "Location" : "Localisation"}</h3>
                <p>{s.address}</p>
                <p className="contact__info-note">{s.location_note}</p>
              </div>
              <div>
                <h3>{en ? "Hours" : "Horaires"}</h3>
                <p>{s.hours}</p>
                <p className="contact__info-note">{en ? s.hours_note_en || "Emergency on a live website? WhatsApp, 7 days a week." : s.hours_note}</p>
              </div>
            </div>
          </div>

          <div className="contact-form">
            <form data-ajax-form="contact" action="/api/contact" method="post">
              <div className="contact-form__top">
                <h2>{en ? <>Request your free <span className="accent">quote</span></> : <>Demandez votre <span className="accent">devis</span> gratuit</>}</h2>
                <div className="contact-form__counter" aria-live="polite"><strong>01</strong><span>/ 02</span></div>
              </div>
              <div className="contact-form__progress" aria-hidden="true"><span /></div>
              <div className="contact-form__steps">
                <div className="contact-form__step is-active" data-contact-step="1">
                  <span className="contact-form__step-label">{en ? "STEP 01 — LET'S GET ACQUAINTED" : "ÉTAPE 01 — FAISONS CONNAISSANCE"}</span>

              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="cf-name">{en ? "Your name *" : "Votre nom *"}</label>
                  <input id="cf-name" name="name" type="text" required placeholder={en ? "E.g. Marie Ngo" : "Ex : Marie Ngo"} autoComplete="name" />
                </div>
                <div className="form-field">
                  <label htmlFor="cf-phone">{en ? "Phone / WhatsApp *" : "Téléphone / WhatsApp *"}</label>
                  <input id="cf-phone" name="phone" type="tel" required placeholder={en ? "+44 7XXX XXX XXX" : "+237 6XX XX XX XX"} autoComplete="tel" />
                </div>
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="cf-email">Email</label>
                  <input id="cf-email" name="email" type="email" placeholder={en ? "you@example.com" : "vous@exemple.com"} autoComplete="email" />
                </div>
                <div className="form-field">
                  <label htmlFor="cf-company">{en ? "Company / activity" : "Entreprise / activité"}</label>
                  <input id="cf-company" name="company" type="text" placeholder={en ? "E.g. Acme Ltd" : "Ex : Boutique Ngo & Fils"} autoComplete="organization" />
                </div>
              </div>

                  <button type="button" className="contact-form__next" data-contact-next>
                    {en ? "Continue" : "Continuer"} <span>02 →</span>
                  </button>
                </div>

                <div className="contact-form__step" data-contact-step="2" aria-hidden="true">
                  <span className="contact-form__step-label">{en ? "STEP 02 — YOUR PROJECT" : "ÉTAPE 02 — VOTRE PROJET"}</span>
              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="cf-type">{en ? "Plan *" : "Offre *"}</label>
                  <select id="cf-type" name="type" data-offer-select required defaultValue="">
                    <option value="" disabled>{en ? "Choose..." : "Choisissez..."}</option>
                    {OFFERS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-field">
                  <label htmlFor="cf-budget">{en ? "Approximate budget" : "Budget indicatif"}</label>
                  <select id="cf-budget" name="budget" data-budget-select defaultValue="">
                    <option value="" disabled>{en ? "Choose..." : "Choisissez..."}</option>
                    {BUDGETS.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="cf-message">{en ? "Tell us about your project *" : "Parlez-nous de votre projet *"}</label>
                <textarea id="cf-message" name="message" required rows={5} placeholder={en ? "Your business, your goals, your timeline... A few lines are enough." : "Votre activité, vos objectifs, vos délais... Quelques lignes suffisent."} />
              </div>

              <p className="contact-form__error" data-form-error style={{ color: "#C0202B", fontSize: "0.9rem", marginBottom: "0.75rem", display: "none" }} role="alert" />

              <div className="contact-form__actions">
                <button type="button" className="contact-form__back" data-contact-back>{en ? "← Back" : "← Retour"}</button>
                <button type="submit" className="contact-form__submit" data-form-submit>{en ? "Send my request" : "Envoyer ma demande"}</button>
              </div>
              <p className="contact-form__privacy">
                {en
                  ? "Response guaranteed within 24h. No spam, ever. No payment will be requested before your project is delivered."
                  : "Réponse garantie sous 24h. Pas de spam, jamais. Aucun paiement ne vous sera demandé avant la livraison de votre projet."}
              </p>
                </div>
              </div>
            </form>

            <div className="contact-form__done" role="status" data-form-done style={{ display: "none" }}>
              <span className="contact-form__done-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 12.5 9.5 18 20 6.5" />
                </svg>
              </span>
              <h3>{en ? "Message received!" : "Message bien reçu !"}</h3>
              <p>
                {en
                  ? "Thanks for your trust. We'll get back to you within 24h (often much faster). To go even faster, write to us directly on WhatsApp."
                  : "Merci pour votre confiance. On revient vers vous sous 24h (souvent bien plus vite). Pour aller encore plus vite, écrivez-nous directement sur WhatsApp."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
