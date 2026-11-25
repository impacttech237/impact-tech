# plateforme-marche

Nouvelle plateforme « Marché financier CEMAC ». Voir [ARCHITECTURE.md](ARCHITECTURE.md) pour la vue d'ensemble.

## État : phase 1 (site ouvert, sans compte)

La base de données unique (phase 0) est validée et le site statique existe : accueil, recherche, bibliothèque, fiche d'un texte, Pratiquer, entraînement, hors ligne. Il n'est pas déployé.

```
data/
  textes/<id>.json    82 textes : métadonnées, statut, relations, contenu pédagogique
  faits/<id>.json     1 491 faits rattachés à un texte et un article
  acteurs.json        168 acteurs (à normaliser)
  themes.json         10 thèmes
scripts/
  convertir-v2.mjs    conversion UNIQUE depuis olympiades-2 (refuse d'écraser sans --force)
  importer.mjs        importe les fiches de nouveaux/ (format v2 + métadonnées), applique les relations entre textes
  lib.mjs             fonctions partagées (dates, valeurs, faits)
  valider.mjs         règles de validation (importable)
  build.mjs           valide puis écrit dist/data/*.json et dist/rapport.md
  tester-validation.mjs  vérifie que la validation attrape bien 11 sortes d'erreurs
site/                 le site (HTML, CSS, JS sans dépendance, service worker) ; copié dans dist/ par le build
serve.mjs             serveur local de dist/ (port 4177, config « plateforme-marche » dans .claude/launch.json)
nouveaux/             fiches des 27 textes ajoutés le 25/11/2026 (+ _relations.json)
dist/                 généré, ne pas modifier
```

## Commandes

```bash
node scripts/importer.mjs            # importe nouveaux/ dans data/
node scripts/build.mjs               # valide, copie le site, génère dist/ (données + service worker)
node serve.mjs                       # http://localhost:4177 (ajouter ?nosw pour désactiver le cache hors ligne)
node scripts/tester-validation.mjs   # teste la validation elle-même
node scripts/convertir-v2.mjs --force   # ATTENTION : écrase data/ avec la v2 (perd les corrections faites ici)
```

## Travailler sur les données

Après la conversion, **data/ est la référence** : on corrige les fichiers ici, pas dans `olympiades-2/`.
Pour marquer un texte comme relu : `confiance: "verifie"`, `verifie_le` (date) et `verifie_par` (nom) ; la validation refuse « verifie » sans ces deux champs. Un fait ne peut être « verifie » que si son texte l'est.

## À savoir

- Toutes les données sont `a_verifier` : elles viennent de scans lus par OCR et n'ont pas été relues contre les PDF officiels.
- Les statuts sont `non_verifie`, sauf 6 textes abrogés dont le statut est `deduit` (30-24, 01/14, 06/03, RG BVMAC 2008, communiqué 01/08, circulaire 003/24) : la relation est lue dans un texte ou déduite, aucune n'a été confirmée par une personne.
- `valeur_texte` est toujours la valeur de référence ; `valeur` et `unite` ne sont ajoutés que lorsque la lecture est sans ambiguïté (la majorité des délais et montants).
- Aucune source PDF n'est encore rattachée (`source.pdf: null`) : c'est la phase de la bibliothèque.
- Les acteurs ne sont pas normalisés (par exemple « Émetteur » et « Émetteur APE » coexistent).

## Ajouter un texte

1. Lire le PDF (OCR si scan) et écrire `nouveaux/<id>.json` au format des fiches existantes (voir l'en-tête de `scripts/importer.mjs`).
2. `node scripts/importer.mjs` puis `node scripts/build.mjs` : la validation bloque les erreurs (article manquant, relation à sens unique, etc.).
3. Pour une relation entre deux textes déjà présents, ajouter une entrée à `nouveaux/_relations.json`.

Voir aussi [INVENTAIRE-TEXTES.md](INVENTAIRE-TEXTES.md) : ce qui existe officiellement et ce qui est converti.

## Le site (phase 1)

| Page | Ce qu'elle fait |
|---|---|
| Accueil | Recherche, accès aux portes, textes récents, avertissement « fiches non relues » |
| Bibliothèque | Liste des textes filtrable (organisme, type, thème, statut) ; abrogés masqués par défaut |
| Fiche d'un texte | Statut et relations, avertissements, essentiel, points à retenir, délais, montants, rôles, définitions, listes, pièges, Q/R ; copie de la citation, du lien, export CSV, impression, lien vers le site officiel |
| Pratiquer | Tableaux de délais, montants, rôles, définitions, pièges, listes ; filtres ; export CSV |
| Recherche | Tolérante (accents, pluriels, mots vides, résultats approchants), surlignage |
| Maîtriser | Séries de 10 questions sur les délais et montants ; progression sur l'appareil ; lien vers la plateforme d'équipe (v1) |
| Hors ligne | Service worker versionné : le site se recharge sans réseau (testé serveur arrêté) |

Pas encore fait : PDF des textes hébergés (la fiche renvoie au site officiel), pages statiques par texte pour Google, moteur de révision de la v1 (flashcards, examens), nouvelle progression, comptes, statistiques d'audience, icônes PNG pour l'installation sur téléphone, déploiement.

## Identité visuelle

Le site reprend le style de la plateforme d'équipe (`olympiades/`) : tapis quadrillé dont la couleur change selon la page (vert, bleu, ou la couleur de l'organisme pour une fiche : COSUMAF bleu, BVMAC orange, CEMAC bleu-vert, UMAC moutarde, UEAC rouge, OHADA violet), navigation en pastilles à ombre dure, titres en mots-autocollants, sous-titres manuscrits (Caveat), papier et post-it, boutons autocollants jaunes, fond bleu pour l'entraînement. Polices Bricolage Grotesque, Newsreader, Outfit et Caveat hébergées dans `site/fonts/` (hors ligne). Les **personnages** (kofi, amina, samir, lina) sont conservés (`site/img/persos/`, copiés de la v1).

Retirés volontairement : émojis, ruban défilant, scotch, épingles, trombones, flèches, bandeau « Tu gères ! », étincelles, étagère, mode clair/sombre (remplacé par la couleur de page).
