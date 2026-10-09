-- Remplace la FAQ générique par les 6 questions/réponses de la refonte
-- (page Offres). Vide la table puis réinsère — la FAQ n'a pas d'autre
-- consommateur que la page /offres et la page /contact (Faq component).
--
--   wrangler d1 execute impact-tech-db --remote --file=db/seed-faqs-merged.sql

DELETE FROM faqs;

INSERT INTO faqs (question, answer, sort_order, active) VALUES
  ('Comment savoir quel pack me convient ?', 'Si vous voulez simplement être visible en ligne → Impact Vitrine. Si vous voulez vendre ou gérer des réservations → Impact Gestion. Si vous avez un besoin spécifique (app, SaaS, logiciel) → Impact Signature. L''appel découverte gratuit vous aide à choisir.', 0, 1),
  ('Pourquoi « paiement à la livraison » ? C''est vraiment gratuit au départ ?', 'Oui. On développe votre projet en entier. Vous testez le résultat. Vous ne payez que quand vous êtes satisfait. On prend le risque, pas vous — aucun acompte n''est demandé.', 1, 1),
  ('Quels sont les délais ?', 'Impact Vitrine : 10-14 jours. Impact Gestion : 3-4 semaines. Impact Signature : selon la complexité du projet (estimé lors de l''appel découverte).', 2, 1),
  ('Est-ce que vous travaillez avec des clients en Europe ?', 'Oui. Nous avons des clients au Cameroun et en Europe du Nord. La communication se fait par visio, WhatsApp et email. Même qualité, même réactivité, prix ajusté à la valeur.', 3, 1),
  ('Que se passe-t-il après la livraison ?', 'Vous êtes formé pour gérer votre site. L''hébergement est inclus 1 an. Le support post-lancement est inclus (durée selon le pack). Le renouvellement hébergement est à partir de 25 000 FCFA/an.', 4, 1),
  ('Vous utilisez WordPress ?', 'Pas systématiquement. On choisit la technologie adaptée à votre besoin. WordPress pour certains sites vitrines, solutions sur mesure pour le reste. L''objectif : performance, sécurité, évolutivité.', 5, 1);
