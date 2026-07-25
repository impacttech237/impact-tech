# Guide — Référencement & SEO · IMPACT TECH

Document de référence pour gérer le référencement du site **https://impacttech237.com**.
Garde-le à jour au fil du temps. Dernière mise à jour : **25 juillet 2026**.

---

## 1. Informations officielles du site

| Élément | Valeur |
|---|---|
| **Domaine canonique** | `https://impacttech237.com` (apex, **sans** `www`) |
| **Email de contact** | `impacttech237@gmail.com` |
| **Téléphone** | `+237 6 53 39 56 94` |
| **Hébergement** | Cloudflare Workers (worker `impact-tech`) |
| **Base de données** | Cloudflare D1 · `impact-tech-db` |

### Réseaux sociaux
| Réseau | Lien |
|---|---|
| Facebook | https://web.facebook.com/profile.php?id=61592459664276 |
| LinkedIn | https://www.linkedin.com/company/impact-tech-cm |
| Instagram | https://www.instagram.com/impacttech_237/ |
| TikTok | https://www.tiktok.com/@impact.tech92 |

> ⚠️ **Important — d'où vient le contenu affiché en production ?**
> Les coordonnées (email, téléphone, réseaux sociaux, adresse, horaires…) viennent de la
> table `settings` de la base **D1**, modifiable depuis **`/admin`**.
> Les fichiers `src/lib/defaults.js` et `db/seed.sql` ne sont que des valeurs de repli.
> **Pour changer une coordonnée en prod : passe par `/admin` (ou la base D1), pas seulement le code.**
> Exception : le JSON-LD (`telephone`/`email` des données structurées Google) vient des
> constantes `PHONE`/`EMAIL` dans `src/lib/seo.ts` → à modifier dans le code + redéployer.

---

## 2. Comment fonctionne le SEO sur ce site

Tout le référencement découle d'**une seule variable** : `SITE_URL` dans
[`src/lib/seo.ts`](src/lib/seo.ts). En la changeant, tout se met à jour automatiquement :

- La balise `<link rel="canonical">` (l'adresse « officielle » de chaque page)
- Les balises Open Graph / Twitter (aperçus quand on partage un lien sur WhatsApp, Facebook…)
- Les données structurées JSON-LD (ce que Google lit pour comprendre l'entreprise)
- Le sitemap et le fichier robots

Fichiers SEO clés :
- [`src/lib/seo.ts`](src/lib/seo.ts) — configuration centrale (URL, nom, tél, email, JSON-LD)
- [`src/layout.tsx`](src/layout.tsx) — injecte canonical + OG + JSON-LD dans chaque page
- [`public/sitemap.xml`](public/sitemap.xml) — liste des pages pour Google
- [`public/robots.txt`](public/robots.txt) — règles pour les robots d'indexation

---

## 3. Étapes de référencement — ce qui a été fait ✅

- [x] Domaine basculé de `impacttech.cm` (placeholder) vers `impacttech237.com` partout
- [x] Email de contact mis à jour (`impacttech237@gmail.com`) — code + JSON-LD + base D1
- [x] Téléphone réel dans les données structurées JSON-LD
- [x] Liens réseaux sociaux réels + intégration TikTok (footer, admin, JSON-LD)
- [x] **Google Search Console** : propriété `impacttech237.com` validée (TXT DNS) + sitemap soumis
- [x] **Redirection `www` → apex** : `www.impacttech237.com` redirige en 301 vers `impacttech237.com`
- [x] **Masquer le doublon `.workers.dev`** (URL de production désactivée)
- [x] **Google Business Profile** pour le SEO local à Douala

---

## 4. Étapes restantes — mode d'emploi

### 4.1 Masquer le doublon `.workers.dev`
Empêche Google d'indexer `impact-tech.impacttech237.workers.dev` (même contenu = doublon SEO).

1. Cloudflare → **Workers & Pages** → worker **`impact-tech`** → **Settings**.
2. Section **« Worker URL »** (en haut).
3. Ligne **Production** `impact-tech.impacttech237.workers.dev` → **interrupteur sur OFF (gris)**.
4. Ligne **Preview** `*-impact-tech.…workers.dev` → **laisser sur ON** (sert aux tests, voir § 5).
5. ⚠️ Ne PAS toucher à la section « Custom Domains and Routes » (`impacttech237.com` = le vrai site).

### 4.2 Google Business Profile (SEO local — gros levier)
Pour apparaître dans Google Maps et le « pack local » sur « agence web Douala ».

1. Aller sur **https://business.google.com** (compte `impacttech237@gmail.com`).
2. **Ajouter une entreprise** → nom : `IMPACT TECH`.
3. Catégorie : `Concepteur de sites Web` (ou `Agence de marketing`).
4. Zone desservie : « Je livre des biens et services à mes clients » → **Douala / Cameroun**.
5. Téléphone : `+237 6 53 39 56 94` · Site : `https://impacttech237.com`.
6. Vérification (SMS / appel / courrier selon options proposées).
7. Remplir : logo, photos de réalisations, horaires (Lun–Sam 8h–18h), description.
   → Plus le profil est complet, mieux l'entreprise ressort.

### 4.3 Rappels Search Console (après quelques jours)
- L'état du sitemap peut afficher « Impossible de récupérer » juste après l'envoi → **normal**,
  ça passe à « Réussite » sous 1–2 jours. Le fichier est techniquement valide.
- Pour accélérer : **Inspection de l'URL** (barre du haut) → coller `https://impacttech237.com/`
  → **Demander une indexation**.
- Revenir régulièrement voir l'onglet **Performances** (impressions, clics, mots-clés).

---

## 5. Workflow de mise à jour (tester avant de mettre en ligne)

### Étape 1 — Tester en local (réflexe de base, 90 % des cas)
```bash
npm run dev
```
Ouvre le site sur `http://localhost:8787`. Tu modifies, tu recharges, tu vois le résultat
instantanément. Les visiteurs ne voient rien.

### Étape 2 — (optionnel) Tester la vraie version déployée, en privé
```bash
wrangler versions upload
```
Met la nouvelle version en ligne **sans la rendre publique** → Cloudflare donne une URL de test
temporaire (`xxxx-impact-tech.impacttech237.workers.dev`). Ces URLs ne sont jamais indexées.

### Étape 3 — Mettre en ligne officiellement
```bash
npm run deploy
```
(ou `wrangler versions deploy` pour promouvoir une version déjà uploadée)

> Après tout changement de contenu SEO (titre, description, nouvelle page…), penser à
> mettre à jour [`public/sitemap.xml`](public/sitemap.xml) si une page a été ajoutée/supprimée.

---

## 6. Bonnes pratiques SEO à entretenir

- **Publier des articles de blog régulièrement** — chaque article = une nouvelle page indexée
  qui peut ranker sur des recherches locales (« créer un site e-commerce Cameroun », etc.).
- **Titres & descriptions uniques** par page (déjà en place, à garder distincts).
- **Images légères** avec attribut `alt` descriptif (bon pour Google Images + accessibilité).
- **Backlinks** : se faire référencer par des annuaires locaux, partenaires, réseaux sociaux.
- **Cohérence NAP** (Name, Address, Phone) : le même nom / tél / adresse partout
  (site, Google Business, réseaux) renforce le SEO local.
- **Vitesse** : Cloudflare gère déjà le cache et le CDN — vérifier de temps en temps sur
  [PageSpeed Insights](https://pagespeed.web.dev/).

---

## 7. En cas de problème

- **Vérifier une balise en ligne** (canonical, OG…) :
  ```bash
  curl -s https://impacttech237.com/ | grep -i canonical
  ```
- **Tester la redirection www** :
  ```bash
  curl -sI https://www.impacttech237.com/ | grep -i location
  ```
- **Tester le sitemap** : ouvrir `https://impacttech237.com/sitemap.xml` dans le navigateur.
- **Modifier une coordonnée en prod** : `/admin` → section Réglages (ne pas oublier que la
  base D1 fait foi, pas le code).
