/* /api/admin/[resource] — liste (GET) et création (POST) génériques
   pour toutes les ressources déclarées dans lib/admin-resources.js */
import { requireAdmin } from "@/lib/auth";
import { getDB } from "@/lib/db";
import { RESOURCES } from "@/lib/admin-resources";

export const runtime = "edge";
export const dynamic = "force-dynamic";

function getResource(params) {
  return RESOURCES[params.resource] || null;
}

export async function GET(request, { params }) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  const res = getResource(params);
  if (!res) return Response.json({ ok: false, error: "Ressource inconnue." }, { status: 404 });

  const db = await getDB();
  if (!db) return Response.json({ ok: false, error: "Base de données indisponible." }, { status: 503 });

  const { results } = await db
    .prepare(`SELECT * FROM ${res.table} ORDER BY ${res.orderBy}`)
    .all();
  return Response.json({ ok: true, items: results });
}

export async function POST(request, { params }) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  const res = getResource(params);
  if (!res) return Response.json({ ok: false, error: "Ressource inconnue." }, { status: 404 });
  if (res.noCreate) {
    return Response.json({ ok: false, error: "Création non autorisée pour cette ressource." }, { status: 405 });
  }

  const db = await getDB();
  if (!db) return Response.json({ ok: false, error: "Base de données indisponible." }, { status: 503 });

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "Corps de requête invalide" }, { status: 400 });
  }

  const cols = res.columns.filter((c) => body[c] !== undefined);
  if (!cols.length) return Response.json({ ok: false, error: "Aucun champ fourni." }, { status: 400 });

  const placeholders = cols.map(() => "?").join(", ");
  try {
    const result = await db
      .prepare(`INSERT INTO ${res.table} (${cols.join(", ")}) VALUES (${placeholders})`)
      .bind(...cols.map((c) => body[c]))
      .run();
    return Response.json({ ok: true, id: result.meta.last_row_id });
  } catch (e) {
    return Response.json({ ok: false, error: e?.message || "Erreur d'insertion." }, { status: 400 });
  }
}
