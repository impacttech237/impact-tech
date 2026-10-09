/* ------------------------------------------------------------------
   /api/admin/portal — devis/factures, avis clients, réglages du
   portail (email, WhatsApp, parrainage).
------------------------------------------------------------------- */
import { Hono } from "hono";
import { emailConfigured, sendEmailDetailed, ADMIN_EMAIL, baseLayout } from "../../lib/email";
import { itemsTotal, nextInvoiceNumber, normalizeItems, renderInvoicePdf } from "../../lib/portal/billing";
import { notifyClient } from "../../lib/portal/mail";
import { clampText, formatMoney, logActivity, nowIso, parseJson, portalSettings } from "../../lib/portal/util";

const app = new Hono();

const clientForProject = (db: any, projectId: number) =>
  db.prepare("SELECT c.*, p.title AS project_title FROM client_projects p JOIN clients c ON c.id = p.client_id WHERE p.id = ?").bind(projectId).first();

/* ── Devis / factures ── */

app.get("/projects/:id/invoices", async (c) => {
  const { results } = await c.env.DB.prepare("SELECT * FROM invoices WHERE project_id = ? ORDER BY created_at DESC").bind(parseInt(c.req.param("id"), 10)).all();
  return c.json({ ok: true, invoices: (results || []).map((i: any) => ({ ...i, items: parseJson(i.items, []) })) });
});

app.post("/projects/:id/invoices", async (c) => {
  const projectId = parseInt(c.req.param("id"), 10);
  const body = await c.req.json().catch(() => null);
  const kind = body?.kind === "devis" ? "devis" : "facture";
  const title = clampText(body?.title, 200);
  const items = normalizeItems(body?.items);
  if (!title || !items.length) return c.json({ ok: false, error: "Titre et au moins une ligne requis" }, 400);
  const amount = itemsTotal(items);
  if (amount < 50) return c.json({ ok: false, error: "Montant trop faible" }, 400);
  // Numéro unique : en cas de création simultanée (double clic), on réessaie.
  let number = "";
  let res: any = null;
  for (let attempt = 0; attempt < 4 && !res; attempt++) {
    number = await nextInvoiceNumber(c.env.DB, kind);
    try {
      res = await c.env.DB.prepare(
        "INSERT INTO invoices (project_id, kind, number, title, items, amount, currency, status, due_date, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'brouillon', ?, ?, ?)"
      )
        .bind(projectId, kind, number, title, JSON.stringify(items), amount, body?.currency === "EUR" ? "EUR" : "XAF", body?.due_date || null, clampText(body?.notes, 3000) || null, nowIso())
        .run();
    } catch (e) {
      if (!/UNIQUE/i.test((e as Error).message)) throw e;
    }
  }
  if (!res) return c.json({ ok: false, error: "Numérotation impossible, réessayez." }, 409);
  // mini-devis issu d'une demande hors périmètre
  if (body?.request_id) {
    await c.env.DB.prepare("UPDATE project_requests SET status = 'devis', kind = 'hors_perimetre', invoice_id = ?, updated_at = ? WHERE id = ? AND project_id = ?")
      .bind(res.meta.last_row_id, nowIso(), parseInt(body.request_id, 10), projectId)
      .run();
  }
  return c.json({ ok: true, id: res.meta.last_row_id, number });
});

app.put("/invoices/:id", async (c) => {
  const inv = await c.env.DB.prepare("SELECT * FROM invoices WHERE id = ?").bind(parseInt(c.req.param("id"), 10)).first();
  if (!inv) return c.json({ ok: false, error: "Introuvable" }, 404);
  const body = await c.req.json().catch(() => null);
  if (inv.status === "paye" && body?.status !== "annule") return c.json({ ok: false, error: "Document déjà payé" }, 409);
  const sets: string[] = [];
  const vals: any[] = [];
  if (body?.title !== undefined) sets.push("title = ?"), vals.push(clampText(body.title, 200));
  if (body?.items !== undefined) {
    const items = normalizeItems(body.items);
    if (!items.length) return c.json({ ok: false, error: "Au moins une ligne" }, 400);
    sets.push("items = ?", "amount = ?");
    vals.push(JSON.stringify(items), itemsTotal(items));
  }
  if (body?.due_date !== undefined) sets.push("due_date = ?"), vals.push(body.due_date || null);
  if (body?.notes !== undefined) sets.push("notes = ?"), vals.push(clampText(body.notes, 3000) || null);
  if (body?.status && ["brouillon", "envoye", "accepte", "refuse", "paye", "annule"].includes(body.status)) {
    sets.push("status = ?");
    vals.push(body.status);
    if (body.status === "paye") sets.push("paid_at = ?"), vals.push(nowIso());
  }
  if (!sets.length) return c.json({ ok: true });
  sets.push("updated_at = ?");
  vals.push(nowIso(), inv.id);
  await c.env.DB.prepare(`UPDATE invoices SET ${sets.join(", ")} WHERE id = ?`).bind(...vals).run();
  if (body?.status === "paye" && inv.status !== "paye") {
    await logActivity(c.env.DB, { projectId: inv.project_id, actor: "admin", action: "invoice_paid", detail: `${inv.title} — ${formatMoney(inv.amount, inv.currency)} (paiement enregistré)` });
  }
  return c.json({ ok: true });
});

app.post("/invoices/:id/send", async (c) => {
  const inv = await c.env.DB.prepare("SELECT * FROM invoices WHERE id = ?").bind(parseInt(c.req.param("id"), 10)).first();
  if (!inv) return c.json({ ok: false, error: "Introuvable" }, 404);
  if (!["brouillon", "envoye"].includes(inv.status)) return c.json({ ok: false, error: "Déjà traité" }, 409);
  await c.env.DB.prepare("UPDATE invoices SET status = 'envoye', sent_at = ?, updated_at = ? WHERE id = ?").bind(nowIso(), nowIso(), inv.id).run();
  await logActivity(c.env.DB, { projectId: inv.project_id, actor: "admin", action: inv.kind === "devis" ? "quote_sent" : "invoice_sent", detail: `${inv.title} — ${formatMoney(inv.amount, inv.currency)}` });
  const client = await clientForProject(c.env.DB, inv.project_id);
  const email = await notifyClient(client, {
    subject: inv.kind === "devis" ? `Devis : ${inv.title}` : `Facture : ${inv.title}`,
    title: inv.kind === "devis" ? "Un devis attend votre réponse" : "Votre facture est disponible",
    body:
      inv.kind === "devis"
        ? `Montant : ${formatMoney(inv.amount, inv.currency)}. Vous pouvez l'accepter ou le refuser en un clic depuis votre espace.`
        : `Montant : ${formatMoney(inv.amount, inv.currency)}. Vous pouvez la régler par Mobile Money (MTN / Orange) directement depuis votre espace.`,
    cta: inv.kind === "devis" ? "Voir le devis" : "Voir et payer",
  });
  return c.json({ ok: true, emailSent: !!email?.ok });
});

app.get("/invoices/:id/pdf", async (c) => {
  const inv = await c.env.DB.prepare("SELECT * FROM invoices WHERE id = ?").bind(parseInt(c.req.param("id"), 10)).first();
  if (!inv) return c.json({ ok: false, error: "Introuvable" }, 404);
  const bytes = await renderInvoicePdf(c.env.DB, inv, c.req.query("receipt") === "1" && inv.status === "paye");
  return new Response(bytes, { headers: { "content-type": "application/pdf", "content-disposition": `inline; filename="${inv.number}.pdf"`, "cache-control": "no-store" } });
});

app.delete("/invoices/:id", async (c) => {
  const inv = await c.env.DB.prepare("SELECT status FROM invoices WHERE id = ?").bind(parseInt(c.req.param("id"), 10)).first();
  if (inv?.status === "paye") return c.json({ ok: false, error: "Une facture payée ne se supprime pas : annulez-la." }, 409);
  await c.env.DB.prepare("DELETE FROM invoices WHERE id = ?").bind(parseInt(c.req.param("id"), 10)).run();
  return c.json({ ok: true });
});

/* ── Avis clients ── */

app.get("/reviews", async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT r.*, c.name AS client_name, c.company AS client_company, p.title AS project_title FROM client_reviews r
     JOIN clients c ON c.id = r.client_id JOIN client_projects p ON p.id = r.project_id ORDER BY r.created_at DESC`
  ).all();
  return c.json({ ok: true, reviews: results || [] });
});

/* Publie un avis (autorisé par le client) dans les témoignages du site. */
app.post("/reviews/:id/publish", async (c) => {
  const r = await c.env.DB.prepare(
    "SELECT r.*, c.name AS client_name, c.company AS client_company FROM client_reviews r JOIN clients c ON c.id = r.client_id WHERE r.id = ?"
  )
    .bind(parseInt(c.req.param("id"), 10))
    .first();
  if (!r) return c.json({ ok: false, error: "Avis introuvable" }, 404);
  if (!r.allow_publish) return c.json({ ok: false, error: "Le client n'a pas autorisé la publication." }, 403);
  if (r.testimonial_id) return c.json({ ok: false, error: "Déjà publié" }, 409);
  const initials = String(r.client_name).split(/\s+/).map((w: string) => w[0] || "").join("").slice(0, 2).toUpperCase();
  const res = await c.env.DB.prepare("INSERT INTO testimonials (name, role, text, initials, sort_order, active) VALUES (?, ?, ?, ?, 0, 1)")
    .bind(r.client_name, r.client_company || "", r.text, initials)
    .run();
  await c.env.DB.prepare("UPDATE client_reviews SET testimonial_id = ? WHERE id = ?").bind(res.meta.last_row_id, r.id).run();
  return c.json({ ok: true });
});

/* Demande d'avis au client (après livraison). */
app.post("/projects/:id/ask-review", async (c) => {
  const client = await clientForProject(c.env.DB, parseInt(c.req.param("id"), 10));
  if (!client) return c.json({ ok: false, error: "Projet introuvable" }, 404);
  const email = await notifyClient(client, {
    subject: "Votre avis compte énormément pour nous",
    title: "Comment s'est passé votre projet ?",
    body: "Ça prend 30 secondes : une note et quelques mots. Votre avis aide d'autres entrepreneurs à nous faire confiance.",
    cta: "Donner mon avis",
  });
  await logActivity(c.env.DB, { projectId: parseInt(c.req.param("id"), 10), actor: "admin", action: "review_requested", visible: false });
  return c.json({ ok: true, emailSent: !!email?.ok });
});

/* ── Réglages du portail ── */

app.get("/settings", async (c) => {
  const s = await portalSettings(c.env.DB);
  return c.json({
    ok: true,
    settings: { portal_whatsapp: s.portal_whatsapp, referral_reward: s.referral_reward, phone_link: s.phone_link },
    email: { configured: emailConfigured(c.env), from: c.env.EMAIL_FROM || "Impact Tech <portail@impacttech237.com>" },
    vaultKey: !!c.env.VAULT_KEY,
    kpay: !!c.env.KPAY_API_KEY,
  });
});

app.put("/settings", async (c) => {
  const body = await c.req.json().catch(() => null);
  const stmts = [];
  for (const key of ["portal_whatsapp", "referral_reward"]) {
    if (body?.[key] !== undefined) stmts.push(c.env.DB.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").bind(key, clampText(body[key], 500)));
  }
  if (stmts.length) await c.env.DB.batch(stmts);
  return c.json({ ok: true });
});

app.post("/settings/test-email", async (c) => {
  const res = await sendEmailDetailed({
    to: ADMIN_EMAIL,
    subject: "Test d'envoi — Portail Impact Tech",
    html: baseLayout(`<h2 style="margin:0 0 16px;color:#f7efd9">Ça marche ✓</h2><p>Les emails du portail client partent correctement.</p>`),
  });
  return c.json({ ok: res.ok, error: res.error || null });
});

/* Parrainages : demandes de devis arrivées avec un code client. */
app.get("/referrals", async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT r.id, r.name, r.phone, r.email, r.created_at, r.status, r.referral_code, c.name AS referrer_name, c.id AS referrer_id
     FROM contact_requests r JOIN clients c ON c.referral_code = r.referral_code ORDER BY r.created_at DESC`
  ).all();
  return c.json({ ok: true, referrals: results || [] });
});

export default app;
