# Plan : Portail client v2 (impacttech237.com)

## Objectif
Un espace client simple (3 questions : où en est mon projet / que dois-je faire / quoi de neuf),
qui fait gagner du temps à Impact Tech : collecte de contenu guidée, validations horodatées,
relances automatiques, retours annotés, paiement K-PAY, fidélisation.

## Décisions d'architecture
- **Front portail** : Preact (~4 Ko) bundlé par esbuild -> `public/portal.js`. Shell SSR autonome
  (pas le Layout marketing, trop lourd pour la 3G). Mobile d'abord, FR/EN.
- **Admin** : React existant (`admin-app/`), PortalPanel réécrit en espace de travail par projet.
- **PDF** : `pdf-lib` (pur JS, compatible Workers) pour apposer la signature sur les PDF uploadés,
  page de certificat (empreinte SHA-256 du document d'origine), factures/reçus.
- **Emails** : Resend (`RESEND_API_KEY`), l'expéditeur reste sur impacttech237.com. Sans clé : l'admin
  le signale clairement et propose WhatsApp / Copier le lien / code manuel.
- **Fichiers** : R2, upload multipart découpé (8 Mo/partie, reprise et retries) pour les vidéos lourdes.
  Lecture avec Range (vidéo/audio lisibles en streaming). Fichiers privés, jamais via /media.
- **Liens** : `/espace/<slug-du-client>` + code (email ou code généré par l'admin, 24 h).
  `/portail/<token>` reste valide (redirection). Anti-bruteforce : 5 essais max par code.
- **Automatisations** : Cron Worker quotidien (relances checklist J+3/J+7, renouvellements,
  santé des sites, récap admin).
- **Migrations** : uniquement additives (`db/migrate-portal-v2.sql`), aucune donnée existante modifiée.

## Phases (toutes livrées le 2026-10-09 — voir guide-portail-client.md)
### Phase 1 : Débloquer
1. Emails Resend + diagnostic dans l'admin, WhatsApp / copier / code manuel
2. Slug client `/espace/:slug`, session 90 j, anti-bruteforce, page de connexion simple
3. Documents & contrats : upload PDF/Word/image par l'admin, lecture dans le portail,
   signature apposée sur le PDF + certificat, contresignature admin
4. Modèles de contrat refaits : variables auto (client, pack, montant, délai...), aperçu,
   modèle par pack, upload d'un modèle fichier
5. Dépôt de fichiers client tous types (multipart, catégories, aperçu, notification admin)
6. Aperçu du site en développement (ordinateur / tablette / mobile)

### Phase 2 : Piloter
7. Modèles de projet par pack (étapes, checklist, séries de modifs, support, délai)
8. Étapes + validation horodatée + satisfaction express
9. Checklist « ce qu'on attend de vous » + collecte guidée (formulaires) + coffre d'accès chiffré
10. Création client+projet en 1 clic depuis une demande de devis
11. Vue « Qui attend qui ? », Kanban projets, alertes de retard, journal d'activité, notes internes
12. Relances automatiques (Cron)

### Phase 3 : Échanger
13. Messagerie par projet + notes vocales + point de la semaine
14. Retours sur le site (widget à intégrer au site en dev + retours depuis le portail),
    séries de modifications, hors périmètre -> mini-devis
15. Rendez-vous depuis le portail (module /rdv prérempli)

### Phase 4 : Encaisser & fidéliser
16. Devis / factures / reçus + paiement K-PAY depuis le portail (webhook -> facture payée)
17. Kit de livraison, santé du site, renouvellements
18. Tickets support (durée incluse), avis -> témoignages, parrainage
19. Onboarding 3 écrans, FR/EN, PWA, bouton WhatsApp

## Risques
| Risque | Mitigation |
|---|---|
| Emails non configurés (DNS) | Fallback WhatsApp / code manuel, statut visible dans l'admin |
| Taille du bundle Worker (pdf-lib) | Import ciblé ; vérifier `wrangler deploy --dry-run` |
| Connexions lentes | Upload multipart avec retries, pages légères |
| Valeur juridique de la signature | Signature électronique simple + empreinte SHA-256 + IP + horodatage ; contrat type à faire relire |

## Questions ouvertes (valeurs par défaut prises)
- Séries de modifications par pack : réglables dans l'admin, laissées vides par défaut.
- Équipe : un seul admin pour l'instant.
- DNS / clé Resend : à fournir par Roberto.
