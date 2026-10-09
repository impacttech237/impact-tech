-- Aligne le bandeau défilant et les arguments du hero sur la refonte
-- (3 packs fusionnés + garantie "paiement à la livraison").
-- Aucun chiffre inventé ici (le mémo suggère "+50 projets" à titre
-- d'exemple — on ne l'utilise pas tant qu'il n'est pas vérifié en base
-- "stats", gérable séparément depuis /admin).
--
--   wrangler d1 execute impact-tech-db --remote --file=db/seed-settings-merged.sql

INSERT OR REPLACE INTO settings (key, value) VALUES
  ('marquee_items', '["Impact Vitrine","Impact Gestion","Impact Signature","Paiement à la livraison","Mobile Money"]');

INSERT OR REPLACE INTO settings (key, value) VALUES
  ('hero_pills', '["Paiement à la livraison uniquement","Cameroun & Europe","Réponse sous 24h"]');
