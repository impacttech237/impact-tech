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
  active     INTEGER DEFAULT 1
);

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
  active      INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS testimonials (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT,
  role       TEXT,
  text       TEXT,
  initials   TEXT,
  sort_order INTEGER DEFAULT 0,
  active     INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS faqs (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  question   TEXT,
  answer     TEXT,
  sort_order INTEGER DEFAULT 0,
  active     INTEGER DEFAULT 1
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
  active      INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS process_steps (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  num         TEXT,
  title       TEXT,
  description TEXT,
  sort_order  INTEGER DEFAULT 0,
  active      INTEGER DEFAULT 1
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
  created_at   TEXT DEFAULT CURRENT_TIMESTAMP
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
  created_at    TEXT DEFAULT CURRENT_TIMESTAMP
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
  updated_at  TEXT
);

CREATE TABLE IF NOT EXISTS contract_templates (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  title      TEXT NOT NULL,
  content    TEXT NOT NULL,
  variables  TEXT,
  active     INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT
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
  updated_at  TEXT
);

CREATE TABLE IF NOT EXISTS signatures (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  document_id   INTEGER NOT NULL REFERENCES client_documents(id) ON DELETE CASCADE,
  client_id     INTEGER NOT NULL REFERENCES clients(id),
  approval_text TEXT NOT NULL DEFAULT 'Lu et approuvé',
  signature_r2  TEXT NOT NULL,
  ip_address    TEXT,
  user_agent    TEXT,
  signed_at     TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS client_files (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id  INTEGER NOT NULL REFERENCES client_projects(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  r2_key      TEXT NOT NULL,
  size        INTEGER,
  mime_type   TEXT,
  uploaded_by TEXT DEFAULT 'admin',
  created_at  TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_clients_access_token ON clients(access_token);
CREATE INDEX IF NOT EXISTS idx_client_projects_client ON client_projects(client_id);
CREATE INDEX IF NOT EXISTS idx_client_documents_project ON client_documents(project_id);
CREATE INDEX IF NOT EXISTS idx_signatures_document ON signatures(document_id);
CREATE INDEX IF NOT EXISTS idx_client_files_project ON client_files(project_id);

-- Paiements K-PAY (Mobile Money — bouton "Payer maintenant" des offres).
-- Voir .claude/skills/kpay-payments/SKILL.md pour l'architecture complète.
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
  updated_at     TEXT
);
