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
  const pageMeta = {
    Services: { key: "services", index: "01" },
    "Réalisations": { key: "realisations", index: "02" },
    "À propos": { key: "a-propos", index: "03" },
    Blog: { key: "blog", index: "04" },
    Contact: { key: "contact", index: "05" },
  }[crumb] ?? { key: "interieur", index: "00" };

  return (
    <section className="page-hero" data-anim="page-hero" data-page={pageMeta.key}>
      <div className="page-hero__bg" style={{ backgroundImage: `url(${image})` }} aria-hidden="true" />
      <div className="page-hero__overlay" aria-hidden="true" />
      <div className="page-hero__grid" aria-hidden="true" />

      <svg className="page-hero__motion" viewBox="0 0 1440 820" fill="none" aria-hidden="true">
        <path className="ph-route ph-route--outer" d="M-80 585C194 280 447 756 734 421c234-273 481-125 792-335" />
        <path className="ph-route ph-route--inner" d="M-50 704C258 478 422 575 618 337 844 62 1120 419 1504 196" />
        <circle className="ph-node ph-node--one" cx="176" cy="494" r="8" />
        <circle className="ph-node ph-node--two" cx="734" cy="421" r="8" />
        <circle className="ph-node ph-node--three" cx="1260" cy="205" r="8" />
        <circle className="ph-runner" cx="0" cy="0" r="11" />
      </svg>

      <div className="page-hero__mark" aria-hidden="true">
        <img src="/images/icone-transparent.png" alt="" />
      </div>

      <div className="page-hero__chapter" aria-hidden="true">
        <span>{pageMeta.index}</span>
        <span>IMPACT EXPERIENCE</span>
      </div>

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

      <div className="page-hero__scroll" aria-hidden="true">
        <span>SCROLL TO EXPLORE</span>
        <i />
      </div>
    </section>
  );
}
