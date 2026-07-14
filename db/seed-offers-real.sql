-- Vraies offres Impact Tech (remplace les packs demo)
INSERT INTO offers (tag, title, price, is_quote, popular, features, image, sort_order, active) VALUES
  ('Impact Vitrine', 'Votre présence en ligne, professionnelle et rassurante', '150 000', 0, 0,
   '["Site vitrine professionnel (accueil, à propos, services, contact)","Nom de domaine + hébergement 1 an inclus","Certificat SSL (https) + design responsive","Renouvellement annuel : 100 000 FCFA (domaine + hébergement)"]',
   '/images/service-landing.jpg', 0, 1),
  ('Impact Gestion', 'Votre activité pilotée, même sans connexion internet', '400 000', 0, 1,
   '["Fonctionne même sans connexion internet (mode hors-ligne)","Gestion clients, stocks et ventes depuis un seul outil","Synchronisation automatique dès que la connexion revient","Renouvellement annuel : 150 000 FCFA (hébergement + support)"]',
   '/images/service-saas.jpg', 1, 1),
  ('Impact Signature', 'La solution 100% sur-mesure pour votre entreprise', 'Sur devis', 1, 0,
   '["Solution taillée pour votre activité, pas un logiciel générique","Architecture pensée pour évoluer sans tout reconstruire","Accompagnement et maintenance dédiés"]',
   '/images/service-custom.jpg', 2, 1);
