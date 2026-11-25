# Plateforme « Marché financier CEMAC » — architecture de la nouvelle version

Nom de travail. Le nom définitif reste à décider : il ne doit pas laisser croire à un outil officiel de la COSUMAF.
Statut : proposition d'architecture, rien n'est construit. Elle remplace à terme `olympiades/` (v1) et `olympiades-2/` (v2), qui restent en ligne tant que la nouvelle version n'est pas prête.

## 0. Décisions prises (Roberto)

1. Tout est gratuit.
2. Tout le monde a accès à tout, sans compte. Les professionnels ne peuvent souvent pas s'inscrire sur des plateformes externes : aucune connexion n'est obligatoire.
3. On peut consulter et télécharger les règlements et autres documents, sans compte.
4. Un compte est facultatif et sert au personnel : progression synchronisée, favoris, notes, alertes. Création par Google ou par e-mail + mot de passe.
5. L'expérience utilisateur doit être excellente.
6. Le système de progression est à refaire (voir §7).
7. Des entreprises pourront à terme payer pour être présentes sur la plateforme : il faut donc des statistiques d'audience fiables (voir §8).

## 1. Objectifs

1. Accessible à tous dans la zone CEMAC : gratuit, sans compte, rapide sur mobile, utilisable hors connexion.
2. Couvrir le marché dans son ensemble, pas seulement les règlements.
3. Servir les professionnels : retrouver en quelques secondes un délai, un montant, un rôle, un statut de texte, et télécharger le texte.
4. Garder le mode Olympiades (quiz, flashcards, examens blancs, suivi d'équipe) et l'améliorer.
5. Mesurer l'audience de façon honnête, pour pouvoir la présenter à des partenaires.

## 2. Principes

| Principe | Conséquence |
|---|---|
| Une seule source de vérité | Chaque fait (délai, montant, rôle, définition) existe une seule fois, rattaché à un texte et un article. Quiz, fiches, recherche et calendrier en sont dérivés. |
| Statique d'abord | Le site est un ensemble de fichiers générés au build, servis par Cloudflare. Coût quasi nul, même avec un grand nombre de visiteurs. |
| Tout ouvert, compte facultatif | Aucune fonction de contenu n'est derrière un compte. Le compte ne sert qu'à personnaliser. |
| Exactitude traçable | Chaque fait porte sa source, son statut de vérification et sa date. Rien de non vérifié n'est publié comme certain. |
| Léger et hors ligne | Chaque porte d'entrée est un paquet séparé, chargé à la demande, mis en cache (PWA). |
| Mesure sans cookie | Statistiques anonymes, sans identifier les personnes. |
| Français d'abord, prêt pour d'autres langues | Tous les textes d'interface sont dans des fichiers de langue. |

## 3. Les quatre portes d'entrée

| Porte | Public | Contenu |
|---|---|---|
| Découvrir | Grand public | Qu'est-ce que la bourse, épargner, investir, risques, arnaques, comment acheter (sociétés de bourse par pays, fonds, obligations, bons du Trésor), fiscalité |
| Comprendre | Étudiants, curieux | Histoire et institutions de la CEMAC, acteurs, instruments, calculs, entreprises cotées |
| Maîtriser | Candidats aux Olympiades | Parcours, flashcards, quiz QCM et QRO, jeux, examen blanc, Olympiade blanche, cas pratiques, grand oral |
| Pratiquer | Professionnels | Consultation des textes, délais, montants, rôles, statuts, calendrier des obligations, ratios, comparateur ancien/nouveau texte, exports |

Une quatrième brique, la **bibliothèque**, est commune aux quatre portes (voir §6). Une recherche unique traverse tout, avec un filtre par porte et par thème.

## 4. Accès et comptes

| | Sans compte | Avec compte (facultatif) |
|---|---|---|
| Lire tout le contenu | Oui | Oui |
| Chercher | Oui | Oui |
| Télécharger les textes et fiches | Oui | Oui |
| Quiz, flashcards, jeux, examens | Oui | Oui |
| Progression | Sur l'appareil, exportable en fichier | Synchronisée entre appareils |
| Favoris, notes, historique | Sur l'appareil | Synchronisés |
| Alertes quand un texte change | Non | Oui (par e-mail) |
| Suivi d'équipe | Non | Oui, avec code d'équipe (existant) |

- Connexion : Google, ou e-mail + mot de passe. Vérification de l'adresse, « mot de passe oublié », limitation des tentatives.
- Au moment de créer un compte, la progression déjà faite sur l'appareil est reprise dans le compte.
- Suppression du compte à la demande, politique de confidentialité claire.
- Choix technique : authentification faite sur Cloudflare (Worker + D1 + Resend, comme le portail client) plutôt qu'un service externe. À confirmer.

## 5. Modèle de données (le cœur)

Tout vit dans `data/`, en fichiers JSON versionnés dans git.

```
data/
  textes/<id>.json        un texte réglementaire
  faits/<texte>.json      les faits atomiques de ce texte
  acteurs.json            COSUMAF, BVMAC, dépositaire central, sociétés de bourse par pays, etc.
  themes.json             thèmes transversaux (placement privé, OPC, LBC/FT, etc.)
  glossaire.json          termes et définitions (liés aux faits)
  calendrier.json         obligations périodiques par métier
  calculs/                générateurs de calculs (VL, coupon couru, ratios)
  contenu/
    decouvrir/            articles pour le grand public
    comprendre/           chapitres pour les étudiants
    cours/                fiches de cours (reprend les chapitres de la v1)
  qcm/                    questions, chacune liée à des faits
  parcours.json           ordre et niveaux (Essentiel / À connaître / Pour aller plus loin)
  changements.json        journal « ce qui a changé » (généré)
sources/                  PDF officiels (hébergés sur R2, pas dans le dépôt)
```

### 5.1 Un texte

Structure réelle (phase 0), exemple de l'Instruction 44-25 :

```json
{
  "id": "i44-25",
  "ordre": 53,
  "type": "instruction",
  "numero": "44-25",
  "titre": "Obligations d'information des émetteurs faisant appel public à l'épargne",
  "theme": "ape",
  "date_texte": "15 décembre 2025",
  "date_adoption": "2025-12-15",
  "lieu": null,
  "entree_en_vigueur": null,
  "statut": "en_vigueur",
  "statut_source": "non_verifie",
  "abroge": ["i30-24"],
  "abroge_par": [],
  "modifie": [],
  "modifie_par": [],
  "abroge_externes": [],
  "source": { "pdf": null, "url_officielle": null, "origine": "v2 olympiades-2 (scan lu par OCR)" },
  "verifie_le": null,
  "verifie_par": null,
  "confiance": "a_verifier",
  "contenu": { "objet": "...", "essentiel": "...", "retenir": [], "listes": [], "pieges": [], "qr": [] }
}
```

- `statut` : `en_vigueur`, `abroge`, `modifie`, `projet`. Un remplacement se note par une abrogation du texte ancien. Les relations `abroge` / `abroge_par` et `modifie` / `modifie_par` doivent être réciproques ; `modifie` précise les articles concernés et cite la phrase de preuve.
- `statut_source` : `verifie` (relu contre le texte officiel), `deduit` (lu dans une fiche), `non_verifie`.
- `abroge_externes` : textes abrogés qui ne sont pas dans la base (par exemple le Règlement 06/03), avec la phrase de preuve.
- `confiance` : `verifie` (relu contre la source, avec date et relecteur), `a_verifier` (extrait par OCR, non relu), `illisible` (source partiellement illisible).

### 5.2 Un fait

```json
{
  "id": "i44-25.delai.03",
  "texte": "i44-25",
  "type": "delai",
  "article": "art. 3",
  "enonce": "Rapport financier semestriel d'un émetteur APE (Instruction 44-25)",
  "valeur_texte": "2 mois après le semestre",
  "type_valeur": "nombre",
  "valeur": 2,
  "unite": "mois",
  "borne": "exact",
  "note": null,
  "themes": ["ape"],
  "niveau": null,
  "confiance": "a_verifier"
}
```

Types de faits : `delai`, `montant`, `role`, `definition`, `liste`, `piege` (déjà présents) ; `seuil`, `ratio`, `procedure` sont prévus.
`valeur_texte` est toujours la valeur de référence. `valeur`, `unite` et `borne` (`exact`, `min`, `max`) ne sont renseignés que si la lecture est sans ambiguïté ; une date (« au plus tard le 15 juillet ») a `type_valeur: "date"` et pas de nombre. Les pièges n'ont pas d'article.
Une valeur douteuse (OCR, textes contradictoires) est marquée `a_verifier` et n'apparaît jamais comme certaine dans Pratiquer.

### 5.3 Règles de validation (bloquantes au build)

Implémentées dans `scripts/valider.mjs` (phase 0), testées par `scripts/tester-validation.mjs` :

1. Tout fait a un texte existant, un énoncé, une valeur, et un article (sauf définitions, listes et pièges).
2. Un texte abrogé a un texte abrogeant, et inversement ; les relations d'abrogation et de modification sont réciproques et leurs références existent.
3. Un texte ou un fait ne peut être « verifie » sans date et relecteur ; un fait ne peut l'être si son texte ne l'est pas.
4. Un nombre extrait doit avoir une unité.

Prévues pour les phases suivantes :

5. Toute question de quiz référence au moins un fait ; si le fait change, la question est signalée à relire.
6. Aucun fait `a_verifier` n'est publié sans l'étiquette « à vérifier ».
7. Chaque page publique affiche la date de dernière vérification.

## 6. Bibliothèque : consulter et télécharger

- Liste filtrable par type (règlement, instruction, décision, communiqué…), statut, thème, année.
- Chaque texte a sa page : titre, date, statut, texte remplacé ou remplaçant, lien vers la source officielle, **PDF téléchargeable**, et la fiche « à retenir » téléchargeable en PDF.
- Les PDF sont hébergés sur Cloudflare R2 (lourds : certains dépassent 15 Mo), pas dans le site.
- Chaque version hébergée est identifiée (date, source). Les copies non officielles ou illisibles sont signalées.
- Exports pour les professionnels : délais et montants d'un texte en PDF ou CSV, copie d'une citation avec sa référence, lien direct vers un article.
- À vérifier avant le lancement : conditions de réutilisation des textes officiels (COSUMAF, BVMAC, CEMAC).
- Phase ultérieure : recherche plein texte dans les textes eux-mêmes (OCR à relire, avec avertissement).

## 7. Progression (refonte)

Constat sur l'existant : la « maîtrise » d'un cours est le nombre de cartes à intervalle d'au moins 3 jours plus les questions dont la dernière réponse est juste. Elle n'oublie jamais, ne distingue pas l'important du secondaire, décourage les nouveaux (« 668 cartes à réviser », 0 % partout) et ne dit pas si on est prêt.

Nouveau système :

| Élément | Principe |
|---|---|
| Maîtrise qui s'érode | Chaque carte ou question a une probabilité estimée de rappel aujourd'hui, qui baisse avec le temps sans révision. |
| Niveau de préparation | Par thème et par niveau (Essentiel, À connaître, Pour aller plus loin), et un indicateur global « prêt à X % ». |
| Objectif | Une date (Olympiades) ou un rythme (15 minutes par jour) ; le plan en découle. |
| Session du jour | Plafonnée (15 cartes par défaut), qui mélange dues, points faibles et Essentiel. |
| Points faibles | Vue claire des erreurs récurrentes, par thème. |
| Série de jours | Tolérante (un jour de grâce). |
| Points et niveaux | Conservés mais au second plan. |
| Équipes | La vue d'équipe existante (temps, jours actifs, activités) est reprise. |
| Stockage | Sur l'appareil par défaut, exportable ; synchronisé si un compte existe. |

## 8. Statistiques d'audience

Pas de compte obligatoire : la mesure est anonyme et sans cookie, sur le modèle du suivi déjà en place sur la page `/livre` et de l'onglet Audience de l'admin.

| Mesure | Comment |
|---|---|
| Visiteurs uniques (approximatifs, par appareil) | Identifiant aléatoire stocké sur l'appareil, sans lien avec une personne. |
| Sessions et pages vues | Compteurs agrégés par jour. |
| Temps actif | Page visible et interaction récente (comme le suivi d'équipe actuel). |
| Pays | En-tête Cloudflare, l'adresse IP n'est pas conservée. |
| Appareil, source de visite | Agrégés. |
| Profil (étudiant, professionnel, autre) | Question facultative, une seule fois ; et à l'inscription pour les comptes. |

Limites à dire clairement à un partenaire : les chiffres comptent des appareils, pas des personnes, et le profil est déclaratif. Il faut publier la méthode de mesure.

Présence de partenaires : parrainage clairement identifié (« avec le soutien de… »), pas de bannières automatiques, séparation nette entre contenu et publicité. Les règles de publicité sur les produits financiers dans la zone sont à vérifier.

## 9. Chaîne de build

```
data/  +  sources/  ->  scripts/build.mjs  ->  dist/
```

Le build :
1. valide les données (§5.3) ;
2. génère un index de recherche par porte ;
3. génère un paquet de contenu par porte (`decouvrir.json`, `comprendre.json`, `maitriser.json`, `pratiquer.json`) ;
4. génère une page HTML statique par texte et par thème (référencement Google) ;
5. génère le journal des changements en comparant avec la version précédente des données ;
6. génère le manifeste et le service worker (cache hors ligne versionné) ;
7. produit les exports PDF des fiches.

Même logique que la v2 (`scripts/build.mjs`), étendue. Aucune dépendance lourde : JavaScript sans framework, comme la v1 et la v2.

## 10. Front et expérience utilisateur

```
dist/
  index.html              accueil : choix de la porte + recherche
  decouvrir/ comprendre/ maitriser/ pratiquer/ bibliotheque/
  textes/<id>/            page statique par texte
  themes/<id>/
  app/                    code partagé : routeur, recherche, progression, i18n, thème
  moteur-revision/        flashcards, quiz, jeux, examens (repris de la v1)
  data/                   paquets JSON par porte, chargés à la demande
  sw.js  manifest.webmanifest
```

Critères d'une expérience « au top », à mesurer :
- Page utile en moins de 2 secondes sur un mobile moyen avec une connexion lente ; mode faible débit ; polices hébergées sur le site.
- Une recherche accessible partout (raccourci Ctrl K sur ordinateur).
- Lecture confortable d'un règlement : sommaire, lien direct vers un article, copie de la citation, impression propre.
- Mode sombre, taille de texte réglable, navigation clavier, contrastes.
- Arrivée en 30 secondes : une phrase, quatre portes, une recherche.
- Fonctionne sans réseau après la première visite ; indicateur clair quand on est hors ligne.
- Un seul système de design avec trois ambiances : ludique (Maîtriser), sobre et dense (Pratiquer), chaleureuse et simple (Découvrir). À valider.
- Icônes Lucide, pas d'émojis.
- Tests avec de vrais utilisateurs (5 étudiants, 3 professionnels) avant de figer le design.

## 11. Services (Cloudflare Workers + D1 + KV + R2)

| Fonction | Stockage |
|---|---|
| Mode équipe (codes personnels, suivi du temps, activité) | KV `TEAM` existant, inchangé |
| Comptes (Google, e-mail + mot de passe), synchronisation de la progression | D1 |
| Alertes de changement de texte | D1 + Resend |
| Signalement d'erreur (bouton sur chaque fiche) | D1 + Resend |
| Statistiques d'audience | D1 (agrégats quotidiens) |
| PDF des textes officiels | R2 |

Le site public n'écrit rien : le service n'est sollicité que pour les comptes, les équipes, les alertes et les statistiques.

## 12. Qualité et crédibilité

- Chaque page : texte source, article, statut, date de vérification, avertissement « outil d'aide, ne remplace pas le texte officiel ».
- Processus de relecture : un professionnel du marché relit les faits `a_verifier` ; un fait relu passe à `verifie`.
- Veille : une personne responsable des mises à jour quand un texte paraît ou change (le placement privé a changé le 1er novembre 2026).
- Nom, logo et couleurs distincts de la COSUMAF ; accord de partenariat à rechercher avec la COSUMAF et la BVMAC (la COSUMAF prévoit en 2026 un portail d'éducation financière).

## 13. Migration depuis l'existant

| Source | Devient | Travail |
|---|---|---|
| v2 `olympiades-2/data/textes/*.json` (55 textes, 502 délais et montants avec article) | `data/textes` + `data/faits` | Conversion quasi directe ; ajout du statut, de la date de vérification et du niveau de confiance. |
| v2 rubrique Pratique (ratios, calendrier, processus, cas) | `data/calendrier.json`, `data/calculs/`, porte Pratiquer | Reprise. |
| v1 `olympiades/packs/` (71 chapitres, ~760 QCM retenus, archive de 2 078) | `data/contenu/cours`, `data/qcm` | Lier chaque question à un ou plusieurs faits ; signaler celles sans fait. |
| v1 moteur de révision, jeux, examens, Olympiade blanche, suivi d'équipe | `moteur-revision/` et Worker équipe | Reprise du code ; la progression est refaite (§7). |
| Contenus « Découvrir » et « Comprendre » | `data/contenu/` | À écrire. |

Pendant la migration, la v1 et la v2 restent en ligne. La v1 sert l'équipe de 5 jusqu'à la bascule.

## 14. Phases

| Phase | Livrable | Condition de sortie |
|---|---|---|
| 0 | Modèle de données + conversion de la v2 + validation au build | Les 55 textes passent la validation ; chaque texte a un statut. |
| 1 | Site ouvert sans compte : accueil, recherche, bibliothèque avec téléchargements, Maîtriser (moteur v1) | Fonctionne hors ligne ; l'équipe de 5 peut y travailler. |
| 2 | Pratiquer : pages de textes, délais, montants, calendrier, comparateur, exports | Relecture par un professionnel des faits les plus utilisés. |
| 3 | Nouvelle progression + comptes facultatifs (Google, e-mail) + synchronisation | Une personne retrouve sa progression sur un autre appareil. |
| 4 | Découvrir et Comprendre (une quinzaine de chapitres pour commencer) | Relecture par un professionnel du marché. |
| 5 | Statistiques d'audience, alertes, parrainages | Tableau de bord d'audience utilisable devant un partenaire. |
| 6 | Autres langues, partenariats, extension à tous les pays de la CEMAC | — |

## 15. Décisions ouvertes

1. Le nom définitif et l'identité visuelle.
2. Qui relit les faits et met à jour les textes (une personne identifiée, ou un partenaire).
3. Le partenariat avec la COSUMAF et la BVMAC : avant ou après le lancement.
4. Les langues après le français.
5. Authentification faite sur Cloudflare (recommandé) ou service externe.
6. Les trois ambiances visuelles (§10).
7. Les règles de publicité et de parrainage sur les produits financiers dans la zone.
8. Les conditions de réutilisation et d'hébergement des textes officiels.

## 16. Risques

| Risque | Parade |
|---|---|
| Erreur de contenu vue par des professionnels | Niveaux de confiance, relecture, signalement d'erreur, avertissement. |
| Texte périmé | Statut, date de vérification, veille, alertes. |
| Confusion avec un site officiel | Nom neutre, mention « non officiel », partenariat. |
| Deux corpus qui se contredisent (v1 et v2) | Source unique des faits. |
| Statistiques contestées par un partenaire | Méthode publiée, chiffres présentés comme des appareils, pas des personnes. |
| Données personnelles (comptes) | Compte facultatif, minimum de données, suppression à la demande, politique claire. |
| Contenu « Découvrir » trop long à produire | Commencer à une quinzaine de chapitres, mesurer l'usage, continuer ensuite. |
| Coût de relecture et de veille non porté | Décider tôt qui l'assume. |
