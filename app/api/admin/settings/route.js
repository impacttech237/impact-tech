/* /api/admin/settings — lecture / mise à jour des réglages (clé/valeur) */
import { requireAdmin } from "@/lib/auth";
import { getDB } from "@/lib/db";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const ALLOWED_KEYS = [
  "site_name",
  "phone_display",
  "phone_link",
  "email",
  "address",
  "hours",
  "location_note",
  "hours_note",
  "facebook",
  "linkedin",
  "instagram",
  "marquee_items",
  "hero_pills",
];

export async function GET(request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  const db = await getDB();
  if (!db) return Response.json({ ok: false, error: "Base de données indisponible." }, { status: 503 });

  const { results } = await db.prepare("SELECT key, value FROM settings").all();
  return Response.json({ ok: true, settings: Object.fromEntries(results.map((r) => [r.key, r.value])) });
}

export async function PUT(request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  const db = await getDB();
  if (!db) return Response.json({ ok: false, error: "Base de données indisponible." }, { status: 503 });

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "Corps de requête invalide" }, { status: 400 });
  }

  const entries = Object.entries(body.settings || {}).filter(([k]) => ALLOWED_KEYS.includes(k));
  if (!entries.length) {
    return Response.json({ ok: false, error: "Aucun réglage valide fourni." }, { status: 400 });
  }

  const stmt = db.prepare(
    "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
  );
  await db.batch(entries.map(([k, v]) => stmt.bind(k, String(v ?? ""))));

  return Response.json({ ok: true });
}
