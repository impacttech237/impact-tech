-- Migration : infrastructure bilingue FR/EN (refonte impacttech237.com)
--   wrangler d1 execute impact-tech-db --remote --file=db/migrate-bilingual.sql

ALTER TABLE offers ADD COLUMN title_en TEXT;
ALTER TABLE offers ADD COLUMN description_en TEXT;
ALTER TABLE offers ADD COLUMN hook_en TEXT;
ALTER TABLE offers ADD COLUMN ideal_en TEXT;
ALTER TABLE offers ADD COLUMN delay_en TEXT;
ALTER TABLE offers ADD COLUMN features_en TEXT;
ALTER TABLE offers ADD COLUMN value_stack_en TEXT;
ALTER TABLE offers ADD COLUMN total_value_en TEXT;
ALTER TABLE offers ADD COLUMN price_eur TEXT;

ALTER TABLE faqs ADD COLUMN question_en TEXT;
ALTER TABLE faqs ADD COLUMN answer_en TEXT;
