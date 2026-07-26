# Playbook — Lancer un nouveau site (référencement & mise en ligne)

Procédure réutilisable pour **chaque nouveau site** que tu déploies (stack Cloudflare Workers).
Copie ce fichier dans chaque projet et coche les cases au fur et à mesure.

> Dans tout ce document, remplace `VOTREDOMAINE.com` par le vrai domaine du client,
> et `client@email.com` par l'email de contact du client.

---

## Phase 0 — Récupérer les infos du client (avant de commencer)

Rassemble ça une bonne fois, tu en auras besoin partout :

- [ ] Nom exact de l'entreprise (tel qu'il doit s'afficher)
- [ ] Domaine souhaité (`VOTREDOMAINE.com`)
- [ ] Email de contact professionnel
- [ ] Téléphone (format affiché **et** format international `+237...`)
- [ ] Adresse / ville / zone desservie
- [ ] Horaires d'ouverture
- [ ] Liens réseaux sociaux (Facebook, Instagram, LinkedIn, TikTok…)
- [ ] Logo + photos (réalisations, équipe, produits)
- [ ] Une phrase de description de l'activité (pour la meta description + JSON-LD)

---

## Phase 1 — Domaine & DNS (Cloudflare)

- [ ] Acheter / transférer le domaine sur **Cloudflare** (Registrar).
- [ ] Vérifier que la zone DNS est active (statut « Active » dans l'onglet DNS).
- [ ] Choisir la version canonique : **apex sans `www`** (`https://VOTREDOMAINE.com`) — recommandé,
      c'est la convention retenue pour tous les sites.

---

## Phase 2 — Configurer le SEO dans le code

Tout le référencement découle d'**une seule variable** : `SITE_URL` dans `src/lib/seo.ts`.

- [ ] **`src/lib/seo.ts`** — mettre à jour :
  - `SITE_URL = "https://VOTREDOMAINE.com"` (sans slash final, sans `www`)
  - `SITE_NAME`, `PHONE`, `EMAIL`
  - Bloc `organizationJsonLd` : adresse, ville, coordonnées GPS, horaires, `areaServed`
  - Tableau `sameAs` : les vrais liens réseaux sociaux
- [ ] **`public/sitemap.xml`** — remplacer le domaine dans toutes les balises `<loc>` et
      lister **toutes** les pages réelles du site.
- [ ] **`public/robots.txt`** — mettre à jour la ligne `Sitemap: https://VOTREDOMAINE.com/sitemap.xml`.
- [ ] **`db/seed.sql`** + **`src/lib/defaults.js`** — coordonnées par défaut (email, tél, réseaux, adresse).
- [ ] Vérifier que chaque page a un **`title`** et une **`description`** uniques (via le composant Layout).
- [ ] Prévoir une **image Open Graph** (`public/images/og-cover.png`, ~1200×630) aux couleurs du client.

> ⚠️ **Où vit le contenu en production ?** Les coordonnées viennent de la base **D1** (table `settings`),
> modifiable depuis `/admin`. `seed.sql` / `defaults.js` ne sont que des valeurs de repli.
> Le JSON-LD (`telephone`/`email`) vient, lui, directement de `seo.ts`.
> → En prod, changer une coordonnée = passer par `/admin` (D1), pas seulement le code.

**Vérifier le build en local :**
```bash
npm run build      # doit se terminer sans erreur
npm run dev        # tester sur http://localhost:8787
```

---

## Phase 3 — Déploiement (Cloudflare Workers)

- [ ] Adapter `wrangler.toml` : `name` du worker, binding + `database_id` de la base D1 du projet.
- [ ] Définir les secrets nécessaires (dashboard ou CLI) :
  ```bash
  wrangler secret put ADMIN_PASSWORD
  wrangler secret put AUTH_SECRET
  # + secrets spécifiques au projet (ex : NOTION_TOKEN)
  ```
- [ ] Créer et initialiser la base D1 (schéma + seed) si nouveau projet.
- [ ] Déployer :
  ```bash
  npm run deploy
  ```
- [ ] **Rattacher le domaine au worker** : Cloudflare → Workers & Pages → le worker →
      **Settings → Domains & Routes → Add Domain** → `VOTREDOMAINE.com`.
- [ ] Vérifier que `https://VOTREDOMAINE.com` affiche bien le site (HTTPS actif, cadenas vert).

---

## Phase 4 — Nettoyage des adresses (anti-doublon SEO)

### 4.1 Rediriger `www` → apex
- [ ] **DNS** → Add record : `CNAME`, Name `www`, Target `VOTREDOMAINE.com`, **Proxied (nuage orange)**.
- [ ] **Rules → Redirect Rules → Create rule** (modèle « Single Redirect ») :
  - Match : `Wildcard pattern`, Request URL `https://www.*`
  - Then : Target URL `https://${1}`, Status **301**
  - Déployer (ignorer l'avertissement « rule may not apply », le record www existe déjà).
- [ ] Tester : `https://www.VOTREDOMAINE.com` doit rediriger vers `https://VOTREDOMAINE.com`.

### 4.2 Couper le doublon `.workers.dev`
- [ ] Worker → **Settings → Worker URL** :
  - Ligne **Production** `...workers.dev` → **OFF** (empêche l'indexation du doublon)
  - Ligne **Preview** `*-...workers.dev` → **ON** (sert aux tests, jamais indexée)
- [ ] Ne PAS toucher à « Custom Domains and Routes » (`VOTREDOMAINE.com` = le vrai site).

---

## Phase 5 — Google Search Console (indexation)

- [ ] Aller sur **https://search.google.com/search-console** → **Ajouter une propriété** →
      type **« Domaine »** → `VOTREDOMAINE.com`.
- [ ] Copier l'enregistrement **TXT** fourni → Cloudflare → DNS → Add record (Type `TXT`, Name `@`).
- [ ] Revenir sur Search Console → **Valider**.
- [ ] Menu **Sitemaps** → soumettre l'**URL complète** : `https://VOTREDOMAINE.com/sitemap.xml`.
  > L'état « Impossible de récupérer » juste après l'envoi est normal → passe à « Réussite » sous 1–2 jours.
- [ ] (Accélérer) **Inspection de l'URL** → coller la page d'accueil → **Demander une indexation**.

---

## Phase 6 — Google Business Profile (SEO local)

Indispensable pour ressortir dans Google Maps et le « pack local ».

- [ ] **https://business.google.com** → Ajouter l'entreprise (nom exact).
- [ ] Catégorie adaptée au métier du client.
- [ ] Zone desservie ou adresse selon le cas.
- [ ] Téléphone + site `https://VOTREDOMAINE.com`.
- [ ] Vérification (SMS / appel / courrier).
- [ ] Compléter : logo, photos, horaires, description, services.
- [ ] **Cohérence NAP** : mêmes Nom / Adresse / Téléphone que sur le site et les réseaux.

---

## Phase 7 — Vérifications finales (à faire en ligne)

```bash
# Canonical correct ?
curl -s https://VOTREDOMAINE.com/ | grep -i canonical

# Open Graph / Twitter corrects ?
curl -s https://VOTREDOMAINE.com/ | grep -iE 'og:(url|image)|twitter:image'

# Redirection www → apex (doit renvoyer un 301 vers l'apex) ?
curl -sI https://www.VOTREDOMAINE.com/ | grep -iE '^HTTP|location'

# workers.dev bien coupé (doit renvoyer 404) ?
curl -sI https://LE-WORKER.SOUS-DOMAINE.workers.dev/ | grep -i HTTP

# Sitemap accessible et en application/xml ?
curl -sI https://VOTREDOMAINE.com/sitemap.xml | grep -i content-type
```

Outils web utiles :
- **Aperçu de partage** (OG) : coller l'URL dans le débogueur de partage Facebook / LinkedIn.
- **Données structurées** : https://search.google.com/test/rich-results
- **Vitesse** : https://pagespeed.web.dev/

---

## Workflow de mise à jour (après la mise en ligne)

1. `npm run dev` → tester en local (réflexe de base)
2. (optionnel) `wrangler versions upload` → tester la vraie version sur une URL privée avant publication
3. `npm run deploy` → mise en ligne officielle

> Si tu ajoutes/supprimes une page : penser à mettre à jour `public/sitemap.xml`.

---

## Bonnes pratiques SEO à entretenir dans le temps

- **Blog** : publier régulièrement → chaque article = une page indexée qui peut ranker.
- **Titres & descriptions uniques** par page.
- **Images** légères avec attribut `alt` descriptif.
- **Backlinks** : annuaires locaux, partenaires, réseaux sociaux.
- **Cohérence NAP** partout (site, Google Business, réseaux).
- Surveiller **Search Console → Performances** (impressions, clics, requêtes) chaque mois.

---

## Checklist express (à copier pour chaque site)

```
[ ] Infos client rassemblées
[ ] Domaine acheté + DNS actif (Cloudflare)
[ ] SITE_URL + seo.ts + sitemap + robots + coordonnées mis à jour
[ ] Image OG créée
[ ] Build OK en local
[ ] Secrets + base D1 configurés
[ ] Déployé + domaine rattaché au worker (HTTPS OK)
[ ] Redirection www → apex (301)
[ ] Doublon .workers.dev coupé
[ ] Search Console validé + sitemap soumis
[ ] Google Business Profile créé + complété
[ ] Vérifications curl passées
```
