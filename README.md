# IMPACT TECH — Site + Backend + Dashboard Admin

Site vitrine de l'agence IMPACT TECH (Next.js 14 + GSAP + Tailwind), avec :

- **Base de données Cloudflare D1** (`impact-tech-db`) : tout le contenu du site (services, offres, réalisations, avis, chiffres, FAQ, articles, étapes, coordonnées) vient de la BD — rien n'est codé en dur.
- **Backend** : API routes Next.js (edge runtime) — formulaire de contact, newsletter, API admin sécurisée.
- **Dashboard admin** : `/admin` — créer / modifier / supprimer tous les éléments du site et consulter les demandes de devis.

## Architecture

```
app/
  page.jsx, services/, realisations/, blog/, a-propos/, contact/   → pages (SSR edge, contenu D1)
  admin/                → dashboard d'administration (login par mot de passe)
  api/
    content/            → GET : contenu public complet
    contact/            → POST : enregistrement des demandes de devis
    newsletter/         → POST : inscriptions newsletter
    admin/
      login|logout|me   → session admin (cookie HMAC signé)
      settings          → réglages clé/valeur (coordonnées, réseaux, textes)
      [resource]/[id]   → CRUD générique (services, offers, projects, testimonials,
                          stats, faqs, posts, process-steps, requests, subscribers)
lib/
  db.js                 → accès binding D1 (fallback dev sans BD)
  content.js            → chargement du contenu (1 batch D1)
  defaults.js           → contenu de secours si BD indisponible
  auth.js               → sessions admin (HMAC SHA-256, Web Crypto)
  admin-resources.js    → registre des tables gérables
wrangler.toml           → binding D1 + config Cloudflare Pages
```

## Base de données

Base D1 : `impact-tech-db` (id `2739901c-9560-4341-8e0f-c5fcfc854920`), déjà créée et remplie.
Tables : `settings`, `services`, `offers`, `testimonials`, `stats`, `faqs`, `posts`, `projects`, `process_steps`, `contact_requests`, `newsletter_subscribers`.

## Déploiement sur Cloudflare Workers (adaptateur OpenNext)

Le site se déploie comme un **Worker** via [@opennextjs/cloudflare](https://opennext.js.org/cloudflare).

Dans le dashboard Cloudflare (Workers & Pages → impact-tech → Settings → Build) :

1. **Build command** : `npx opennextjs-cloudflare build`
2. **Deploy command** : `npx wrangler deploy`
3. Le binding D1 `DB` → `impact-tech-db` et le flag `nodejs_compat` sont déjà déclarés dans `wrangler.toml` (appliqués automatiquement au déploiement).
4. Settings → Variables and Secrets (⚠️ obligatoire en production) :
   - `ADMIN_PASSWORD` : mot de passe du dashboard `/admin` (défaut dev : `impact-admin-2026` — à changer !)
   - `AUTH_SECRET` : longue chaîne aléatoire (signature des sessions)

## Développement local

```bash
npm install
npm run dev        # site avec contenu de secours (D1 locale vide → fallback)
npm run preview    # build OpenNext + aperçu local dans le runtime Workers
npm run deploy     # build + déploiement direct via wrangler
```

## Dashboard admin

`/admin` → connexion par mot de passe → onglets :
Demandes de devis (statuts nouvelle / en cours / traitée), Services, Offres (packs), Réalisations, Avis clients, Chiffres clés, FAQ, Blog, Méthode, Newsletter, Réglages (téléphone, WhatsApp, email, adresse, horaires, réseaux sociaux, bandeau défilant, arguments du hero).

Chaque élément possède un champ **Ordre d'affichage** et un interrupteur **Visible/Masqué** (suppression douce).
