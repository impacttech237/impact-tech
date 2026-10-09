-- Recatégorise les projets réels sur les nouveaux noms de packs (grille v2).
--   wrangler d1 execute impact-tech-db --remote --file=db/migrate-projects-tarifs-v2.sql

UPDATE projects SET category = 'Impact Essentiel' WHERE category = 'Impact Vitrine';
UPDATE projects SET category = 'Impact Business' WHERE category = 'Impact Gestion';
UPDATE projects SET category = 'Impact Sur Mesure' WHERE category = 'Impact Signature';
