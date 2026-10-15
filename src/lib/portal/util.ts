/* ------------------------------------------------------------------
   Portail client — utilitaires partagés (API client, API admin, cron).
------------------------------------------------------------------- */
import { DEFAULTS } from "../defaults";

export const nowIso = () => new Date().toISOString();

export function addDays(date: Date | string, days: number): string {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/* "Boulangerie Dupont & Fils" -> "boulangerie-dupont-fils" */
export function slugify(input: string): string {
  return (input || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " et ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50)
    .replace(/-+$/g, "");
}

/* Slug unique dans la table clients (suffixe -2, -3... si déjà pris). */
export async function uniqueClientSlug(db: any, base: string, excludeId?: number): Promise<string> {
  const root = slugify(base) || "client";
  for (let i = 1; i < 200; i++) {
    const candidate = i === 1 ? root : `${root}-${i}`;
    const row = await db
      .prepare("SELECT id FROM clients WHERE slug = ?" + (excludeId ? " AND id != ?" : ""))
      .bind(...(excludeId ? [candidate, excludeId] : [candidate]))
      .first();
    if (!row) return candidate;
  }
  return `${root}-${crypto.randomUUID().slice(0, 6)}`;
}

export function randomToken(bytes = 16): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

/* Code de parrainage court et lisible (sans 0/O/1/I). */
export function referralCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const arr = new Uint8Array(6);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => alphabet[b % alphabet.length]).join("");
}

export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function parseJson<T>(value: any, fallback: T): T {
  if (value == null || value === "") return fallback;
  if (typeof value !== "string") return value as T;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function clientIp(c: any): string {
  return c.req.header("cf-connecting-ip") || c.req.header("x-forwarded-for") || "";
}

export function clampText(value: any, max: number): string {
  return String(value ?? "").trim().slice(0, max);
}

/* URL http(s) uniquement (évite javascript:, data:... dans les liens affichés). */
export function safeUrl(value: any): string | null {
  const v = String(value ?? "").trim();
  if (!v) return null;
  try {
    const u = new URL(v.startsWith("http") ? v : `https://${v}`);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.toString();
  } catch {
    return null;
  }
}

export interface ActivityInput {
  projectId?: number | null;
  clientId?: number | null;
  actor: "client" | "admin" | "system";
  action: string;
  detail?: string;
  visible?: boolean;
  ip?: string;
  actorName?: string | null; // membre du client qui a agi (null = client principal)
}

/* Journal d'activité : preuve horodatée + fil « Quoi de neuf » du client. */
export async function logActivity(db: any, a: ActivityInput) {
  try {
    await db
      .prepare(
        "INSERT INTO activity_log (project_id, client_id, actor, action, detail, visible, ip, created_at, actor_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
      )
      .bind(a.projectId ?? null, a.clientId ?? null, a.actor, a.action, a.detail ?? null, a.visible === false ? 0 : 1, a.ip ?? null, nowIso(), a.actorName ?? null)
      .run();
  } catch (e) {
    console.error("logActivity:", (e as Error).message);
  }
}

/* Réglages utiles au portail (WhatsApp, parrainage), avec repli sur DEFAULTS. */
export async function portalSettings(db: any) {
  const keys = ["phone_link", "phone_display", "email", "portal_whatsapp", "referral_reward"];
  const out: Record<string, string> = {
    phone_link: DEFAULTS.settings.phone_link,
    phone_display: DEFAULTS.settings.phone_display,
    email: DEFAULTS.settings.email,
    portal_whatsapp: "",
    referral_reward: "",
  };
  try {
    const { results } = await db
      .prepare(`SELECT key, value FROM settings WHERE key IN (${keys.map(() => "?").join(",")})`)
      .bind(...keys)
      .all();
    for (const r of results || []) if (r.value) out[r.key] = r.value;
  } catch {}
  const wa = (out.portal_whatsapp || out.phone_link || "").replace(/[^\d]/g, "");
  return { ...out, whatsapp: wa };
}

export function waLink(phone: string, text: string): string {
  const digits = String(phone || "").replace(/[^\d]/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export function formatMoney(amount: number | null | undefined, currency = "XAF"): string {
  if (amount == null || !Number.isFinite(Number(amount))) return "";
  const n = Math.round(Number(amount)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  if (currency === "EUR") return `${n} €`;
  return `${n} FCFA`;
}

/* Catégories de fichiers (dépôt client) + devinette à partir du type MIME. */
export const FILE_CATEGORIES = ["logo", "photos", "videos", "musique", "textes", "documents", "autre"];

export function guessCategory(mime: string, name: string): string {
  const m = (mime || "").toLowerCase();
  const n = (name || "").toLowerCase();
  if (/logo/.test(n)) return "logo";
  if (m.startsWith("image/")) return "photos";
  if (m.startsWith("video/")) return "videos";
  if (m.startsWith("audio/")) return "musique";
  if (/\.(docx?|txt|odt|rtf|md)$/.test(n)) return "textes";
  if (m === "application/pdf" || /\.(pdf|xlsx?|pptx?|csv)$/.test(n)) return "documents";
  return "autre";
}
