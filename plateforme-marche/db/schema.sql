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
