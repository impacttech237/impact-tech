/* GET /api/admin/me — vérifie la session admin */
import { requireAdmin } from "@/lib/auth";
import { getDB } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const db = await getDB();
  return Response.json({ ok: true, dbAvailable: !!db });
}
