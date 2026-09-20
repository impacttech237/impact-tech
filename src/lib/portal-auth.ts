/* ------------------------------------------------------------------
   Auth portail client — lien unique + code 6 chiffres par email.
   Cookie HttpOnly "it_client", durée 7 jours.
------------------------------------------------------------------- */
import { sendEmail } from "./email";
import { SITE_URL } from "./seo";

export const CLIENT_COOKIE = "it_client";
const SESSION_DURATION = 60 * 60 * 24 * 7;
const CODE_VALIDITY = 10 * 60; // 10 minutes

function getSecret(env: any): string {
  return env?.AUTH_SECRET || "impact-tech-dev-secret::client";
}

async function hmacHex(env: any, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(getSecret(env)),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
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

export async function sendAuthCodeEmail(
  email: string,
  name: string,
  code: string
): Promise<boolean> {
  return sendEmail({
    to: email,
    toName: name,
    subject: `Votre code d'accès — Impact Tech`,
    html: `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0e0e0c;font-family:'Inter',system-ui,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0e0e0c;padding:32px 16px">
<tr><td align="center">
<table width="100%" style="max-width:540px;background:#1a1a17;border-radius:12px;overflow:hidden">
<tr><td style="background:#C0202B;padding:20px 24px">
  <p style="margin:0;color:#fff;font-size:18px;font-weight:700">impact<span style="color:#f7efd9">.</span>Tech</p>
</td></tr>
<tr><td style="padding:28px 24px;color:#f7efd9;font-size:14px;line-height:1.6">
  <h2 style="margin:0 0 16px;color:#f7efd9;font-size:20px">Votre code d'accès</h2>
  <p>Bonjour <strong>${name}</strong>,</p>
  <p>Voici votre code pour accéder à votre espace client :</p>
  <p style="text-align:center;margin:24px 0">
    <span style="display:inline-block;background:#0e0e0c;color:#C0202B;font-size:32px;font-weight:700;letter-spacing:8px;padding:16px 32px;border-radius:8px;border:1px solid #2a2a25">${code}</span>
  </p>
  <p style="color:rgba(247,239,217,0.5);font-size:12px">Ce code est valable 10 minutes. Si vous n'avez pas demandé cet accès, ignorez cet email.</p>
</td></tr>
<tr><td style="padding:16px 24px;border-top:1px solid #2a2a25;color:rgba(247,239,217,0.4);font-size:11px;text-align:center">
  © Impact Tech — impacttech237.com
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`,
  });
}

export async function createClientSession(
  env: any,
  clientId: number,
  accessToken: string
): Promise<string> {
  const expires = Math.floor(Date.now() / 1000) + SESSION_DURATION;
  const payload = `client.${clientId}.${accessToken}.${expires}`;
  const sig = await hmacHex(env, payload);
  return `${payload}.${sig}`;
}

export async function verifyClientSession(
  env: any,
  token: string
): Promise<{ clientId: number; accessToken: string } | null> {
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

function getCookie(c: any, name: string): string | null {
  const header = c.req.header("cookie") || "";
  for (const part of header.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return decodeURIComponent(v.join("="));
  }
  return null;
}

export async function requireClient(c: any): Promise<any> {
  const token = getCookie(c, CLIENT_COOKIE);
  if (!token) return c.json({ ok: false, error: "Non autorisé" }, 401);
  const session = await verifyClientSession(c.env, token);
  if (!session) return c.json({ ok: false, error: "Session expirée" }, 401);
  const client = await c.env.DB.prepare(
    "SELECT * FROM clients WHERE id = ? AND access_token = ? AND active = 1"
  )
    .bind(session.clientId, session.accessToken)
    .first();
  if (!client) return c.json({ ok: false, error: "Compte introuvable" }, 401);
  c.set("client", client);
  return null;
}

export function isCodeValid(client: any, code: string): boolean {
  if (!client.auth_code || !client.auth_code_exp) return false;
  const exp = new Date(client.auth_code_exp).getTime();
  if (Date.now() > exp) return false;
  return timingSafeEqual(client.auth_code, code);
}

export async function storeAuthCode(db: any, clientId: number): Promise<string> {
  const code = generateAuthCode();
  const exp = new Date(Date.now() + CODE_VALIDITY * 1000).toISOString();
  await db
    .prepare("UPDATE clients SET auth_code = ?, auth_code_exp = ? WHERE id = ?")
    .bind(code, exp, clientId)
    .run();
  return code;
}
