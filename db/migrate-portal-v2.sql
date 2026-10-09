-- Migration : Portail client v2 (voir tasks/plan.md)
-- Uniquement additive : nouvelles colonnes + nouvelles tables, aucune donnée modifiée.
--   wrangler d1 execute impact-tech-db --remote --file=db/migrate-portal-v2.sql

-- ─── Clients ───
ALTER TABLE clients ADD COLUMN slug TEXT;             -- /espace/<slug>
ALTER TABLE clients ADD COLUMN locale TEXT DEFAULT 'fr';
ALTER TABLE clients ADD COLUMN auth_attempts INTEGER DEFAULT 0;
ALTER TABLE clients ADD COLUMN code_sent_at TEXT;
ALTER TABLE clients ADD COLUMN onboarded_at TEXT;
ALTER TABLE clients ADD COLUMN last_seen_at TEXT;
ALTER TABLE clients ADD COLUMN referral_code TEXT;
ALTER TABLE clients ADD COLUMN internal_notes TEXT;
ALTER TABLE clients ADD COLUMN source_request_id INTEGER;
CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_slug ON clients(slug);
CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_referral ON clients(referral_code);

-- ─── Projets ───
ALTER TABLE client_projects ADD COLUMN pack TEXT;
ALTER TABLE client_projects ADD COLUMN preview_url TEXT;      -- site en développement
ALTER TABLE client_projects ADD COLUMN site_url TEXT;         -- site en ligne (après livraison)
ALTER TABLE client_projects ADD COLUMN admin_url TEXT;        -- back-office du site livré
ALTER TABLE client_projects ADD COLUMN amount INTEGER;
ALTER TABLE client_projects ADD COLUMN currency TEXT DEFAULT 'XAF';
ALTER TABLE client_projects ADD COLUMN revision_rounds INTEGER;        -- séries de modifs incluses (NULL = non défini)
ALTER TABLE client_projects ADD COLUMN revision_used INTEGER DEFAULT 0;
ALTER TABLE client_projects ADD COLUMN support_days INTEGER;
ALTER TABLE client_projects ADD COLUMN delivered_at TEXT;
ALTER TABLE client_projects ADD COLUMN support_until TEXT;
ALTER TABLE client_projects ADD COLUMN hosting_renewal_at TEXT;
ALTER TABLE client_projects ADD COLUMN domain_renewal_at TEXT;
ALTER TABLE client_projects ADD COLUMN renewal_amount INTEGER;
ALTER TABLE client_projects ADD COLUMN handover_notes TEXT;   -- kit de livraison (texte libre)
ALTER TABLE client_projects ADD COLUMN handover_links TEXT;   -- JSON [{title,url}] tutoriels, guides
ALTER TABLE client_projects ADD COLUMN internal_notes TEXT;
ALTER TABLE client_projects ADD COLUMN feedback_key TEXT;     -- clé publique du widget de retours
ALTER TABLE client_projects ADD COLUMN weekly_update TEXT;    -- "Point de la semaine" courant
ALTER TABLE client_projects ADD COLUMN weekly_update_at TEXT;
ALTER TABLE client_projects ADD COLUMN health_status INTEGER; -- code HTTP du dernier contrôle
ALTER TABLE client_projects ADD COLUMN health_ms INTEGER;
ALTER TABLE client_projects ADD COLUMN health_checked_at TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_client_projects_feedback_key ON client_projects(feedback_key);

-- ─── Documents & contrats ───
ALTER TABLE client_documents ADD COLUMN file_key TEXT;        -- fichier d'origine uploadé (PDF/Word/image)
ALTER TABLE client_documents ADD COLUMN file_name TEXT;
ALTER TABLE client_documents ADD COLUMN file_mime TEXT;
ALTER TABLE client_documents ADD COLUMN file_sha256 TEXT;
ALTER TABLE client_documents ADD COLUMN needs_signature INTEGER DEFAULT 0;
ALTER TABLE client_documents ADD COLUMN sent_at TEXT;
ALTER TABLE client_documents ADD COLUMN admin_signed_at TEXT;
ALTER TABLE client_documents ADD COLUMN admin_signature_key TEXT;

ALTER TABLE contract_templates ADD COLUMN pack TEXT;          -- pack auquel le modèle est rattaché
ALTER TABLE contract_templates ADD COLUMN file_key TEXT;      -- modèle fourni sous forme de fichier
ALTER TABLE contract_templates ADD COLUMN file_name TEXT;
ALTER TABLE contract_templates ADD COLUMN file_mime TEXT;

ALTER TABLE signatures ADD COLUMN document_sha256 TEXT;

-- ─── Fichiers ───
ALTER TABLE client_files ADD COLUMN category TEXT DEFAULT 'autre';
ALTER TABLE client_files ADD COLUMN checklist_item_id INTEGER;
ALTER TABLE client_files ADD COLUMN message_id INTEGER;

-- ─── Demandes de devis -> clients ───
ALTER TABLE contact_requests ADD COLUMN referral_code TEXT;
ALTER TABLE contact_requests ADD COLUMN converted_client_id INTEGER;

-- ─── Paiements liés aux factures ───
ALTER TABLE payments ADD COLUMN invoice_id INTEGER;

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
