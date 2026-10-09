/* ------------------------------------------------------------------
   Upload de fichiers (client ET admin) — R2 multipart.
   Le navigateur découpe le fichier en parties de 8 Mo, chaque partie
   est réessayée en cas de coupure réseau : un envoi de vidéo en 3G
   n'a jamais à repartir de zéro.
     POST /projects/:pid/uploads/start     -> { key, uploadId, partSize }
     PUT  /projects/:pid/uploads/part      -> { partNumber, etag }
     POST /projects/:pid/uploads/complete  -> { file }
     POST /projects/:pid/uploads/abort
------------------------------------------------------------------- */
import {
  MAX_FILE_SIZE,
  MAX_PART_SIZE,
  abortMultipart,
  completeMultipart,
  createMultipart,
  fileKey,
  sanitizeFileName,
  uploadPart,
} from "../../lib/portal/files";
import { FILE_CATEGORIES, clientIp, guessCategory, logActivity, nowIso } from "../../lib/portal/util";

export const PART_SIZE = 8 * 1024 * 1024;

export type ResolveProject = (c: any, projectId: string) => Promise<{ project: any; actor: "client" | "admin" } | Response>;

export function registerUploadRoutes(app: any, resolve: ResolveProject) {
  const guard = async (c: any) => {
    if (!c.env.MEDIA) return c.json({ ok: false, error: "Stockage indisponible" }, 503);
    return resolve(c, c.req.param("projectId"));
  };

  const keyOk = (key: string, projectId: number) => typeof key === "string" && key.startsWith(`client-files/${projectId}/`) && !key.includes("..");

  app.post("/projects/:projectId/uploads/start", async (c: any) => {
    const ctx = await guard(c);
    if (ctx instanceof Response) return ctx;
    const body = await c.req.json().catch(() => null);
    const name = sanitizeFileName(body?.name);
    const size = Number(body?.size || 0);
    const mime = String(body?.mime || "application/octet-stream").slice(0, 120);
    if (!size || size < 0) return c.json({ ok: false, error: "Fichier vide" }, 400);
    if (size > MAX_FILE_SIZE) return c.json({ ok: false, error: "Fichier trop lourd (5 Go maximum)" }, 413);
    const key = fileKey("client-files", ctx.project.id, name);
    const uploadId = await createMultipart(c.env, key, mime);
    return c.json({ ok: true, key, uploadId, partSize: PART_SIZE });
  });

  app.put("/projects/:projectId/uploads/part", async (c: any) => {
    const ctx = await guard(c);
    if (ctx instanceof Response) return ctx;
    const key = c.req.query("key") || "";
    const uploadId = c.req.query("uploadId") || "";
    const partNumber = parseInt(c.req.query("part") || "0", 10);
    if (!keyOk(key, ctx.project.id) || !uploadId || partNumber < 1 || partNumber > 10000) {
      return c.json({ ok: false, error: "Paramètres d'envoi invalides" }, 400);
    }
    const len = parseInt(c.req.header("content-length") || "0", 10);
    if (len > MAX_PART_SIZE) return c.json({ ok: false, error: "Partie trop grande" }, 413);
    try {
      const part = await uploadPart(c.env, key, uploadId, partNumber, c.req.raw.body);
      return c.json({ ok: true, ...part });
    } catch (e) {
      console.error("upload part:", (e as Error).message);
      return c.json({ ok: false, error: "Échec de l'envoi de cette partie" }, 502);
    }
  });

  app.post("/projects/:projectId/uploads/complete", async (c: any) => {
    const ctx = await guard(c);
    if (ctx instanceof Response) return ctx;
    const body = await c.req.json().catch(() => null);
    const key = body?.key || "";
    if (!keyOk(key, ctx.project.id) || !body?.uploadId || !Array.isArray(body?.parts) || !body.parts.length) {
      return c.json({ ok: false, error: "Paramètres d'envoi invalides" }, 400);
    }
    let obj: any;
    try {
      obj = await completeMultipart(c.env, key, body.uploadId, body.parts.map((p: any) => ({ partNumber: Number(p.partNumber), etag: String(p.etag) })));
    } catch (e) {
      console.error("upload complete:", (e as Error).message);
      return c.json({ ok: false, error: "Impossible de finaliser l'envoi" }, 502);
    }

    const name = sanitizeFileName(body?.name);
    const mime = String(body?.mime || "application/octet-stream").slice(0, 120);
    const category = FILE_CATEGORIES.includes(body?.category) ? body.category : guessCategory(mime, name);

    let checklistItemId: number | null = null;
    if (body?.checklistItemId) {
      const item = await c.env.DB.prepare("SELECT id, kind, status FROM checklist_items WHERE id = ? AND project_id = ?")
        .bind(parseInt(body.checklistItemId, 10), ctx.project.id)
        .first();
      if (item) {
        checklistItemId = item.id;
        if (ctx.actor === "client" && item.status === "todo") {
          await c.env.DB.prepare("UPDATE checklist_items SET status = 'sent', sent_at = ? WHERE id = ?").bind(nowIso(), item.id).run();
        }
      }
    }

    const res = await c.env.DB.prepare(
      `INSERT INTO client_files (project_id, name, r2_key, size, mime_type, uploaded_by, category, checklist_item_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(ctx.project.id, name, key, obj?.size ?? Number(body?.size || 0), mime, ctx.actor, category, checklistItemId, nowIso())
      .run();

    await logActivity(c.env.DB, {
      projectId: ctx.project.id,
      clientId: ctx.project.client_id,
      actor: ctx.actor,
      action: "file_uploaded",
      detail: name,
      ip: clientIp(c),
    });

    return c.json({
      ok: true,
      file: { id: res.meta.last_row_id, name, size: obj?.size, mime_type: mime, category, uploaded_by: ctx.actor, checklist_item_id: checklistItemId },
    });
  });

  app.post("/projects/:projectId/uploads/abort", async (c: any) => {
    const ctx = await guard(c);
    if (ctx instanceof Response) return ctx;
    const body = await c.req.json().catch(() => null);
    if (keyOk(body?.key, ctx.project.id) && body?.uploadId) await abortMultipart(c.env, body.key, body.uploadId);
    return c.json({ ok: true });
  });
}
