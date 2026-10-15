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

/* Le code est stocké haché (HMAC) : une fuite de la base ne le révèle pas.
   Un membre a son propre espace de hachage (member.<id>) : le code de l'un
   ne peut jamais ouvrir la session de l'autre. */
async function hashCode(env: any, clientId: number, code: string) {
  return hmacHex(env, `code.${clientId}.${code}`);
}
async function hashMemberCode(env: any, memberId: number, code: string) {
  return hmacHex(env, `member.${memberId}.${code}`);
}

/* Session : « client.<id>.<token>.<exp>.<sig> » pour le client principal,
   « m<memberId>.<id>.<token>.<exp>.<sig> » pour un membre (signée de même). */
export async function createClientSession(env: any, clientId: number, accessToken: string, memberId?: number | null): Promise<string> {
  const expires = Math.floor(Date.now() / 1000) + SESSION_DURATION;
  const payload = `${memberId ? `m${memberId}` : "client"}.${clientId}.${accessToken}.${expires}`;
  const sig = await hmacHex(env, payload);
  return `${payload}.${sig}`;
}

export async function verifyClientSession(env: any, token: string): Promise<{ clientId: number; accessToken: string; memberId: number | null } | null> {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 5 || !(parts[0] === "client" || /^m\d+$/.test(parts[0]))) return null;
  const memberId = parts[0] === "client" ? null : parseInt(parts[0].slice(1), 10);
  const clientId = parseInt(parts[1], 10);
  const accessToken = parts[2];
  const expires = parseInt(parts[3], 10);
  if (!clientId || !accessToken || !expires) return null;
  if (expires < Math.floor(Date.now() / 1000)) return null;
  const expected = await hmacHex(env, `${parts[0]}.${parts[1]}.${parts[2]}.${parts[3]}`);
  if (!timingSafeEqual(expected, parts[4])) return null;
  return { clientId, accessToken, memberId };
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
  const client = await c.env.DB.prepare("SELECT * FROM clients WHERE id = ? AND access_token = ? AND active = 1")
    .bind(session.clientId, session.accessToken)
    .first();
  if (!client || !session.memberId) return client;
  // Membre retiré ou désactivé : la session tombe immédiatement.
  const member = await c.env.DB.prepare("SELECT * FROM client_members WHERE id = ? AND client_id = ? AND active = 1").bind(session.memberId, client.id).first();
  if (!member) return null;
  return { ...client, _member: member };
}

/* ── Membres : qui agit, et avec quels droits ── */
export type MemberRight = "decide" | "pay" | "vault";

/* Nom à afficher pour l'auteur d'une action (null = le client principal). */
export function actorName(client: any): string | null {
  return client?._member ? client._member.name : null;
}

/* Le client principal a tous les droits ; un membre, ceux qu'on lui a donnés. */
export function can(client: any, right: MemberRight): boolean {
  const m = client?._member;
  if (!m) return true;
  return right === "decide" ? !!m.can_decide : right === "pay" ? !!m.can_pay : !!m.can_vault;
}

export const RIGHT_ERRORS: Record<MemberRight, string> = {
  decide: "Seul le responsable du projet (ou une personne autorisée) peut signer ou valider. Demandez-lui de le faire, ou écrivez-nous.",
  pay: "Seul le responsable du projet (ou une personne autorisée) peut régler les factures.",
  vault: "Le coffre d'accès est réservé au responsable du projet (ou à une personne autorisée).",
};

/* Personne (client principal ou membre actif) dont le numéro ou l'email correspond. */
export async function findPerson(db: any, client: any, by: { phone?: string; email?: string }): Promise<{ kind: "client" | "member"; row: any } | null> {
  const email = String(by.email || "").trim().toLowerCase();
  if (by.phone) {
    if (client.phone && samePhone(by.phone, client.phone)) return { kind: "client", row: client };
  } else if (email && String(client.email || "").toLowerCase() === email) {
    return { kind: "client", row: client };
  }
  const { results } = await db.prepare("SELECT * FROM client_members WHERE client_id = ? AND active = 1").bind(client.id).all();
  const m = (results || []).find((r: any) => (by.phone ? r.phone && samePhone(by.phone!, r.phone) : email && String(r.email || "").toLowerCase() === email));
  return m ? { kind: "member", row: m } : null;
}

export async function storeMemberCode(env: any, memberId: number, validitySeconds = EMAIL_CODE_VALIDITY): Promise<string> {
  const code = generateAuthCode();
  const exp = new Date(Date.now() + validitySeconds * 1000).toISOString();
  await env.DB.prepare("UPDATE client_members SET auth_code = ?, auth_code_exp = ?, auth_attempts = 0, code_sent_at = ? WHERE id = ?")
    .bind(await hashMemberCode(env, memberId, code), exp, new Date().toISOString(), memberId)
    .run();
  return code;
}

/* Vérifie un code contre le client principal ET ses membres ayant un code en
   cours (« J'ai déjà un code » ne dit pas qui on est). Les essais sont
   comptés pour chaque code en cours ; 5 essais faux invalident le code. */
export async function checkAnyCode(env: any, client: any, code: string): Promise<{ result: "ok" | "invalid" | "expired" | "locked"; memberId: number | null }> {
  const clean = String(code || "").replace(/\D/g, "");
  const now = Date.now();
  const { results } = await env.DB.prepare("SELECT * FROM client_members WHERE client_id = ? AND active = 1 AND auth_code IS NOT NULL").bind(client.id).all();
  const members = (results || []).filter((m: any) => m.auth_code_exp && now <= new Date(m.auth_code_exp).getTime() && (m.auth_attempts || 0) < MAX_CODE_ATTEMPTS);
  for (const m of members) {
    if (timingSafeEqual(await hashMemberCode(env, m.id, clean), m.auth_code)) {
      await env.DB.prepare("UPDATE client_members SET auth_code = NULL, auth_code_exp = NULL, auth_attempts = 0, last_seen_at = ? WHERE id = ?").bind(new Date().toISOString(), m.id).run();
      return { result: "ok", memberId: m.id };
    }
  }
  const clientResult = await checkAuthCode(env, client, clean);
  if (clientResult === "ok") return { result: "ok", memberId: null };
  for (const m of members) {
    const attempts = (m.auth_attempts || 0) + 1;
    await env.DB.prepare(`UPDATE client_members SET auth_attempts = ?${attempts >= MAX_CODE_ATTEMPTS ? ", auth_code = NULL, auth_code_exp = NULL" : ""} WHERE id = ?`).bind(attempts, m.id).run();
  }
  // Un membre avait un code valable : « expiré » (code du client principal) serait trompeur.
  if (clientResult === "expired" && members.length) return { result: "invalid", memberId: null };
  return { result: clientResult, memberId: null };
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

/* 5 tentatives de connexion par heure et par client : demandes de code
   (email ou WhatsApp), codes faux et numéros faux comptent ensemble. */
export const MAX_LOGIN_TRIES_PER_HOUR = 5;
export const LOGIN_TRY_ACTIONS = ["code_requested", "code_requested_whatsapp", "code_failed", "code_phone_mismatch"];

export async function loginTriesLeft(db: any, clientId: number): Promise<{ ok: boolean; retryMinutes: number }> {
  const since = new Date(Date.now() - 3600 * 1000).toISOString();
  const row = await db
    .prepare(
      `SELECT COUNT(*) AS n, MIN(created_at) AS first FROM activity_log
       WHERE client_id = ? AND created_at > ? AND action IN (${LOGIN_TRY_ACTIONS.map(() => "?").join(",")})`
    )
    .bind(clientId, since, ...LOGIN_TRY_ACTIONS)
    .first();
  if ((row?.n || 0) < MAX_LOGIN_TRIES_PER_HOUR) return { ok: true, retryMinutes: 0 };
  const freeAt = new Date(row.first).getTime() + 3600 * 1000;
  return { ok: false, retryMinutes: Math.max(1, Math.ceil((freeAt - Date.now()) / 60000)) };
}

/* Même numéro ? On compare les 9 derniers chiffres (indicatif +237 facultatif). */
export function samePhone(a: string, b: string): boolean {
  const x = String(a || "").replace(/\D/g, "");
  const y = String(b || "").replace(/\D/g, "");
  if (x.length < 8 || y.length < 8) return false;
  return x.slice(-9) === y.slice(-9);
}

export function maskPhone(phone: string): string {
  const d = String(phone || "").replace(/\D/g, "");
  if (d.length < 4) return "";
  return `${d.length > 9 ? `+${d.slice(0, d.length - 9)} ` : ""}${d.slice(-9, -8)}•• •• •• ${d.slice(-2)}`;
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
