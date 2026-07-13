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
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  tag        TEXT,
  title      TEXT,
  price      TEXT,
  is_quote   INTEGER DEFAULT 0,
  popular    INTEGER DEFAULT 0,
  features   TEXT,
  image      TEXT,
  sort_order INTEGER DEFAULT 0,
  active     INTEGER DEFAULT 1
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
  active     INTEGER DEFAULT 1
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
