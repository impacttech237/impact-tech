/* ------------------------------------------------------------------
   Auth portail client — lien personnel (/espace/<slug>) + code à usage
   unique (envoyé par email, ou généré par l'admin et transmis par
   téléphone / WhatsApp). Cookie HttpOnly "it_client", 90 jours.
   Anti-bruteforce : 5 essais par code, puis le code est invalidé.
------------------------------------------------------------------- */

import { getCookie } from "hono/cookie";

export const CLIENT_COOKIE = "it_client";
const SESSION_DURATION = 60 * 60 * 24 * 90;
export const EMAIL_CODE_VALIDITY = 15 * 60; // 15 min
export const MANUAL_CODE_VALIDITY = 24 * 60 * 60; // code généré par l'admin : 24 h
export const MAX_CODE_ATTEMPTS = 5;
export const CODE_RESEND_DELAY = 45; // secondes entre deux envois

function getSecret(env: any): string {
  return env?.AUTH_SECRET || "impact-tech-dev-secret::client";
}

async function hmacHex(env: any, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(getSecret(env)), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function generateAccessToken(): string {
  return crypto.randomUUID() + "-" + crypto.randomUUID().slice(0, 8);
}

export function generateAuthCode(): string {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return String(arr[0] % 1000000).padStart(6, "0");
}

/* Le code est stocké haché (HMAC) : une fuite de la base ne le révèle pas. */
async function hashCode(env: any, clientId: number, code: string) {
  return hmacHex(env, `code.${clientId}.${code}`);
}

export async function createClientSession(env: any, clientId: number, accessToken: string): Promise<string> {
  const expires = Math.floor(Date.now() / 1000) + SESSION_DURATION;
  const payload = `client.${clientId}.${accessToken}.${expires}`;
  const sig = await hmacHex(env, payload);
  return `${payload}.${sig}`;
}

export async function verifyClientSession(env: any, token: string): Promise<{ clientId: number; accessToken: string } | null> {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 5 || parts[0] !== "client") return null;
  const clientId = parseInt(parts[1], 10);
  const accessToken = parts[2];
  const expires = parseInt(parts[3], 10);
  if (!clientId || !accessToken || !expires) return null;
  if (expires < Math.floor(Date.now() / 1000)) return null;
  const expected = await hmacHex(env, `${parts[0]}.${parts[1]}.${parts[2]}.${parts[3]}`);
  if (!timingSafeEqual(expected, parts[4])) return null;
  return { clientId, accessToken };
}

export function clientCookieHeader(token: string): string {
  return `${CLIENT_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=${SESSION_DURATION}`;
}

export function clearClientCookieHeader(): string {
  return `${CLIENT_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=0`;
}

/* Client courant (ou null) — pour les routes qui gèrent elles-mêmes le refus. */
export async function currentClient(c: any): Promise<any | null> {
  const token = getCookie(c, CLIENT_COOKIE);
  if (!token) return null;
  const session = await verifyClientSession(c.env, token);
  if (!session) return null;
  return c.env.DB.prepare("SELECT * FROM clients WHERE id = ? AND access_token = ? AND active = 1")
    .bind(session.clientId, session.accessToken)
    .first();
}

export async function requireClient(c: any): Promise<any> {
  const client = await currentClient(c);
  if (!client) return c.json({ ok: false, error: "Session expirée", code: "unauthorized" }, 401);
  c.set("client", client);
  return null;
}

/* Retrouve un client par son lien : slug (/espace/x) ou ancien token. */
export async function findClientByKey(db: any, key: string) {
  const k = String(key || "").trim();
  if (!k) return null;
  return db.prepare("SELECT * FROM clients WHERE (slug = ? OR access_token = ?) AND active = 1").bind(k, k).first();
}

export async function storeAuthCode(env: any, clientId: number, validitySeconds = EMAIL_CODE_VALIDITY): Promise<string> {
  const code = generateAuthCode();
  const exp = new Date(Date.now() + validitySeconds * 1000).toISOString();
  await env.DB.prepare("UPDATE clients SET auth_code = ?, auth_code_exp = ?, auth_attempts = 0, code_sent_at = ? WHERE id = ?")
    .bind(await hashCode(env, clientId, code), exp, new Date().toISOString(), clientId)
    .run();
  return code;
}

export function canResendCode(client: any): boolean {
  if (!client.code_sent_at) return true;
  return Date.now() - new Date(client.code_sent_at).getTime() > CODE_RESEND_DELAY * 1000;
}

/* Vérifie le code et comptabilise les essais. */
export async function checkAuthCode(env: any, client: any, code: string): Promise<"ok" | "invalid" | "expired" | "locked"> {
  if (!client.auth_code || !client.auth_code_exp) return "expired";
  if (Date.now() > new Date(client.auth_code_exp).getTime()) return "expired";
  if ((client.auth_attempts || 0) >= MAX_CODE_ATTEMPTS) return "locked";

  const expected = await hashCode(env, client.id, String(code || "").replace(/\D/g, ""));
  if (timingSafeEqual(expected, client.auth_code)) {
    await env.DB.prepare("UPDATE clients SET auth_code = NULL, auth_code_exp = NULL, auth_attempts = 0, last_seen_at = ? WHERE id = ?")
      .bind(new Date().toISOString(), client.id)
      .run();
    return "ok";
  }
  const attempts = (client.auth_attempts || 0) + 1;
  if (attempts >= MAX_CODE_ATTEMPTS) {
    await env.DB.prepare("UPDATE clients SET auth_code = NULL, auth_code_exp = NULL, auth_attempts = ? WHERE id = ?").bind(attempts, client.id).run();
    return "locked";
  }
  await env.DB.prepare("UPDATE clients SET auth_attempts = ? WHERE id = ?").bind(attempts, client.id).run();
  return "invalid";
}
