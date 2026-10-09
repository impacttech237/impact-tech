-- Enrichissement des 3 packs (fusion Services -> Offres, refonte).
-- Complète les lignes "offers" DÉJÀ en base (db/seed-offers-real.sql) avec le
-- contenu marketing des mémos stratégiques : accroche, cible, délai, value
-- stack chiffré. Ne touche pas tag/title/price/features/popular/is_quote,
-- déjà corrects en prod.
--
--   wrangler d1 execute impact-tech-db --remote --file=db/seed-offers-merged.sql

UPDATE offers SET
  hook = 'Vous perdez des clients chaque jour où votre entreprise n''a pas de site professionnel. Vos concurrents en ont un. Vos prospects cherchent sur Google. Ils ne vous trouvent pas.',
  ideal = 'L''entrepreneur ou la PME qui n''a pas encore de présence en ligne, ou dont le site actuel fait fuir les clients.',
  delay = '10-14 jours',
  value_stack = '[
    "Design sur mesure adapté à votre marque (pas un template générique) — 120 000 FCFA",
    "Jusqu''à 7 pages optimisées (accueil, services, à propos, contact...) — 80 000 FCFA",
    "Responsive mobile natif — 50 000 FCFA",
    "Optimisation SEO de base — 40 000 FCFA",
    "Formulaire de contact intelligent avec notifications — 20 000 FCFA",
    "Intégration WhatsApp Business (bouton flottant) — 15 000 FCFA",
    "Hébergement 1 an inclus + nom de domaine — 35 000 FCFA",
    "Formation 1h pour gérer votre site vous-même — 25 000 FCFA"
  ]',
  total_value = '385 000 FCFA'
WHERE tag = 'Impact Vitrine';

UPDATE offers SET
  hook = 'Vous gérez vos commandes par WhatsApp et vos paiements en espèces ? Pendant ce temps, vos concurrents encaissent en ligne 24h/24 via Mobile Money. Il est temps de rattraper — et de dépasser.',
  ideal = 'L''entreprise qui veut vendre en ligne, prendre des réservations, ou gérer ses clients depuis un tableau de bord.',
  delay = '3-4 semaines',
  value_stack = '[
    "Tout le pack Impact Vitrine inclus — 385 000 FCFA",
    "Catalogue produits / services en ligne — 80 000 FCFA",
    "Paiement intégré : MTN MoMo + Orange Money + carte bancaire — 120 000 FCFA",
    "Tableau de bord admin (commandes, clients, statistiques) — 100 000 FCFA",
    "Système de réservation en ligne — 60 000 FCFA",
    "Notifications automatiques (email + WhatsApp) — 50 000 FCFA",
    "Espace client sécurisé — 45 000 FCFA",
    "Formation 2h + support prioritaire 30 jours — 60 000 FCFA",
    "Hébergement 1 an + domaine + SSL — 45 000 FCFA"
  ]',
  total_value = '945 000 FCFA'
WHERE tag = 'Impact Gestion';

UPDATE offers SET
  hook = 'Vous avez un problème spécifique que les solutions génériques ne règlent pas. Vous avez besoin d''un outil conçu pour VOTRE réalité — pas un template adapté.',
  ideal = 'L''entreprise ou le porteur de projet qui a besoin d''un outil digital sur mesure : application mobile, logiciel SaaS, plateforme de gestion, outil interne.',
  delay = 'Selon la complexité (estimé lors de l''appel découverte)',
  value_stack = '[
    "Audit complet de vos besoins + cahier des charges détaillé — 150 000 FCFA",
    "Architecture technique sur mesure (choix techno, base de données, API) — 200 000 FCFA",
    "Développement complet front-end + back-end — selon complexité",
    "Design UX/UI professionnel (maquettes validées avant développement) — 250 000 FCFA",
    "Intégrations tierces (paiement, API, CRM, ERP) — selon besoins",
    "Tests complets + correction de bugs — 100 000 FCFA",
    "Déploiement + mise en production — 80 000 FCFA",
    "Formation équipe + documentation technique — 100 000 FCFA",
    "Support prioritaire 60 jours post-lancement — 120 000 FCFA",
    "Révisions illimitées pendant le développement — incalculable"
  ]',
  total_value = NULL
WHERE tag = 'Impact Signature';
