# Inventaire des textes : ce qui existe officiellement, ce que nous avons

Relevé du 25/11/2026, fait dans Chrome sur les deux sites officiels :
- COSUMAF, médiathèque `cosumaf.org/nos-documents` : 133 documents au total (liste complète dans `sources/inventaire/cosumaf-mediatheque-2026-11-25.json`).
- BVMAC, `bvm-ac.org/textes-reglementaires/` : 11 textes (liste dans `sources/inventaire/bvmac-textes-reglementaires-2026-11-25.json`).

Légende des colonnes : **Base** = présent dans `data/textes` (55 textes) · **Local** = le PDF existe dans `Downloads\cosumaf` ou `Downloads\Preparation COSUMAF` · **v1** = couvert dans les chapitres de l'ancienne plateforme (`olympiades/packs`).

## 1. Ce qui est complet

| Catégorie officielle | Officiel | Base | Remarque |
|---|---|---|---|
| Instructions COSUMAF | 49 (01-23 à 49-26) | 49 | Liste identique, numéro par numéro. Le dossier a un doublon (« 48_DOC à modifier » = modèle de contrat de l'Instruction 47-25). |
| Règlement 01/22 (organisation du marché) | 1 | 1 (`r01-22`) | |
| Règlement 03 (2026, placement privé) | 1 | 1 (`r03-26`) | |
| Règlement 04/25 (inscription en compte) | 1 | 1 (`r04-25`) | |
| Règlement Général COSUMAF du 23 mai 2023 | 1 | 1 (`rg-23`) | Absent de `Downloads\cosumaf`, présent dans `Preparation COSUMAF`. |
| Régime fiscal BVMAC | 1 | 1 (`rfi-07`) | Numéro à corriger : le site officiel écrit « 14/07-UEAC-175-CM-15 », la base « 07-UEAC-175-CM-15 ». |

## 2. Ce qui est faux dans la base

| Texte | Problème | Action |
|---|---|---|
| `rbv-08` « Règlement général BVMAC 2008 » | Version périmée. Le règlement général en vigueur est celui publié par la BVMAC en avril 2025 (237 articles ; il cite le Règlement 01/22 et le RG COSUMAF 2023). La COSUMAF l'a approuvé par la Décision N°21-2025. L'ancienne version renvoie encore au Règlement 06/03, abrogé. | Remplacer par le règlement de 2025 (déjà couvert dans la v1, chapitres b1 à b6) ; garder 2008 comme texte abrogé. |

## 3. Ce qui manque dans la base alors que le PDF est déjà en local

| Texte | Source | Local | v1 |
|---|---|---|---|
| Règlement général de la BVMAC (2025) | BVMAC | oui | oui (b1 à b6) |
| Instruction BVMAC N°1 (admission), N°2 (règles de marché), N°3 (grille tarifaire) | BVMAC | oui | oui |
| Règlement N°02/18 (changes) | COSUMAF + BVMAC | oui | oui (t3) |
| Règlement N°01/14 (inscription en compte, remplacé par le 04/25) | COSUMAF + BVMAC | oui | oui (t1) |
| Règlement N°02/24 (LBC/FT et prolifération, Comité ministériel, 102 pages) | COSUMAF | oui | partiel (i09) |
| Lignes directrices LBC/FT sur la vigilance | COSUMAF | oui | partiel (i09) |
| Acte additionnel 03/01 (création de la COSUMAF, 2001) | COSUMAF | oui | oui (m0) |
| Acte additionnel 06/17 (unification du marché, 2018) | COSUMAF | oui | oui (m0) |
| Lettres circulaires 005/24, 001-2026, 003.26 | COSUMAF | oui | partiel |
| Communiqué COSUMAF O1/08 (tarification) | COSUMAF + BVMAC | oui | oui |
| Règlement du 14 mars 2002 (organisation du marché, ancien) | BVMAC + COSUMAF | oui | non |

## 4. Ce qui est publié officiellement et que nous n'avons pas en local

| Texte | Catégorie | Remarque |
|---|---|---|
| Lettres circulaires 002.26, 001/24, 002/24, 003/24, 004/24 | Circulaires | 5 des 8 circulaires. |
| Lignes directrices sur les déclarations d'opérations suspectes | Lignes directrices | |
| Règlement CEMAC/UMAC sur l'introduction en bourse des participations des États (2 octobre 2019) | Autres textes | |
| Communiqué COSUMAF 03/20 (tarification) | Autres textes | |
| Traité révisé CEMAC (2009), Convention UMAC (2008), Acte uniforme OHADA sur les sociétés commerciales (2014) | Textes de base | Textes généraux, pas spécifiques au marché financier. |
| Guide sur les obligations vertes, sociales et durables (février 2026) | Éducation financière | Utile pour « Découvrir » et « Comprendre ». |
| Projet de règlement sur le placement privé (consultation 7 au 16 juillet 2026) | Consultation publique | Dépassé par le Règlement 03 du 13 octobre 2026 ; ne pas intégrer. |

### Téléchargés le 25/11/2026

Les 12 documents de la section 4 (sauf le projet de consultation, volontairement écarté) ont été téléchargés depuis `cosumaf.org` dans `C:\Users\BOZ\Downloads\cosumaf-manquants\`. Chaque fichier est un vrai PDF et le bon document (page de titre vérifiée).

| N° | Document | Pages | Nature |
|---|---|---|---|
| 01 | Lettre circulaire 002.26 (calendrier de transmission, SGO et dépositaires d'OPC, 1er juin 2026) | 3 | scan |
| 02 | Lettre circulaire 004/24 (plan de mise en conformité des SGO, octobre 2024) | 1 | scan |
| 03 | Lettre circulaire 003/24 (calendrier de transmission, SGO, 24 septembre 2024) | 2 | scan |
| 04 | Lettre circulaire 002/24 (modèle et format de reporting, SGO, 16 septembre 2024) | 5 | scan |
| 05 | Lettre circulaire 001/24 (modification du capital social, intermédiaires, 24 juillet 2024) | 2 | scan |
| 06 | Lignes directrices sur les déclarations d'opérations suspectes | 16 | scan |
| 07 | Règlement CEMAC/UMAC sur l'introduction en bourse des participations des États | 2 | scan |
| 08 | Communiqué COSUMAF 03/20 (tarification) | 10 | texte lisible |
| 09 | Traité révisé de la CEMAC | 21 | scan |
| 10 | Convention UMAC | 15 | scan |
| 11 | Acte uniforme OHADA sur les sociétés commerciales | 217 | texte lisible |
| 12 | Guide sur les obligations vertes, sociales et durables | 32 | texte lisible |

À savoir :
- 9 fichiers sur 12 sont des scans : il faudra les lire par OCR avant de les convertir, et ce que donne l'OCR reste à relire.
- Le n° 07 porte un numéro en blanc (« RÈGLEMENT N° …./…./CEMAC/UMAC ») : il s'agit peut-être d'une version non signée ou d'un projet. À vérifier avant de l'intégrer comme texte en vigueur. Le site le date du 2 octobre 2019.
- Il ne reste plus aucun texte officiel de la section 4 à se procurer. La seule exception volontaire est le projet de consultation de juillet 2026, dépassé par le Règlement 03.

## 5. Ce qui n'est pas un texte à intégrer

- **Décisions** (31) : presque toutes des agréments, enregistrements ou retraits d'agrément individuels. Une seule est réglementaire : la **Décision N°21-2025 portant approbation du Règlement Général de la BVMAC**, à citer dans la fiche du texte.
- **Rapports annuels**, bulletins mensuels de statistiques, L'Essentiel, Échos du régulateur, communiqués, appels d'offres, recrutement : utiles comme contexte, pas comme textes.

## 6. Points à vérifier

1. **Date du Règlement N°02/24.** Le titre officiel affiche « 24 avril 2014 », mais le texte cite le Règlement 02/18 (décembre 2018) et un texte de 2022 : la date de 2014 est forcément fausse. Nos contenus parlent du 20 décembre 2024, à confirmer sur la page de signature.
2. **Règlement de 2002.** La BVMAC le date du 14 mars 2002 ; la base cite le Règlement 06/03 du 12 novembre 2003 comme abrogé par le 01/22. Il faut établir la chaîne exacte des règlements anciens.
3. **Projets d'instructions.** La COSUMAF a ouvert une consultation publique sur des projets d'instructions du 14 au 24 septembre 2026. Les instructions qui en résulteront (50-26 et suivantes) seront à ajouter dès leur publication.
4. **Veille.** La médiathèque est mise à jour régulièrement (ce relevé date du 25/11/2026) : il faut le refaire avant chaque mise en ligne.

## 7. Conclusion

- Sur les **instructions**, la base est complète.
- Sur les **règlements**, la base contient 5 des textes principaux mais il manque le règlement général de la BVMAC en vigueur, les instructions BVMAC, les règlements 02/18, 01/14 et 02/24, les actes additionnels et les lignes directrices.
- Sur les **autres textes** (circulaires, lignes directrices, guides), la couverture est faible.
- Presque tout ce qui manque est déjà en PDF sur ton ordinateur : il reste surtout à le convertir.

## 8. Conversion dans la base (25/11/2026)

Tous les textes des sections 2, 3 et 4 ont été lus (OCR pour les scans) et convertis en fiches dans `nouveaux/`, importées dans `data/` par `node scripts/importer.mjs`. La base passe de 55 à **82 textes** et de 1 056 à **1 491 faits**.

| Texte | Fiche | Couverture | Remarque |
|---|---|---|---|
| Règlement général de la BVMAC (2025) | `rbv-25` | partielle | Remplace `rbv-08` (2008), maintenant marqué abrogé (déduit : aucune clause d'abrogation dans le texte de 2025). |
| Instructions BVMAC n° 1, 2, 3 | `ibv-01`, `ibv-02`, `ibv-03` | complète | Versions « projet » de 2008 et 2013. |
| Communiqués COSUMAF 01/08 et 03/20 | `cc-01-08`, `cc-03-20` | contexte, partielle | Le 03/20 remplace le 01/08 (déduit). Scans dégradés : seuls les chiffres lisibles sont repris. |
| Actes additionnels 03/01 et 06/17 | `aa03-01`, `aa06-17` | complète | |
| Lettres circulaires (8 sur 8) | `lc-001-24` à `lc-005-24`, `lc-001-26` à `lc-003-26` | complète ou partielle | La 002.26 abroge la 003/24 (explicite dans le texte). |
| Lignes directrices LBC/FT (vigilance) et DOS | `ld-vigilance`, `ld-dos` | contexte, partielle | |
| Règlement 01/14 (inscription en compte) | `r01-14` | complète | Remplacé par le 04/25 (déduit). |
| Règlement 02/18 (changes) | `r02-18` | partielle | Titre IV (articles 97 à 138) relu en entier. |
| Règlement 02/24 (LBC/FT) | `r02-24` | partielle | Adopté le **20 décembre 2024** à Libreville : la date du site (« 24 avril 2014 ») est fausse. 102 pages : seules les durées et montants sont relevés. |
| Règlement 06/03 (organisation du marché, ancien) | `r06-03` | contexte | C'est le document que la BVMAC appelle « du 14 mars 2002 ». Abrogé par le 01/22. |
| Règlement CEMAC/UMAC 2019 (introduction en bourse des États) | `r19-intro` | complète | Numéro en blanc mais daté et signé du 2 octobre 2019. |
| Traité révisé CEMAC, Convention UMAC, Acte uniforme OHADA | `tr-cemac-09`, `conv-umac-08`, `au-ohada-14` | contexte | Seuls quelques articles relus (OHADA : 920 articles, articles 80 à 87 lus). |
| Guide sur les obligations vertes, sociales et durables | `guide-ovsd-26` | partielle | |

Résultat : `13` textes en couverture complète, `63` partielle, `6` de contexte. **Tout est encore « à vérifier »** : aucune fiche n'a été relue contre le PDF par une personne.

Points signalés dans les fiches (pièges) :
- Instruction BVMAC n° 2 : validité d'un ordre jusqu'à 365 jours, mais le règlement de 2025 limite à 30 jours (art. 162).
- Instruction BVMAC n° 2 : phase de consultation à 9 h dans le corps du texte, 8 h dans le sommaire.
- Règlement 01/14 : renvoi interne à « l'article 23 » alors que la vente est à l'article 24.
- Règlement 02/18, article 121 : le délai de 30 jours n'est pas lisible (avant ou après).
- Communiqués de tarification et Instruction 23-24 : les montants des agréments diffèrent (par exemple Dépositaire Central : 15 M en 2020, 30 M en 2024) ; aucune abrogation expresse du communiqué 03/20 n'a été constatée.
- Règlement général de la BVMAC : le franchissement de seuil parle de 6 mois (art. 180) puis de 12 mois (art. 181).
