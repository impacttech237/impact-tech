/* ------------------------------------------------------------------
   Auth admin — session signée HMAC-SHA256 (Web Crypto).
   Cookie HttpOnly "it_admin".

   Variables d'environnement (Worker Settings > Variables and Secrets) :
   - ADMIN_PASSWORD : mot de passe de connexion à /admin
   - AUTH_SECRET    : secret de signature des sessions
   ⚠️ Des valeurs par défaut existent pour le dev local : CHANGEZ-LES
   impérativement en production.
------------------------------------------------------------------- */

export const COOKIE_NAME = "it_admin";
const SESSION_DURATION = 60 * 60 * 24 * 7; // 7 jours

export const DEFAULT_PASSWORD = "impact-admin-2026";

export function getAdminPassword(env) {
  return env?.ADMIN_PASSWORD || DEFAULT_PASSWORD;
}

function getSecret(env) {
  return env?.AUTH_SECRET || "impact-tech-dev-secret::" + getAdminPassword(env);
}

async function hmacHex(env, message) {
  const secret = getSecret(env);
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function createSessionToken(env) {
  const expires = Math.floor(Date.now() / 1000) + SESSION_DURATION;
  const payload = `admin.${expires}`;
  const sig = await hmacHex(env, payload);
  return `${payload}.${sig}`;
}

export async function verifySessionToken(env, token) {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== "admin") return false;
  const expires = parseInt(parts[1], 10);
  if (!expires || expires < Math.floor(Date.now() / 1000)) return false;
  const expected = await hmacHex(env, `${parts[0]}.${parts[1]}`);
  return timingSafeEqual(expected, parts[2]);
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function getCookie(c, name) {
  const header = c.req.header("cookie") || "";
  for (const part of header.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return decodeURIComponent(v.join("="));
  }
  return null;
}

/* Garde d'authentification pour les routes /api/admin/*.
   Renvoie null si OK, sinon un objet Response Hono (401). */
export async function requireAdmin(c) {
  const token = getCookie(c, COOKIE_NAME);
  if (await verifySessionToken(c.env, token)) return null;
  return c.json({ ok: false, error: "Non autorisé" }, 401);
}

export function sessionCookieHeader(token) {
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=${SESSION_DURATION}`;
}

export function clearCookieHeader() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=0`;
}
