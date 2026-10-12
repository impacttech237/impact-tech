-- Migration : questionnaires sur mesure envoyés aux clients après l'appel
-- découverte (lien /q/<token>, sauvegarde automatique, export PDF).
--   wrangler d1 execute impact-tech-db --remote --file=db/migrate-questionnaires.sql

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
