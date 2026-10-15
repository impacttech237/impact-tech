/* ------------------------------------------------------------------
   /api/admin/portal — clients : création (lien personnalisé), envoi
   du lien (email / WhatsApp / copier), code manuel, conversion d'une
   demande de devis en client + projet en 1 clic.
------------------------------------------------------------------- */
import { Hono } from "hono";
import { emailConfigured } from "../../lib/email";
import { generateAccessToken, samePhone, storeAuthCode, storeMemberCode, MANUAL_CODE_VALIDITY } from "../../lib/portal-auth";
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

/* ── Membres d'un client (collaborateurs) ──
   Chacun se connecte sur le lien du client avec SON numéro WhatsApp ou SON
   email. Droits : signer/valider, payer, coffre d'accès (non par défaut). */
const MEMBER_FIELDS = "id, client_id, name, role, email, phone, can_decide, can_pay, can_vault, active, last_seen_at, created_at";

function memberInput(body: any) {
  const name = clampText(body?.name, 120);
  const email = clampText(body?.email, 200).toLowerCase();
  const phone = clampText(body?.phone, 50);
  if (!name) throw new Error("Le nom est obligatoire.");
  if (email && !isEmail(email)) throw new Error("Email invalide.");
  if (!email && phone.replace(/\D/g, "").length < 8) throw new Error("Indiquez au moins un numéro WhatsApp ou un email : c'est ce qui permet de se connecter.");
  return {
    name,
    role: clampText(body?.role, 80) || null,
    email: email || null,
    phone: phone || null,
    can_decide: body?.can_decide ? 1 : 0,
    can_pay: body?.can_pay ? 1 : 0,
    can_vault: body?.can_vault ? 1 : 0,
  };
}

/* Un numéro ou un email ne doit désigner qu'une personne par espace :
   sinon on ne saurait pas à qui envoyer le code. */
async function contactTaken(db: any, client: any, m: { email: string | null; phone: string | null }, exceptMemberId?: number) {
  if (m.email && String(client.email || "").toLowerCase() === m.email) return "Cet email est déjà celui du client principal.";
  if (m.phone && client.phone && samePhone(m.phone, client.phone)) return "Ce numéro est déjà celui du client principal.";
  const { results } = await db.prepare("SELECT id, name, email, phone FROM client_members WHERE client_id = ? AND active = 1").bind(client.id).all();
  for (const r of results || []) {
    if (r.id === exceptMemberId) continue;
    if (m.email && String(r.email || "").toLowerCase() === m.email) return `Cet email est déjà utilisé par ${r.name}.`;
    if (m.phone && r.phone && samePhone(m.phone, r.phone)) return `Ce numéro est déjà utilisé par ${r.name}.`;
  }
  return null;
}

app.get("/clients/:id/members", async (c) => {
  const { results } = await c.env.DB.prepare(`SELECT ${MEMBER_FIELDS} FROM client_members WHERE client_id = ? ORDER BY active DESC, created_at`)
    .bind(parseInt(c.req.param("id"), 10))
    .all();
  return c.json({ ok: true, members: results || [] });
});

app.post("/clients/:id/members", async (c) => {
  const client = await c.env.DB.prepare("SELECT * FROM clients WHERE id = ?").bind(parseInt(c.req.param("id"), 10)).first();
  if (!client) return c.json({ ok: false, error: "Client introuvable" }, 404);
  let m;
  try {
    m = memberInput(await c.req.json().catch(() => null));
  } catch (e) {
    return c.json({ ok: false, error: (e as Error).message }, 400);
  }
  const taken = await contactTaken(c.env.DB, client, m);
  if (taken) return c.json({ ok: false, error: taken }, 409);
  const res = await c.env.DB.prepare(
    "INSERT INTO client_members (client_id, name, role, email, phone, can_decide, can_pay, can_vault, active, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)"
  )
    .bind(client.id, m.name, m.role, m.email, m.phone, m.can_decide, m.can_pay, m.can_vault, nowIso())
    .run();
  await logActivity(c.env.DB, { clientId: client.id, actor: "admin", action: "member_added", detail: `${m.name}${m.role ? ` (${m.role})` : ""}`, visible: false });
  const member = await c.env.DB.prepare(`SELECT ${MEMBER_FIELDS} FROM client_members WHERE id = ?`).bind(res.meta.last_row_id).first();
  return c.json({ ok: true, member, share: memberShare(client, member) });
});

app.put("/members/:id", async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  const current = await c.env.DB.prepare("SELECT * FROM client_members WHERE id = ?").bind(id).first();
  if (!current) return c.json({ ok: false, error: "Membre introuvable" }, 404);
  const client = await c.env.DB.prepare("SELECT * FROM clients WHERE id = ?").bind(current.client_id).first();
  const body = await c.req.json().catch(() => null);
  let m;
  try {
    m = memberInput({ ...current, ...body });
  } catch (e) {
    return c.json({ ok: false, error: (e as Error).message }, 400);
  }
  const active = body?.active === undefined ? current.active : body.active ? 1 : 0;
  if (active) {
    const taken = await contactTaken(c.env.DB, client, m, id);
    if (taken) return c.json({ ok: false, error: taken }, 409);
  }
  // Désactivé : le code en cours tombe aussi (et la session, via currentClient).
  await c.env.DB.prepare(
    `UPDATE client_members SET name = ?, role = ?, email = ?, phone = ?, can_decide = ?, can_pay = ?, can_vault = ?, active = ?${active ? "" : ", auth_code = NULL, auth_code_exp = NULL"} WHERE id = ?`
  )
    .bind(m.name, m.role, m.email, m.phone, m.can_decide, m.can_pay, m.can_vault, active, id)
    .run();
  if (active !== current.active) {
    await logActivity(c.env.DB, { clientId: current.client_id, actor: "admin", action: active ? "member_reactivated" : "member_removed", detail: m.name, visible: false });
  }
  const member = await c.env.DB.prepare(`SELECT ${MEMBER_FIELDS} FROM client_members WHERE id = ?`).bind(id).first();
  return c.json({ ok: true, member });
});

/* Retirer l'accès : le membre est désactivé (l'historique garde son nom). */
app.delete("/members/:id", async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  const m = await c.env.DB.prepare("SELECT client_id, name FROM client_members WHERE id = ?").bind(id).first();
  if (!m) return c.json({ ok: false, error: "Membre introuvable" }, 404);
  await c.env.DB.prepare("UPDATE client_members SET active = 0, auth_code = NULL, auth_code_exp = NULL WHERE id = ?").bind(id).run();
  await logActivity(c.env.DB, { clientId: m.client_id, actor: "admin", action: "member_removed", detail: m.name, visible: false });
  return c.json({ ok: true });
});

function memberShare(client: any, member: any) {
  const url = portalUrl(client);
  const first = String(member?.name || "").split(" ")[0];
  const team = client.company || client.name;
  const text =
    client.locale === "en"
      ? `Hello ${first}, ${client.name} has added you to the ${team} client space at Impact Tech: ${url}\nTo log in, tap "Get my code on WhatsApp" and enter your number.`
      : `Bonjour ${first}, ${client.name} vous a ajouté(e) à l'espace client ${team} chez Impact Tech : ${url}\nPour vous connecter, touchez « Recevoir mon code sur WhatsApp » et indiquez votre numéro.`;
  return { url, text, whatsapp: member?.phone ? waLink(member.phone, text) : `https://wa.me/?text=${encodeURIComponent(text)}` };
}

/* Code manuel (24 h) pour un membre, à lui transmettre par WhatsApp. */
app.post("/members/:id/code", async (c) => {
  const member = await c.env.DB.prepare("SELECT * FROM client_members WHERE id = ? AND active = 1").bind(parseInt(c.req.param("id"), 10)).first();
  if (!member) return c.json({ ok: false, error: "Membre introuvable ou retiré" }, 404);
  const client = await c.env.DB.prepare("SELECT * FROM clients WHERE id = ?").bind(member.client_id).first();
  const code = await storeMemberCode(c.env, member.id, MANUAL_CODE_VALIDITY);
  const first = String(member.name || "").split(" ")[0];
  const text =
    client.locale === "en"
      ? `Hello ${first}, your Impact Tech access code is ${code} (valid 24h). Your space: ${portalUrl(client)}`
      : `Bonjour ${first}, votre code d'accès Impact Tech est ${code} (valable 24 h). Votre espace : ${portalUrl(client)}`;
  await logActivity(c.env.DB, { clientId: client.id, actor: "admin", action: "manual_code", detail: member.name, visible: false });
  return c.json({ ok: true, code, text, whatsapp: member.phone ? waLink(member.phone, text) : `https://wa.me/?text=${encodeURIComponent(text)}` });
});

app.get("/members/:id/share", async (c) => {
  const member = await c.env.DB.prepare(`SELECT ${MEMBER_FIELDS} FROM client_members WHERE id = ?`).bind(parseInt(c.req.param("id"), 10)).first();
  if (!member) return c.json({ ok: false, error: "Membre introuvable" }, 404);
  const client = await c.env.DB.prepare("SELECT * FROM clients WHERE id = ?").bind(member.client_id).first();
  return c.json({ ok: true, share: memberShare(client, member) });
});

export default app;
