/* ------------------------------------------------------------------
   Layout — shell HTML commun à toutes les pages.
   Remplace app/layout.jsx (Next). Polices via Google Fonts (plus de
   next/font), JSON-LD organisation + site injectés partout, JSON-LD
   spécifique à la page passé en prop.
------------------------------------------------------------------- */
import { SITE_URL, SITE_NAME, organizationJsonLd, websiteJsonLd, jsonLdScript } from "./lib/seo";

export default function Layout({
  title,
  description,
  canonical,
  ogImage = "/images/og-cover.png",
  jsonLd = [],
  children,
}) {
  const fullTitle = title.includes("IMPACT TECH") ? title : `${title} | IMPACT TECH`;
  const url = `${SITE_URL}${canonical}`;

  return (
    <html lang="fr">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0E0E0C" />
        <title>{fullTitle}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={url} />
        <link rel="icon" href="/icon-square.png" />
        <link rel="apple-touch-icon" href="/icon-square.png" />
        <link rel="manifest" href="/manifest.json" />

        {/* Open Graph / réseaux sociaux (WhatsApp, Facebook...) */}
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="fr_FR" />
        <meta property="og:site_name" content={SITE_NAME} />
        <meta property="og:url" content={url} />
        <meta property="og:title" content={fullTitle} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={`${SITE_URL}${ogImage}`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={fullTitle} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={`${SITE_URL}${ogImage}`} />

        <meta name="robots" content="index, follow" />

        {/* Polices Google Fonts (remplace next/font) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&family=Instrument+Serif:ital@0;1&display=swap"
          rel="stylesheet"
        />

        <link rel="stylesheet" href="/styles.css" />

        {/* JSON-LD global : organisation + site web */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(organizationJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(websiteJsonLd) }} />
        {jsonLd.map((data, i) => (
          <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(data) }} />
        ))}
      </head>
      <body>
        {children}
        <script type="module" src="/client.js"></script>
      </body>
    </html>
  );
}
