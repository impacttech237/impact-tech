/* ------------------------------------------------------------------
   /api/portal — devis et factures : consulter, accepter un devis,
   payer par Mobile Money (K-PAY, mode Gateway), télécharger le reçu.
   Architecture K-PAY : .claude/skills/kpay-payments/SKILL.md
------------------------------------------------------------------- */
import { Hono } from "hono";
import { generatePaymentExternalId, initGatewayPayment } from "../../lib/kpay";
import { RIGHT_ERRORS, actorName, can } from "../../lib/portal-auth";
import { renderInvoicePdf } from "../../lib/portal/billing";
import { notifyAdmin } from "../../lib/portal/mail";
import { clientIp, formatMoney, logActivity, nowIso, parseJson } from "../../lib/portal/util";
import { SITE_URL } from "../../lib/seo";
import { fail, ownedProject, ownedRow, withClient } from "./common";

const app = new Hono();

app.get("/projects/:id/invoices", async (c) => {
  const r = await withClient(c);
  if ("denied" in r) return r.denied;
  const project = await ownedProject(c, r.client, c.req.param("id"));
  if (!project) return fail(c, "Projet introuvable", 404);
  const { results } = await c.env.DB.prepare(
    "SELECT id, kind, number, title, items, amount, currency, status, due_date, notes, sent_at, accepted_at, paid_at, created_at FROM invoices WHERE project_id = ? AND status != 'brouillon' ORDER BY created_at DESC"
  )
    .bind(project.id)
    .all();
  return c.json({ ok: true, invoices: (results || []).map((i: any) => ({ ...i, items: parseJson(i.items, []) })) });
});

app.get("/invoices/:id/pdf", async (c) => {
  const r = await withClient(c);
  if ("denied" in r) return r.denied;
  const invoice = await ownedRow(c, r.client, "invoices", c.req.param("id"));
  if (!invoice || invoice.status === "brouillon") return fail(c, "Document introuvable", 404);
  const receipt = c.req.query("receipt") === "1" && invoice.status === "paye";
  const bytes = await renderInvoicePdf(c.env.DB, invoice, receipt);
  const name = `${receipt ? "Recu" : invoice.kind === "devis" ? "Devis" : "Facture"}-${invoice.number}.pdf`;
  return new Response(bytes, {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `${c.req.query("download") === "1" ? "attachment" : "inline"}; filename="${name}"`,
      "cache-control": "private, no-store",
    },
  });
});

app.post("/invoices/:id/accept", async (c) => {
  const r = await withClient(c);
  if ("denied" in r) return r.denied;
  if (!can(r.client, "decide")) return fail(c, RIGHT_ERRORS.decide, 403);
  const invoice = await ownedRow(c, r.client, "invoices", c.req.param("id"));
  if (!invoice || invoice.kind !== "devis" || invoice.status !== "envoye") return fail(c, "Ce devis n'attend pas de réponse.", 409);
  await c.env.DB.prepare("UPDATE invoices SET status = 'accepte', accepted_at = ?, updated_at = ? WHERE id = ?").bind(nowIso(), nowIso(), invoice.id).run();
  await logActivity(c.env.DB, { projectId: invoice.project_id, clientId: r.client.id, actor: "client", actorName: actorName(r.client), action: "quote_accepted", detail: `${invoice.number} — ${invoice.title}`, ip: clientIp(c) });
  c.executionCtx.waitUntil(
    notifyAdmin({ subject: `👍 Devis accepté — ${r.client.name}`, title: invoice.title, lines: [`Projet : ${invoice.project_title}`, `${invoice.number} — ${formatMoney(invoice.amount, invoice.currency)}`] })
  );
  return c.json({ ok: true });
});

app.post("/invoices/:id/refuse", async (c) => {
  const r = await withClient(c);
  if ("denied" in r) return r.denied;
  if (!can(r.client, "decide")) return fail(c, RIGHT_ERRORS.decide, 403);
  const invoice = await ownedRow(c, r.client, "invoices", c.req.param("id"));
  if (!invoice || invoice.kind !== "devis" || invoice.status !== "envoye") return fail(c, "Ce devis n'attend pas de réponse.", 409);
  const body = await c.req.json().catch(() => null);
  const reason = String(body?.reason || "").trim().slice(0, 1000);
  await c.env.DB.prepare("UPDATE invoices SET status = 'refuse', notes = COALESCE(notes || char(10), '') || ?, updated_at = ? WHERE id = ?")
    .bind(reason ? `Refus client : ${reason}` : "Refusé par le client", nowIso(), invoice.id)
    .run();
  await logActivity(c.env.DB, { projectId: invoice.project_id, clientId: r.client.id, actor: "client", actorName: actorName(r.client), action: "quote_refused", detail: invoice.title });
  c.executionCtx.waitUntil(notifyAdmin({ subject: `Devis refusé — ${r.client.name}`, title: invoice.title, lines: [reason || "Pas de raison indiquée."] }));
  return c.json({ ok: true });
});

/* Paiement Mobile Money d'une facture (ou d'un devis accepté). */
app.post("/invoices/:id/pay", async (c) => {
  const r = await withClient(c);
  if ("denied" in r) return r.denied;
  if (!can(r.client, "pay")) return fail(c, RIGHT_ERRORS.pay, 403);
  const invoice = await ownedRow(c, r.client, "invoices", c.req.param("id"));
  if (!invoice) return fail(c, "Facture introuvable", 404);
  const payable = (invoice.kind === "facture" && invoice.status === "envoye") || (invoice.kind === "devis" && invoice.status === "accepte");
  if (!payable) return fail(c, "Ce document n'est pas payable en ligne.", 409);
  if ((invoice.currency || "XAF") !== "XAF") return fail(c, "Le paiement Mobile Money n'est possible qu'en FCFA. Contactez-nous pour un virement.", 400);
  if (!c.env.KPAY_API_KEY) return fail(c, "Le paiement en ligne est momentanément indisponible.", 503);

  const externalId = generatePaymentExternalId();
  await c.env.DB.prepare(
    `INSERT INTO payments (external_id, offer_tag, amount, currency, status, customer_name, customer_email, customer_phone, invoice_id)
     VALUES (?, ?, ?, 'XAF', 'PENDING', ?, ?, ?, ?)`
  )
    .bind(externalId, `${invoice.number} — ${invoice.title}`.slice(0, 200), invoice.amount, r.client.name, r.client.email || "", r.client.phone || "", invoice.id)
    .run();
  try {
    const payment = await initGatewayPayment(c.env, {
      amount: invoice.amount,
      externalId,
      description: `${invoice.number} — ${invoice.title}`.slice(0, 140),
      returnUrl: `${SITE_URL}/api/payments/return`,
      cancelUrl: `${SITE_URL}/api/payments/return`,
      customerEmail: r.client.email || undefined,
    });
    await c.env.DB.prepare("UPDATE payments SET kpay_id = ?, kpay_reference = ?, is_test = ? WHERE external_id = ?")
      .bind(payment.id, payment.reference, payment.isTest ? 1 : 0, externalId)
      .run();
    await logActivity(c.env.DB, { projectId: invoice.project_id, clientId: r.client.id, actor: "client", actorName: actorName(r.client), action: "payment_started", detail: invoice.title, visible: false });
    return c.json({ ok: true, gatewayUrl: payment.gatewayUrl });
  } catch (e: any) {
    console.error("portal pay:", e?.message, e?.kpayError);
    await c.env.DB.prepare("UPDATE payments SET status = 'FAILED', failure_reason = ? WHERE external_id = ?").bind(e?.message || "init", externalId).run().catch(() => {});
    return fail(c, "Impossible de lancer le paiement. Réessayez dans un instant.", 502);
  }
});

export default app;
