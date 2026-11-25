// Comptes facultatifs : e-mail + mot de passe (ou Google), session par cookie HttpOnly, progression synchronisée.
// Mots de passe : PBKDF2-SHA256 (WebCrypto). Aucun mot de passe en clair, aucune session durable côté client en dehors du cookie.
const enc = new TextEncoder();
const b64u = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const alea = n => b64u(crypto.getRandomValues(new Uint8Array(n)));
const sha = async s => b64u(await crypto.subtle.digest('SHA-256', enc.encode(s)));
const ITER = 100000, SESSION_JOURS = 60, MAX_ECHECS = 8, VERROU_MIN = 15, MAX_SYNC = 512 * 1024;
const COOKIE = 'mf_s';
const reponse = (o, status = 200, extra = {}) => new Response(JSON.stringify(o), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...extra } });
const erreur = (msg, status = 400) => reponse({ erreur: msg }, status);

async function pbkdf2(mdp, sel) {
  const k = await crypto.subtle.importKey('raw', enc.encode(mdp), 'PBKDF2', false, ['deriveBits']);
  return b64u(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: enc.encode(sel), iterations: ITER }, k, 256));
}
const egal = (a, b) => { if (!a || !b || a.length !== b.length) return false; let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i); return r === 0; };
const emailOk = e => typeof e === 'string' && e.length <= 120 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);
const mdpOk = m => typeof m === 'string' && m.length >= 8 && m.length <= 200;
const CAR = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const codeRecuperation = () => { const o = crypto.getRandomValues(new Uint8Array(16)); const s = [...o].map(x => CAR[x % CAR.length]).join(''); return s.match(/.{4}/g).join('-'); };
const normCode = c => String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

const lireCookie = (req, nom) => { const m = (req.headers.get('cookie') || '').match(new RegExp('(?:^|; )' + nom + '=([^;]+)')); return m ? m[1] : null; };
const poserCookie = (jeton, req) => `${COOKIE}=${jeton}; Path=/; Max-Age=${SESSION_JOURS * 86400}; HttpOnly; SameSite=Lax${new URL(req.url).protocol === 'https:' ? '; Secure' : ''}`;
const effacerCookie = req => `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${new URL(req.url).protocol === 'https:' ? '; Secure' : ''}`;

async function ouvrirSession(env, req, idUtil) {
  const jeton = alea(32), exp = Date.now() + SESSION_JOURS * 864e5;
  await env.DB.prepare('INSERT INTO marche_sessions (th, user_id, exp) VALUES (?,?,?)').bind(await sha(jeton), idUtil, exp).run();
  await env.DB.prepare('DELETE FROM marche_sessions WHERE exp < ?').bind(Date.now()).run();
  return poserCookie(jeton, req);
}
async function utilisateur(env, req) {
  const jeton = lireCookie(req, COOKIE); if (!jeton) return null;
  return env.DB.prepare('SELECT u.id, u.email, u.pwd_hash, u.google_sub FROM marche_sessions s JOIN marche_users u ON u.id = s.user_id WHERE s.th = ? AND s.exp > ?').bind(await sha(jeton), Date.now()).first();
}
const lireJson = async req => { try { const t = await req.text(); if (t.length > MAX_SYNC + 1024) return null; return JSON.parse(t); } catch { return null; } };

async function creer(env, req, corps) {
  const email = String(corps.email || '').trim().toLowerCase();
  if (!emailOk(email)) return erreur('Adresse e-mail invalide.');
  if (!mdpOk(corps.motdepasse)) return erreur('Le mot de passe doit faire au moins 8 caractères.');
  if (await env.DB.prepare('SELECT id FROM marche_users WHERE email = ?').bind(email).first()) return erreur('Un compte existe déjà avec cette adresse. Connectez-vous.', 409);
  const sel = alea(16), hash = await pbkdf2(corps.motdepasse, sel), code = codeRecuperation(), selR = alea(8);
  const r = await env.DB.prepare('INSERT INTO marche_users (email, pwd_hash, salt, recovery_hash, recovery_salt, created_at) VALUES (?,?,?,?,?,?)')
    .bind(email, hash, sel, await sha(normCode(code) + selR), selR, Date.now()).run();
  const cookie = await ouvrirSession(env, req, r.meta.last_row_id);
  return reponse({ email, code_recuperation: code }, 201, { 'set-cookie': cookie });
}
async function connecter(env, req, corps) {
  const email = String(corps.email || '').trim().toLowerCase(), u = await env.DB.prepare('SELECT * FROM marche_users WHERE email = ?').bind(email).first();
  const KO = erreur('E-mail ou mot de passe incorrect.', 401);
  if (!u || !u.pwd_hash) return KO;
  if (u.locked_until > Date.now()) return erreur(`Trop d'essais. Réessayez dans quelques minutes.`, 429);
  if (!egal(await pbkdf2(String(corps.motdepasse || ''), u.salt), u.pwd_hash)) {
    const n = (u.fails || 0) + 1;
    await env.DB.prepare('UPDATE marche_users SET fails = ?, locked_until = ? WHERE id = ?').bind(n >= MAX_ECHECS ? 0 : n, n >= MAX_ECHECS ? Date.now() + VERROU_MIN * 60000 : 0, u.id).run();
    return KO;
  }
  await env.DB.prepare('UPDATE marche_users SET fails = 0, locked_until = 0 WHERE id = ?').bind(u.id).run();
  return reponse({ email: u.email }, 200, { 'set-cookie': await ouvrirSession(env, req, u.id) });
}
async function reinitialiser(env, req, corps) {
  const email = String(corps.email || '').trim().toLowerCase(), u = await env.DB.prepare('SELECT * FROM marche_users WHERE email = ?').bind(email).first();
  const KO = erreur('E-mail ou code de récupération incorrect.', 401);
  if (!u || !u.recovery_hash) return KO;
  if (!mdpOk(corps.motdepasse)) return erreur('Le mot de passe doit faire au moins 8 caractères.');
  if (u.locked_until > Date.now()) return erreur(`Trop d'essais. Réessayez dans quelques minutes.`, 429);
  if (!egal(await sha(normCode(corps.code) + u.recovery_salt), u.recovery_hash)) {
    const n = (u.fails || 0) + 1;
    await env.DB.prepare('UPDATE marche_users SET fails = ?, locked_until = ? WHERE id = ?').bind(n >= MAX_ECHECS ? 0 : n, n >= MAX_ECHECS ? Date.now() + VERROU_MIN * 60000 : 0, u.id).run();
    return KO;
  }
  const sel = alea(16), code = codeRecuperation(), selR = alea(8);
  await env.DB.prepare('UPDATE marche_users SET pwd_hash = ?, salt = ?, recovery_hash = ?, recovery_salt = ?, fails = 0, locked_until = 0 WHERE id = ?')
    .bind(await pbkdf2(corps.motdepasse, sel), sel, await sha(normCode(code) + selR), selR, u.id).run();
  await env.DB.prepare('DELETE FROM marche_sessions WHERE user_id = ?').bind(u.id).run(); // déconnecte les autres appareils
  return reponse({ email: u.email, code_recuperation: code }, 200, { 'set-cookie': await ouvrirSession(env, req, u.id) });
}
async function google(env, req, corps) {
  if (!env.GOOGLE_CLIENT_ID) return erreur('Connexion Google non activée.', 404);
  const r = await fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(String(corps.credential || ''))).catch(() => null);
  const t = r && r.ok ? await r.json().catch(() => null) : null;
  if (!t || t.aud !== env.GOOGLE_CLIENT_ID || !['true', true].includes(t.email_verified) || !t.sub || !emailOk(t.email) || Number(t.exp) * 1000 < Date.now()) return erreur('Connexion Google refusée.', 401);
  const email = t.email.toLowerCase();
  let u = await env.DB.prepare('SELECT * FROM marche_users WHERE google_sub = ? OR email = ?').bind(t.sub, email).first();
  if (!u) { const ins = await env.DB.prepare('INSERT INTO marche_users (email, google_sub, created_at) VALUES (?,?,?)').bind(email, t.sub, Date.now()).run(); u = { id: ins.meta.last_row_id, email }; }
  else if (!u.google_sub) await env.DB.prepare('UPDATE marche_users SET google_sub = ? WHERE id = ?').bind(t.sub, u.id).run();
  return reponse({ email: u.email }, 200, { 'set-cookie': await ouvrirSession(env, req, u.id) });
}

export async function gererAuth(req, env, url) {
  const chemin = url.pathname, m = req.method;
  if (chemin === '/api/auth/config' && m === 'GET') return reponse({ google: env.GOOGLE_CLIENT_ID || null });
  if (m !== 'GET' && req.headers.get('x-mf') !== '1') return erreur('Requête refusée.', 403); // protection CSRF : en-tête personnalisé exigé
  if (chemin === '/api/auth/me' && m === 'GET') { const u = await utilisateur(env, req); return u ? reponse({ email: u.email, google: !!u.google_sub, motdepasse: !!u.pwd_hash }) : erreur('Non connecté.', 401); }
  if (chemin === '/api/auth/register' && m === 'POST') { const c = await lireJson(req); return c ? creer(env, req, c) : erreur('Requête invalide.'); }
  if (chemin === '/api/auth/login' && m === 'POST') { const c = await lireJson(req); return c ? connecter(env, req, c) : erreur('Requête invalide.'); }
  if (chemin === '/api/auth/reset' && m === 'POST') { const c = await lireJson(req); return c ? reinitialiser(env, req, c) : erreur('Requête invalide.'); }
  if (chemin === '/api/auth/google' && m === 'POST') { const c = await lireJson(req); return c ? google(env, req, c) : erreur('Requête invalide.'); }
  if (chemin === '/api/auth/logout' && m === 'POST') {
    const jeton = lireCookie(req, COOKIE); if (jeton) await env.DB.prepare('DELETE FROM marche_sessions WHERE th = ?').bind(await sha(jeton)).run();
    return reponse({ ok: true }, 200, { 'set-cookie': effacerCookie(req) });
  }
  const u = await utilisateur(env, req);
  if (!u) return erreur('Non connecté.', 401);
  if (chemin === '/api/auth/account' && m === 'DELETE') {
    await env.DB.batch([env.DB.prepare('DELETE FROM marche_sync WHERE user_id = ?').bind(u.id), env.DB.prepare('DELETE FROM marche_sessions WHERE user_id = ?').bind(u.id), env.DB.prepare('DELETE FROM marche_users WHERE id = ?').bind(u.id)]);
    return reponse({ ok: true }, 200, { 'set-cookie': effacerCookie(req) });
  }
  if (chemin === '/api/sync' && m === 'GET') { const s = await env.DB.prepare('SELECT data, updated FROM marche_sync WHERE user_id = ?').bind(u.id).first(); return reponse(s ? { data: JSON.parse(s.data), updated: s.updated } : { data: null, updated: 0 }); }
  if (chemin === '/api/sync' && m === 'PUT') {
    const c = await lireJson(req); if (!c || typeof c.data !== 'object' || c.data === null) return erreur('Requête invalide.');
    const txt = JSON.stringify(c.data); if (txt.length > MAX_SYNC) return erreur('Progression trop volumineuse.', 413);
    await env.DB.prepare('INSERT INTO marche_sync (user_id, data, updated) VALUES (?,?,?) ON CONFLICT(user_id) DO UPDATE SET data = excluded.data, updated = excluded.updated').bind(u.id, txt, Date.now()).run();
    return reponse({ ok: true });
  }
  return erreur('Introuvable.', 404);
}
