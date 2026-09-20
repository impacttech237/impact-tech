/* ------------------------------------------------------------------
   /api/portal/* — API publique du portail client.
   Auth : lien unique /portail/:access_token → code email → cookie.
------------------------------------------------------------------- */
import { Hono } from "hono";
import {
  requireClient,
  storeAuthCode,
  sendAuthCodeEmail,
  isCodeValid,
  createClientSession,
  clientCookieHeader,
  clearClientCookieHeader,
} from "../lib/portal-auth";
import { generateContractPdf, storeContractPdf } from "../lib/pdf";
import { sendEmail } from "../lib/email";
import { SITE_URL } from "../lib/seo";

const app = new Hono();

/* ── Auth : demande de code ── */

app.post("/request-code", async (c) => {
  if (!c.env.DB) return c.json({ ok: false, error: "Base indisponible" }, 503);

  const body = await c.req.json().catch(() => null);
  const accessToken = (body?.accessToken || "").trim();
  if (!accessToken) return c.json({ ok: false, error: "Token manquant" }, 400);

  const client = await c.env.DB.prepare(
    "SELECT * FROM clients WHERE access_token = ? AND active = 1"
  )
    .bind(accessToken)
    .first();
  if (!client) return c.json({ ok: false, error: "Lien invalide" }, 404);

  const code = await storeAuthCode(c.env.DB, client.id);
  c.executionCtx.waitUntil(sendAuthCodeEmail(client.email, client.name, code));

  const masked =
    client.email.slice(0, 3) +
    "***" +
    client.email.slice(client.email.indexOf("@"));

  return c.json({ ok: true, email: masked });
});

/* ── Auth : vérification du code ── */

app.post("/verify-code", async (c) => {
  if (!c.env.DB) return c.json({ ok: false, error: "Base indisponible" }, 503);

  const body = await c.req.json().catch(() => null);
  const accessToken = (body?.accessToken || "").trim();
  const code = (body?.code || "").trim();
  if (!accessToken || !code)
    return c.json({ ok: false, error: "Données manquantes" }, 400);

  const client = await c.env.DB.prepare(
    "SELECT * FROM clients WHERE access_token = ? AND active = 1"
  )
    .bind(accessToken)
    .first();
  if (!client) return c.json({ ok: false, error: "Lien invalide" }, 404);

  if (!isCodeValid(client, code))
    return c.json({ ok: false, error: "Code invalide ou expiré" }, 401);

  // Clear the code
  await c.env.DB.prepare(
    "UPDATE clients SET auth_code = NULL, auth_code_exp = NULL WHERE id = ?"
  )
    .bind(client.id)
    .run();

  const token = await createClientSession(c.env, client.id, client.access_token);
  c.header("Set-Cookie", clientCookieHeader(token));

  return c.json({ ok: true, client: { name: client.name, email: client.email, company: client.company } });
});

/* ── Auth : déconnexion ── */

app.post("/logout", (c) => {
  c.header("Set-Cookie", clearClientCookieHeader());
  return c.json({ ok: true });
});

/* ── Session : vérifier le cookie ── */

app.get("/me", async (c) => {
  const denied = await requireClient(c);
  if (denied) return denied;
  const client = c.get("client");
  return c.json({
    ok: true,
    client: { id: client.id, name: client.name, email: client.email, company: client.company },
  });
});

/* ── Projets du client ── */

app.get("/projects", async (c) => {
  const denied = await requireClient(c);
  if (denied) return denied;
  const client = c.get("client");

  const { results } = await c.env.DB.prepare(
    "SELECT * FROM client_projects WHERE client_id = ? ORDER BY created_at DESC"
  )
    .bind(client.id)
    .all();

  return c.json({ ok: true, projects: results });
});

/* ── Documents d'un projet ── */

app.get("/projects/:projectId/documents", async (c) => {
  const denied = await requireClient(c);
  if (denied) return denied;
  const client = c.get("client");
  const projectId = parseInt(c.req.param("projectId"), 10);

  // Vérifier que le projet appartient au client
  const project = await c.env.DB.prepare(
    "SELECT * FROM client_projects WHERE id = ? AND client_id = ?"
  )
    .bind(projectId, client.id)
    .first();
  if (!project) return c.json({ ok: false, error: "Projet introuvable" }, 404);

  const { results } = await c.env.DB.prepare(
    `SELECT d.*, s.signed_at, s.id as signature_id
     FROM client_documents d
     LEFT JOIN signatures s ON s.document_id = d.id
     WHERE d.project_id = ?
     ORDER BY d.created_at DESC`
  )
    .bind(projectId)
    .all();

  return c.json({ ok: true, documents: results });
});

/* ── Lire un document/contrat ── */

app.get("/documents/:docId", async (c) => {
  const denied = await requireClient(c);
  if (denied) return denied;
  const client = c.get("client");
  const docId = parseInt(c.req.param("docId"), 10);

  const doc = await c.env.DB.prepare(
    `SELECT d.*, p.client_id
     FROM client_documents d
     JOIN client_projects p ON p.id = d.project_id
     WHERE d.id = ? AND p.client_id = ?`
  )
    .bind(docId, client.id)
    .first();
  if (!doc) return c.json({ ok: false, error: "Document introuvable" }, 404);

  const signature = await c.env.DB.prepare(
    "SELECT id, approval_text, signed_at FROM signatures WHERE document_id = ? AND client_id = ?"
  )
    .bind(docId, client.id)
    .first();

  return c.json({ ok: true, document: doc, signature });
});

/* ── Signer un contrat ── */

app.post("/documents/:docId/sign", async (c) => {
  const denied = await requireClient(c);
  if (denied) return denied;
  const client = c.get("client");
  const docId = parseInt(c.req.param("docId"), 10);

  const doc = await c.env.DB.prepare(
    `SELECT d.*, p.client_id, p.id as project_id
     FROM client_documents d
     JOIN client_projects p ON p.id = d.project_id
     WHERE d.id = ? AND p.client_id = ? AND d.status = 'sent'`
  )
    .bind(docId, client.id)
    .first();
  if (!doc)
    return c.json({ ok: false, error: "Document introuvable ou déjà signé" }, 404);

  // Vérifier qu'il n'y a pas déjà une signature
  const existing = await c.env.DB.prepare(
    "SELECT id FROM signatures WHERE document_id = ? AND client_id = ?"
  )
    .bind(docId, client.id)
    .first();
  if (existing)
    return c.json({ ok: false, error: "Document déjà signé" }, 409);

  const body = await c.req.json().catch(() => null);
  const approvalText = (body?.approvalText || "").trim();
  const signatureData = (body?.signature || "").trim();

  if (approvalText !== "Lu et approuvé")
    return c.json(
      { ok: false, error: 'Vous devez saisir exactement "Lu et approuvé"' },
      400
    );

  if (!signatureData || !signatureData.startsWith("data:image/"))
    return c.json({ ok: false, error: "Signature manquante" }, 400);

  // Stocker la signature PNG dans R2
  const sigB64 = signatureData.replace(/^data:image\/\w+;base64,/, "");
  const sigRaw = atob(sigB64);
  const sigBytes = new Uint8Array(sigRaw.length);
  for (let i = 0; i < sigRaw.length; i++) sigBytes[i] = sigRaw.charCodeAt(i);

  const sigKey = `signatures/${doc.project_id}/${docId}-${Date.now()}.png`;
  await c.env.MEDIA.put(sigKey, sigBytes, {
    httpMetadata: { contentType: "image/png" },
  });

  const ip = c.req.header("cf-connecting-ip") || c.req.header("x-forwarded-for") || "";
  const ua = c.req.header("user-agent") || "";
  const signedAt = new Date().toISOString();

  // Enregistrer la signature
  await c.env.DB.prepare(
    `INSERT INTO signatures (document_id, client_id, approval_text, signature_r2, ip_address, user_agent, signed_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(docId, client.id, approvalText, sigKey, ip, ua, signedAt)
    .run();

  // Mettre à jour le statut du document
  await c.env.DB.prepare(
    "UPDATE client_documents SET status = 'signed', updated_at = ? WHERE id = ?"
  )
    .bind(signedAt, docId)
    .run();

  // Générer le PDF signé
  let pdfR2Key: string | null = null;
  try {
    const pdfBytes = generateContractPdf({
      title: doc.title,
      content: doc.content || "",
      clientName: client.name,
      approvalText,
      signatureB64: signatureData,
      signedAt: new Date(signedAt).toLocaleString("fr-FR", { timeZone: "Africa/Douala" }),
      ipAddress: ip,
    });
    pdfR2Key = await storeContractPdf(c.env, doc.project_id, docId, pdfBytes);
    await c.env.DB.prepare(
      "UPDATE client_documents SET r2_key = ? WHERE id = ?"
    )
      .bind(pdfR2Key, docId)
      .run();
  } catch (e) {
    console.error("PDF generation error:", (e as Error).message);
  }

  // Notification admin
  c.executionCtx.waitUntil(
    sendEmail({
      to: "impacttech237@gmail.com",
      subject: `Contrat signé — ${client.name} (${doc.title})`,
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
  <h2 style="margin:0 0 16px;font-size:20px">Contrat signé ✓</h2>
  <p><strong>${client.name}</strong> a signé le document « ${doc.title} ».</p>
  <p>Date : ${new Date(signedAt).toLocaleString("fr-FR", { timeZone: "Africa/Douala" })}</p>
  <p style="text-align:center;margin:24px 0">
    <a href="${SITE_URL}/admin" style="display:inline-block;background:#C0202B;color:#fff;text-decoration:none;padding:12px 28px;border-radius:100px;font-weight:600">Voir dans l'admin</a>
  </p>
</td></tr>
</table>
</td></tr></table>
</body></html>`,
    })
  );

  return c.json({ ok: true, pdfAvailable: !!pdfR2Key });
});

/* ── Télécharger le PDF signé ── */

app.get("/documents/:docId/pdf", async (c) => {
  const denied = await requireClient(c);
  if (denied) return denied;
  const client = c.get("client");
  const docId = parseInt(c.req.param("docId"), 10);

  const doc = await c.env.DB.prepare(
    `SELECT d.r2_key, d.title, p.client_id
     FROM client_documents d
     JOIN client_projects p ON p.id = d.project_id
     WHERE d.id = ? AND p.client_id = ? AND d.r2_key IS NOT NULL`
  )
    .bind(docId, client.id)
    .first();
  if (!doc) return c.json({ ok: false, error: "PDF non disponible" }, 404);

  const obj = await c.env.MEDIA.get(doc.r2_key);
  if (!obj) return c.json({ ok: false, error: "Fichier introuvable" }, 404);

  const headers = new Headers();
  headers.set("content-type", "application/pdf");
  headers.set(
    "content-disposition",
    `attachment; filename="${encodeURIComponent(doc.title)}.pdf"`
  );
  headers.set("cache-control", "private, no-cache");
  return new Response(obj.body, { headers });
});

/* ── Fichiers d'un projet ── */

app.get("/projects/:projectId/files", async (c) => {
  const denied = await requireClient(c);
  if (denied) return denied;
  const client = c.get("client");
  const projectId = parseInt(c.req.param("projectId"), 10);

  const project = await c.env.DB.prepare(
    "SELECT id FROM client_projects WHERE id = ? AND client_id = ?"
  )
    .bind(projectId, client.id)
    .first();
  if (!project) return c.json({ ok: false, error: "Projet introuvable" }, 404);

  const { results } = await c.env.DB.prepare(
    "SELECT * FROM client_files WHERE project_id = ? ORDER BY created_at DESC"
  )
    .bind(projectId)
    .all();

  return c.json({ ok: true, files: results });
});

/* ── Télécharger un fichier ── */

app.get("/files/:fileId", async (c) => {
  const denied = await requireClient(c);
  if (denied) return denied;
  const client = c.get("client");
  const fileId = parseInt(c.req.param("fileId"), 10);

  const file = await c.env.DB.prepare(
    `SELECT f.*, p.client_id
     FROM client_files f
     JOIN client_projects p ON p.id = f.project_id
     WHERE f.id = ? AND p.client_id = ?`
  )
    .bind(fileId, client.id)
    .first();
  if (!file) return c.json({ ok: false, error: "Fichier introuvable" }, 404);

  const obj = await c.env.MEDIA.get(file.r2_key);
  if (!obj) return c.json({ ok: false, error: "Fichier introuvable" }, 404);

  const headers = new Headers();
  headers.set("content-type", file.mime_type || "application/octet-stream");
  headers.set(
    "content-disposition",
    `attachment; filename="${encodeURIComponent(file.name)}"`
  );
  return new Response(obj.body, { headers });
});

export default app;
