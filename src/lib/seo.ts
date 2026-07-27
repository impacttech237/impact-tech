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
  logo: `${SITE_URL}/icon-square.png`,
  image: `${SITE_URL}/images/og-cover.png`,
  description:
    "Agence web au Cameroun : création de sites internet, e-commerce, SaaS, applications et solutions sur-mesure à prix accessible.",
  slogan: "Un digital qui a de l'impact, à prix juste",
  telephone: PHONE,
  email: EMAIL,
  priceRange: "à partir de 200 000 FCFA",
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
  ],
  sameAs: [
    "https://web.facebook.com/profile.php?id=61592459664276",
    "https://www.linkedin.com/company/impact-tech-cm",
    "https://www.instagram.com/impacttech_237/",
    "https://www.tiktok.com/@impact.tech92",
  ],
};

export const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  url: SITE_URL,
  name: SITE_NAME,
  inLanguage: "fr",
  publisher: { "@id": `${SITE_URL}/#organization` },
};

export const servicesJsonLd = {
  "@context": "https://schema.org",
  "@type": "OfferCatalog",
  name: "Services IMPACT TECH",
  url: `${SITE_URL}/services`,
  itemListElement: [
    {
      "@type": "Offer",
      name: "Pack Landing Page",
      description:
        "Page de conversion clé en main : design, développement, domaine, hébergement 1 an, SSL et SEO de base inclus.",
      price: "200000",
      priceCurrency: "XAF",
      url: `${SITE_URL}/services#landing-page`,
    },
    {
      "@type": "Offer",
      name: "Pack Site E-commerce",
      description:
        "Boutique en ligne complète avec paiement Mobile Money (MTN MoMo, Orange Money), formation et support 3 mois.",
      price: "500000",
      priceCurrency: "XAF",
      url: `${SITE_URL}/services#e-commerce`,
    },
    {
      "@type": "Offer",
      name: "Pack Blog / Site Vitrine",
      description:
        "Site vitrine élégant avec espace blog administrable, domaine, hébergement et SEO de base inclus.",
      price: "300000",
      priceCurrency: "XAF",
      url: `${SITE_URL}/services#blog-vitrine`,
    },
    {
      "@type": "Offer",
      name: "SaaS, Applications & Sur-mesure",
      description:
        "Logiciels en ligne, applications web/mobile et solutions métier sur-mesure. Devis gratuit sous 48h.",
      url: `${SITE_URL}/services#saas`,
    },
  ],
};

/* Données structurées FAQPage — construites à partir des VRAIES FAQ (base D1)
   pour que chaque question gérée au dashboard alimente les résultats enrichis
   Google. Repli sur une liste minimale si aucune FAQ n'est fournie. */
const FALLBACK_FAQS = [
  { q: "Le prix affiché est-il vraiment tout compris ?", a: "Oui. Design, développement, nom de domaine, hébergement la première année, certificat SSL et mise en ligne sont inclus. La seule dépense future est le renouvellement domaine + hébergement à partir de la 2e année, annoncé dès le devis." },
  { q: "Combien de temps pour avoir mon site en ligne ?", a: "Une landing page est livrée en 2 semaines environ, un site vitrine en 3 semaines, un e-commerce en 4 à 6 semaines. Le délai exact est fixé dans le devis." },
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
