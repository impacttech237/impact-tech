import PillButton from "./PillButton";
import { DEFAULTS } from "../lib/defaults";

export default function Process({ steps, locale = "fr" }) {
  const en = locale === "en";
  // Contenu des étapes toujours servi en FR (pas encore de colonnes _en sur
  // process_steps) — seuls les libellés statiques de la section sont traduits.
  const STEPS = (steps?.length ? steps : DEFAULTS.processSteps).map((s) => ({
    num: s.num,
    title: s.title,
    desc: s.description,
  }));

  return (
    <section id="methode" className="process section-pad" data-anim="process">
      <div className="container-it">
        <div className="process__card">
          <div className="process__content">
            <div className="process-head">
              <span className="section-badge section-badge--light">
                <span className="dot" /> {en ? "Our process" : "Notre méthode"} <span className="dot" />
              </span>
              <h2 className="process-title">
                {en ? <>How we <span className="accent">work</span></> : <>Comment on <span className="accent">travaille</span></>}
              </h2>
              <p className="process-sub">
                {en
                  ? "A simple, transparent process, from the first conversation to post-launch follow-up."
                  : "Un process simple et transparent, du premier échange jusqu'au suivi après livraison."}
              </p>
            </div>

            <div className="process-steps">
              <div className="process-progress" aria-hidden="true">
                <span className="process-progress__bar" />
              </div>

              <ol>
                {STEPS.map((s) => (
                  <li key={s.num} className="process-step">
                    <span className="process-step__num" aria-hidden="true">{s.num}</span>
                    <div>
                      <h3>{s.title}</h3>
                      <p>{s.desc}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="process-cta">
              <PillButton href={en ? "/en/contact" : "/contact"} variant="cream">{en ? "Start the first step" : "Lancer la première étape"}</PillButton>
            </div>
          </div>

          <div className="process-visual">
            <img
              src="/images/process-visual.jpg"
              alt="Session de cadrage projet avec une cliente chez IMPACT TECH à Douala"
              loading="lazy"
            />
            <svg className="process-visual__route" viewBox="0 0 640 760" fill="none" aria-hidden="true">
              <path id="process-draw-path" d="M82 88C433 46 503 192 300 285c-203 93-231 257 42 313 103 21 174 66 199 112" />
              <circle className="process-route-dot process-route-dot--one" cx="82" cy="88" r="8" />
              <circle className="process-route-dot process-route-dot--two" cx="541" cy="710" r="8" />
            </svg>
            <div className="process-visual__badge">
              <span className="process-visual__badge-dot" />
              {en ? "Quote within 48h" : "Devis sous 48h"}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
