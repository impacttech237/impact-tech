/* ------------------------------------------------------------------
   /api/admin/portal — fichiers, messagerie et demandes (retours,
   support, hors périmètre) d'un projet.
------------------------------------------------------------------- */
import { Hono } from "hono";
import { streamObject } from "../../lib/portal/files";
import { notifyClient } from "../../lib/portal/mail";
import { clampText, logActivity, nowIso } from "../../lib/portal/util";
import { shouldNotify } from "../portal/common";
import { registerUploadRoutes } from "../portal/uploads";

const app = new Hono();

const clientForProject = (db: any, projectId: number) =>
  db.prepare("SELECT c.*, p.title AS project_title FROM client_projects p JOIN clients c ON c.id = p.client_id WHERE p.id = ?").bind(projectId).first();

/* ── Fichiers ── */

registerUploadRoutes(app, async (c, projectId) => {
  const project = await c.env.DB.prepare("SELECT * FROM client_projects WHERE id = ?").bind(parseInt(projectId, 10)).first();
  if (!project) return c.json({ ok: false, error: "Projet introuvable" }, 404);
  return { project, actor: "admin" };
});

app.get("/projects/:id/files", async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT id, name, size, mime_type, category, uploaded_by, checklist_item_id, message_id, created_at FROM client_files WHERE project_id = ? ORDER BY created_at DESC"
  )
    .bind(parseInt(c.req.param("id"), 10))
    .all();
  return c.json({ ok: true, files: results || [] });
});

app.get("/files/:id", async (c) => {
  const f = await c.env.DB.prepare("SELECT * FROM client_files WHERE id = ?").bind(parseInt(c.req.param("id"), 10)).first();
  if (!f) return c.json({ ok: false, error: "Fichier introuvable" }, 404);
  return streamObject(c, f.r2_key, { name: f.name, mime: f.mime_type, download: c.req.query("download") === "1" });
});

app.put("/files/:id", async (c) => {
  const body = await c.req.json().catch(() => null);
  if (body?.category) await c.env.DB.prepare("UPDATE client_files SET category = ? WHERE id = ?").bind(clampText(body.category, 40), parseInt(c.req.param("id"), 10)).run();
  return c.json({ ok: true });
});

app.delete("/files/:id", async (c) => {
  const f = await c.env.DB.prepare("SELECT r2_key FROM client_files WHERE id = ?").bind(parseInt(c.req.param("id"), 10)).first();
  if (f?.r2_key && c.env.MEDIA) await c.env.MEDIA.delete(f.r2_key).catch(() => {});
  await c.env.DB.prepare("DELETE FROM client_files WHERE id = ?").bind(parseInt(c.req.param("id"), 10)).run();
  return c.json({ ok: true });
});

/* ── Messagerie ── */

app.get("/projects/:id/messages", async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  const { results } = await c.env.DB.prepare(
    `SELECT m.*, f.name AS file_name, f.mime_type AS file_mime, f.size AS file_size
     FROM messages m LEFT JOIN client_files f ON f.id = m.file_id
     WHERE m.project_id = ? ORDER BY m.created_at DESC, m.id DESC LIMIT 300`
  )
    .bind(id)
    .all();
  await c.env.DB.prepare("UPDATE messages SET read_by_admin_at = ? WHERE project_id = ? AND author = 'client' AND read_by_admin_at IS NULL").bind(nowIso(), id).run();
  return c.json({ ok: true, messages: (results || []).reverse() });
});

app.post("/projects/:id/messages", async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  const client = await clientForProject(c.env.DB, id);
  if (!client) return c.json({ ok: false, error: "Projet introuvable" }, 404);
  const body = await c.req.json().catch(() => null);
  const text = clampText(body?.body, 5000);
  let fileId: number | null = null;
  if (body?.fileId) {
    const f = await c.env.DB.prepare("SELECT id FROM client_files WHERE id = ? AND project_id = ?").bind(parseInt(body.fileId, 10), id).first();
    fileId = f?.id || null;
  }
  if (!text && !fileId) return c.json({ ok: false, error: "Message vide" }, 400);
  const kind = fileId ? (body?.kind === "voice" ? "voice" : "file") : "text";
  const res = await c.env.DB.prepare("INSERT INTO messages (project_id, author, kind, body, file_id, created_at) VALUES (?, 'admin', ?, ?, ?, ?)")
    .bind(id, kind, text || null, fileId, nowIso())
    .run();
  if (fileId) await c.env.DB.prepare("UPDATE client_files SET message_id = ? WHERE id = ?").bind(res.meta.last_row_id, fileId).run();
  if (await shouldNotify(c.env.DB, id, "admin-message", 10)) {
    c.executionCtx.waitUntil(
      notifyClient(client, {
        subject: `Nouveau message d'Impact Tech — ${client.project_title}`,
        title: "Vous avez un nouveau message",
        body: kind === "voice" ? "🎤 Note vocale" : text || "📎 Pièce jointe",
        cta: "Lire et répondre",
      })
    );
  }
  return c.json({ ok: true });
});

/* ── Demandes : retours, support, hors périmètre ── */

app.get("/projects/:id/requests", async (c) => {
  const { results } = await c.env.DB.prepare("SELECT * FROM project_requests WHERE project_id = ? ORDER BY CASE status WHEN 'nouveau' THEN 0 WHEN 'en_cours' THEN 1 ELSE 2 END, created_at DESC")
    .bind(parseInt(c.req.param("id"), 10))
    .all();
  return c.json({ ok: true, requests: results || [] });
});

app.put("/requests/:id", async (c) => {
  const req = await c.env.DB.prepare("SELECT * FROM project_requests WHERE id = ?").bind(parseInt(c.req.param("id"), 10)).first();
  if (!req) return c.json({ ok: false, error: "Demande introuvable" }, 404);
  const body = await c.req.json().catch(() => null);
  const sets: string[] = [];
  const vals: any[] = [];
  if (body?.status && ["nouveau", "en_cours", "fait", "refuse", "devis"].includes(body.status)) sets.push("status = ?"), vals.push(body.status);
  if (body?.kind && ["retour", "support", "hors_perimetre"].includes(body.kind)) sets.push("kind = ?"), vals.push(body.kind);
  if (body?.admin_reply !== undefined) sets.push("admin_reply = ?"), vals.push(clampText(body.admin_reply, 3000) || null);
  if (body?.invoice_id !== undefined) sets.push("invoice_id = ?"), vals.push(body.invoice_id || null);
  if (!sets.length) return c.json({ ok: true });
  sets.push("updated_at = ?");
  vals.push(nowIso(), req.id);
  await c.env.DB.prepare(`UPDATE project_requests SET ${sets.join(", ")} WHERE id = ?`).bind(...vals).run();

  if (body?.status === "fait" && req.status !== "fait") {
    await logActivity(c.env.DB, { projectId: req.project_id, actor: "admin", action: "request_done", detail: req.comment.slice(0, 120) });
  }
  if (body?.notify && (body?.admin_reply || body?.status)) {
    const client = await clientForProject(c.env.DB, req.project_id);
    const labels: Record<string, string> = { en_cours: "en cours de traitement", fait: "traitée ✓", refuse: "non retenue", devis: "hors forfait : un devis vous a été envoyé" };
    c.executionCtx.waitUntil(
      notifyClient(client, {
        subject: `Votre demande est ${labels[body.status] || "mise à jour"}`,
        title: "Suivi de votre demande",
        body: `« ${req.comment.slice(0, 200)} »\n\n${body.admin_reply || `Statut : ${labels[body.status] || body.status}`}`,
        cta: "Voir mes demandes",
      })
    );
  }
  return c.json({ ok: true });
});

app.delete("/requests/:id", async (c) => {
  const req = await c.env.DB.prepare("SELECT screenshot_key FROM project_requests WHERE id = ?").bind(parseInt(c.req.param("id"), 10)).first();
  if (req?.screenshot_key && c.env.MEDIA) await c.env.MEDIA.delete(req.screenshot_key).catch(() => {});
  await c.env.DB.prepare("DELETE FROM project_requests WHERE id = ?").bind(parseInt(c.req.param("id"), 10)).run();
  return c.json({ ok: true });
});

app.get("/requests/:id/screenshot", async (c) => {
  const req = await c.env.DB.prepare("SELECT screenshot_key FROM project_requests WHERE id = ?").bind(parseInt(c.req.param("id"), 10)).first();
  if (!req?.screenshot_key) return c.json({ ok: false, error: "Pas de capture" }, 404);
  return streamObject(c, req.screenshot_key, { name: "capture.jpg" });
});

export default app;
