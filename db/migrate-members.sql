-- ------------------------------------------------------------------
-- Portail client : membres (collaborateurs d'un client).
-- Un membre se connecte sur le même lien /espace/<slug> avec SON numéro
-- WhatsApp ou SON email, reçoit son propre code, et ses actions portent
-- son nom. Droits : signer/valider, payer, voir le coffre d'accès.
-- Appliquer : npx wrangler d1 execute impact-tech-db --remote --file=db/migrate-members.sql
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS client_members (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id     INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  role          TEXT,                 -- ex : Assistante, Graphiste
  email         TEXT,
  phone         TEXT,
  can_decide    INTEGER DEFAULT 0,    -- signer, valider une étape, répondre à un devis
  can_pay       INTEGER DEFAULT 0,    -- payer les factures
  can_vault     INTEGER DEFAULT 0,    -- voir / ajouter des accès dans le coffre
  active        INTEGER DEFAULT 1,
  auth_code     TEXT,
  auth_code_exp TEXT,
  auth_attempts INTEGER DEFAULT 0,
  code_sent_at  TEXT,
  last_seen_at  TEXT,
  onboarded_at  TEXT,                 -- visite guidée vue
  created_at    TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_client_members_client ON client_members(client_id);

-- Qui a fait quoi (nom affiché ; NULL = le client principal ou l'équipe).
ALTER TABLE activity_log ADD COLUMN actor_name TEXT;
ALTER TABLE messages ADD COLUMN author_name TEXT;
ALTER TABLE client_files ADD COLUMN uploaded_by_name TEXT;

-- Nom de la personne qui a signé (un membre autorisé ; NULL = le client principal).
ALTER TABLE signatures ADD COLUMN signer_name TEXT;
