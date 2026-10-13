/* ------------------------------------------------------------------
   SEO — configuration centrale IMPACT TECH
   SITE_URL = domaine canonique du site (sans slash final).
   Tout le SEO (canonical, Open Graph, Twitter, JSON-LD, sitemap) en
   découle. On utilise le domaine apex (sans www) pour rester cohérent
   avec la redirection Cloudflare.
------------------------------------------------------------------- */
export const SITE_URL = "https://impacttech237.com";
export const SITE_NAME = "IMPACT TECH";
export const PHONE = "+237653395694";
export const EMAIL = "impacttech237@gmail.com";

/* --- Données structurées JSON-LD --- */

export const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  "@id": `${SITE_URL}/#organization`,
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/icon-square.png?v=2`,
  image: `${SITE_URL}/images/og-cover.png`,
  description:
    "Agence web au Cameroun : sites internet, boutiques en ligne (Mobile Money), applications et logiciels sur-mesure. Paiement à la livraison uniquement.",
  slogan: "Le partenaire digital africain de confiance, à prix juste",
  telephone: PHONE,
  email: EMAIL,
  priceRange: "à partir de 150 000 FCFA",
  currenciesAccepted: "XAF",
  paymentAccepted: "Mobile Money, Virement, Espèces",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Douala",
    addressRegion: "Littoral",
    addressCountry: "CM",
  },
  geo: { "@type": "GeoCoordinates", latitude: 4.0511, longitude: 9.7679 },
  openingHoursSpecification: {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    opens: "08:00",
    closes: "18:00",
  },
  areaServed: [
    { "@type": "Country", name: "Cameroun" },
    { "@type": "City", name: "Douala" },
    { "@type": "City", name: "Yaoundé" },
    { "@type": "Place", name: "Europe" },
  ],
  sameAs: [
    "https://web.facebook.com/profile.php?id=61592459664276",
    "https://www.linkedin.com/company/impact-tech-cm",
    "https://www.instagram.com/impacttech_237/",
    "https://www.tiktok.com/@impact.tech92",
  ],
};

export function websiteJsonLd(locale = "fr") {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL,
    name: SITE_NAME,
    inLanguage: locale === "en" ? "en" : "fr",
    publisher: { "@id": `${SITE_URL}/#organization` },
  };
}

function slugifyTag(str) {
  const noAccents = str
    .toLowerCase()
    .normalize("NFD")
    .split("")
    .filter((ch) => ch.codePointAt(0) < 0x0300 || ch.codePointAt(0) > 0x036f)
    .join("");
  return noAccents.replace(/\s+/g, "-");
}

/* Catalogue d'offres construit dynamiquement depuis les 3 packs réels (D1),
   remplace l'ancien servicesJsonLd statique (fusion Services -> Offres). */
export function offersJsonLd(offers) {
  const list = Array.isArray(offers) && offers.length ? offers : [];
  return {
    "@context": "https://schema.org",
    "@type": "OfferCatalog",
    name: "Offres IMPACT TECH",
    url: `${SITE_URL}/offres`,
    itemListElement: list.map((o) => ({
      "@type": "Offer",
      name: o.tag,
      description: o.description || o.title || "",
      ...(o.isQuote ? {} : { price: String(o.price).replace(/\D/g, ""), priceCurrency: "XAF" }),
      url: `${SITE_URL}/offres#${slugifyTag(o.tag)}`,
    })),
  };
}

/* Données structurées FAQPage — construites à partir des VRAIES FAQ (base D1)
   pour que chaque question gérée au dashboard alimente les résultats enrichis
   Google. Repli sur une liste minimale si aucune FAQ n'est fournie. */
const FALLBACK_FAQS = [
  { q: "Pourquoi « paiement à la livraison » ?", a: "On développe votre projet en entier, vous le testez, et vous ne payez que quand vous êtes satisfait. Aucun acompte n'est demandé." },
  { q: "Quels sont les délais ?", a: "Impact Essentiel : 10-14 jours. Impact Business : 3-4 semaines. Impact Sur Mesure : selon le projet." },
];

export function faqJsonLd(faqs) {
  const list = Array.isArray(faqs) && faqs.length ? faqs : FALLBACK_FAQS;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: list
      .filter((f) => f.q && f.a)
      .map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
  };
}

export function breadcrumbJsonLd(items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}

/* Sérialise un objet JSON-LD en chaîne sûre pour <script> (échappe </script>) */
export function jsonLdScript(data) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
