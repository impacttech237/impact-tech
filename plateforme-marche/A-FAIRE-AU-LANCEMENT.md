# À faire au lancement public

## 1. Ouvrir l'indexation (obligatoire, sinon Google ne voit rien)

Reconstruire avec le nom de domaine définitif, puis déployer :

```powershell
$env:LANCEMENT='1'; $env:SITE_URL='https://votre-domaine'; node scripts/build.mjs
node ../node_modules/wrangler/bin/wrangler.js deploy
```

Ce que cela change : `robots.txt` autorise les moteurs, l'en-tête `noindex` disparaît, les adresses canoniques et le plan du site (`sitemap.xml`) utilisent le vrai domaine.

Sans ces variables, le build reste en mode préversion (indexation fermée, domaine `boussole-cemac-preview.impacttech237.workers.dev`).

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

## 3 bis. Comptes : activer « Continuer avec Google » (facultatif)

Le code est prêt mais inactif tant que l'identifiant Google n'est pas fourni. Il faut le domaine définitif.
1. Google Cloud Console, API et services, Identifiants, créer un « ID client OAuth » de type Application Web.
2. « Origines JavaScript autorisées » : `https://votre-domaine` (et l'adresse workers.dev si besoin de tests).
3. Enregistrer l'identifiant : `echo VOTRE_ID_CLIENT | node ../node_modules/wrangler/bin/wrangler.js secret put GOOGLE_CLIENT_ID`.
4. Le bouton Google apparaît tout seul sur la page Compte. Aucun autre changement de code.

Mot de passe oublié : par code de récupération (affiché une fois à la création). Une réinitialisation par e-mail demanderait la clé Resend dans ce Worker.

## 3 ter. Logos et photos des acteurs

Les logos et les photos des dirigeants (118 acteurs, dossier `site/img/acteurs/`) viennent des sites officiels de la COSUMAF et de la BVMAC. Avant le lancement public, demander l'accord écrit de la COSUMAF et de la BVMAC pour les reproduire (droit d'auteur et droit à l'image), ou les retirer : `node scripts/annuaire.mjs` régénère l'annuaire ; sans image, des initiales s'affichent. Seule la photo de la Présidente de la COSUMAF est reprise (aucune photo officielle du DG de la BVMAC n'est publiée sur son site).
L'annuaire est relevé à la main sur les listes officielles (`sources/annuaire/`) : à relancer régulièrement (nouveaux agréments, changements de dirigeants).

## 4. Les PDF

Les PDF ne sont pas dans git (325 Mo). Ils sont pris dans les dossiers Téléchargements de l'équipe via `data/pdf-map.json`.
Pour ajouter un nouveau texte : mettre son PDF dans `Downloads\cosumaf`, relancer `node scripts/pdf-mapper.mjs`, puis le build.
