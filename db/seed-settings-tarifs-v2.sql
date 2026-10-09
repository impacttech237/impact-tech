-- Aligne le bandeau défilant sur les nouveaux noms de packs (grille v2).
--   wrangler d1 execute impact-tech-db --remote --file=db/seed-settings-tarifs-v2.sql

INSERT OR REPLACE INTO settings (key, value) VALUES
  ('marquee_items', '["Impact Essentiel","Impact Business","Impact Sur Mesure","Paiement à la livraison","Mobile Money"]');
