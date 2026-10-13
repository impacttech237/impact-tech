/* ------------------------------------------------------------------
   /espace/:slug — espace client privé.
   Shell SSR autonome et léger (pas le Layout marketing : ni GSAP ni
   Lenis, pour rester rapide en 3G). L'interface est rendue par
   /portal.js (Preact) + /portal.css.
------------------------------------------------------------------- */
import { raw } from "hono/html";

export default function PortailPage({ accessKey }: { accessKey: string }) {
  return (
    <html lang="fr">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#0E0E0C" />
        <meta name="robots" content="noindex, nofollow" />
        <meta name="referrer" content="same-origin" />
        <title>Mon espace — Impact Tech</title>
        <link rel="icon" href="/icon-square.png?v=2" />
        <link rel="apple-touch-icon" href="/icon-square.png?v=2" />
        {/* Aperçu des liens (WhatsApp, Facebook…) : l'icône Impact Tech. */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Impact Tech" />
        <meta property="og:title" content="Votre espace client Impact Tech" />
        <meta property="og:description" content="Suivez votre projet, envoyez vos fichiers et échangez avec l'équipe, au même endroit." />
        <meta property="og:image" content="https://impacttech237.com/images/og-icone.jpg" />
        <meta property="og:image:width" content="600" />
        <meta property="og:image:height" content="600" />
        <meta property="og:image:alt" content="Impact Tech" />
        {accessKey && <link rel="manifest" href={`/espace/${encodeURIComponent(accessKey)}/manifest.webmanifest`} />}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Impact Tech" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="/portal.css" />
      </head>
      <body>
        <div id="portal-root" data-key={accessKey}>
          <div class="pt-boot">
            <div class="pt-logo">impact<span>.</span>Tech</div>
          </div>
        </div>
        <noscript>{raw("<p style='padding:24px;color:#f7efd9'>Activez JavaScript pour accéder à votre espace client.</p>")}</noscript>
        <script type="module" src="/portal.js"></script>
      </body>
    </html>
  );
}
