/* ------------------------------------------------------------------
   SEO — configuration centrale IMPACT TECH
   ⚠️ Remplacez SITE_URL par votre vrai domaine avant la mise en ligne
   (ex : https://www.impacttech.cm)
------------------------------------------------------------------- */
export const SITE_URL = "https://www.impacttech.cm";
export const SITE_NAME = "IMPACT TECH";
export const PHONE = "+237600000000";
export const EMAIL = "contact@impacttech.cm";

/* --- Données structurées JSON-LD --- */

/* Organisation / entreprise locale (agence web à Douala) */
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
  geo: {
    "@type": "GeoCoordinates",
    latitude: 4.0511,
    longitude: 9.7679,
  },
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
    // ⚠️ Ajoutez vos vrais profils sociaux
    "https://www.facebook.com/impacttech",
    "https://www.linkedin.com/company/impacttech",
    "https://www.instagram.com/impacttech",
  ],
};

/* Site web + action de recherche */
export const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  url: SITE_URL,
  name: SITE_NAME,
  inLanguage: "fr",
  publisher: { "@id": `${SITE_URL}/#organization` },
};

/* Catalogue de services (page /services) */
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

/* FAQ (rich snippet Google — page /services et /contact) */
export const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Le prix affiché est-il vraiment tout compris ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Oui. Design, développement, nom de domaine, hébergement la première année, certificat SSL et mise en ligne sont inclus. La seule dépense future est le renouvellement domaine + hébergement à partir de la 2e année, annoncé dès le devis.",
      },
    },
    {
      "@type": "Question",
      name: "Puis-je payer en plusieurs fois ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Oui. En général : un acompte au démarrage, un paiement à la validation du design, et le solde à la livraison. Nous nous adaptons à votre trésorerie.",
      },
    },
    {
      "@type": "Question",
      name: "Combien de temps pour avoir mon site en ligne ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Une landing page est livrée en 2 semaines environ, un site vitrine en 3 semaines, un e-commerce en 4 à 6 semaines. Le délai exact est fixé dans le devis.",
      },
    },
    {
      "@type": "Question",
      name: "Proposez-vous le paiement Mobile Money sur les boutiques ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Oui, nous intégrons MTN Mobile Money, Orange Money et les cartes bancaires selon vos besoins — indispensable pour vendre en ligne au Cameroun.",
      },
    },
  ],
};

/* Fil d'Ariane par page */
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

/* Helper : composant <script> JSON-LD */
export function JsonLd({ data }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
