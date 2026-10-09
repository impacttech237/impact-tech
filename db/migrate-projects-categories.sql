-- Recatégorise les projets réels (table "projects") sur les 3 packs, pour
-- que le filtre de /realisations (déjà générique, basé sur `category`)
-- corresponde aux offres de /offres. Idempotent : ne touche que les
-- anciennes valeurs de catégorie, sans risque si déjà migré.
--
--   wrangler d1 execute impact-tech-db --remote --file=db/migrate-projects-categories.sql
--
-- Si vos catégories réelles en base diffèrent de celles ci-dessous, corrigez
-- plutôt à la main depuis /admin (Réalisations) — plus sûr qu'une regex.

UPDATE projects SET category = 'Impact Vitrine' WHERE category IN ('Landing Page', 'Vitrine', 'Blog / Vitrine', 'Blog/Vitrine');
UPDATE projects SET category = 'Impact Gestion' WHERE category IN ('E-commerce', 'Ecommerce');
UPDATE projects SET category = 'Impact Signature' WHERE category IN ('SaaS & App', 'SaaS', 'Application', 'App', 'Sur-mesure');
