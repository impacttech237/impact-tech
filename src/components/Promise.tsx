const BLOBS = [
  {
    label: "Prix accessible",
    className: "blob--1",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M14.8 9.2a3.2 3.2 0 1 0 0 5.6M8 10.5h4M8 13.5h4" />
      </svg>
    ),
  },
  {
    label: "Support local",
    className: "blob--2",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 21s7-5.1 7-11a7 7 0 1 0-14 0c0 5.9 7 11 7 11Z" />
        <circle cx="12" cy="10" r="2.6" />
      </svg>
    ),
  },
  {
    label: "100% sur-mesure",
    className: "blob--3",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 8h10M18 8h2M4 16h2M10 16h10" />
        <circle cx="16" cy="8" r="2.4" />
        <circle cx="8" cy="16" r="2.4" />
      </svg>
    ),
  },
  {
    label: "Livraison rapide",
    className: "blob--4",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2 4.5 13.5H11L9.5 22 19 10h-6.5L13 2Z" />
      </svg>
    ),
  },
];

const TITLE_WORDS = [
  { t: "On" }, { t: "ne" }, { t: "livre" }, { t: "pas" }, { t: "juste" }, { t: "un" }, { t: "site," },
  { t: "on" }, { t: "crée" }, { t: "de" }, { t: "l'impact", accent: true }, { t: "qui" }, { t: "dure." },
];

export default function Promise() {
  return (
    <section id="promesse" className="promise section-pad" data-anim="promise">
      <div className="container-it">
        <div className="promise__stage">
          {BLOBS.map((b) => (
            <div key={b.label} className={`blob ${b.className}`}>
              <span className="blob__icon" aria-hidden="true">{b.icon}</span>
              {b.label}
            </div>
          ))}

          <div className="promise__content">
            <span className="section-badge promise-badge">
              <span className="dot" /> Notre promesse <span className="dot" />
            </span>

            <h2 className="promise-title" aria-label="On ne livre pas juste un site, on crée de l'impact qui dure.">
              {TITLE_WORDS.map((w, i) => (
                <span key={i} aria-hidden="true" className={`promise-word ${w.accent ? "accent" : ""}`}>
                  {w.t}{" "}
                </span>
              ))}
            </h2>

            <p className="promise-sub">
              Chaque projet est pensé pour durer : un design soigné, un code solide et un accompagnement qui ne
              s'arrête pas à la livraison.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
