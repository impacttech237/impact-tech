/* ------------------------------------------------------------------
   /q/:token — questionnaire client (envoyé après l'appel découverte).
   Shell SSR léger : l'interface est rendue par /questionnaire.js.
------------------------------------------------------------------- */
import { raw } from "hono/html";

export default function QuestionnairePage({ token }: { token: string }) {
  return (
    <html lang="fr">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#0E0E0C" />
        <meta name="robots" content="noindex, nofollow" />
        <meta name="referrer" content="same-origin" />
        <title>Questionnaire — Impact Tech</title>
        <link rel="icon" href="/icon-square.png?v=2" />
        {/* Aperçu des liens (WhatsApp, Facebook…) : l'icône Impact Tech. */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Impact Tech" />
        <meta property="og:title" content="Votre questionnaire Impact Tech" />
        <meta property="og:description" content="Quelques questions pour construire votre projet, à votre rythme. Vos réponses s'enregistrent automatiquement." />
        <meta property="og:image" content="https://impacttech237.com/images/og-icone.jpg" />
        <meta property="og:image:width" content="600" />
        <meta property="og:image:height" content="600" />
        <meta property="og:image:alt" content="Impact Tech" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=Instrument+Serif:ital@1&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="/questionnaire.css" />
      </head>
      <body>
        <div id="q-root" data-token={token}>
          <div class="q-boot">impact<span>.</span>Tech</div>
        </div>
        <noscript>{raw("<p style='padding:24px;color:#f7efd9'>Activez JavaScript pour remplir ce questionnaire.</p>")}</noscript>
        <script type="module" src="/questionnaire.js"></script>
      </body>
    </html>
  );
}
