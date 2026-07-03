import PillButton from "./PillButton";
import { DEFAULTS } from "../lib/defaults";

export default function Process({ steps }) {
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
                <span className="dot" /> Notre méthode <span className="dot" />
              </span>
              <h2 className="process-title">
                Comment on <span className="accent">travaille</span>
              </h2>
              <p className="process-sub">
                Un process simple et transparent, du premier échange jusqu'au suivi après livraison.
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
              <PillButton href="/contact" variant="cream">Lancer la première étape</PillButton>
            </div>
          </div>

          <div className="process-visual">
            <img
              src="/images/process-visual.jpg"
              alt="Session de cadrage projet avec une cliente chez IMPACT TECH à Douala"
              loading="lazy"
            />
            <div className="process-visual__badge">
              <span className="process-visual__badge-dot" />
              Devis sous 48h
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
