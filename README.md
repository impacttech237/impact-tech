# IMPACT TECH — Site + Backend + Dashboard Admin

Site vitrine de l'agence IMPACT TECH — **Hono (rendu serveur JSX) + GSAP + Tailwind**,
déployé comme un unique Cloudflare Worker. Aucun framework/adaptateur tiers
(pas de Next.js, pas d'OpenNext) : juste Hono, esbuild et wrangler.

- **Base de données Cloudflare D1** (`impact-tech-db`) : tout le contenu du site (services, offres, réalisations, avis, chiffres, FAQ, articles, étapes, coordonnées) vient de la BD — rien n'est codé en dur.
- **Backend** : Hono, un seul Worker — pages SSR + API publiques + API admin sécurisée.
- **Dashboard admin** : `/admin` (SPA React isolée) — créer / modifier / supprimer tous les éléments du site et consulter les demandes de devis.
- **SEO préservé** : chaque page génère son propre `<title>`, meta description, Open Graph et JSON-LD côté serveur — essentiel pour le référencement et les aperçus de partage WhatsApp/Facebook.

## Architecture

```
src/
  worker.tsx             → point d'entrée Worker (Hono) : routes pages + API
  layout.tsx             → shell HTML commun (meta, fonts, JSON-LD, styles.css)
  lib/
    db... content.ts     → chargement du contenu (1 batch D1), fallback defaults.js
    defaults.js          → contenu de secours si la BD est indisponible
    auth.ts              → sessions admin (HMAC SHA-256, Web Crypto)
    admin-resources.ts   → registre des tables gérables par l'admin
    seo.ts                → constantes SEO + JSON-LD
  pages/                  → 6 pages marketing (home, services, realisations, blog, contact, a-propos)
  components/             → composants JSX serveur (Header, Hero, Footer, etc.)
  api/admin.ts            → routes /api/admin/* (login, settings, CRUD générique)

client/
  main.ts                 → UN SEUL bundle client : Lenis + GSAP (toutes les animations),
                             menu mobile, accordéon FAQ, carousel services, filtre
                             portfolio, formulaires en AJAX

admin-app/
  AdminApp.jsx, main.jsx   → dashboard admin, petite SPA React indépendante,
                             bundlée séparément (public/admin/bundle.js)

public/                    → images, robots.txt, sitemap.xml, manifest.json,
                              + styles.css / client.js / admin/bundle.js (générés)

wrangler.toml              → binding D1 + assets statiques (Worker)
scripts/build.mjs          → bundle client + admin via esbuild
```

## Base de données

Base D1 : `impact-tech-db` (id `2739901c-9560-4341-8e0f-c5fcfc854920`), déjà créée et remplie.
Tables : `settings`, `services`, `offers`, `testimonials`, `stats`, `faqs`, `posts`, `projects`, `process_steps`, `contact_requests`, `newsletter_subscribers`.

## Déploiement sur Cloudflare Workers

Déploiement piloté par **GitHub Actions** (`.github/workflows/deploy.yml`), pas par
l'intégration Git automatique de Cloudflare (source de bugs avec l'ancienne stack Next.js).

1. Secrets GitHub à définir une seule fois (Settings → Secrets and variables → Actions) :
   - `CLOUDFLARE_API_TOKEN` : token avec le template *Edit Cloudflare Workers*
   - `CLOUDFLARE_ACCOUNT_ID` : visible dans le dashboard Cloudflare (Workers & Pages)
2. Chaque push sur `main` : `npm ci` → `npm run build` (Tailwind + bundles esbuild) → `npx wrangler deploy`.
3. Variables/secrets du Worker (dashboard Cloudflare → impact-tech → Settings → Variables and Secrets), **obligatoires en production** :
   - `ADMIN_PASSWORD` : mot de passe du dashboard `/admin` (défaut dev : `impact-admin-2026` — à changer !)
   - `AUTH_SECRET` : longue chaîne aléatoire (signature des sessions)

## Développement local

```bash
npm install
npm run dev        # build (CSS + bundles) puis wrangler dev — D1 locale (vide au départ)
npm run deploy      # build + déploiement direct via wrangler
```

## Dashboard admin

`/admin` → connexion par mot de passe → onglets :
Demandes de devis (statuts nouvelle / en cours / traitée), Services, Offres (packs), Réalisations, Avis clients, Chiffres clés, FAQ, Blog, Méthode, Newsletter, Réglages (téléphone, WhatsApp, email, adresse, horaires, réseaux sociaux, bandeau défilant, arguments du hero).

Chaque élément possède un champ **Ordre d'affichage** et un interrupteur **Visible/Masqué** (suppression douce).
