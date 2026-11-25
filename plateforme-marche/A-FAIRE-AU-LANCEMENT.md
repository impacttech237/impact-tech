# À faire au lancement public

## 1. Ouvrir l'indexation (obligatoire, sinon Google ne voit rien)

Reconstruire avec le nom de domaine définitif, puis déployer :

```powershell
$env:LANCEMENT='1'; $env:SITE_URL='https://votre-domaine'; node scripts/build.mjs
node ../node_modules/wrangler/bin/wrangler.js deploy
```

Ce que cela change : `robots.txt` autorise les moteurs, l'en-tête `noindex` disparaît, les adresses canoniques et le plan du site (`sitemap.xml`) utilisent le vrai domaine.

Sans ces variables, le build reste en mode préversion (indexation fermée, domaine `marche-cemac-preview.impacttech237.workers.dev`).

## 2. Ensuite

- Déclarer le plan du site dans Google Search Console : `https://votre-domaine/sitemap.xml`.
- Brancher le domaine sur le Worker (Cloudflare : Workers & Pages, Domaines personnalisés).
- Faire relire les 15 chapitres Découvrir / Comprendre par un professionnel du marché.
- Relire les chiffres lus sur des scans dégradés (voir `rapport-relecture.md`).

## 3. Statistiques d'audience

- Tableau de bord : `https://votre-domaine/admin/` (code administrateur demandé ; il n'est pas dans git).
- Données stockées dans la table `marche_events` de la base D1 `impact-tech-db` (la limite de bases D1 du compte est atteinte).
- Changer le code : `echo NOUVEAU_CODE | node ../node_modules/wrangler/bin/wrangler.js secret put ADMIN_TOKEN`.
- Exclure vos appareils : ouvrir le site avec `?notrack=1` (`?notrack=0` pour réactiver).
- Données conservées 200 jours, sans cookie ni adresse IP.

## 4. Les PDF

Les PDF ne sont pas dans git (325 Mo). Ils sont pris dans les dossiers Téléchargements de l'équipe via `data/pdf-map.json`.
Pour ajouter un nouveau texte : mettre son PDF dans `Downloads\cosumaf`, relancer `node scripts/pdf-mapper.mjs`, puis le build.
