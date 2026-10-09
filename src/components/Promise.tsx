/* Garantie & Différenciation (refonte) — remplace l'ancienne promesse
   générique par les 4 piliers de confiance issus des mémos stratégiques :
   la garantie "paiement à la livraison" est l'ADN de la boîte. */
const ICONS = [
  (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M14.8 9.2a3.2 3.2 0 1 0 0 5.6M8 10.5h4M8 13.5h4" />
    </svg>
  ),
  (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21s7-5.1 7-11a7 7 0 1 0-14 0c0 5.9 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.6" />
    </svg>
  ),
  (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 8h10M18 8h2M4 16h2M10 16h10" />
      <circle cx="16" cy="8" r="2.4" />
      <circle cx="8" cy="16" r="2.4" />
    </svg>
  ),
  (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2 4.5 13.5H11L9.5 22 19 10h-6.5L13 2Z" />
    </svg>
  ),
];

const LABELS_FR = ["Paiement à la livraison", "Zéro acompte", "Un interlocuteur unique", "Qualité internationale, prix juste"];
const LABELS_EN = ["Pay on delivery", "Zero deposit", "One point of contact", "International quality, fair price"];

const TITLE_WORDS_FR = [
  { t: "On" }, { t: "développe" }, { t: "d'abord." }, { t: "Vous" }, { t: "ne" }, { t: "payez" }, { t: "qu'à" },
  { t: "la", accent: true }, { t: "livraison.", accent: true },
];
const TITLE_WORDS_EN = [
  { t: "We" }, { t: "build" }, { t: "first." }, { t: "You" }, { t: "only" }, { t: "pay" }, { t: "on" },
  { t: "delivery.", accent: true },
];

export default function Promise({ locale = "fr" }) {
  const en = locale === "en";
  const BLOBS = (en ? LABELS_EN : LABELS_FR).map((label, i) => ({ label, className: `blob--${i + 1}`, icon: ICONS[i] }));
  const TITLE_WORDS = en ? TITLE_WORDS_EN : TITLE_WORDS_FR;
  return (
    <section id="promesse" className="promise section-pad" data-anim="promise">
      <div className="container-it">
        <div className="promise__stage">
          <div className="promise__morph-wrap" aria-hidden="true">
            <svg className="promise__morph" viewBox="0 0 520 520">
              <path id="promise-shape" d="M259 38C350 25 454 86 476 181c22 95-49 147-64 230-15 83-102 86-185 69S40 426 34 330c-6-96 84-124 103-193C156 68 207 45 259 38Z" />
              <path id="promise-shape-two" d="M260 32C346 32 398 110 465 167c67 57-4 135-42 213-38 78-128 112-209 76S47 387 55 295c8-92 100-121 128-187 28-66 27-76 77-76Z" visibility="hidden" />
              <path id="promise-shape-three" d="M250 44C347 18 452 97 469 191c17 94-72 119-66 209 6 90-101 90-184 66S38 407 51 309c13-98 105-109 116-187 11-78 34-65 83-78Z" visibility="hidden" />
            </svg>
            <img src="/images/icone-transparent.png" alt="" className="promise__mark" />
          </div>
          {BLOBS.map((b) => (
            <div key={b.label} className={`blob ${b.className}`}>
              <span className="blob__icon" aria-hidden="true">{b.icon}</span>
              {b.label}
            </div>
          ))}

          <div className="promise__content">
            <span className="promise__chapter" aria-hidden="true">03 / {en ? "GUARANTEE" : "GARANTIE"}</span>
            <span className="section-badge promise-badge">
              <span className="dot" /> {en ? "Why businesses choose us" : "Pourquoi les entreprises nous choisissent"} <span className="dot" />
            </span>

            <h2 className="promise-title" aria-label={en ? "We build first. You only pay on delivery." : "On développe d'abord. Vous ne payez qu'à la livraison."}>
              {TITLE_WORDS.map((w, i) => (
                <span key={i} aria-hidden="true" className={`promise-word ${w.accent ? "accent" : ""}`}>
                  {w.t}{" "}
                </span>
              ))}
            </h2>

            <p className="promise-sub">
              {en
                ? "If the result doesn't match the agreed brief, we fix it for free. Roberto, the founder, personally oversees every project — you have his WhatsApp."
                : "Si le résultat ne correspond pas au brief validé ensemble, on corrige gratuitement. Roberto, le fondateur, supervise chaque projet personnellement — vous avez son WhatsApp."}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
