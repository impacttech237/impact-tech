-- Schéma D1 — IMPACT TECH
-- Reconstruit depuis src/lib/admin-resources.ts, src/lib/content.ts et src/worker.tsx
-- (aucun fichier de migration n'existait dans le dépôt).

CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT
);

CREATE TABLE IF NOT EXISTS stats (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  value      INTEGER,
  suffix     TEXT,
  label      TEXT,
  note       TEXT,
  sort_order INTEGER DEFAULT 0,
  active     INTEGER DEFAULT 1,
  -- Bilingue EN (db/migrate-bilingual-v2.sql)
  label_en TEXT,
  note_en TEXT,
  suffix_en TEXT
);

-- Table "services" dépréciée (refonte : chaque pack EST le service, cf. "offers"
-- ci-dessous). Conservée telle quelle pour ne pas casser une base existante,
-- mais plus lue/écrite par le code applicatif depuis la fusion Offres/Services.
CREATE TABLE IF NOT EXISTS services (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  slug        TEXT,
  tag         TEXT,
  title       TEXT,
  short_desc  TEXT,
  headline    TEXT,
  accent      TEXT,
  description TEXT,
  features    TEXT,
  ideal       TEXT,
  price       TEXT,
  delay       TEXT,
  image       TEXT,
  sort_order  INTEGER DEFAULT 0,
  active      INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS offers (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  tag         TEXT,
  title       TEXT,
  description TEXT,   -- explication du pack (à qui il s'adresse, ce qu'il couvre)
  price       TEXT,
  is_quote    INTEGER DEFAULT 0,
  popular     INTEGER DEFAULT 0,
  features    TEXT,
  image       TEXT,
  sort_order  INTEGER DEFAULT 0,
  active      INTEGER DEFAULT 1,
  -- Colonnes de fusion Offres/Services (refonte) : chaque pack porte
  -- désormais tout le contenu marketing (accroche, cible, délai, value stack).
  hook          TEXT,   -- accroche ("Vous perdez des clients chaque jour...")
  ideal         TEXT,   -- "Pour qui" (repris de l'ancienne table services)
  delay         TEXT,   -- délai de livraison affiché
  value_stack   TEXT,   -- JSON [{label, value}] — value stack chiffré (Hormozi)
  total_value   TEXT,   -- valeur totale affichée barrée, ex. "385 000 FCFA"
  -- Colonnes bilingue EN (refonte) : marché Europe du Nord, prix en EUR.
  tag_en          TEXT,  -- nom du pack en anglais (ex. "Essential", grille tarifaire v2)
  title_en        TEXT,
  description_en  TEXT,
  hook_en         TEXT,
  ideal_en        TEXT,
  delay_en        TEXT,
  features_en     TEXT,  -- JSON, même format que "features"
  value_stack_en  TEXT,  -- JSON, même format que "value_stack"
  total_value_en  TEXT,
  price_eur       TEXT   -- prix affiché en € sur la version EN (ex. "230" ou "Custom quote")
);

CREATE TABLE IF NOT EXISTS testimonials (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT,
  role       TEXT,
  text       TEXT,
  initials   TEXT,
  sort_order INTEGER DEFAULT 0,
  active     INTEGER DEFAULT 1,
  -- Bilingue EN (db/migrate-bilingual-v2.sql)
  role_en TEXT,
  text_en TEXT
);

CREATE TABLE IF NOT EXISTS faqs (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  question    TEXT,
  answer      TEXT,
  sort_order  INTEGER DEFAULT 0,
  active      INTEGER DEFAULT 1,
  -- Bilingue EN (refonte)
  question_en TEXT,
  answer_en   TEXT
);

CREATE TABLE IF NOT EXISTS posts (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  title      TEXT,
  category   TEXT,
  date       TEXT,
  read_time  TEXT,
  excerpt    TEXT,
  image      TEXT,
  featured   INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  active     INTEGER DEFAULT 1,
  -- Contenu riche de la page article (rédigé depuis le dashboard) :
  eyebrow         TEXT,   -- petit sur-titre au-dessus du titre
  lead            TEXT,   -- chapô / accroche d'introduction
  secondary_image TEXT,   -- image insérée en milieu d'article
  author          TEXT,   -- auteur affiché
  sections        TEXT    -- JSON: [{title, paragraphs[], bullets[], quote, callout}]
);

CREATE TABLE IF NOT EXISTS projects (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  title       TEXT,
  category    TEXT,
  description TEXT,
  result      TEXT,
  image       TEXT,
  sort_order  INTEGER DEFAULT 0,
  active      INTEGER DEFAULT 1,
  -- Bilingue EN (db/migrate-bilingual-v2.sql)
  title_en TEXT,
  description_en TEXT,
  result_en TEXT
);

CREATE TABLE IF NOT EXISTS process_steps (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  num         TEXT,
  title       TEXT,
  description TEXT,
  sort_order  INTEGER DEFAULT 0,
  active      INTEGER DEFAULT 1,
  -- Bilingue EN (db/migrate-bilingual-v2.sql)
  title_en TEXT,
  description_en TEXT
);

CREATE TABLE IF NOT EXISTS contact_requests (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  name         TEXT,
  phone        TEXT,
  email        TEXT,
  company      TEXT,
  project_type TEXT,
  budget       TEXT,
  message      TEXT,
  status       TEXT DEFAULT 'nouvelle',
  created_at   TEXT DEFAULT CURRENT_TIMESTAMP,
  -- Portail client v2 (db/migrate-portal-v2.sql)
  referral_code TEXT,
  converted_client_id INTEGER
);

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  email      TEXT UNIQUE,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- ─── Formulaires prospects (enquêtes permanentes par offre) ───

CREATE TABLE IF NOT EXISTS survey_forms (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  slug         TEXT UNIQUE NOT NULL,
  title        TEXT NOT NULL,
  description  TEXT,
  redirect_url TEXT,
  active       INTEGER DEFAULT 1,
  created_at   TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS survey_sections (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  form_id     INTEGER NOT NULL REFERENCES survey_forms(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  sort_order  INTEGER DEFAULT 0,
  condition   TEXT
);

CREATE TABLE IF NOT EXISTS survey_questions (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  section_id  INTEGER NOT NULL REFERENCES survey_sections(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,
  label       TEXT NOT NULL,
  description TEXT,
  required    INTEGER DEFAULT 0,
  sort_order  INTEGER DEFAULT 0,
  config      TEXT
);

CREATE TABLE IF NOT EXISTS survey_responses (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  form_id            INTEGER NOT NULL REFERENCES survey_forms(id),
  respondent_name    TEXT,
  respondent_email   TEXT,
  respondent_phone   TEXT,
  respondent_company TEXT,
  started_at         TEXT DEFAULT CURRENT_TIMESTAMP,
  completed_at       TEXT,
  ip_address         TEXT,
  user_agent         TEXT
);

CREATE TABLE IF NOT EXISTS survey_answers (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  response_id INTEGER NOT NULL REFERENCES survey_responses(id) ON DELETE CASCADE,
  question_id INTEGER NOT NULL REFERENCES survey_questions(id),
  value       TEXT
);

CREATE INDEX IF NOT EXISTS idx_survey_sections_form ON survey_sections(form_id);
CREATE INDEX IF NOT EXISTS idx_survey_questions_section ON survey_questions(section_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_form ON survey_responses(form_id);
CREATE INDEX IF NOT EXISTS idx_survey_answers_response ON survey_answers(response_id);

-- ─── Agenda & Prise de RDV ───

CREATE TABLE IF NOT EXISTS appointment_types (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  slug        TEXT UNIQUE NOT NULL,
  title       TEXT NOT NULL,
  description TEXT,
  duration    INTEGER NOT NULL DEFAULT 30,
  color       TEXT DEFAULT '#C0202B',
  location    TEXT,
  active      INTEGER DEFAULT 1,
  sort_order  INTEGER DEFAULT 0,
  created_at  TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS availability_rules (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  day_of_week INTEGER NOT NULL,
  start_time  TEXT NOT NULL,
  end_time    TEXT NOT NULL,
  active      INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS appointments (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  type_id          INTEGER NOT NULL REFERENCES appointment_types(id),
  start_time       TEXT NOT NULL,
  end_time         TEXT NOT NULL,
  client_name      TEXT NOT NULL,
  client_email     TEXT,
  client_phone     TEXT,
  client_company   TEXT,
  notes            TEXT,
  status           TEXT DEFAULT 'confirmed',
  gcal_event_id    TEXT,
  cancel_token     TEXT UNIQUE,
  cancelled_at     TEXT,
  created_at       TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS oauth_tokens (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  provider      TEXT NOT NULL DEFAULT 'google',
  access_token  TEXT NOT NULL,
  refresh_token TEXT,
  expires_at    TEXT,
  scope         TEXT,
  created_at    TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at    TEXT
);

CREATE INDEX IF NOT EXISTS idx_appointments_type ON appointments(type_id);
CREATE INDEX IF NOT EXISTS idx_appointments_start ON appointments(start_time);
CREATE INDEX IF NOT EXISTS idx_appointments_cancel_token ON appointments(cancel_token);

-- ─── Portail Client ───

CREATE TABLE IF NOT EXISTS clients (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL,
  phone         TEXT,
  company       TEXT,
  access_token  TEXT UNIQUE NOT NULL,
  auth_code     TEXT,
  auth_code_exp TEXT,
  active        INTEGER DEFAULT 1,
  created_at    TEXT DEFAULT CURRENT_TIMESTAMP,
  -- Portail client v2 (db/migrate-portal-v2.sql)
  slug TEXT,
  locale TEXT DEFAULT 'fr',
  auth_attempts INTEGER DEFAULT 0,
  code_sent_at TEXT,
  onboarded_at TEXT,
  last_seen_at TEXT,
  referral_code TEXT,
  internal_notes TEXT,
  source_request_id INTEGER
);

CREATE TABLE IF NOT EXISTS client_projects (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id   INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  status      TEXT DEFAULT 'cadrage',
  start_date  TEXT,
  due_date    TEXT,
  created_at  TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at  TEXT,
  -- Portail client v2 (db/migrate-portal-v2.sql)
  pack TEXT,
  preview_url TEXT,
  site_url TEXT,
  admin_url TEXT,
  amount INTEGER,
  currency TEXT DEFAULT 'XAF',
  revision_rounds INTEGER,
  revision_used INTEGER DEFAULT 0,
  support_days INTEGER,
  delivered_at TEXT,
  support_until TEXT,
  hosting_renewal_at TEXT,
  domain_renewal_at TEXT,
  renewal_amount INTEGER,
  handover_notes TEXT,
  handover_links TEXT,
  internal_notes TEXT,
  feedback_key TEXT,
  weekly_update TEXT,
  weekly_update_at TEXT,
  health_status INTEGER,
  health_ms INTEGER,
  health_checked_at TEXT
);

CREATE TABLE IF NOT EXISTS contract_templates (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  title      TEXT NOT NULL,
  content    TEXT NOT NULL,
  variables  TEXT,
  active     INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT,
  -- Portail client v2 (db/migrate-portal-v2.sql)
  pack TEXT,
  file_key TEXT,
  file_name TEXT,
  file_mime TEXT
);

CREATE TABLE IF NOT EXISTS client_documents (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id  INTEGER NOT NULL REFERENCES client_projects(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  category    TEXT DEFAULT 'document',
  status      TEXT DEFAULT 'draft',
  content     TEXT,
  template_id INTEGER REFERENCES contract_templates(id),
  r2_key      TEXT,
  created_at  TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at  TEXT,
  -- Portail client v2 (db/migrate-portal-v2.sql)
  file_key TEXT,
  file_name TEXT,
  file_mime TEXT,
  file_sha256 TEXT,
  needs_signature INTEGER DEFAULT 0,
  sent_at TEXT,
  admin_signed_at TEXT,
  admin_signature_key TEXT
);

CREATE TABLE IF NOT EXISTS signatures (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  document_id   INTEGER NOT NULL REFERENCES client_documents(id) ON DELETE CASCADE,
  client_id     INTEGER NOT NULL REFERENCES clients(id),
  approval_text TEXT NOT NULL DEFAULT 'Lu et approuvé',
  signature_r2  TEXT NOT NULL,
  ip_address    TEXT,
  user_agent    TEXT,
  signed_at     TEXT DEFAULT CURRENT_TIMESTAMP,
  -- Portail client v2 (db/migrate-portal-v2.sql)
  document_sha256 TEXT
);

CREATE TABLE IF NOT EXISTS client_files (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id  INTEGER NOT NULL REFERENCES client_projects(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  r2_key      TEXT NOT NULL,
  size        INTEGER,
  mime_type   TEXT,
  uploaded_by TEXT DEFAULT 'admin',
  created_at  TEXT DEFAULT CURRENT_TIMESTAMP,
  -- Portail client v2 (db/migrate-portal-v2.sql)
  category TEXT DEFAULT 'autre',
  checklist_item_id INTEGER,
  message_id INTEGER
);

CREATE INDEX IF NOT EXISTS idx_clients_access_token ON clients(access_token);
CREATE INDEX IF NOT EXISTS idx_client_projects_client ON client_projects(client_id);
CREATE INDEX IF NOT EXISTS idx_client_documents_project ON client_documents(project_id);
CREATE INDEX IF NOT EXISTS idx_signatures_document ON signatures(document_id);
CREATE INDEX IF NOT EXISTS idx_client_files_project ON client_files(project_id);

-- Paiements K-PAY (Mobile Money). Backend conservé mais plus exposé en UI
-- depuis la refonte (garantie "paiement à la livraison uniquement" — le
-- bouton "Payer maintenant" a été retiré des packs). Voir
-- .claude/skills/kpay-payments/SKILL.md pour l'architecture complète.
CREATE TABLE IF NOT EXISTS payments (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  external_id    TEXT UNIQUE,   -- notre référence envoyée à K-PAY (idempotence)
  kpay_id        TEXT,          -- id K-PAY (pay_xxx)
  kpay_reference TEXT,          -- référence K-PAY (KPAY-...)
  offer_tag      TEXT,
  amount         INTEGER,
  currency       TEXT DEFAULT 'XAF',
  status         TEXT DEFAULT 'PENDING', -- PENDING | COMPLETED | FAILED | CANCELLED
  customer_name  TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  failure_reason TEXT,
  is_test        INTEGER DEFAULT 1,
  created_at     TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at     TEXT,
  -- Portail client v2 (db/migrate-portal-v2.sql)
  invoice_id INTEGER
);

-- ─── Portail client v2 ───
CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_slug ON clients(slug);
CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_referral ON clients(referral_code);
CREATE UNIQUE INDEX IF NOT EXISTS idx_client_projects_feedback_key ON client_projects(feedback_key);

-- ─── Modèles de projet par pack ───
CREATE TABLE IF NOT EXISTS project_templates (
  id                   INTEGER PRIMARY KEY AUTOINCREMENT,
  pack                 TEXT NOT NULL,
  title                TEXT,
  delay_days           INTEGER,
  revision_rounds      INTEGER,
  support_days         INTEGER,
  steps                TEXT,   -- JSON [{title, description, needs_validation, days}]
  checklist            TEXT,   -- JSON [{label, help, kind, category, config, due_days}]
  contract_template_id INTEGER,
  active               INTEGER DEFAULT 1,
  sort_order           INTEGER DEFAULT 0,
  created_at           TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at           TEXT
);

-- ─── Étapes du projet ───
CREATE TABLE IF NOT EXISTS project_steps (
  id                   INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id           INTEGER NOT NULL REFERENCES client_projects(id) ON DELETE CASCADE,
  title                TEXT NOT NULL,
  description          TEXT,
  status               TEXT DEFAULT 'todo',   -- todo | in_progress | review | done
  needs_validation     INTEGER DEFAULT 0,
  due_date             TEXT,
  started_at           TEXT,
  completed_at         TEXT,
  validated_at         TEXT,
  validated_ip         TEXT,
  validation_comment   TEXT,
  satisfaction         INTEGER,               -- 1..5
  satisfaction_comment TEXT,
  sort_order           INTEGER DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_project_steps_project ON project_steps(project_id);

-- ─── Ce qu'on attend du client ───
CREATE TABLE IF NOT EXISTS checklist_items (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id       INTEGER NOT NULL REFERENCES client_projects(id) ON DELETE CASCADE,
  label            TEXT NOT NULL,
  help             TEXT,
  kind             TEXT DEFAULT 'file',  -- file | form | access | confirm
  category         TEXT,                 -- catégorie de fichiers (logo, photos...)
  config           TEXT,                 -- JSON : questions du formulaire guidé
  answer           TEXT,                 -- JSON : réponses
  status           TEXT DEFAULT 'todo',  -- todo | sent | ok
  due_date         TEXT,
  sent_at          TEXT,
  validated_at     TEXT,
  reminder_count   INTEGER DEFAULT 0,
  last_reminder_at TEXT,
  sort_order       INTEGER DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_checklist_project ON checklist_items(project_id);

-- ─── Coffre d'accès (secrets chiffrés AES-GCM) ───
CREATE TABLE IF NOT EXISTS vault_entries (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL REFERENCES client_projects(id) ON DELETE CASCADE,
  label      TEXT NOT NULL,
  url        TEXT,
  login      TEXT,
  secret_enc TEXT,
  note       TEXT,
  created_by TEXT DEFAULT 'client',  -- client | admin
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_vault_project ON vault_entries(project_id);

-- ─── Messagerie ───
CREATE TABLE IF NOT EXISTS messages (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id        INTEGER NOT NULL REFERENCES client_projects(id) ON DELETE CASCADE,
  author            TEXT NOT NULL,       -- client | admin | system
  kind              TEXT DEFAULT 'text', -- text | voice | update | file
  body              TEXT,
  file_id           INTEGER,
  read_by_client_at TEXT,
  read_by_admin_at  TEXT,
  created_at        TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_messages_project ON messages(project_id);

-- ─── Retours, demandes de modification, support ───
CREATE TABLE IF NOT EXISTS project_requests (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id     INTEGER NOT NULL REFERENCES client_projects(id) ON DELETE CASCADE,
  kind           TEXT DEFAULT 'retour',  -- retour | support | hors_perimetre
  comment        TEXT NOT NULL,
  page_url       TEXT,
  pos_x          REAL,
  pos_y          REAL,
  selector       TEXT,
  viewport       TEXT,
  device         TEXT,
  screenshot_key TEXT,
  round          INTEGER,
  status         TEXT DEFAULT 'nouveau', -- nouveau | en_cours | fait | refuse | devis
  admin_reply    TEXT,
  invoice_id     INTEGER,
  created_at     TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at     TEXT
);
CREATE INDEX IF NOT EXISTS idx_project_requests_project ON project_requests(project_id);

-- ─── Devis / factures ───
CREATE TABLE IF NOT EXISTS invoices (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id          INTEGER NOT NULL REFERENCES client_projects(id) ON DELETE CASCADE,
  kind                TEXT DEFAULT 'facture',  -- devis | facture
  number              TEXT UNIQUE,
  title               TEXT NOT NULL,
  items               TEXT,                    -- JSON [{label, qty, unit}]
  amount              INTEGER NOT NULL,
  currency            TEXT DEFAULT 'XAF',
  status              TEXT DEFAULT 'brouillon', -- brouillon | envoye | accepte | refuse | paye | annule
  due_date            TEXT,
  notes               TEXT,
  sent_at             TEXT,
  accepted_at         TEXT,
  paid_at             TEXT,
  payment_external_id TEXT,
  created_at          TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at          TEXT
);
CREATE INDEX IF NOT EXISTS idx_invoices_project ON invoices(project_id);

-- ─── Journal d'activité (preuve + fil "Quoi de neuf") ───
CREATE TABLE IF NOT EXISTS activity_log (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER,
  client_id  INTEGER,
  actor      TEXT NOT NULL,        -- client | admin | system
  action     TEXT NOT NULL,
  detail     TEXT,
  visible    INTEGER DEFAULT 1,    -- affiché dans le fil du client
  ip         TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_activity_project ON activity_log(project_id);
CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_log(created_at);

-- ─── Avis clients ───
CREATE TABLE IF NOT EXISTS client_reviews (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id     INTEGER NOT NULL REFERENCES client_projects(id) ON DELETE CASCADE,
  client_id      INTEGER NOT NULL,
  rating         INTEGER,
  text           TEXT,
  allow_publish  INTEGER DEFAULT 0,
  testimonial_id INTEGER,
  created_at     TEXT DEFAULT CURRENT_TIMESTAMP
);

-- ─── Questionnaires clients (db/migrate-questionnaires.sql) ───
CREATE TABLE IF NOT EXISTS questionnaires (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  token        TEXT UNIQUE NOT NULL,      -- lien secret /q/<token>
  title        TEXT NOT NULL,
  client_id    INTEGER,                   -- facultatif : rattache au portail du client
  project_id   INTEGER,
  definition   TEXT NOT NULL,             -- JSON : sections et champs (voir src/lib/questionnaires.ts)
  status       TEXT DEFAULT 'sent',       -- sent | in_progress | submitted | closed
  locale       TEXT DEFAULT 'fr',
  created_at   TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at   TEXT,
  opened_at    TEXT,
  submitted_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_questionnaires_client ON questionnaires(client_id);

-- Une seule réponse par questionnaire (le client la complète en plusieurs fois).
CREATE TABLE IF NOT EXISTS questionnaire_responses (
  questionnaire_id INTEGER PRIMARY KEY REFERENCES questionnaires(id) ON DELETE CASCADE,
  answers          TEXT,               -- JSON { idDuChamp: valeur }
  filled           INTEGER DEFAULT 0,  -- nombre de champs remplis
  total            INTEGER DEFAULT 0,
  updated_at       TEXT,
  submitted_at     TEXT,
  ip               TEXT
);
