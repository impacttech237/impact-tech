/* ------------------------------------------------------------------
   Portail client — garde d'accès commune aux routes /api/portal/*.
   Chaque route vérifie que la ressource appartient AU client connecté
   (jamais seulement « un client est connecté »).
------------------------------------------------------------------- */
import { requireClient } from "../../lib/portal-auth";
import { nowIso } from "../../lib/portal/util";

export async function withClient(c: any): Promise<{ client: any } | { denied: Response }> {
  const denied = await requireClient(c);
  if (denied) return { denied };
  return { client: c.get("client") };
}

export async function ownedProject(c: any, client: any, projectId: any) {
  const id = parseInt(String(projectId), 10);
  if (!id) return null;
  return c.env.DB.prepare("SELECT * FROM client_projects WHERE id = ? AND client_id = ?").bind(id, client.id).first();
}

/* Ressource rattachée à un projet du client (table avec colonne project_id). */
export async function ownedRow(c: any, client: any, table: string, id: any) {
  const allowed = ["client_documents", "client_files", "checklist_items", "project_steps", "vault_entries", "invoices", "project_requests", "messages"];
  if (!allowed.includes(table)) throw new Error("table non autorisée");
  const rowId = parseInt(String(id), 10);
  if (!rowId) return null;
  return c.env.DB.prepare(
    `SELECT t.*, p.title AS project_title FROM ${table} t JOIN client_projects p ON p.id = t.project_id WHERE t.id = ? AND p.client_id = ?`
  )
    .bind(rowId, client.id)
    .first();
}

/* Évite d'inonder la boîte mail de l'admin : une notification par
   (projet, sujet) toutes les `minutes` minutes au plus. */
export async function shouldNotify(db: any, projectId: number, key: string, minutes = 15): Promise<boolean> {
  const since = new Date(Date.now() - minutes * 60 * 1000).toISOString();
  const row = await db
    .prepare("SELECT id FROM activity_log WHERE project_id = ? AND action = ? AND created_at > ? LIMIT 1")
    .bind(projectId, `notif:${key}`, since)
    .first();
  if (row) return false;
  await db
    .prepare("INSERT INTO activity_log (project_id, actor, action, visible, created_at) VALUES (?, 'system', ?, 0, ?)")
    .bind(projectId, `notif:${key}`, nowIso())
    .run();
  return true;
}

export const fail = (c: any, error: string, status = 400) => c.json({ ok: false, error }, status);
