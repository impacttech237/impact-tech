-- Migration : fusion Services -> Offres (refonte impacttech237.com)
-- À exécuter une fois sur la base D1 existante :
--   wrangler d1 execute impact-tech-db --remote --file=db/migrate-merge-offers.sql
-- (ou --local pour la base de dev)
--
-- N'échoue pas si déjà appliquée (idempotent) et ne touche pas à la table
-- "services" existante (dépréciée, laissée intacte pour ne rien casser).

ALTER TABLE offers ADD COLUMN hook TEXT;
ALTER TABLE offers ADD COLUMN ideal TEXT;
ALTER TABLE offers ADD COLUMN delay TEXT;
ALTER TABLE offers ADD COLUMN value_stack TEXT;
ALTER TABLE offers ADD COLUMN total_value TEXT;
