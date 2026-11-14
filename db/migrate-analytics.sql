-- Suivi d'audience anonyme (page /livre) : un événement = une ligne.
-- Aucune donnée personnelle : ni IP, ni cookie, ni identifiant durable.
--   sid = identifiant de visite (aléatoire, généré dans la page, jamais stocké côté navigateur)
--   vid = empreinte anonyme du visiteur POUR UNE JOURNÉE (hash salé avec la date, non réversible)
-- Appliquer : npx wrangler d1 execute impact-tech-db --remote --file=db/migrate-analytics.sql
CREATE TABLE IF NOT EXISTS page_events (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  ts      INTEGER NOT NULL,          -- epoch ms
  day     TEXT    NOT NULL,          -- YYYY-MM-DD (heure de Douala, UTC+1)
  page    TEXT    NOT NULL,          -- 'livre'
  sid     TEXT    NOT NULL,
  vid     TEXT    NOT NULL,
  event   TEXT    NOT NULL,          -- view | scroll | section | cta | checkout | wa | ba | ba_tab | faq | zoom | leave
  label   TEXT,                      -- détail : section, position du bouton, onglet, question...
  value   INTEGER,                   -- scroll en %, secondes engagées...
  src     TEXT,                      -- facebook | instagram | whatsapp | google | direct | interne | autre
  camp    TEXT,                      -- utm_campaign
  ad      TEXT,                      -- utm_content (nom de la pub)
  device  TEXT,                      -- mobile | tablet | desktop
  country TEXT                       -- code pays (Cloudflare)
);
CREATE INDEX IF NOT EXISTS idx_pe_page_day ON page_events (page, day, event);
CREATE INDEX IF NOT EXISTS idx_pe_sid ON page_events (sid);
