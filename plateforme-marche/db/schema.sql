-- Audience anonyme : aucun cookie, aucune adresse IP, aucun identifiant durable.
-- vid = identifiant aléatoire valable pour un onglet (sessionStorage), il disparaît à la fermeture.
CREATE TABLE IF NOT EXISTS marche_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts INTEGER NOT NULL,          -- millisecondes
  vid TEXT,                     -- visite anonyme
  type TEXT NOT NULL,           -- pv | dur | search | act | pdf | out | cite
  page TEXT,                    -- ex. texte/rbv-25, quiz, decouvrir/institutions
  a TEXT,                       -- détail : recherche, jeu, texte du PDF, domaine sortant…
  n INTEGER,                    -- nombre : durée en s, résultats, score…
  ref TEXT,                     -- domaine d'origine (première page de la visite)
  utm TEXT,                     -- utm_source|utm_campaign|utm_content
  country TEXT,
  device TEXT                   -- mobile | desktop | tablette
);
CREATE INDEX IF NOT EXISTS marche_ev_ts ON marche_events(ts);
CREATE INDEX IF NOT EXISTS marche_ev_type_ts ON marche_events(type, ts);

-- Comptes facultatifs (e-mail + mot de passe, ou Google) et progression synchronisée.
CREATE TABLE IF NOT EXISTS marche_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  pwd_hash TEXT,                -- PBKDF2-SHA256, absent pour un compte Google seul
  salt TEXT,
  google_sub TEXT UNIQUE,
  recovery_hash TEXT,           -- empreinte du code de récupération (affiché une seule fois)
  recovery_salt TEXT,
  fails INTEGER DEFAULT 0,
  locked_until INTEGER DEFAULT 0,
  created_at INTEGER
);
CREATE TABLE IF NOT EXISTS marche_sessions (
  th TEXT PRIMARY KEY,          -- empreinte du jeton de session (le jeton n'est jamais stocké)
  user_id INTEGER NOT NULL,
  exp INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS marche_sess_user ON marche_sessions(user_id);
CREATE TABLE IF NOT EXISTS marche_sync (
  user_id INTEGER PRIMARY KEY,
  data TEXT NOT NULL,
  updated INTEGER NOT NULL
);
