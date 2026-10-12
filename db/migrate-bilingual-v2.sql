-- Migration : bilingue FR/EN, suite (chiffres clés, témoignages, méthode,
-- réalisations). Colonnes _en optionnelles : vides = le FR s'affiche.
--   wrangler d1 execute impact-tech-db --remote --file=db/migrate-bilingual-v2.sql

ALTER TABLE stats ADD COLUMN label_en TEXT;
ALTER TABLE stats ADD COLUMN note_en TEXT;
ALTER TABLE stats ADD COLUMN suffix_en TEXT;

ALTER TABLE testimonials ADD COLUMN role_en TEXT;
ALTER TABLE testimonials ADD COLUMN text_en TEXT;

ALTER TABLE process_steps ADD COLUMN title_en TEXT;
ALTER TABLE process_steps ADD COLUMN description_en TEXT;

ALTER TABLE projects ADD COLUMN title_en TEXT;
ALTER TABLE projects ADD COLUMN description_en TEXT;
ALTER TABLE projects ADD COLUMN result_en TEXT;
