/* ------------------------------------------------------------------
   /api/admin/portal — documents & contrats.
   Deux façons de créer un document :
   - upload d'un fichier (PDF, Word, image) : le client le lit dans son
     espace, la signature est apposée sur le PDF + certificat ;
   - rédaction / modèle : variables {{client_name}}, {{amount}}...
     remplies automatiquement à partir du client et du projet.
   Puis : envoi au client -> signature client -> contresignature.
------------------------------------------------------------------- */
import { Hono } from "hono";
import { MAX_DOCUMENT_SIZE, fileKey, sanitizeFileName, sha256Hex, streamObject } from "../../lib/portal/files";
import { notifyClient } from "../../lib/portal/mail";
import { textDocumentPdf } from "../../lib/portal/pdf";
import { MISSING_VALUE, contractVariables, fillVariables } from "../../lib/portal/projects";
import { buildSignedPdf, dataUrlToBytes, documentFingerprint } from "../../lib/portal/signing";
import { clampText, logActivity, nowIso } from "../../lib/portal/util";

const app = new Hono();

export const VARIABLES = [
  { key: "client_name", label: "Nom du client" },
  { key: "client_company", label: "Entreprise du client" },
  { key: "client_email", label: "Email du client" },
  { key: "client_phone", label: "Téléphone du client" },
  { key: "project_title", label: "Titre du projet" },
  { key: "pack", label: "Pack choisi" },
  { key: "amount", label: "Montant du projet" },
  { key: "start_date", label: "Date de début" },
  { key: "delay", label: "Date de livraison prévue" },
  { key: "revisions", label: "Séries de modifications incluses" },
  { key: "support", label: "Durée du support" },
  { key: "date", label: "Date du jour" },
];

async function projectContext(db: any, projectId: number) {
  const project = await db.prepare("SELECT * FROM client_projects WHERE id = ?").bind(projectId).first();
  if (!project) return null;
  const client = await db.prepare("SELECT * FROM clients WHERE id = ?").bind(project.client_id).first();
  return { project, client };
}

const DOC_CATEGORIES = ["contrat", "devis", "maquette", "document", "livraison", "facture"];

/* ── Documents d'un projet ── */

app.get("/projects/:id/documents", async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT d.id, d.title, d.category, d.status, d.needs_signature, d.file_name, d.file_mime, d.sent_at, d.created_at, d.updated_at,
            d.admin_signed_at, d.template_id, (d.r2_key IS NOT NULL) AS has_signed_pdf, (d.file_key IS NOT NULL) AS has_file,
            s.signed_at, s.ip_address AS sig_ip
     FROM client_documents d LEFT JOIN signatures s ON s.document_id = d.id
     WHERE d.project_id = ? ORDER BY d.created_at DESC`
  )
    .bind(parseInt(c.req.param("id"), 10))
    .all();
  return c.json({ ok: true, documents: results || [] });
});

app.get("/documents/:id", async (c) => {
  const doc = await c.env.DB.prepare("SELECT * FROM client_documents WHERE id = ?").bind(parseInt(c.req.param("id"), 10)).first();
  if (!doc) return c.json({ ok: false, error: "Document introuvable" }, 404);
  return c.json({ ok: true, document: doc });
});

/* Document rédigé ou issu d'un modèle. */
app.post("/projects/:id/documents", async (c) => {
  const projectId = parseInt(c.req.param("id"), 10);
  const ctx = await projectContext(c.env.DB, projectId);
  if (!ctx) return c.json({ ok: false, error: "Projet introuvable" }, 404);
  const body = await c.req.json().catch(() => null);
  let title = clampText(body?.title, 200);
  let content = String(body?.content || "").slice(0, 200000);
  let file: { key: string; name: string; mime: string; sha: string } | null = null;

  if (body?.template_id) {
    const tpl = await c.env.DB.prepare("SELECT * FROM contract_templates WHERE id = ?").bind(parseInt(body.template_id, 10)).first();
    if (!tpl) return c.json({ ok: false, error: "Modèle introuvable" }, 404);
    title = title || tpl.title;
    if (tpl.file_key) {
      const obj = await c.env.MEDIA.get(tpl.file_key);
      if (!obj) return c.json({ ok: false, error: "Fichier du modèle introuvable" }, 404);
      const bytes = new Uint8Array(await obj.arrayBuffer());
      const key = fileKey("documents", projectId, tpl.file_name || "modele.pdf");
      await c.env.MEDIA.put(key, bytes, { httpMetadata: { contentType: tpl.file_mime || "application/octet-stream" } });
      file = { key, name: tpl.file_name, mime: tpl.file_mime, sha: await sha256Hex(bytes) };
    } else {
      content = tpl.content;
    }
  }
  if (!title) return c.json({ ok: false, error: "Titre requis" }, 400);
  const vars = contractVariables(ctx);
  title = fillVariables(title, vars).slice(0, 200);
  if (content) content = fillVariables(content, vars);

  const category = DOC_CATEGORIES.includes(body?.category) ? body.category : "contrat";
  const res = await c.env.DB.prepare(
    `INSERT INTO client_documents (project_id, title, category, content, template_id, status, needs_signature, file_key, file_name, file_mime, file_sha256, created_at)
     VALUES (?, ?, ?, ?, ?, 'draft', ?, ?, ?, ?, ?, ?)`
  )
    .bind(projectId, title, category, file ? null : content, body?.template_id || null, body?.needs_signature === false ? 0 : category === "contrat" || category === "devis" ? 1 : body?.needs_signature ? 1 : 0, file?.key || null, file?.name || null, file?.mime || null, file?.sha || null, nowIso())
    .run();
  return c.json({ ok: true, id: res.meta.last_row_id });
});

/* Upload d'un document (PDF, Word, image...). */
app.post("/projects/:id/documents/upload", async (c) => {
  const projectId = parseInt(c.req.param("id"), 10);
  if (!(await projectContext(c.env.DB, projectId))) return c.json({ ok: false, error: "Projet introuvable" }, 404);
  let form: FormData;
  try {
    form = await c.req.formData();
  } catch {
    return c.json({ ok: false, error: "Envoi invalide" }, 400);
  }
  const f = form.get("file");
  if (!f || typeof f === "string") return c.json({ ok: false, error: "Aucun fichier" }, 400);
  if (f.size > MAX_DOCUMENT_SIZE) return c.json({ ok: false, error: "Document trop lourd (30 Mo max)" }, 413);
  const name = sanitizeFileName(f.name);
  const bytes = new Uint8Array(await f.arrayBuffer());
  const mime = f.type || "application/octet-stream";
  const key = fileKey("documents", projectId, name);
  await c.env.MEDIA.put(key, bytes, { httpMetadata: { contentType: mime } });
  const category = DOC_CATEGORIES.includes(String(form.get("category"))) ? String(form.get("category")) : "document";
  const needsSig = form.get("needs_signature") === "1";
  const title = clampText(form.get("title"), 200) || name.replace(/\.[a-z0-9]+$/i, "");
  const res = await c.env.DB.prepare(
    `INSERT INTO client_documents (project_id, title, category, status, needs_signature, file_key, file_name, file_mime, file_sha256, created_at)
     VALUES (?, ?, ?, 'draft', ?, ?, ?, ?, ?, ?)`
  )
    .bind(projectId, title, category, needsSig ? 1 : 0, key, name, mime, await sha256Hex(bytes), nowIso())
    .run();
  return c.json({ ok: true, id: res.meta.last_row_id });
});

app.put("/documents/:id", async (c) => {
  const doc = await c.env.DB.prepare("SELECT * FROM client_documents WHERE id = ?").bind(parseInt(c.req.param("id"), 10)).first();
  if (!doc) return c.json({ ok: false, error: "Document introuvable" }, 404);
  if (doc.status === "signed") return c.json({ ok: false, error: "Un document signé ne peut plus être modifié." }, 409);
  const body = await c.req.json().catch(() => null);
  const sets: string[] = [];
  const vals: any[] = [];
  if (body?.title !== undefined) sets.push("title = ?"), vals.push(clampText(body.title, 200));
  if (body?.category !== undefined && DOC_CATEGORIES.includes(body.category)) sets.push("category = ?"), vals.push(body.category);
  if (body?.content !== undefined && !doc.file_key) sets.push("content = ?"), vals.push(String(body.content).slice(0, 200000));
  if (body?.needs_signature !== undefined) sets.push("needs_signature = ?"), vals.push(body.needs_signature ? 1 : 0);
  if (!sets.length) return c.json({ ok: true });
  sets.push("updated_at = ?");
  vals.push(nowIso(), doc.id);
  await c.env.DB.prepare(`UPDATE client_documents SET ${sets.join(", ")} WHERE id = ?`).bind(...vals).run();
  return c.json({ ok: true });
});

app.post("/documents/:id/send", async (c) => {
  const doc = await c.env.DB.prepare("SELECT * FROM client_documents WHERE id = ?").bind(parseInt(c.req.param("id"), 10)).first();
  if (!doc) return c.json({ ok: false, error: "Document introuvable" }, 404);
  if (doc.status === "signed") return c.json({ ok: false, error: "Document déjà signé" }, 409);
  const body = await c.req.json().catch(() => ({}));
  const text = `${doc.title} ${doc.content || ""}`;
  const missing = text.includes(MISSING_VALUE) || /\{\{\s*[a-z_]+\s*\}\}/.test(text);
  if (missing && !body?.force) {
    return c.json({ ok: false, code: "missing_values", error: `Le document contient encore des champs « ${MISSING_VALUE} » : complétez-les (bouton Modifier) avant l'envoi.` }, 409);
  }
  const ctx = await projectContext(c.env.DB, doc.project_id);
  const sha = doc.file_sha256 || (await documentFingerprint(c.env, doc));
  await c.env.DB.prepare("UPDATE client_documents SET status = 'sent', sent_at = ?, file_sha256 = ?, updated_at = ? WHERE id = ?").bind(nowIso(), sha, nowIso(), doc.id).run();
  await logActivity(c.env.DB, { projectId: doc.project_id, actor: "admin", action: doc.needs_signature ? "document_to_sign" : "document_shared", detail: doc.title });
  const email = await notifyClient(ctx.client, {
    subject: doc.needs_signature ? `Document à signer : ${doc.title}` : `Nouveau document : ${doc.title}`,
    title: doc.needs_signature ? "Un document attend votre signature" : "Un nouveau document est disponible",
    body: doc.needs_signature
      ? `« ${doc.title} » est prêt. Lisez-le tranquillement, puis signez-le en un clic depuis votre espace (au doigt sur téléphone).`
      : `« ${doc.title} » a été ajouté à votre espace client.`,
    cta: doc.needs_signature ? "Lire et signer" : "Voir le document",
  });
  return c.json({ ok: true, emailSent: !!email?.ok });
});

app.post("/documents/:id/unsend", async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  await c.env.DB.prepare("UPDATE client_documents SET status = 'draft', updated_at = ? WHERE id = ? AND status = 'sent'").bind(nowIso(), id).run();
  return c.json({ ok: true });
});

/* Contresignature Impact Tech (après la signature du client). */
app.post("/documents/:id/countersign", async (c) => {
  const doc = await c.env.DB.prepare("SELECT * FROM client_documents WHERE id = ?").bind(parseInt(c.req.param("id"), 10)).first();
  if (!doc) return c.json({ ok: false, error: "Document introuvable" }, 404);
  if (doc.status !== "signed") return c.json({ ok: false, error: "Le client doit d'abord signer." }, 409);
  const body = await c.req.json().catch(() => null);
  const png = dataUrlToBytes(body?.signature);
  if (!png) return c.json({ ok: false, error: "Signature manquante" }, 400);
  const key = `signatures/${doc.project_id}/${doc.id}-admin-${Date.now()}.png`;
  await c.env.MEDIA.put(key, png, { httpMetadata: { contentType: "image/png" } });
  await c.env.DB.prepare("UPDATE client_documents SET admin_signed_at = ?, admin_signature_key = ? WHERE id = ?").bind(nowIso(), key, doc.id).run();
  await buildSignedPdf(c.env, doc.id);
  await logActivity(c.env.DB, { projectId: doc.project_id, actor: "admin", action: "document_countersigned", detail: doc.title });
  const ctx = await projectContext(c.env.DB, doc.project_id);
  c.executionCtx.waitUntil(
    notifyClient(ctx.client, {
      subject: `Document finalisé : ${doc.title}`,
      title: "Votre document est signé par les deux parties ✓",
      body: `« ${doc.title} » a été contresigné par Impact Tech. La version finale (PDF) est téléchargeable dans votre espace.`,
      cta: "Télécharger le PDF",
    })
  );
  return c.json({ ok: true });
});

app.post("/documents/:id/rebuild", async (c) => {
  const key = await buildSignedPdf(c.env, parseInt(c.req.param("id"), 10));
  return c.json({ ok: !!key });
});

app.get("/documents/:id/file", async (c) => {
  const doc = await c.env.DB.prepare("SELECT * FROM client_documents WHERE id = ?").bind(parseInt(c.req.param("id"), 10)).first();
  if (!doc?.file_key) return c.json({ ok: false, error: "Pas de fichier" }, 404);
  return streamObject(c, doc.file_key, { name: doc.file_name || doc.title, mime: doc.file_mime, download: c.req.query("download") === "1" });
});

app.get("/documents/:id/signed", async (c) => {
  const doc = await c.env.DB.prepare("SELECT * FROM client_documents WHERE id = ?").bind(parseInt(c.req.param("id"), 10)).first();
  if (!doc?.r2_key) return c.json({ ok: false, error: "Pas encore signé" }, 404);
  return streamObject(c, doc.r2_key, { name: `${doc.title} (signé).pdf`, mime: "application/pdf", download: c.req.query("download") === "1" });
});

/* Aperçu PDF d'un document rédigé (avant envoi). */
app.get("/documents/:id/preview", async (c) => {
  const doc = await c.env.DB.prepare("SELECT * FROM client_documents WHERE id = ?").bind(parseInt(c.req.param("id"), 10)).first();
  if (!doc) return c.json({ ok: false, error: "Document introuvable" }, 404);
  if (doc.file_key) return streamObject(c, doc.file_key, { name: doc.file_name || doc.title, mime: doc.file_mime });
  const bytes = await textDocumentPdf(doc.title, doc.content || "");
  return new Response(bytes, { headers: { "content-type": "application/pdf", "cache-control": "no-store" } });
});

app.delete("/documents/:id", async (c) => {
  const doc = await c.env.DB.prepare("SELECT * FROM client_documents WHERE id = ?").bind(parseInt(c.req.param("id"), 10)).first();
  if (!doc) return c.json({ ok: true });
  for (const k of [doc.file_key, doc.r2_key, doc.admin_signature_key]) if (k && c.env.MEDIA) await c.env.MEDIA.delete(k).catch(() => {});
  await c.env.DB.prepare("DELETE FROM client_documents WHERE id = ?").bind(doc.id).run();
  return c.json({ ok: true });
});

/* ── Modèles de contrat ── */

app.get("/contract-templates", async (c) => {
  const { results } = await c.env.DB.prepare("SELECT id, title, content, pack, file_name, file_mime, active, created_at, updated_at FROM contract_templates ORDER BY pack, title").all();
  return c.json({ ok: true, templates: results || [], variables: VARIABLES });
});

app.post("/contract-templates", async (c) => {
  const body = await c.req.json().catch(() => null);
  const title = clampText(body?.title, 200);
  const content = String(body?.content || "").slice(0, 200000);
  if (!title || !content.trim()) return c.json({ ok: false, error: "Titre et contenu requis" }, 400);
  const res = await c.env.DB.prepare("INSERT INTO contract_templates (title, content, pack, active, created_at) VALUES (?, ?, ?, 1, ?)")
    .bind(title, content, clampText(body?.pack, 100) || null, nowIso())
    .run();
  return c.json({ ok: true, id: res.meta.last_row_id });
});

app.post("/contract-templates/upload", async (c) => {
  let form: FormData;
  try {
    form = await c.req.formData();
  } catch {
    return c.json({ ok: false, error: "Envoi invalide" }, 400);
  }
  const f = form.get("file");
  if (!f || typeof f === "string") return c.json({ ok: false, error: "Aucun fichier" }, 400);
  if (f.size > MAX_DOCUMENT_SIZE) return c.json({ ok: false, error: "Fichier trop lourd (30 Mo max)" }, 413);
  const name = sanitizeFileName(f.name);
  const key = fileKey("contract-templates", 0, name);
  await c.env.MEDIA.put(key, f.stream(), { httpMetadata: { contentType: f.type || "application/octet-stream" } });
  const title = clampText(form.get("title"), 200) || name.replace(/\.[a-z0-9]+$/i, "");
  const res = await c.env.DB.prepare("INSERT INTO contract_templates (title, content, pack, file_key, file_name, file_mime, active, created_at) VALUES (?, '', ?, ?, ?, ?, 1, ?)")
    .bind(title, clampText(form.get("pack"), 100) || null, key, name, f.type || "application/octet-stream", nowIso())
    .run();
  return c.json({ ok: true, id: res.meta.last_row_id });
});

app.put("/contract-templates/:id", async (c) => {
  const body = await c.req.json().catch(() => null);
  const sets: string[] = [];
  const vals: any[] = [];
  if (body?.title !== undefined) sets.push("title = ?"), vals.push(clampText(body.title, 200));
  if (body?.content !== undefined) sets.push("content = ?"), vals.push(String(body.content).slice(0, 200000));
  if (body?.pack !== undefined) sets.push("pack = ?"), vals.push(clampText(body.pack, 100) || null);
  if (body?.active !== undefined) sets.push("active = ?"), vals.push(body.active ? 1 : 0);
  if (!sets.length) return c.json({ ok: true });
  sets.push("updated_at = ?");
  vals.push(nowIso(), parseInt(c.req.param("id"), 10));
  await c.env.DB.prepare(`UPDATE contract_templates SET ${sets.join(", ")} WHERE id = ?`).bind(...vals).run();
  return c.json({ ok: true });
});

app.delete("/contract-templates/:id", async (c) => {
  const tpl = await c.env.DB.prepare("SELECT file_key FROM contract_templates WHERE id = ?").bind(parseInt(c.req.param("id"), 10)).first();
  if (tpl?.file_key && c.env.MEDIA) await c.env.MEDIA.delete(tpl.file_key).catch(() => {});
  await c.env.DB.prepare("DELETE FROM contract_templates WHERE id = ?").bind(parseInt(c.req.param("id"), 10)).run();
  return c.json({ ok: true });
});

app.get("/contract-templates/:id/file", async (c) => {
  const tpl = await c.env.DB.prepare("SELECT * FROM contract_templates WHERE id = ?").bind(parseInt(c.req.param("id"), 10)).first();
  if (!tpl?.file_key) return c.json({ ok: false, error: "Pas de fichier" }, 404);
  return streamObject(c, tpl.file_key, { name: tpl.file_name || tpl.title, mime: tpl.file_mime });
});

/* Aperçu d'un modèle rempli avec un client réel (ou des valeurs d'exemple). */
app.post("/contract-templates/preview", async (c) => {
  const body = await c.req.json().catch(() => null);
  let vars: Record<string, string>;
  const ctx = body?.project_id ? await projectContext(c.env.DB, parseInt(body.project_id, 10)) : null;
  if (ctx) vars = contractVariables(ctx);
  else
    vars = contractVariables({
      client: { name: "Marie Ngo", company: "Boutique Ngo & Fils", email: "marie@exemple.com", phone: "+237 6XX XX XX XX" },
      project: { title: "Site vitrine Boutique Ngo", pack: "Impact Essentiel", amount: 150000, currency: "XAF", start_date: new Date().toISOString(), due_date: new Date(Date.now() + 14 * 864e5).toISOString(), revision_rounds: 2, support_days: 30 },
    });
  return c.json({ ok: true, content: fillVariables(String(body?.content || ""), vars), variables: vars });
});

export default app;
