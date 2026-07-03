import PillButton from "./PillButton";

/* L'état scroll (solide/masqué) et le menu mobile sont gérés par
   client/main.ts (classes header--solid / header--hidden / is-open
   ajoutées dynamiquement, cf. data-header). */
const NAV_LINKS = [
  { label: "Accueil", href: "/" },
  { label: "Services", href: "/services" },
  { label: "Réalisations", href: "/realisations" },
  { label: "À propos", href: "/a-propos" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
];

export default function Header() {
  return (
    <>
      <header className="header" data-header>
        <div className="container-it">
          <div className="header__inner">
            <a href="/" className="logo" aria-label="IMPACT TECH — Accueil">
              impact<span className="logo-dot">.</span>
              <span className="logo-tech">Tech</span>
            </a>

            <nav className="header__nav flex items-center gap-8" aria-label="Navigation principale">
              {NAV_LINKS.map((l) => (
                <a key={l.label} href={l.href} className="nav-link">{l.label}</a>
              ))}
            </nav>

            <div className="header__cta">
              <PillButton href="/contact" variant="cream" data-header-cta>Démarrer un projet</PillButton>
            </div>

            <button className="burger" aria-expanded="false" aria-label="Ouvrir le menu" data-burger>
              <span /><span /><span />
            </button>
          </div>
        </div>
      </header>

      <div className="mobile-menu" data-mobile-menu>
        <nav aria-label="Navigation mobile" className="flex flex-col">
          {NAV_LINKS.map((l) => (
            <a key={l.label} href={l.href}>{l.label}</a>
          ))}
        </nav>
        <div className="mt-10">
          <PillButton href="/contact" variant="dark">Démarrer un projet</PillButton>
        </div>
      </div>
    </>
  );
}
