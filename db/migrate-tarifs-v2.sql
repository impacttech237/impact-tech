-- Migration : nouvelle grille tarifaire v2 (Impact_Tech_Grille_Tarifaire_v2.md)
--   wrangler d1 execute impact-tech-db --remote --file=db/migrate-tarifs-v2.sql

ALTER TABLE offers ADD COLUMN tag_en TEXT;
