/* ------------------------------------------------------------------
   Suivi d'audience anonyme (page /livre).

   - POST /api/t        : collecte (publique). Reçoit un lot d'évènements
                          envoyé par public/livre/stats.js (sendBeacon).
   - GET /api/admin/analytics : agrégats pour la rubrique « Audience »
                          du dashboard (protégé par requireAdmin).

   Vie privée : aucun cookie, aucune IP ni identifiant durable stocké.
   - sid : identifiant de visite aléatoire, généré dans la page (mémoire
           seulement, perdu à la fermeture de l'onglet).
   - vid : empreinte du visiteur POUR UNE JOURNÉE = SHA-256(sel + date +
           IP + navigateur), tronquée. Non réversible, change chaque jour.
   Les robots sont ignorés. Table : page_events (db/migrate-analytics.sql).
------------------------------------------------------------------- */
import { Hono } from "hono";
import { requireAdmin } from "../lib/auth";

const PAGES = new Set(["livre"]);
const EVENTS = new Set(["view", "scroll", "section", "cta", "checkout", "wa", "ba", "ba_tab", "faq", "zoom", "leave"]);
const BOT = /bot|crawl|spider|slurp|facebookexternalhit|meta-external|headless|lighthouse|pagespeed|preview|curl|wget|python|httpclient|axios|node-fetch|go-http|java\//i;
const DOUALA_OFFSET_MS = 3600_000; // UTC+1

const clean = (s: unknown, n = 40) =>
  String(s ?? "").toLowerCase().replace(/[^a-z0-9:_.\- ]/g, "").trim().slice(0, n);

function sourceOf(ctx: any): string {
  const us = clean(ctx?.us, 30);
  if (us) {
    if (["fb", "facebook", "meta", "facebook.com"].includes(us)) return "facebook";
    if (["ig", "instagram"].includes(us)) return "instagram";
    return us;
  }
  if (ctx?.fb) return "facebook";
  const r = clean(ctx?.r, 80);
  if (!r) return "direct";
  if (/facebook|(^|\.)fb\.(com|me)$/.test(r)) return "facebook";
  if (r.includes("instagram")) return "instagram";
  if (/whatsapp|(^|\.)wa\.me$/.test(r)) return "whatsapp";
  if (r.includes("google")) return "google";
  if (r.includes("tiktok")) return "tiktok";
  if (/youtube|youtu\.be/.test(r)) return "youtube";
  if (/(^|\.)t\.co$|twitter|(^|\.)x\.com$/.test(r)) return "x";
  if (r.includes("impacttech237")) return "interne";
  return "autre";
}

async function sha256Hex(text: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/* ======================= Collecte publique ======================= */
export const collectApi = new Hono<{ Bindings: any }>();

collectApi.post("/", async (c) => {
  const done = () => new Response(null, { status: 204, headers: { "cache-control": "no-store" } });
  try {
    const db = c.env?.DB;
    if (!db) return done();

    const origin = c.req.header("origin");
    const localDev = /^localhost(:\d+)?$/.test(c.req.header("host") || ""); // tests en local (wrangler dev)
    if (origin && !localDev && !/^https:\/\/(www\.)?impacttech237\.com$/.test(origin)) return done();

    const ua = c.req.header("user-agent") || "";
    if (!ua || BOT.test(ua)) return done();

    const raw = await c.req.text();
    if (raw.length > 6000) return done();
    const b = JSON.parse(raw);

    const page = clean(b?.p, 12);
    if (!PAGES.has(page)) return done();
    const sid = String(b?.s || "");
    if (!/^[a-z0-9]{8,24}$/.test(sid)) return done();
    const events = Array.isArray(b?.e) ? b.e.slice(0, 30) : [];
    if (!events.length) return done();

    const now = Date.now();
    const day = new Date(now + DOUALA_OFFSET_MS).toISOString().slice(0, 10);
    const sent = Number.isFinite(+b?.n) ? Math.min(Math.max(+b.n, 0), 6 * 3600_000) : 0; // ms écoulées depuis le chargement
    const ctx = b?.c || {};
    const src = sourceOf(ctx);
    const camp = clean(ctx?.uc, 40) || null;
    const ad = clean(ctx?.ut, 40) || null;
    const device = /ipad|tablet/i.test(ua) ? "tablet" : /mobi|android|iphone/i.test(ua) ? "mobile" : "desktop";
    const country = ((c.req.raw as any).cf?.country as string) || null;
    const ip = c.req.header("cf-connecting-ip") || "";
    const salt = c.env?.AUTH_SECRET || "impact-tech-dev-secret";
    const vid = (await sha256Hex(`audience::${salt}::${day}::${ip}::${ua}`)).slice(0, 16);

    const insert = db.prepare(
      "INSERT INTO page_events (ts,day,page,sid,vid,event,label,value,src,camp,ad,device,country) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)"
    );
    const stmts = [];
    for (const e of events) {
      const name = clean(e?.n, 12);
      if (!EVENTS.has(name)) continue;
      const t = Number.isFinite(+e?.t) ? Math.min(Math.max(+e.t, 0), 6 * 3600_000) : sent;
      const ts = now - Math.max(sent - t, 0);
      const label = clean(e?.l, 40) || null;
      const v = e?.v != null && Number.isFinite(+e.v) ? Math.min(Math.max(Math.round(+e.v), 0), 86400) : null;
      stmts.push(insert.bind(ts, day, page, sid, vid, name, label, v, src, camp, ad, device, country));
    }
    if (stmts.length) await db.batch(stmts);
  } catch {
    /* un suivi ne doit jamais gêner la page : on ignore silencieusement */
  }
  return done();
});

/* ======================= Lecture admin ======================= */
export const adminAnalyticsApi = new Hono<{ Bindings: any }>();

const dayAdd = (iso: string, n: number) => {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

/* Une ligne par visite (sid), avec des indicateurs 0/1 par étape. */
const SESSIONS = `
  SELECT sid,
    MIN(day) AS day, MAX(vid) AS vid, MAX(src) AS src, MAX(camp) AS camp, MAX(ad) AS ad,
    MAX(device) AS device, MAX(country) AS country,
    MAX(CASE WHEN event='view' THEN 1 ELSE 0 END) AS v,
    MAX(CASE WHEN event='scroll' AND value>=25 THEN 1 ELSE 0 END) AS sc25,
    MAX(CASE WHEN event='scroll' AND value>=50 THEN 1 ELSE 0 END) AS sc50,
    MAX(CASE WHEN event='scroll' AND value>=75 THEN 1 ELSE 0 END) AS sc75,
    MAX(CASE WHEN event='scroll' AND value>=100 THEN 1 ELSE 0 END) AS sc100,
    MAX(CASE WHEN event='cta' THEN 1 ELSE 0 END) AS cta,
    MAX(CASE WHEN event='checkout' THEN 1 ELSE 0 END) AS chk,
    MAX(CASE WHEN event='wa' THEN 1 ELSE 0 END) AS wa,
    MAX(CASE WHEN event IN ('ba','ba_tab') THEN 1 ELSE 0 END) AS ba,
    MAX(CASE WHEN event='faq' THEN 1 ELSE 0 END) AS faq,
    MAX(CASE WHEN event='zoom' THEN 1 ELSE 0 END) AS zoom,
    MAX(CASE WHEN event='leave' THEN value END) AS secs
  FROM page_events WHERE page=? AND day BETWEEN ? AND ?
  GROUP BY sid`;

adminAnalyticsApi.get("/", async (c) => {
  const denied = await requireAdmin(c);
  if (denied) return denied;
  const db = c.env?.DB;
  if (!db) return c.json({ ok: false, error: "Base de données indisponible." }, 503);

  const page = clean(c.req.query("page") || "livre", 12);
  const days = Math.min(Math.max(parseInt(c.req.query("days") || "14", 10) || 14, 1), 180);
  const today = new Date(Date.now() + DOUALA_OFFSET_MS).toISOString().slice(0, 10);
  const from = dayAdd(today, -(days - 1));
  const prevTo = dayAdd(from, -1);
  const prevFrom = dayAdd(prevTo, -(days - 1));

  const totalsSql = `
    WITH s AS (${SESSIONS})
    SELECT COUNT(*) AS visits, COUNT(DISTINCT day||vid) AS visitors,
      SUM(sc25) AS sc25, SUM(sc50) AS sc50, SUM(sc75) AS sc75, SUM(sc100) AS sc100,
      SUM(cta) AS cta, SUM(chk) AS chk, SUM(wa) AS wa, SUM(ba) AS ba, SUM(faq) AS faq, SUM(zoom) AS zoom,
      AVG(secs) AS avg_secs,
      SUM(CASE WHEN secs IS NOT NULL AND secs<10 THEN 1 ELSE 0 END) AS t_lt10,
      SUM(CASE WHEN secs>=10 AND secs<30 THEN 1 ELSE 0 END) AS t_10_30,
      SUM(CASE WHEN secs>=30 AND secs<60 THEN 1 ELSE 0 END) AS t_30_60,
      SUM(CASE WHEN secs>=60 AND secs<180 THEN 1 ELSE 0 END) AS t_1_3,
      SUM(CASE WHEN secs>=180 THEN 1 ELSE 0 END) AS t_gt3,
      SUM(CASE WHEN secs IS NULL THEN 1 ELSE 0 END) AS t_unknown
    FROM s WHERE v=1`;

  const segSql = (col: string, limit: number) => `
    WITH s AS (${SESSIONS})
    SELECT COALESCE(${col},'inconnu') AS k, COUNT(*) AS visits, SUM(sc50) AS sc50, SUM(cta) AS cta, SUM(chk) AS chk, AVG(secs) AS avg_secs
    FROM s WHERE v=1 GROUP BY k ORDER BY visits DESC LIMIT ${limit}`;

  const A = [page, from, today];
  const B = [page, prevFrom, prevTo];

  const res = await db.batch([
    db.prepare(totalsSql).bind(...A),                                   // 0 totaux période
    db.prepare(totalsSql).bind(...B),                                   // 1 totaux période précédente
    db.prepare(`WITH s AS (${SESSIONS}) SELECT day, COUNT(*) AS visits, SUM(cta) AS cta, SUM(chk) AS chk FROM s WHERE v=1 GROUP BY day ORDER BY day`).bind(...A), // 2 par jour
    db.prepare(segSql("src", 10)).bind(...A),                           // 3 sources
    db.prepare(segSql("device", 5)).bind(...A),                         // 4 appareils
    db.prepare(segSql("country", 8)).bind(...A),                        // 5 pays
    db.prepare(`WITH s AS (${SESSIONS}) SELECT COALESCE(camp,'(aucune)') AS camp, COALESCE(ad,'') AS ad, COUNT(*) AS visits, SUM(sc50) AS sc50, SUM(cta) AS cta, SUM(chk) AS chk, AVG(secs) AS avg_secs FROM s WHERE v=1 AND (camp IS NOT NULL OR ad IS NOT NULL) GROUP BY camp, ad ORDER BY visits DESC LIMIT 15`).bind(...A), // 6 campagnes/pubs
    db.prepare(`SELECT label, COUNT(*) AS clicks, COUNT(DISTINCT sid) AS sessions FROM page_events WHERE page=? AND day BETWEEN ? AND ? AND event='cta' GROUP BY label ORDER BY label`).bind(...A), // 7 boutons cliqués
    db.prepare(`SELECT label, COUNT(DISTINCT sid) AS sessions FROM page_events WHERE page=? AND day BETWEEN ? AND ? AND event='checkout' GROUP BY label`).bind(...A), // 8 paiements ouverts par bouton
    db.prepare(`SELECT label, COUNT(DISTINCT sid) AS sessions FROM page_events WHERE page=? AND day BETWEEN ? AND ? AND event='section' GROUP BY label ORDER BY label`).bind(...A), // 9 sections vues
    db.prepare(`SELECT deepest AS label, COUNT(*) AS sessions FROM (SELECT sid, MAX(label) AS deepest FROM page_events WHERE page=? AND day BETWEEN ? AND ? AND event='section' GROUP BY sid) GROUP BY deepest ORDER BY deepest`).bind(...A), // 10 section la plus profonde
    db.prepare(`SELECT event, label, COUNT(DISTINCT sid) AS sessions, COUNT(*) AS actions FROM page_events WHERE page=? AND day BETWEEN ? AND ? AND event IN ('ba_tab','ba','faq','zoom','wa') GROUP BY event, label ORDER BY sessions DESC LIMIT 40`).bind(...A), // 11 engagement
    db.prepare(`SELECT strftime('%H', (ts/1000)+3600, 'unixepoch') AS h, COUNT(DISTINCT sid) AS visits FROM page_events WHERE page=? AND day BETWEEN ? AND ? AND event='view' GROUP BY h ORDER BY h`).bind(...A), // 12 heures
  ]);
  const rows = (i: number) => (res[i].results || []) as any[];
  const num = (o: any) => Object.fromEntries(Object.entries(o || {}).map(([k, v]) => [k, typeof v === "number" ? v : v ?? 0]));

  // Série quotidienne complète (jours sans visite = 0).
  const byDay = new Map(rows(2).map((r) => [r.day, r]));
  const daily = [];
  for (let i = 0; i < days; i++) {
    const d = dayAdd(from, i);
    const r = byDay.get(d);
    daily.push({ day: d, visits: r?.visits || 0, cta: r?.cta || 0, chk: r?.chk || 0 });
  }

  // Visites par heure de Douala (0-23).
  const hourMap = new Map(rows(12).map((r) => [parseInt(r.h, 10), r.visits]));
  const hours = Array.from({ length: 24 }, (_, h) => ({ h, visits: hourMap.get(h) || 0 }));

  return c.json({
    ok: true,
    page, days, from, to: today,
    totals: num(rows(0)[0]),
    previous: num(rows(1)[0]),
    daily,
    sources: rows(3).map(num),
    devices: rows(4).map(num),
    countries: rows(5).map(num),
    campaigns: rows(6).map(num),
    buttons: rows(7).map(num),
    checkouts: rows(8).map(num),
    sections: rows(9).map(num),
    deepest: rows(10).map(num),
    engagement: rows(11).map(num),
    hours,
  });
});
