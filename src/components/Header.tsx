import PillButton from "./PillButton";
import { t, altLocaleHref } from "../lib/i18n";

/* L'état scroll (solide/masqué) et le menu mobile sont gérés par
   client/main.ts (classes header--solid / header--hidden / is-open
   ajoutées dynamiquement, cf. data-header).

   Nav principale volontairement limitée à 4 liens + le CTA (Loi de Miller,
   refonte) : Contact n'y figure pas — il reste accessible via le CTA et le
   footer. Blog / RDV / Diagnostic / Portail restent en ligne mais hors nav
   principale (cf. footer). `current` et `frPath` sont des chemins FR (sans
   préfixe /en) : le préfixe est ajouté ici selon `locale`. */
export default function Header({ current = "", locale = "fr", frPath = "/" }) {
  const p = (path) => (locale === "en" ? altLocaleHref(path, "en") : path);
  const NAV_LINKS = [
    { label: t(locale, "nav_home"), href: "/" },
    { label: t(locale, "nav_offers"), href: "/offres" },
    { label: t(locale, "nav_work"), href: "/realisations" },
    { label: t(locale, "nav_about"), href: "/a-propos" },
  ];
  const langHref = locale === "en" ? frPath : altLocaleHref(frPath, "en");

  return (
    <>
      <header className="header" data-header>
        <div className="container-it">
          <div className="header__inner">
            <a href={p("/")} className="logo" aria-label="Impact Tech — Accueil">
              <img className="logo__img" src="/images/logo.png" alt="Impact Tech" />
              <span className="logo__text" aria-hidden="true">
                impact<span className="logo-dot">.</span><span className="logo-tech">Tech</span>
              </span>
            </a>

            <nav className="header__nav flex items-center gap-8" aria-label="Navigation principale">
              {NAV_LINKS.map((l) => (
                <a
                  key={l.label}
                  href={p(l.href)}
                  className={`nav-link ${l.href === current ? "is-active" : ""}`}
                  aria-current={l.href === current ? "page" : undefined}
                >
                  {l.label}
                </a>
              ))}
              <a href={langHref} className="nav-link nav-link--lang" aria-label="Changer de langue / Switch language">
                {t(locale, "language_switch")}
              </a>
            </nav>

            <div className="header__cta">
              <PillButton href={p("/contact")} variant="cream" data-header-cta>{t(locale, "cta_start")}</PillButton>
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
            <a
              key={l.label}
              href={p(l.href)}
              className={l.href === current ? "is-active" : ""}
              aria-current={l.href === current ? "page" : undefined}
            >
              {l.label}
            </a>
          ))}
          <a href={p("/contact")}>{t(locale, "nav_contact")}</a>
          <a href={langHref}>{t(locale, "language_switch")}</a>
        </nav>
        <div className="mt-10">
          <PillButton href={p("/contact")} variant="dark">{t(locale, "cta_start")}</PillButton>
        </div>
      </div>
    </>
  );
}
