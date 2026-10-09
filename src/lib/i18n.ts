/* ------------------------------------------------------------------
   i18n minimal (refonte, bilingue FR/EN) — pas de librairie externe,
   juste un dictionnaire + un routing /en/* dans src/worker.tsx. Le
   contenu dynamique (offres, FAQ) est bilingue via src/lib/content.ts ;
   ce fichier couvre les libellés statiques des composants (nav, CTA,
   labels de prix...).
------------------------------------------------------------------- */

export const LOCALES = ["fr", "en"];
export const DEFAULT_LOCALE = "fr";

const DICT = {
  fr: {
    nav_home: "Accueil",
    nav_offers: "Nos Offres",
    nav_work: "Réalisations",
    nav_about: "À propos",
    nav_contact: "Contact",
    nav_blog: "Blog",
    nav_book: "Prendre rendez-vous",
    cta_start: "Démarrer un projet",
    cta_start_project: "Démarrer mon projet",
    cta_whatsapp: "Parler sur WhatsApp",
    from: "à partir de",
    custom_quote: "Sur devis",
    discover: "Découvrir",
    discuss_project: "Discuter de mon projet",
    request_quote: "Demander mon devis gratuit",
    see_work: "Voir nos réalisations",
    language_switch: "English",
    language_switch_href_prefix: "/en",
  },
  en: {
    nav_home: "Home",
    nav_offers: "Our Plans",
    nav_work: "Work",
    nav_about: "About",
    nav_contact: "Contact",
    nav_blog: "Blog",
    nav_book: "Book a call",
    cta_start: "Start a project",
    cta_start_project: "Start my project",
    cta_whatsapp: "Chat on WhatsApp",
    from: "from",
    custom_quote: "Custom quote",
    discover: "Learn more",
    discuss_project: "Discuss my project",
    request_quote: "Request my free quote",
    see_work: "See our work",
    language_switch: "Français",
    language_switch_href_prefix: "",
  },
};

export function t(locale, key) {
  return (DICT[locale] || DICT.fr)[key] ?? (DICT.fr[key] ?? key);
}

/* Construit l'URL de la version alternative (FR <-> EN) pour un chemin FR
   donné (ex: "/offres" -> "/en/offres", "/" -> "/en/"). Utilisé par le
   sélecteur de langue et les balises hreflang. */
export function altLocaleHref(pathFr, targetLocale) {
  if (targetLocale === "en") return pathFr === "/" ? "/en" : `/en${pathFr}`;
  return pathFr;
}
