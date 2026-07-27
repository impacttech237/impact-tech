-- Ajoute une explication à chaque pack (offre) + met à jour les 3 packs existants.
ALTER TABLE offers ADD COLUMN description TEXT;

UPDATE offers SET description =
  'Le pack idéal pour exister en ligne et inspirer confiance. Un site clair qui présente votre activité, vos services et vos coordonnées, avec un bouton WhatsApp direct. Parfait pour les indépendants, artisans et petites entreprises qui veulent une première présence sérieuse sur internet.'
WHERE tag = 'Impact Vitrine';

UPDATE offers SET description =
  'Pour vendre et gérer votre activité au quotidien. Boutique en ligne avec paiement MTN MoMo et Orange Money et gestion des commandes, ou outil de suivi qui marche même en connexion faible. Idéal pour les commerçants et les PME qui veulent encaisser en ligne et piloter leur activité.'
WHERE tag = 'Impact Gestion';

UPDATE offers SET description =
  'La formule pour les projets uniques et ambitieux : application mobile, logiciel de gestion (SaaS), plateforme métier ou outil interne. On analyse votre besoin en profondeur et on construit exactement l''outil qu''il vous faut. Pour les entreprises et startups qui veulent digitaliser tout un métier.'
WHERE tag = 'Impact Signature';
