"use client";

/* ------------------------------------------------------------------
   CONTACT — page /contact
   Colonne gauche : canaux directs (WhatsApp, tél, email) + infos.
   Colonne droite : formulaire de devis (validation native +
   état d'envoi simulé — à brancher sur votre backend/API).
------------------------------------------------------------------- */
import { useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

import { DEFAULTS } from "@/lib/defaults";

const PROJECT_TYPES = [
  "Landing Page",
  "Site E-commerce",
  "Blog / Site Vitrine",
  "SaaS",
  "Application web / mobile",
  "Solution sur-mesure",
  "Je ne sais pas encore",
];

const BUDGETS = [
  "Moins de 200 000 FCFA",
  "200 000 – 500 000 FCFA",
  "500 000 – 1 500 000 FCFA",
  "Plus de 1 500 000 FCFA",
  "À définir ensemble",
];

/* Coordonnées gérées depuis le dashboard admin (table settings) */
function buildChannels(PHONE_DISPLAY, PHONE_LINK, EMAIL) {
  return [
  {
    label: "WhatsApp",
    value: "Réponse la plus rapide",
    href: `https://wa.me/${PHONE_LINK.replace("+", "")}?text=Bonjour%20IMPACT%20TECH%2C%20je%20souhaite%20discuter%20d%27un%20projet.`,
    cta: "Écrire sur WhatsApp",
    green: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5.1-1.3A10 10 0 1 0 12 2Zm5.2 14.2c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.4 0 .6l-.4.6-.5.5c-.2.2-.3.4-.1.7.2.3.8 1.4 1.8 2.2 1.3 1.1 2.3 1.5 2.6 1.6.3.1.5.1.7-.1l1-1.2c.2-.3.4-.2.7-.1l2.1 1c.3.2.5.3.6.4 0 .1 0 .7-.3 1.4Z" /></svg>
    ),
  },
  {
    label: "Téléphone",
    value: PHONE_DISPLAY,
    href: `tel:${PHONE_LINK}`,
    cta: "Appeler maintenant",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 4h4l2 5-2.5 1.5a12 12 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" /></svg>
    ),
  },
  {
    label: "Email",
    value: EMAIL,
    href: `mailto:${EMAIL}`,
    cta: "Envoyer un email",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="3" /><path d="m3 7 9 6 9-6" /></svg>
    ),
  },
  ];
}

export default function ContactSection({ settings }) {
  const rootRef = useRef(null);
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error
  const [error, setError] = useState("");

  const s = { ...DEFAULTS.settings, ...(settings || {}) };
  const CHANNELS = buildChannels(s.phone_display, s.phone_link, s.email);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) return;

      gsap.from(".contact-channel", {
        y: 40,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: "power2.out",
        scrollTrigger: { trigger: rootRef.current, start: "top 82%" },
      });
      gsap.from(".contact-form", {
        y: 50,
        opacity: 0,
        duration: 0.9,
        ease: "power2.out",
        scrollTrigger: { trigger: ".contact-form", start: "top 85%" },
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setStatus("sending");
    setError("");
    const fd = new FormData(e.target);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(fd.entries())),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Erreur d'envoi");
      setStatus("sent");
    } catch (err) {
      setError(err.message || "Erreur d'envoi, réessayez ou écrivez-nous sur WhatsApp.");
      setStatus("error");
    }
  };

  return (
    <section ref={rootRef} className="contact section-pad">
      <div className="container-it">
        <div className="contact__grid">
          {/* ----- Colonne gauche : canaux + infos ----- */}
          <div className="contact__side">
            <h2>
              Choisissez votre <span className="accent">canal</span>
            </h2>
            <p className="contact__side-sub">
              WhatsApp, appel, email ou formulaire : on s'adapte à vous.
            </p>

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

            {/* Infos pratiques */}
            <div className="contact__info">
              <div>
                <h3>Localisation</h3>
                <p>{s.address}</p>
                <p className="contact__info-note">{s.location_note}</p>
              </div>
              <div>
                <h3>Horaires</h3>
                <p>{s.hours}</p>
                <p className="contact__info-note">{s.hours_note}</p>
              </div>
            </div>
          </div>

          {/* ----- Colonne droite : formulaire ----- */}
          <div className="contact-form">
            {status === "sent" ? (
              <div className="contact-form__done" role="status">
                <span className="contact-form__done-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 12.5 9.5 18 20 6.5" />
                  </svg>
                </span>
                <h3>Message bien reçu !</h3>
                <p>
                  Merci pour votre confiance. On revient vers vous sous 24h
                  (souvent bien plus vite). Pour aller encore plus vite,
                  écrivez-nous directement sur WhatsApp.
                </p>
              </div>
            ) : (
              <form onSubmit={onSubmit}>
                <h2>
                  Demandez votre <span className="accent">devis</span> gratuit
                </h2>

                <div className="form-row">
                  <div className="form-field">
                    <label htmlFor="cf-name">Votre nom *</label>
                    <input id="cf-name" name="name" type="text" required placeholder="Ex : Marie Ngo" autoComplete="name" />
                  </div>
                  <div className="form-field">
                    <label htmlFor="cf-phone">Téléphone / WhatsApp *</label>
                    <input id="cf-phone" name="phone" type="tel" required placeholder="+237 6XX XX XX XX" autoComplete="tel" />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-field">
                    <label htmlFor="cf-email">Email</label>
                    <input id="cf-email" name="email" type="email" placeholder="vous@exemple.com" autoComplete="email" />
                  </div>
                  <div className="form-field">
                    <label htmlFor="cf-company">Entreprise / activité</label>
                    <input id="cf-company" name="company" type="text" placeholder="Ex : Boutique Ngo & Fils" autoComplete="organization" />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-field">
                    <label htmlFor="cf-type">Type de projet *</label>
                    <select id="cf-type" name="type" required defaultValue="">
                      <option value="" disabled>
                        Choisissez...
                      </option>
                      {PROJECT_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-field">
                    <label htmlFor="cf-budget">Budget indicatif</label>
                    <select id="cf-budget" name="budget" defaultValue="">
                      <option value="" disabled>
                        Choisissez...
                      </option>
                      {BUDGETS.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-field">
                  <label htmlFor="cf-message">Parlez-nous de votre projet *</label>
                  <textarea
                    id="cf-message"
                    name="message"
                    required
                    rows={5}
                    placeholder="Votre activité, vos objectifs, vos délais... Quelques lignes suffisent."
                  />
                </div>

                {status === "error" && (
                  <p role="alert" style={{ color: "#C0202B", fontSize: "0.9rem", marginBottom: "0.75rem" }}>
                    {error}
                  </p>
                )}
                <button type="submit" className="contact-form__submit" disabled={status === "sending"}>
                  {status === "sending" ? "Envoi en cours..." : "Envoyer ma demande"}
                </button>
                <p className="contact-form__privacy">
                  En envoyant ce formulaire, vous acceptez d'être recontacté au
                  sujet de votre projet. Vos données ne sont jamais partagées.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
