/* ------------------------------------------------------------------
   PageHero — bannière des pages intérieures.
   Animation d'entrée gérée par client/main.ts (sélecteurs .ph-word /
   .ph-fade), pas de JS ici : rendu 100% statique côté serveur.
------------------------------------------------------------------- */
export default function PageHero({
  badge,
  title, // tableau de mots : [{ t: "Nos" }, { t: "services", accent: true }]
  subtitle,
  crumb,
  image = "/images/hero-bg-africa-1.jpg",
}) {
  return (
    <section className="page-hero" data-anim="page-hero">
      <div className="page-hero__bg" style={{ backgroundImage: `url(${image})` }} aria-hidden="true" />
      <div className="page-hero__overlay" aria-hidden="true" />

      <div className="container-it page-hero__content">
        <nav className="page-hero__crumb ph-fade gsap-hidden" aria-label="Fil d'Ariane">
          <a href="/">Accueil</a>
          <span aria-hidden="true">·</span>
          <span>{crumb}</span>
        </nav>

        <div className="page-hero__badge ph-fade gsap-hidden">
          <span className="dot" aria-hidden="true" />
          {badge}
        </div>

        <h1 className="page-hero__title">
          {title.map((w, i) => (
            <span key={i}>
              <span className="inline-block overflow-hidden align-bottom">
                <span className={`ph-word inline-block ${w.accent ? "accent" : ""}`}>{w.t}</span>
              </span>
              {i < title.length - 1 ? " " : ""}
            </span>
          ))}
        </h1>

        {subtitle && <p className="page-hero__sub ph-fade gsap-hidden">{subtitle}</p>}
      </div>
    </section>
  );
}
