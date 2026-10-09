/* ------------------------------------------------------------------
   /api/portal — fichiers et documents du client (lecture, dépôt,
   signature électronique).
------------------------------------------------------------------- */
import { Hono } from "hono";
import { streamObject } from "../../lib/portal/files";
import { notifyAdmin } from "../../lib/portal/mail";
import { buildSignedPdf, dataUrlToBytes, documentFingerprint } from "../../lib/portal/signing";
import { clientIp, logActivity, nowIso } from "../../lib/portal/util";
import { fail, ownedProject, ownedRow, shouldNotify, withClient } from "./common";
import { registerUploadRoutes } from "./uploads";

const app = new Hono();

/* ── Fichiers ── */

registerUploadRoutes(app, async (c, projectId) => {
  const r = await withClient(c);
  if ("denied" in r) return r.denied;
  const project = await ownedProject(c, r.client, projectId);
  if (!project) return c.json({ ok: false, error: "Projet introuvable" }, 404);
  return { project, actor: "client" };
});

/* Le navigateur signale la fin d'un lot d'envois : une seule notification. */
app.post("/projects/:id/uploads/batch-done", async (c) => {
  const r = await withClient(c);
  if ("denied" in r) return r.denied;
  const project = await ownedProject(c, r.client, c.req.param("id"));
  if (!project) return fail(c, "Projet introuvable", 404);
  const body = await c.req.json().catch(() => null);
  const names: string[] = Array.isArray(body?.names) ? body.names.slice(0, 30).map((n: any) => String(n).slice(0, 120)) : [];
  if (names.length && (await shouldNotify(c.env.DB, project.id, "uploads", 10))) {
    c.executionCtx.waitUntil(
      notifyAdmin({
        subject: `📎 ${r.client.name} a envoyé ${names.length} fichier(s)`,
        title: "Nouveaux fichiers du client",
        lines: [`Projet : ${project.title}`, ...names],
      })
    );
  }
  return c.json({ ok: true });
});

app.get("/projects/:id/files", async (c) => {
  const r = await withClient(c);
  if ("denied" in r) return r.denied;
  const project = await ownedProject(c, r.client, c.req.param("id"));
  if (!project) return fail(c, "Projet introuvable", 404);
  const { results } = await c.env.DB.prepare(
    "SELECT id, name, size, mime_type, category, uploaded_by, checklist_item_id, created_at FROM client_files WHERE project_id = ? AND message_id IS NULL ORDER BY created_at DESC"
  )
    .bind(project.id)
    .all();
  return c.json({ ok: true, files: results || [] });
});

app.get("/files/:id", async (c) => {
  const r = await withClient(c);
  if ("denied" in r) return r.denied;
  const file = await ownedRow(c, r.client, "client_files", c.req.param("id"));
  if (!file) return fail(c, "Fichier introuvable", 404);
  return streamObject(c, file.r2_key, { name: file.name, mime: file.mime_type, download: c.req.query("download") === "1" });
});

app.delete("/files/:id", async (c) => {
  const r = await withClient(c);
  if ("denied" in r) return r.denied;
  const file = await ownedRow(c, r.client, "client_files", c.req.param("id"));
  if (!file) return fail(c, "Fichier introuvable", 404);
  if (file.uploaded_by !== "client") return fail(c, "Ce fichier a été déposé par Impact Tech.", 403);
  await c.env.MEDIA.delete(file.r2_key).catch(() => {});
  await c.env.DB.prepare("DELETE FROM client_files WHERE id = ?").bind(file.id).run();
  await logActivity(c.env.DB, { projectId: file.project_id, clientId: r.client.id, actor: "client", action: "file_deleted", detail: file.name, visible: false });
  return c.json({ ok: true });
});

/* ── Documents & contrats ── */

app.get("/projects/:id/documents", async (c) => {
  const r = await withClient(c);
  if ("denied" in r) return r.denied;
  const project = await ownedProject(c, r.client, c.req.param("id"));
  if (!project) return fail(c, "Projet introuvable", 404);
  const { results } = await c.env.DB.prepare(
    `SELECT d.id, d.title, d.category, d.status, d.needs_signature, d.file_name, d.file_mime, d.sent_at, d.created_at, d.admin_signed_at,
            (d.r2_key IS NOT NULL) AS has_signed_pdf, s.signed_at
     FROM client_documents d LEFT JOIN signatures s ON s.document_id = d.id
     WHERE d.project_id = ? AND d.status != 'draft'
     ORDER BY d.created_at DESC`
  )
    .bind(project.id)
    .all();
  return c.json({ ok: true, documents: results || [] });
});

app.get("/documents/:id", async (c) => {
  const r = await withClient(c);
  if ("denied" in r) return r.denied;
  const doc = await ownedRow(c, r.client, "client_documents", c.req.param("id"));
  if (!doc || doc.status === "draft") return fail(c, "Document introuvable", 404);
  const signature = await c.env.DB.prepare("SELECT approval_text, signed_at FROM signatures WHERE document_id = ? LIMIT 1").bind(doc.id).first();
  return c.json({
    ok: true,
    document: {
      id: doc.id,
      title: doc.title,
      category: doc.category,
      status: doc.status,
      needs_signature: doc.needs_signature,
      content: doc.file_key ? null : doc.content,
      file_name: doc.file_name,
      file_mime: doc.file_mime,
      has_file: !!doc.file_key,
      has_signed_pdf: !!doc.r2_key,
      admin_signed_at: doc.admin_signed_at,
      project_id: doc.project_id,
    },
    signature,
  });
});

/* Fichier d'origine (affiché dans le lecteur du portail). */
app.get("/documents/:id/file", async (c) => {
  const r = await withClient(c);
  if ("denied" in r) return r.denied;
  const doc = await ownedRow(c, r.client, "client_documents", c.req.param("id"));
  if (!doc || doc.status === "draft" || !doc.file_key) return fail(c, "Fichier introuvable", 404);
  return streamObject(c, doc.file_key, { name: doc.file_name || `${doc.title}`, mime: doc.file_mime, download: c.req.query("download") === "1" });
});

/* PDF signé (généré à la signature). */
app.get("/documents/:id/signed", async (c) => {
  const r = await withClient(c);
  if ("denied" in r) return r.denied;
  const doc = await ownedRow(c, r.client, "client_documents", c.req.param("id"));
  if (!doc || !doc.r2_key) return fail(c, "PDF signé indisponible", 404);
  return streamObject(c, doc.r2_key, { name: `${doc.title} (signé).pdf`, mime: "application/pdf", download: c.req.query("download") === "1" });
});

app.post("/documents/:id/sign", async (c) => {
  const r = await withClient(c);
  if ("denied" in r) return r.denied;
  const doc = await ownedRow(c, r.client, "client_documents", c.req.param("id"));
  if (!doc || doc.status !== "sent" || !doc.needs_signature) return fail(c, "Ce document n'est pas (ou plus) à signer.", 409);
  const existing = await c.env.DB.prepare("SELECT id FROM signatures WHERE document_id = ?").bind(doc.id).first();
  if (existing) return fail(c, "Document déjà signé", 409);

  const body = await c.req.json().catch(() => null);
  const approvalText = String(body?.approvalText || "").trim().replace(/\s+/g, " ");
  const expected = r.client.locale === "en" ? ["read and approved", "lu et approuvé"] : ["lu et approuvé", "lu et approuve"];
  if (!expected.includes(approvalText.toLowerCase())) {
    return fail(c, r.client.locale === "en" ? 'Please type "Read and approved".' : "Écrivez « Lu et approuvé » pour confirmer.");
  }
  const png = dataUrlToBytes(body?.signature);
  if (!png) return fail(c, r.client.locale === "en" ? "Please draw your signature." : "Dessinez votre signature dans le cadre.");

  const sigKey = `signatures/${doc.project_id}/${doc.id}-${Date.now()}.png`;
  await c.env.MEDIA.put(sigKey, png, { httpMetadata: { contentType: "image/png" } });
  const ip = clientIp(c);
  const signedAt = nowIso();
  const sha = doc.file_sha256 || (await documentFingerprint(c.env, doc));

  await c.env.DB.batch([
    c.env.DB.prepare(
      "INSERT INTO signatures (document_id, client_id, approval_text, signature_r2, ip_address, user_agent, signed_at, document_sha256) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    ).bind(doc.id, r.client.id, approvalText, sigKey, ip, (c.req.header("user-agent") || "").slice(0, 300), signedAt, sha),
    c.env.DB.prepare("UPDATE client_documents SET status = 'signed', updated_at = ? WHERE id = ?").bind(signedAt, doc.id),
  ]);

  let pdfOk = false;
  try {
    pdfOk = !!(await buildSignedPdf(c.env, doc.id));
  } catch (e) {
    console.error("signed pdf:", (e as Error).message);
  }

  await logActivity(c.env.DB, { projectId: doc.project_id, clientId: r.client.id, actor: "client", action: "document_signed", detail: doc.title, ip });
  c.executionCtx.waitUntil(
    notifyAdmin({
      subject: `✍️ Contrat signé — ${r.client.name} (${doc.title})`,
      title: "Document signé par le client",
      lines: [`Projet : ${doc.project_title}`, `Document : ${doc.title}`, "Pensez à le contresigner depuis l'admin."],
    })
  );
  return c.json({ ok: true, pdfAvailable: pdfOk });
});

export default app;
