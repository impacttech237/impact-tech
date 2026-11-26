// Worker : collecte d'audience anonyme (POST /api/t) et statistiques pour l'administration (GET /api/admin/stats).
// Les pages statiques sont servies par la plateforme d'assets ; ce code ne reçoit que /api/*.
import { gererAuth } from './auth.js';

const TYPES = new Set(['pv', 'dur', 'search', 'act', 'pdf', 'out', 'cite']);
const BOT = /bot|crawl|spider|slurp|headless|lighthouse|preview|facebookexternalhit|whatsapp|curl|wget/i;
const nettoie = (s, n = 80) => (typeof s === 'string' ? s.slice(0, n).replace(/[\u0000-\u001f]/g, '') : null);
const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
const appareil = ua => /ipad|tablet/i.test(ua) ? 'tablette' : /mobi|android|iphone/i.test(ua) ? 'mobile' : 'desktop';

const SQL = 'INSERT INTO marche_events (ts, vid, type, page, a, n, ref, utm, country, device) VALUES (?,?,?,?,?,?,?,?,?,?)';
// Un évènement valide -> valeurs à insérer, sinon null
function ligne(corps, vid, pays, dev) {
  if (!corps || !TYPES.has(corps.type)) return null;
  let a = nettoie(corps.a, 100);
  if (corps.type === 'search' && a) a = a.toLowerCase().replace(/[\w.+-]+@[\w.-]+/g, '').replace(/\d{6,}/g, '').trim();
  const page = nettoie(corps.page, 80);
  if (page && !/^[a-z0-9/_-]*$/i.test(page)) return null;
  const n = Number.isFinite(corps.n) ? Math.max(0, Math.min(1e6, Math.round(corps.n))) : null;
  const utm = [corps.us, corps.uc, corps.ut].map(x => nettoie(x, 40) || '').join('|');
  return [Date.now(), vid, corps.type, page, a, n, nettoie(corps.ref, 60), utm === '||' ? null : utm, pays, dev];
}

// Les évènements arrivent groupés (jusqu'à 20) : une seule requête D1 par groupe, répondue sans attendre l'écriture.
async function collecter(req, env, ctx) {
  const ua = req.headers.get('user-agent') || '';
  if (BOT.test(ua)) return new Response(null, { status: 204 });
  let corps;
  try { const txt = await req.text(); if (txt.length > 8192) return new Response(null, { status: 413 }); corps = JSON.parse(txt); } catch { return new Response(null, { status: 400 }); }
  const vid = nettoie(corps.vid, 16), pays = req.cf?.country || null, dev = appareil(ua);
  const liste = Array.isArray(corps.evs) ? corps.evs.slice(0, 20).map(e => ({ ...e })) : [corps];
  const lignes = liste.map(e => ligne(e, vid, pays, dev)).filter(Boolean);
  if (!lignes.length) return new Response(null, { status: 400 });
  const ecrire = async () => {
    try {
      await env.DB.batch(lignes.map(l => env.DB.prepare(SQL).bind(...l)));
      if (Math.random() < 0.01) await env.DB.prepare('DELETE FROM marche_events WHERE ts < ?').bind(Date.now() - 200 * 864e5).run(); // conservation 200 jours
    } catch { /* l'audience ne doit jamais gêner les visiteurs */ }
  };
  if (ctx?.waitUntil) ctx.waitUntil(ecrire()); else await ecrire();
  return new Response(null, { status: 204 });
}

const egal = (a, b) => { if (!a || !b || a.length !== b.length) return false; let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i); return r === 0; };

async function statistiques(req, env, url) {
  if (!env.ADMIN_TOKEN || !egal(req.headers.get('x-admin') || '', env.ADMIN_TOKEN)) return json({ erreur: 'non autorisé' }, 401);
  const jours = Math.min(180, Math.max(1, Number(url.searchParams.get('jours')) || 30)), depuis = Date.now() - jours * 864e5;
  const q = sql => env.DB.prepare(sql).bind(depuis).all().then(r => r.results);
  const [tot, quotidien, pages, recherches, actions, sources, pays, appareils, duree, heures, sortants] = await Promise.all([
    q("SELECT COUNT(*) pv, COUNT(DISTINCT vid) visites FROM marche_events WHERE type='pv' AND ts>=?"),
    q("SELECT date(ts/1000,'unixepoch') d, COUNT(*) pv, COUNT(DISTINCT vid) visites FROM marche_events WHERE type='pv' AND ts>=? GROUP BY d ORDER BY d"),
    q("SELECT page, COUNT(*) n, COUNT(DISTINCT vid) visites FROM marche_events WHERE type='pv' AND ts>=? GROUP BY page ORDER BY n DESC LIMIT 20"),
    q("SELECT a, COUNT(*) n, ROUND(AVG(n),1) resultats FROM marche_events WHERE type='search' AND ts>=? AND a<>'' GROUP BY a ORDER BY n DESC LIMIT 25"),
    q("SELECT type, a, COUNT(*) n FROM marche_events WHERE type IN ('act','pdf','cite') AND ts>=? GROUP BY type, a ORDER BY n DESC LIMIT 40"),
    q("SELECT COALESCE(NULLIF(ref,''),'direct') ref, COUNT(DISTINCT vid) visites FROM marche_events WHERE type='pv' AND ts>=? GROUP BY 1 ORDER BY visites DESC LIMIT 15"),
    q("SELECT COALESCE(country,'?') pays, COUNT(DISTINCT vid) visites FROM marche_events WHERE type='pv' AND ts>=? GROUP BY 1 ORDER BY visites DESC LIMIT 15"),
    q("SELECT device, COUNT(DISTINCT vid) visites FROM marche_events WHERE type='pv' AND ts>=? GROUP BY device"),
    q("SELECT ROUND(AVG(n)) moyenne, COUNT(*) mesures FROM marche_events WHERE type='dur' AND ts>=? AND n BETWEEN 1 AND 1800"),
    q("SELECT CAST(strftime('%H', ts/1000 + 3600, 'unixepoch') AS INTEGER) h, COUNT(*) n FROM marche_events WHERE type='pv' AND ts>=? GROUP BY h ORDER BY h"),
    q("SELECT a, COUNT(*) n FROM marche_events WHERE type='out' AND ts>=? GROUP BY a ORDER BY n DESC LIMIT 10"),
  ]);
  return json({ jours, totaux: tot[0], quotidien, pages, recherches, actions, sources, pays, appareils, duree: duree[0], heures, sortants });
}

export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url);
    if (url.pathname === '/api/t' && req.method === 'POST') return collecter(req, env, ctx);
    if (url.pathname === '/api/admin/stats' && req.method === 'GET') return statistiques(req, env, url);
    if (url.pathname.startsWith('/api/auth/') || url.pathname === '/api/sync') return gererAuth(req, env, url);
    return new Response('Introuvable', { status: 404 });
  },
};
