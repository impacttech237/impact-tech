/* ------------------------------------------------------------------
   /api/admin/portal — clients : création (lien personnalisé), envoi
   du lien (email / WhatsApp / copier), code manuel, conversion d'une
   demande de devis en client + projet en 1 clic.
------------------------------------------------------------------- */
import { Hono } from "hono";
import { emailConfigured } from "../../lib/email";
import { generateAccessToken, storeAuthCode, MANUAL_CODE_VALIDITY } from "../../lib/portal-auth";
import { portalUrl, sendPortalLinkEmail } from "../../lib/portal/mail";
import { createProjectFromTemplate } from "../../lib/portal/projects";
import { deleteProjectObjects } from "../../lib/portal/files";
import { clampText, logActivity, nowIso, portalSettings, referralCode, uniqueClientSlug, waLink } from "../../lib/portal/util";

const app = new Hono();

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

async function newReferralCode(db: any) {
  for (let i = 0; i < 10; i++) {
    const code = referralCode();
    if (!(await db.prepare("SELECT id FROM clients WHERE referral_code = ?").bind(code).first())) return code;
  }
  return referralCode() + referralCode().slice(0, 2);
}

function shareInfo(client: any, settings: any) {
  const url = portalUrl(client);
  const first = String(client.name || "").split(" ")[0];
  const text =
    client.locale === "en"
      ? `Hello ${first}, here is your Impact Tech client space: ${url}\nYou'll follow your project, send us your files and sign your documents there.`
      : `Bonjour ${first}, voici votre espace client Impact Tech : ${url}\nVous y suivrez votre projet, nous enverrez vos fichiers et signerez vos documents.`;
  return { url, text, whatsapp: client.phone ? waLink(client.phone, text) : `https://wa.me/?text=${encodeURIComponent(text)}` };
}

app.get("/clients", async (c) => {
  const search = `%${(c.req.query("search") || "").trim()}%`;
  const { results } = await c.env.DB.prepare(
    `SELECT c.id, c.name, c.email, c.phone, c.company, c.slug, c.access_token, c.locale, c.active, c.created_at, c.last_seen_at, c.referral_code,
            (SELECT COUNT(*) FROM client_projects p WHERE p.client_id = c.id) AS project_count,
            (SELECT COUNT(*) FROM contact_requests r WHERE r.referral_code = c.referral_code AND c.referral_code IS NOT NULL) AS referrals
     FROM clients c
     WHERE c.name LIKE ? OR c.email LIKE ? OR c.company LIKE ? OR c.phone LIKE ?
     ORDER BY c.created_at DESC`
  )
    .bind(search, search, search, search)
    .all();
  return c.json({ ok: true, clients: (results || []).map((cl: any) => ({ ...cl, portal_url: portalUrl(cl) })), emailEnabled: emailConfigured(c.env) });
});

async function createClient(db: any, input: any) {
  const name = clampText(input?.name, 200);
  const email = clampText(input?.email, 200).toLowerCase();
  if (!name) throw new Error("Le nom est obligatoire.");
  if (email && !isEmail(email)) throw new Error("Email invalide.");
  if (!email && !input?.phone) throw new Error("Indiquez au moins un email ou un téléphone.");
  const slug = await uniqueClientSlug(db, input?.slug || input?.company || name);
  const res = await db
    .prepare(
      `INSERT INTO clients (name, email, phone, company, access_token, slug, locale, referral_code, source_request_id, active, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`
    )
    .bind(
      name,
      email,
      clampText(input?.phone, 50) || null,
      clampText(input?.company, 200) || null,
      generateAccessToken(),
      slug,
      input?.locale === "en" ? "en" : "fr",
      await newReferralCode(db),
      input?.source_request_id || null,
      nowIso()
    )
    .run();
  return db.prepare("SELECT * FROM clients WHERE id = ?").bind(res.meta.last_row_id).first();
}

app.post("/clients", async (c) => {
  const body = await c.req.json().catch(() => null);
  try {
    const client = await createClient(c.env.DB, body);
    await logActivity(c.env.DB, { clientId: client.id, actor: "admin", action: "client_created", detail: client.name, visible: false });
    const settings = await portalSettings(c.env.DB);
    return c.json({ ok: true, client: { ...client, portal_url: portalUrl(client) }, share: shareInfo(client, settings) });
  } catch (e) {
    return c.json({ ok: false, error: (e as Error).message }, 400);
  }
});

app.put("/clients/:id", async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  const body = await c.req.json().catch(() => null);
  if (!body) return c.json({ ok: false, error: "Corps invalide" }, 400);
  if (body.email && !isEmail(String(body.email).trim())) return c.json({ ok: false, error: "Email invalide." }, 400);
  const fields: string[] = [];
  const vals: any[] = [];
  for (const key of ["name", "email", "phone", "company", "internal_notes"]) {
    if (body[key] !== undefined) {
      fields.push(`${key} = ?`);
      vals.push(clampText(body[key], key === "internal_notes" ? 10000 : 200) || (key === "email" ? "" : null));
    }
  }
  if (body.locale !== undefined) {
    fields.push("locale = ?");
    vals.push(body.locale === "en" ? "en" : "fr");
  }
  if (body.active !== undefined) {
    fields.push("active = ?");
    vals.push(body.active ? 1 : 0);
  }
  if (body.slug !== undefined && String(body.slug).trim()) {
    fields.push("slug = ?");
    vals.push(await uniqueClientSlug(c.env.DB, body.slug, id));
  }
  if (!fields.length) return c.json({ ok: true });
  vals.push(id);
  await c.env.DB.prepare(`UPDATE clients SET ${fields.join(", ")} WHERE id = ?`).bind(...vals).run();
  const client = await c.env.DB.prepare("SELECT * FROM clients WHERE id = ?").bind(id).first();
  return c.json({ ok: true, client: client && { ...client, portal_url: portalUrl(client) } });
});

app.delete("/clients/:id", async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  // Supprime aussi tous les objets R2 de ses projets (données personnelles).
  const { results } = await c.env.DB.prepare("SELECT id FROM client_projects WHERE client_id = ?").bind(id).all();
  await deleteProjectObjects(c.env, (results || []).map((p: any) => p.id));
  await c.env.DB.prepare("DELETE FROM clients WHERE id = ?").bind(id).run();
  return c.json({ ok: true });
});

/* Envoi du lien : email si possible, toujours le texte prêt pour WhatsApp. */
app.post("/clients/:id/send-link", async (c) => {
  const client = await c.env.DB.prepare("SELECT * FROM clients WHERE id = ?").bind(parseInt(c.req.param("id"), 10)).first();
  if (!client) return c.json({ ok: false, error: "Client introuvable" }, 404);
  const settings = await portalSettings(c.env.DB);
  const share = shareInfo(client, settings);
  let email: { ok: boolean; error?: string } = { ok: false, error: "Ce client n'a pas d'email." };
  if (client.email) email = await sendPortalLinkEmail(client);
  if (email.ok) await logActivity(c.env.DB, { clientId: client.id, actor: "admin", action: "link_sent", detail: client.email, visible: false });
  return c.json({ ok: true, emailSent: email.ok, emailError: email.error || null, share });
});

app.get("/clients/:id/share", async (c) => {
  const client = await c.env.DB.prepare("SELECT * FROM clients WHERE id = ?").bind(parseInt(c.req.param("id"), 10)).first();
  if (!client) return c.json({ ok: false, error: "Client introuvable" }, 404);
  return c.json({ ok: true, share: shareInfo(client, await portalSettings(c.env.DB)) });
});

/* Code manuel (24 h) à transmettre par téléphone ou WhatsApp. */
app.post("/clients/:id/code", async (c) => {
  const client = await c.env.DB.prepare("SELECT * FROM clients WHERE id = ?").bind(parseInt(c.req.param("id"), 10)).first();
  if (!client) return c.json({ ok: false, error: "Client introuvable" }, 404);
  const code = await storeAuthCode(c.env, client.id, MANUAL_CODE_VALIDITY);
  const first = String(client.name || "").split(" ")[0];
  const text =
    client.locale === "en"
      ? `Hello ${first}, your Impact Tech access code is ${code} (valid 24h). Your space: ${portalUrl(client)}`
      : `Bonjour ${first}, votre code d'accès Impact Tech est ${code} (valable 24 h). Votre espace : ${portalUrl(client)}`;
  await logActivity(c.env.DB, { clientId: client.id, actor: "admin", action: "manual_code", visible: false });
  return c.json({ ok: true, code, text, whatsapp: client.phone ? waLink(client.phone, text) : `https://wa.me/?text=${encodeURIComponent(text)}` });
});

/* Demande de devis -> client + projet (modèle du pack) en 1 clic. */
app.post("/from-request/:requestId", async (c) => {
  const req = await c.env.DB.prepare("SELECT * FROM contact_requests WHERE id = ?").bind(parseInt(c.req.param("requestId"), 10)).first();
  if (!req) return c.json({ ok: false, error: "Demande introuvable" }, 404);
  if (req.converted_client_id) return c.json({ ok: false, error: "Cette demande a déjà été convertie en client." }, 409);
  const body = await c.req.json().catch(() => ({}));
  try {
    const client = await createClient(c.env.DB, {
      name: body?.name || req.name,
      email: body?.email ?? req.email,
      phone: body?.phone || req.phone,
      company: body?.company ?? req.company,
      locale: body?.locale,
      source_request_id: req.id,
    });
    const pack = clampText(body?.pack || req.project_type, 100) || "Impact Essentiel";
    const amount = body?.amount ? Math.round(Number(body.amount)) : null;
    const { projectId } = await createProjectFromTemplate(c.env.DB, {
      clientId: client.id,
      title: clampText(body?.title, 200) || `Site ${client.company || client.name}`,
      pack,
      amount,
      description: req.message || "",
    });
    await c.env.DB.prepare("UPDATE contact_requests SET converted_client_id = ?, status = 'done' WHERE id = ?").bind(client.id, req.id).run();
    await logActivity(c.env.DB, { projectId, clientId: client.id, actor: "admin", action: "project_created", detail: pack });
    return c.json({ ok: true, client: { ...client, portal_url: portalUrl(client) }, projectId, share: shareInfo(client, await portalSettings(c.env.DB)) });
  } catch (e) {
    return c.json({ ok: false, error: (e as Error).message }, 400);
  }
});

export default app;
