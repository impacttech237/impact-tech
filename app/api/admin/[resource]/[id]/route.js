/* /api/admin/[resource]/[id] — mise à jour (PUT) et suppression (DELETE) */
import { requireAdmin } from "@/lib/auth";
import { getDB } from "@/lib/db";
import { RESOURCES } from "@/lib/admin-resources";

export const dynamic = "force-dynamic";

function parse(params) {
  const res = RESOURCES[params.resource] || null;
  const id = parseInt(params.id, 10);
  return { res, id: Number.isFinite(id) ? id : null };
}

export async function PUT(request, { params }) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  const { res, id } = parse(params);
  if (!res || id === null) return Response.json({ ok: false, error: "Ressource inconnue." }, { status: 404 });

  const db = await getDB();
  if (!db) return Response.json({ ok: false, error: "Base de données indisponible." }, { status: 503 });

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "Corps de requête invalide" }, { status: 400 });
  }

  const cols = res.columns.filter((c) => body[c] !== undefined);
  if (!cols.length) return Response.json({ ok: false, error: "Aucun champ à mettre à jour." }, { status: 400 });

  const assignments = cols.map((c) => `${c} = ?`).join(", ");
  try {
    await db
      .prepare(`UPDATE ${res.table} SET ${assignments} WHERE id = ?`)
      .bind(...cols.map((c) => body[c]), id)
      .run();
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ ok: false, error: e?.message || "Erreur de mise à jour." }, { status: 400 });
  }
}

export async function DELETE(request, { params }) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  const { res, id } = parse(params);
  if (!res || id === null) return Response.json({ ok: false, error: "Ressource inconnue." }, { status: 404 });

  const db = await getDB();
  if (!db) return Response.json({ ok: false, error: "Base de données indisponible." }, { status: 503 });

  await db.prepare(`DELETE FROM ${res.table} WHERE id = ?`).bind(id).run();
  return Response.json({ ok: true });
}
