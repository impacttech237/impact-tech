/* ------------------------------------------------------------------
   /api/portal — échanges : messagerie par projet (texte, notes
   vocales, pièces jointes) et demandes (retours, support).
------------------------------------------------------------------- */
import { Hono } from "hono";
import { notifyAdmin } from "../../lib/portal/mail";
import { clampText, clientIp, logActivity, nowIso, safeUrl } from "../../lib/portal/util";
import { fail, ownedProject, shouldNotify, withClient } from "./common";

const app = new Hono();

const MESSAGE_FIELDS = `m.id, m.author, m.kind, m.body, m.file_id, m.created_at, m.read_by_client_at, m.read_by_admin_at,
  f.name AS file_name, f.mime_type AS file_mime, f.size AS file_size`;

app.get("/projects/:id/messages", async (c) => {
  const r = await withClient(c);
  if ("denied" in r) return r.denied;
  const project = await ownedProject(c, r.client, c.req.param("id"));
  if (!project) return fail(c, "Projet introuvable", 404);
  const { results } = await c.env.DB.prepare(
    `SELECT ${MESSAGE_FIELDS} FROM messages m LEFT JOIN client_files f ON f.id = m.file_id
     WHERE m.project_id = ? ORDER BY m.created_at DESC, m.id DESC LIMIT 200`
  )
    .bind(project.id)
    .all();
  await c.env.DB.prepare("UPDATE messages SET read_by_client_at = ? WHERE project_id = ? AND author != 'client' AND read_by_client_at IS NULL")
    .bind(nowIso(), project.id)
    .run();
  return c.json({ ok: true, messages: (results || []).reverse() });
});

app.post("/projects/:id/messages", async (c) => {
  const r = await withClient(c);
  if ("denied" in r) return r.denied;
  const project = await ownedProject(c, r.client, c.req.param("id"));
  if (!project) return fail(c, "Projet introuvable", 404);
  const body = await c.req.json().catch(() => null);
  const text = clampText(body?.body, 5000);
  let fileId: number | null = null;
  let kind = "text";
  if (body?.fileId) {
    const file = await c.env.DB.prepare("SELECT id, mime_type FROM client_files WHERE id = ? AND project_id = ? AND uploaded_by = 'client'")
      .bind(parseInt(body.fileId, 10), project.id)
      .first();
    if (!file) return fail(c, "Pièce jointe introuvable", 404);
    fileId = file.id;
    kind = body?.kind === "voice" ? "voice" : "file";
  }
  if (!text && !fileId) return fail(c, "Message vide");

  const res = await c.env.DB.prepare("INSERT INTO messages (project_id, author, kind, body, file_id, created_at) VALUES (?, 'client', ?, ?, ?, ?)")
    .bind(project.id, kind, text || null, fileId, nowIso())
    .run();
  if (fileId) await c.env.DB.prepare("UPDATE client_files SET message_id = ? WHERE id = ?").bind(res.meta.last_row_id, fileId).run();

  if (await shouldNotify(c.env.DB, project.id, "message", 10)) {
    c.executionCtx.waitUntil(
      notifyAdmin({
        subject: `💬 Message de ${r.client.name}`,
        title: `Nouveau message — ${project.title}`,
        lines: [kind === "voice" ? "🎤 Note vocale" : text || "📎 Pièce jointe"],
      })
    );
  }
  return c.json({ ok: true, id: res.meta.last_row_id });
});

/* ── Demandes : retours, support après livraison ── */

app.get("/projects/:id/requests", async (c) => {
  const r = await withClient(c);
  if ("denied" in r) return r.denied;
  const project = await ownedProject(c, r.client, c.req.param("id"));
  if (!project) return fail(c, "Projet introuvable", 404);
  const { results } = await c.env.DB.prepare(
    "SELECT id, kind, comment, page_url, device, round, status, admin_reply, invoice_id, screenshot_key IS NOT NULL AS has_screenshot, created_at, updated_at FROM project_requests WHERE project_id = ? ORDER BY created_at DESC"
  )
    .bind(project.id)
    .all();
  return c.json({ ok: true, requests: results || [] });
});

app.post("/projects/:id/requests", async (c) => {
  const r = await withClient(c);
  if ("denied" in r) return r.denied;
  const project = await ownedProject(c, r.client, c.req.param("id"));
  if (!project) return fail(c, "Projet introuvable", 404);
  const body = await c.req.json().catch(() => null);
  const comment = clampText(body?.comment, 4000);
  if (!comment) return fail(c, "Décrivez votre demande.");
  const kind = project.delivered_at ? "support" : "retour";
  const res = await c.env.DB.prepare(
    "INSERT INTO project_requests (project_id, kind, comment, page_url, device, round, status, created_at) VALUES (?, ?, ?, ?, ?, ?, 'nouveau', ?)"
  )
    .bind(project.id, kind, comment, safeUrl(body?.pageUrl), clampText(body?.device, 40) || null, kind === "retour" ? (project.revision_used || 0) + 1 : null, nowIso())
    .run();
  await logActivity(c.env.DB, { projectId: project.id, clientId: r.client.id, actor: "client", action: kind === "support" ? "support_request" : "feedback", detail: comment.slice(0, 120), ip: clientIp(c) });
  if (await shouldNotify(c.env.DB, project.id, "request", 10)) {
    c.executionCtx.waitUntil(
      notifyAdmin({
        subject: `${kind === "support" ? "🛟 Demande de support" : "✏️ Nouveau retour"} — ${r.client.name}`,
        title: project.title,
        lines: [comment, body?.pageUrl ? `Page : ${body.pageUrl}` : ""].filter(Boolean),
      })
    );
  }
  return c.json({ ok: true, id: res.meta.last_row_id });
});

export default app;
