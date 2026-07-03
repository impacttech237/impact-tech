"use client";

/* ------------------------------------------------------------------
   07. MARQUEE incliné (-3deg) — défilement infini ~30s/boucle
   Double bande : la 1re défile vers la gauche (fond noir),
   la 2e vers la droite (fond rouge), croisées comme sur Tripora.
   Implémentation CSS @keyframes (piste dupliquée x2 → -50%).
------------------------------------------------------------------- */

import { DEFAULTS } from "@/lib/defaults";

/* Une bande = la liste répétée 3x, puis la piste entière dupliquée
   pour la boucle parfaite (translateX -50%). */
function Band({ items, reverse = false, variant = "dark" }) {
  const seq = [...items, ...items, ...items];
  return (
    <div className={`marquee-band marquee-band--${variant} ${reverse ? "marquee-band--reverse" : ""}`} aria-hidden="true">
      <div className="marquee-track">
        {[0, 1].map((dup) => (
          <div className="marquee-seq" key={dup}>
            {seq.map((item, i) => (
              <span className="marquee-item" key={`${dup}-${i}`}>
                {item}
                <svg className="marquee-star" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2c.6 5.4 4.6 9.4 10 10-5.4.6-9.4 4.6-10 10-.6-5.4-4.6-9.4-10-10 5.4-.6 9.4-4.6 10-10Z" />
                </svg>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Marquee({ items }) {
  const ITEMS = items?.length ? items : DEFAULTS.settings.marquee_items;
  return (
    <section className="marquee" aria-label={`Nos prestations : ${ITEMS.join(", ")}`}>
      <div className="marquee__stage">
        <Band items={ITEMS} variant="dark" />
        <Band items={ITEMS} variant="red" reverse />
      </div>
    </section>
  );
}
