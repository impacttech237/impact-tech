# Programme d'audit complet — impacttech237.com

Objectif : un état des lieux honnête et chiffré du site public (FR/EN), du portail
client (`/espace/<slug>`) et du dashboard admin (`/admin`), avec un plan d'action
priorisé. Un audit **n'applique aucune correction** : il constate, prouve et priorise.

## Règles de conduite (non négociables)
- **Production en lecture seule** : aucune soumission de formulaire (contact, newsletter,
  RDV, paiement), aucune connexion admin ou client, aucune écriture en base, aucun déploiement,
  aucun commit, aucun push.
- **Tests actifs uniquement en local** : `npx wrangler dev --local --persist-to .wrangler/audit-state`
  avec une base créée depuis `db/schema.sql` (mot de passe admin par défaut du code en local,
  `AUTH_SECRET` dans `.dev.vars`). Les tests de sécurité (IDOR, bruteforce, uploads) se font là.
- Chaque constat = **preuve** (URL, capture, extrait de code `fichier:ligne`, mesure) + **gravité**
  + **recommandation concrète**. Pas de constat sans preuve.
- Ne jamais inventer de chiffres (trafic, conversion) : seulement ce qui est mesurable.

## Les 12 axes et les compétences (skills) à charger

| # | Axe | Ce qu'on vérifie | Skills |
|---|-----|------------------|--------|
| 1 | **Parcours client** | Prospect : arrivée → compréhension de l'offre en 5 s → choix du pack → devis / RDV / WhatsApp. Client : lien → connexion → « à faire » → envoi de fichiers → signature → validation → paiement → livraison. Admin : demande → client + projet → suivi. Frictions, impasses, étapes inutiles. | `anthropic-skills:ux-ui-audit-pro`, `anthropic-skills:marketing-funnel-conversion`, `design:user-research` |
| 2 | **UX** | Clarté, hiérarchie de l'information, charge cognitive, formulaires, messages d'erreur, états vides/chargement, cohérence de navigation FR/EN, mobile d'abord. | `anthropic-skills:ux-ui-audit-pro`, `design:ux-copy` |
| 3 | **UI & design** | Cohérence de marque (noir chaud / crème / rouge #C0202B, Space Grotesk / Inter), espacements, typographie, contrastes, composants, qualité des animations (GSAP, Lenis), « effet IA » à éviter. | `ui-ux-pro-max`, `design:design-critique`, `marketing:brand-review`, `frontend-ui-engineering` |
| 4 | **Responsive** | 320, 375, 768, 1024, 1440 px : débordements, lisibilité, cibles tactiles ≥ 44 px, sections animées (grand titre, tableau comparatif, carrousels). | `frontend-ui-engineering`, `browser-testing-with-devtools` |
| 5 | **Accessibilité** | WCAG 2.1 AA : contrastes, focus visible, navigation clavier, libellés, `alt`, structure des titres, `prefers-reduced-motion`, langue de page. | `design:accessibility-review` |
| 6 | **Performance** | Poids des pages et des scripts (GSAP, Lenis, portail), images (format, taille, lazy), en-têtes de cache, nombre de requêtes, temps de réponse du Worker, comportement en 3G. | `performance-optimization`, `browser-testing-with-devtools` |
| 7 | **SEO & AEO** | Titres/descriptions, hreflang FR/EN, canonical, sitemap, robots, données structurées, maillage interne, articles de blog, contenu « réponse » pour moteurs IA. | `marketing:seo-audit` |
| 8 | **Sécurité** | En-têtes (CSP, HSTS, X-Frame-Options, nosniff), cookies (HttpOnly/Secure/SameSite), auth admin (mot de passe par défaut ? limitation d'essais ?), portail (IDOR, anti-bruteforce des codes, uploads, fichiers servis), webhooks K-PAY, secrets, dépendances (`npm audit`). | `security-and-hardening`, `security-review` |
| 9 | **Contenu & conversion** | Promesse, preuves (chiffres et témoignages : réels ou exemples ?), appels à l'action, objections, cohérence des prix FCFA/EUR, qualité de la version anglaise. | `anthropic-skills:copywriting-persuasion`, `anthropic-skills:irresistible-offers-pricing`, `marketing:brand-review` |
| 10 | **Bilingue (i18n)** | Textes FR restés sur `/en/*` (et l'inverse), formats de prix et de dates, sélecteur de langue, redirection par pays, portail FR/EN. | `ui-ux-pro-max` |
| 11 | **Qualité du code & dette** | Lisibilité, duplication, fichiers trop longs (ex. `client/main.ts`), code mort (table `services`, `src/lib/pdf.ts` ancien), cohérence `db/schema.sql` / migrations, tests. | `code-review-and-quality`, `engineering:tech-debt` |
| 12 | **Fiabilité, ops & conformité** | Cron quotidien, emails Resend (domaine vérifié ?), DNS (anciens enregistrements MailChannels), sauvegardes D1, observabilité, pages légales, cookies/consentement, données personnelles du portail (rétention, suppression). | `observability-and-instrumentation`, `security-and-hardening` (partie données personnelles) |

## Déroulé
1. **Préparation** : lire `CLAUDE.md`, la mémoire projet, `guide.md`, `guide-portail-client.md`,
   `tasks/plan.md` ; lister les pages (`/sitemap.xml`) ; lancer le serveur local d'audit.
2. **Collecte** : pour chaque axe, charger les skills indiqués, mesurer et capturer (navigateur
   intégré, `curl`, lecture du code). Pages FR et EN, mobile (375 px) et desktop (1440 px).
3. **Synthèse** : dédoublonner, classer chaque constat en **Critique** (bloque une vente, risque
   sécurité/légal), **Majeur** (perte de conversion ou de confiance), **Mineur** (finition).
4. **Livrable** : `audits/audit-AAAA-MM-JJ.md` (voir modèle ci-dessous) + captures dans
   `audits/captures-AAAA-MM-JJ/`.

## Modèle du rapport
1. Résumé en 10 lignes : note globale /100, les 5 actions les plus rentables.
2. Tableau des notes par axe (/10) avec une phrase de justification chacune.
3. Constats par axe : gravité, preuve, impact, recommandation, effort (S/M/L).
4. Quick wins (< 1 h chacun).
5. Plan d'action en 3 vagues : cette semaine / ce mois / plus tard.
6. Ce qui a été vérifié et ce qui n'a pas pu l'être (et pourquoi).
