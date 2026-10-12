/* Tableau comparatif des 3 packs — "outil de décision principal" (scanning
   rapide, Krug), contenu exact de la grille tarifaire v2 (Impact Essentiel /
   Impact Business / Impact Sur Mesure). Prix et délai sont pris depuis les
   vraies données (D1/DEFAULTS) ; le reste est structurel (pas de nouvelle
   donnée métier), FR/EN. */
const ROWS_FR = [
  { label: "Design unique à votre image", values: [true, true, true] },
  { label: "Adapté mobile, tablette, PC", values: [true, true, true] },
  { label: "Visible sur Google (SEO)", values: [true, true, true] },
  { label: "Formulaire de contact", values: [true, true, true] },
  { label: "Bouton WhatsApp", values: [true, true, true] },
  { label: "Hébergement 1 an + domaine", values: [true, true, true] },
  { label: "Formation incluse", values: ["1h", "2h", "Sur mesure"] },
  { label: "Nombre de pages", values: ["5", "10", "Illimité"] },
  { label: "Catalogue produits/services", values: [false, true, true] },
  { label: "Paiement en ligne (MoMo, OM, CB)", values: [false, true, true] },
  { label: "Tableau de bord privé", values: [false, true, true] },
  { label: "Réservation en ligne", values: [false, true, true] },
  { label: "Notifications automatiques", values: [false, true, true] },
  { label: "Espace client sécurisé", values: [false, true, true] },
  { label: "Support post-lancement", values: [false, "30 jours", "60 jours"] },
  { label: "Développement sur mesure", values: [false, false, true] },
  { label: "Application mobile", values: [false, false, true] },
  { label: "Maquettes validées avant dev", values: [false, false, true] },
  { label: "Révisions illimitées", values: [false, false, true] },
];
const ROWS_EN = [
  { label: "Custom design (not a template)", values: [true, true, true] },
  { label: "Mobile-responsive", values: [true, true, true] },
  { label: "SEO-optimized (Google-ready)", values: [true, true, true] },
  { label: "Contact form with notifications", values: [true, true, true] },
  { label: "WhatsApp integration", values: [true, true, true] },
  { label: "1-year hosting + domain included", values: [true, true, true] },
  { label: "Training included", values: ["1h", "2h", "Custom"] },
  { label: "Number of pages", values: ["5", "10", "Unlimited"] },
  { label: "Product/service catalog", values: [false, true, true] },
  { label: "Online payments (Stripe, PayPal, cards)", values: [false, true, true] },
  { label: "Private admin dashboard", values: [false, true, true] },
  { label: "Online booking system", values: [false, true, true] },
  { label: "Automated notifications", values: [false, true, true] },
  { label: "Secure client portal", values: [false, true, true] },
  { label: "Post-launch support", values: [false, "30 days", "60 days"] },
  { label: "Fully custom development", values: [false, false, true] },
  { label: "Mobile app (iOS & Android)", values: [false, false, true] },
  { label: "Design mockups approved before build", values: [false, false, true] },
  { label: "Unlimited revisions during project", values: [false, false, true] },
];

function Mark({ v, en = false }) {
  if (typeof v !== "boolean") return <>{v}</>;
  return v ? (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="oc-check" aria-label={en ? "Included" : "Inclus"}><path d="M2.5 8.5 6 12l7.5-8" /></svg>
  ) : (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="oc-cross" aria-label={en ? "Not included" : "Non inclus"}><path d="M3 3l10 10M13 3 3 13" /></svg>
  );
}

export default function OffersComparison({ items, locale = "fr" }) {
  const en = locale === "en";
  const ROWS = en ? ROWS_EN : ROWS_FR;
  const OFFERS = items?.length ? items : [];
  const hasRealData = OFFERS.length === 3;
  const names = hasRealData ? OFFERS.map((o) => o.tag) : (en ? ["Essential", "Business", "Custom"] : ["Impact Essentiel", "Impact Business", "Impact Sur Mesure"]);
  const popularIndex = hasRealData ? OFFERS.findIndex((o) => o.popular) : 1;
  const prices = hasRealData
    ? OFFERS.map((o) => (o.isQuote ? o.price : o.currency === "EUR" ? `€${o.price}` : `${o.price} FCFA`))
    : (en ? ["€1,490", "€3,490", "from €4,990"] : ["150 000 FCFA", "400 000 FCFA", "dès 600 000 FCFA"]);
  const delays = hasRealData
    ? OFFERS.map((o) => o.delay || "—")
    : (en ? ["10-14 days", "3-4 weeks", "Based on scope"] : ["10-14 jours", "3-4 semaines", "Selon projet"]);

  return (
    <section className="offers-comparison section-pad" data-anim="offers-comparison">
      <div className="container-it">
        <header className="oc-intro">
          <span className="section-badge"><span className="dot" /> {en ? "Compare the plans" : "Comparer les packs"} <span className="dot" /></span>
          <h2>{en ? <>Which plan is <span className="accent">right for you?</span></> : <>Quel pack est <span className="accent">fait pour vous ?</span></>}</h2>
        </header>

        <div className="oc-table-wrap">
          <table className="oc-table">
            <thead>
              <tr>
                <th scope="col" className="oc-table__feature">{en ? "Feature" : "Fonctionnalité"}</th>
                {names.map((name, i) => (
                  <th scope="col" key={name} className={i === popularIndex ? "oc-table__popular" : ""}>
                    {name}
                    {i === popularIndex && <span className="oc-table__badge">{en ? "Most popular" : "Le plus demandé"}</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="oc-table__price-row">
                <th scope="row">{en ? "Price" : "Prix"}</th>
                {prices.map((p, i) => (
                  <td key={i} className={i === popularIndex ? "oc-table__popular" : ""}><strong>{p}</strong></td>
                ))}
              </tr>
              {ROWS.map((row) => (
                <tr key={row.label}>
                  <th scope="row">{row.label}</th>
                  {row.values.map((v, i) => (
                    <td key={i} className={i === popularIndex ? "oc-table__popular" : ""}><Mark v={v} en={en} /></td>
                  ))}
                </tr>
              ))}
              <tr>
                <th scope="row">{en ? "Timeline" : "Délai"}</th>
                {delays.map((d, i) => (
                  <td key={i} className={i === popularIndex ? "oc-table__popular" : ""}>{d}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
