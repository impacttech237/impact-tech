/* ------------------------------------------------------------------
   /api/admin/portal/* — API admin du portail client.
   CRUD clients, projets, documents, templates, fichiers.
------------------------------------------------------------------- */
import { Hono } from "hono";
import { requireAdmin } from "../lib/auth";
import { generateAccessToken } from "../lib/portal-auth";
import { sendEmail } from "../lib/email";
import { SITE_URL } from "../lib/seo";

const app = new Hono();

/* ═══════════ Clients ═══════════ */

app.get("/clients", async (c) => {
  const denied = await requireAdmin(c);
  if (denied) return denied;

  const search = (c.req.query("search") || "").trim();
  const page = Math.max(1, parseInt(c.req.query("page") || "1", 10));
  const limit = 20;
  const offset = (page - 1) * limit;

  let where = "WHERE 1=1";
  const params: any[] = [];
  if (search) {
    where += " AND (name LIKE ? OR email LIKE ? OR company LIKE ?)";
    const s = `%${search}%`;
    params.push(s, s, s);
  }

  const countRow = await c.env.DB.prepare(
    `SELECT COUNT(*) as total FROM clients ${where}`
  )
    .bind(...params)
    .first();

  const { results } = await c.env.DB.prepare(
    `SELECT id, name, email, phone, company, access_token, active, created_at
     FROM clients ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`
  )
    .bind(...params, limit, offset)
    .all();

  return c.json({ ok: true, clients: results, total: countRow?.total || 0, page, pages: Math.ceil((countRow?.total || 0) / limit) });
});

app.post("/clients", async (c) => {
  const denied = await requireAdmin(c);
  if (denied) return denied;

  const body = await c.req.json().catch(() => null);
  const name = (body?.name || "").trim();
  const email = (body?.email || "").trim();
  if (!name || !email) return c.json({ ok: false, error: "Nom et email requis" }, 400);

  const accessToken = generateAccessToken();

  const result = await c.env.DB.prepare(
    `INSERT INTO clients (name, email, phone, company, access_token)
     VALUES (?, ?, ?, ?, ?)`
  )
    .bind(name, email, (body?.phone || "").trim(), (body?.company || "").trim(), accessToken)
    .run();

  return c.json({
    ok: true,
    id: result.meta.last_row_id,
    accessToken,
    portalUrl: `${SITE_URL}/portail/${accessToken}`,
  });
});

app.put("/clients/:id", async (c) => {
  const denied = await requireAdmin(c);
  if (denied) return denied;
  const id = parseInt(c.req.param("id"), 10);

  const body = await c.req.json().catch(() => null);
  if (!body) return c.json({ ok: false, error: "Corps invalide" }, 400);

  const fields: string[] = [];
  const vals: any[] = [];
  for (const key of ["name", "email", "phone", "company", "active"]) {
    if (body[key] !== undefined) {
      fields.push(`${key} = ?`);
      vals.push(body[key]);
    }
  }
  if (!fields.length) return c.json({ ok: false, error: "Aucun champ" }, 400);

  vals.push(id);
  await c.env.DB.prepare(`UPDATE clients SET ${fields.join(", ")} WHERE id = ?`)
    .bind(...vals)
    .run();

  return c.json({ ok: true });
});

app.delete("/clients/:id", async (c) => {
  const denied = await requireAdmin(c);
  if (denied) return denied;
  const id = parseInt(c.req.param("id"), 10);
  await c.env.DB.prepare("DELETE FROM clients WHERE id = ?").bind(id).run();
  return c.json({ ok: true });
});

/* ── Envoyer le lien portail au client ── */

app.post("/clients/:id/send-link", async (c) => {
  const denied = await requireAdmin(c);
  if (denied) return denied;
  const id = parseInt(c.req.param("id"), 10);

  const client = await c.env.DB.prepare(
    "SELECT * FROM clients WHERE id = ?"
  )
    .bind(id)
    .first();
  if (!client) return c.json({ ok: false, error: "Client introuvable" }, 404);

  const portalUrl = `${SITE_URL}/portail/${client.access_token}`;

  const sent = await sendEmail({
    to: client.email,
    toName: client.name,
    subject: "Votre espace client — Impact Tech",
    html: `<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0e0e0c;font-family:system-ui,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0e0e0c;padding:32px 16px">
<tr><td align="center">
<table width="100%" style="max-width:540px;background:#1a1a17;border-radius:12px;overflow:hidden">
<tr><td style="background:#C0202B;padding:20px 24px">
  <p style="margin:0;color:#fff;font-size:18px;font-weight:700">impact<span style="color:#f7efd9">.</span>Tech</p>
</td></tr>
<tr><td style="padding:28px 24px;color:#f7efd9;font-size:14px;line-height:1.6">
  <h2 style="margin:0 0 16px;font-size:20px">Bienvenue sur votre espace client</h2>
  <p>Bonjour <strong>${client.name}</strong>,</p>
  <p>Votre espace client Impact Tech est prêt. Vous pouvez y suivre vos projets, consulter vos documents et signer vos contrats.</p>
  <p style="text-align:center;margin:24px 0">
    <a href="${portalUrl}" style="display:inline-block;background:#C0202B;color:#fff;text-decoration:none;padding:12px 28px;border-radius:100px;font-weight:600">Accéder à mon espace</a>
  </p>
  <p style="color:rgba(247,239,217,0.5);font-size:12px">Gardez ce lien confidentiel, il est unique à votre compte.</p>
</td></tr>
<tr><td style="padding:16px 24px;border-top:1px solid #2a2a25;color:rgba(247,239,217,0.4);font-size:11px;text-align:center">
  © Impact Tech — impacttech237.com
</td></tr>
</table>
</td></tr></table>
</body></html>`,
  });

  return c.json({ ok: sent, portalUrl });
});

/* ═══════════ Projets ═══════════ */

app.get("/clients/:clientId/projects", async (c) => {
  const denied = await requireAdmin(c);
  if (denied) return denied;
  const clientId = parseInt(c.req.param("clientId"), 10);

  const { results } = await c.env.DB.prepare(
    "SELECT * FROM client_projects WHERE client_id = ? ORDER BY created_at DESC"
  )
    .bind(clientId)
    .all();

  return c.json({ ok: true, projects: results });
});

app.post("/projects", async (c) => {
  const denied = await requireAdmin(c);
  if (denied) return denied;

  const body = await c.req.json().catch(() => null);
  const clientId = body?.client_id;
  const title = (body?.title || "").trim();
  if (!clientId || !title) return c.json({ ok: false, error: "Client et titre requis" }, 400);

  const result = await c.env.DB.prepare(
    `INSERT INTO client_projects (client_id, title, description, status, start_date, due_date)
     VALUES (?, ?, ?, ?, ?, ?)`
  )
    .bind(
      clientId,
      title,
      (body?.description || "").trim(),
      body?.status || "cadrage",
      body?.start_date || null,
      body?.due_date || null
    )
    .run();

  return c.json({ ok: true, id: result.meta.last_row_id });
});

app.put("/projects/:id", async (c) => {
  const denied = await requireAdmin(c);
  if (denied) return denied;
  const id = parseInt(c.req.param("id"), 10);

  const body = await c.req.json().catch(() => null);
  if (!body) return c.json({ ok: false, error: "Corps invalide" }, 400);

  const fields: string[] = [];
  const vals: any[] = [];
  for (const key of ["title", "description", "status", "start_date", "due_date"]) {
    if (body[key] !== undefined) {
      fields.push(`${key} = ?`);
      vals.push(body[key]);
    }
  }
  fields.push("updated_at = ?");
  vals.push(new Date().toISOString());
  vals.push(id);

  await c.env.DB.prepare(`UPDATE client_projects SET ${fields.join(", ")} WHERE id = ?`)
    .bind(...vals)
    .run();

  return c.json({ ok: true });
});

app.delete("/projects/:id", async (c) => {
  const denied = await requireAdmin(c);
  if (denied) return denied;
  const id = parseInt(c.req.param("id"), 10);
  await c.env.DB.prepare("DELETE FROM client_projects WHERE id = ?").bind(id).run();
  return c.json({ ok: true });
});

/* ═══════════ Documents ═══════════ */

app.get("/projects/:projectId/documents", async (c) => {
  const denied = await requireAdmin(c);
  if (denied) return denied;
  const projectId = parseInt(c.req.param("projectId"), 10);

  const { results } = await c.env.DB.prepare(
    `SELECT d.*, s.signed_at, s.ip_address as sig_ip
     FROM client_documents d
     LEFT JOIN signatures s ON s.document_id = d.id
     WHERE d.project_id = ?
     ORDER BY d.created_at DESC`
  )
    .bind(projectId)
    .all();

  return c.json({ ok: true, documents: results });
});

app.post("/documents", async (c) => {
  const denied = await requireAdmin(c);
  if (denied) return denied;

  const body = await c.req.json().catch(() => null);
  const projectId = body?.project_id;
  const title = (body?.title || "").trim();
  if (!projectId || !title) return c.json({ ok: false, error: "Projet et titre requis" }, 400);

  // Si un template est spécifié, charger son contenu
  let content = (body?.content || "").trim();
  if (body?.template_id) {
    const tpl = await c.env.DB.prepare(
      "SELECT content, variables FROM contract_templates WHERE id = ?"
    )
      .bind(body.template_id)
      .first();
    if (tpl) {
      content = tpl.content;
      // Remplacer les variables si fournies
      if (body?.variables && typeof body.variables === "object") {
        for (const [key, val] of Object.entries(body.variables)) {
          content = content.replace(
            new RegExp(`\\{\\{${key}\\}\\}`, "g"),
            String(val)
          );
        }
      }
    }
  }

  const result = await c.env.DB.prepare(
    `INSERT INTO client_documents (project_id, title, category, content, template_id, status)
     VALUES (?, ?, ?, ?, ?, ?)`
  )
    .bind(
      projectId,
      title,
      body?.category || "document",
      content,
      body?.template_id || null,
      "draft"
    )
    .run();

  return c.json({ ok: true, id: result.meta.last_row_id });
});

app.put("/documents/:id", async (c) => {
  const denied = await requireAdmin(c);
  if (denied) return denied;
  const id = parseInt(c.req.param("id"), 10);

  const body = await c.req.json().catch(() => null);
  if (!body) return c.json({ ok: false, error: "Corps invalide" }, 400);

  const fields: string[] = [];
  const vals: any[] = [];
  for (const key of ["title", "category", "content", "status"]) {
    if (body[key] !== undefined) {
      fields.push(`${key} = ?`);
      vals.push(body[key]);
    }
  }
  fields.push("updated_at = ?");
  vals.push(new Date().toISOString());
  vals.push(id);

  await c.env.DB.prepare(`UPDATE client_documents SET ${fields.join(", ")} WHERE id = ?`)
    .bind(...vals)
    .run();

  return c.json({ ok: true });
});

/* ── Envoyer un document au client (passe en status "sent") ── */

app.post("/documents/:id/send", async (c) => {
  const denied = await requireAdmin(c);
  if (denied) return denied;
  const id = parseInt(c.req.param("id"), 10);

  const doc = await c.env.DB.prepare(
    `SELECT d.*, p.client_id, p.title as project_title
     FROM client_documents d
     JOIN client_projects p ON p.id = d.project_id
     WHERE d.id = ?`
  )
    .bind(id)
    .first();
  if (!doc) return c.json({ ok: false, error: "Document introuvable" }, 404);

  const client = await c.env.DB.prepare("SELECT * FROM clients WHERE id = ?")
    .bind(doc.client_id)
    .first();
  if (!client) return c.json({ ok: false, error: "Client introuvable" }, 404);

  await c.env.DB.prepare(
    "UPDATE client_documents SET status = 'sent', updated_at = ? WHERE id = ?"
  )
    .bind(new Date().toISOString(), id)
    .run();

  const portalUrl = `${SITE_URL}/portail/${client.access_token}`;

  c.executionCtx.waitUntil(
    sendEmail({
      to: client.email,
      toName: client.name,
      subject: `Nouveau document à consulter — ${doc.title}`,
      html: `<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0e0e0c;font-family:system-ui,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0e0e0c;padding:32px 16px">
<tr><td align="center">
<table width="100%" style="max-width:540px;background:#1a1a17;border-radius:12px;overflow:hidden">
<tr><td style="background:#C0202B;padding:20px 24px">
  <p style="margin:0;color:#fff;font-size:18px;font-weight:700">impact<span style="color:#f7efd9">.</span>Tech</p>
</td></tr>
<tr><td style="padding:28px 24px;color:#f7efd9;font-size:14px;line-height:1.6">
  <h2 style="margin:0 0 16px;font-size:20px">Nouveau document</h2>
  <p>Bonjour <strong>${client.name}</strong>,</p>
  <p>Un nouveau document « <strong>${doc.title}</strong> » est disponible dans votre espace client${doc.category === "contrat" ? " et nécessite votre signature" : ""}.</p>
  <p style="text-align:center;margin:24px 0">
    <a href="${portalUrl}" style="display:inline-block;background:#C0202B;color:#fff;text-decoration:none;padding:12px 28px;border-radius:100px;font-weight:600">Consulter le document</a>
  </p>
</td></tr>
<tr><td style="padding:16px 24px;border-top:1px solid #2a2a25;color:rgba(247,239,217,0.4);font-size:11px;text-align:center">
  © Impact Tech — impacttech237.com
</td></tr>
</table>
</td></tr></table>
</body></html>`,
    })
  );

  return c.json({ ok: true });
});

app.delete("/documents/:id", async (c) => {
  const denied = await requireAdmin(c);
  if (denied) return denied;
  const id = parseInt(c.req.param("id"), 10);
  await c.env.DB.prepare("DELETE FROM client_documents WHERE id = ?").bind(id).run();
  return c.json({ ok: true });
});

/* ═══════════ Templates de contrat ═══════════ */

app.get("/templates", async (c) => {
  const denied = await requireAdmin(c);
  if (denied) return denied;

  const { results } = await c.env.DB.prepare(
    "SELECT * FROM contract_templates ORDER BY created_at DESC"
  ).all();

  return c.json({ ok: true, templates: results });
});

app.post("/templates", async (c) => {
  const denied = await requireAdmin(c);
  if (denied) return denied;

  const body = await c.req.json().catch(() => null);
  const title = (body?.title || "").trim();
  const content = (body?.content || "").trim();
  if (!title || !content) return c.json({ ok: false, error: "Titre et contenu requis" }, 400);

  const result = await c.env.DB.prepare(
    `INSERT INTO contract_templates (title, content, variables, active)
     VALUES (?, ?, ?, 1)`
  )
    .bind(title, content, body?.variables || null)
    .run();

  return c.json({ ok: true, id: result.meta.last_row_id });
});

app.put("/templates/:id", async (c) => {
  const denied = await requireAdmin(c);
  if (denied) return denied;
  const id = parseInt(c.req.param("id"), 10);

  const body = await c.req.json().catch(() => null);
  if (!body) return c.json({ ok: false, error: "Corps invalide" }, 400);

  const fields: string[] = [];
  const vals: any[] = [];
  for (const key of ["title", "content", "variables", "active"]) {
    if (body[key] !== undefined) {
      fields.push(`${key} = ?`);
      vals.push(body[key]);
    }
  }
  fields.push("updated_at = ?");
  vals.push(new Date().toISOString());
  vals.push(id);

  await c.env.DB.prepare(`UPDATE contract_templates SET ${fields.join(", ")} WHERE id = ?`)
    .bind(...vals)
    .run();

  return c.json({ ok: true });
});

app.delete("/templates/:id", async (c) => {
  const denied = await requireAdmin(c);
  if (denied) return denied;
  const id = parseInt(c.req.param("id"), 10);
  await c.env.DB.prepare("DELETE FROM contract_templates WHERE id = ?").bind(id).run();
  return c.json({ ok: true });
});

/* ═══════════ Fichiers ═══════════ */

app.get("/projects/:projectId/files", async (c) => {
  const denied = await requireAdmin(c);
  if (denied) return denied;
  const projectId = parseInt(c.req.param("projectId"), 10);

  const { results } = await c.env.DB.prepare(
    "SELECT * FROM client_files WHERE project_id = ? ORDER BY created_at DESC"
  )
    .bind(projectId)
    .all();

  return c.json({ ok: true, files: results });
});

app.post("/projects/:projectId/files", async (c) => {
  const denied = await requireAdmin(c);
  if (denied) return denied;
  const projectId = parseInt(c.req.param("projectId"), 10);
  if (!c.env.MEDIA) return c.json({ ok: false, error: "Stockage indisponible" }, 503);

  let form;
  try {
    form = await c.req.formData();
  } catch {
    return c.json({ ok: false, error: "Envoi invalide" }, 400);
  }
  const file = form.get("file");
  if (!file || typeof file === "string") return c.json({ ok: false, error: "Aucun fichier" }, 400);
  if (file.size > 20 * 1024 * 1024) return c.json({ ok: false, error: "Fichier trop lourd (max 20 Mo)" }, 413);

  const ext = file.name.split(".").pop() || "bin";
  const key = `client-files/${projectId}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;

  await c.env.MEDIA.put(key, file.stream(), {
    httpMetadata: { contentType: file.type || "application/octet-stream" },
  });

  const result = await c.env.DB.prepare(
    `INSERT INTO client_files (project_id, name, r2_key, size, mime_type, uploaded_by)
     VALUES (?, ?, ?, ?, ?, 'admin')`
  )
    .bind(projectId, file.name, key, file.size, file.type || "application/octet-stream")
    .run();

  return c.json({ ok: true, id: result.meta.last_row_id });
});

app.delete("/files/:id", async (c) => {
  const denied = await requireAdmin(c);
  if (denied) return denied;
  const id = parseInt(c.req.param("id"), 10);

  const file = await c.env.DB.prepare("SELECT r2_key FROM client_files WHERE id = ?")
    .bind(id)
    .first();
  if (file?.r2_key && c.env.MEDIA) {
    await c.env.MEDIA.delete(file.r2_key).catch(() => {});
  }

  await c.env.DB.prepare("DELETE FROM client_files WHERE id = ?").bind(id).run();
  return c.json({ ok: true });
});

/* ═══════════ Stats rapides ═══════════ */

app.get("/stats", async (c) => {
  const denied = await requireAdmin(c);
  if (denied) return denied;

  const clients = await c.env.DB.prepare("SELECT COUNT(*) as c FROM clients").first();
  const projects = await c.env.DB.prepare("SELECT COUNT(*) as c FROM client_projects").first();
  const pending = await c.env.DB.prepare(
    "SELECT COUNT(*) as c FROM client_documents WHERE status = 'sent'"
  ).first();
  const signed = await c.env.DB.prepare(
    "SELECT COUNT(*) as c FROM signatures"
  ).first();

  return c.json({
    ok: true,
    stats: {
      clients: clients?.c || 0,
      projects: projects?.c || 0,
      pendingDocuments: pending?.c || 0,
      signedContracts: signed?.c || 0,
    },
  });
});

export default app;
