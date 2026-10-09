/* ------------------------------------------------------------------
   Devis / factures du portail : numérotation, PDF, et passage en
   « payé » quand K-PAY confirme le paiement (webhook ou retour).
------------------------------------------------------------------- */
import { invoicePdf } from "./pdf";
import { notifyAdmin, notifyClient } from "./mail";
import { formatMoney, logActivity, nowIso, parseJson, portalSettings } from "./util";

/* Numéro lisible et unique : F-2026-0007 / D-2026-0003. */
export async function nextInvoiceNumber(db: any, kind: "devis" | "facture") {
  const prefix = `${kind === "devis" ? "D" : "F"}-${new Date().getUTCFullYear()}-`;
  const row = await db.prepare("SELECT number FROM invoices WHERE number LIKE ? ORDER BY number DESC LIMIT 1").bind(`${prefix}%`).first();
  const last = row ? parseInt(String(row.number).slice(prefix.length), 10) || 0 : 0;
  return `${prefix}${String(last + 1).padStart(4, "0")}`;
}

export function normalizeItems(items: any): { label: string; qty: number; unit: number }[] {
  if (!Array.isArray(items)) return [];
  return items
    .slice(0, 50)
    .map((it) => ({
      label: String(it?.label || "").trim().slice(0, 300),
      qty: Math.max(1, Math.min(10000, parseInt(it?.qty, 10) || 1)),
      unit: Math.max(0, Math.round(Number(it?.unit) || 0)),
    }))
    .filter((it) => it.label);
}

export function itemsTotal(items: { qty: number; unit: number }[]) {
  return items.reduce((s, it) => s + it.qty * it.unit, 0);
}

export async function renderInvoicePdf(db: any, invoice: any, asReceipt = false) {
  const project = await db.prepare("SELECT * FROM client_projects WHERE id = ?").bind(invoice.project_id).first();
  const client = await db.prepare("SELECT * FROM clients WHERE id = ?").bind(project.client_id).first();
  const settings = await portalSettings(db);
  const items = parseJson<any[]>(invoice.items, []);
  const fmt = (d: string) => new Date(d).toLocaleDateString("fr-FR", { timeZone: "Africa/Douala" });
  return invoicePdf({
    kind: asReceipt ? "recu" : invoice.kind,
    number: invoice.number,
    title: invoice.title,
    date: fmt(invoice.sent_at || invoice.created_at),
    dueDate: invoice.due_date ? fmt(invoice.due_date) : null,
    client: { name: client.name, company: client.company, email: client.email, phone: client.phone },
    items: items.length ? items : [{ label: invoice.title, qty: 1, unit: invoice.amount }],
    amount: invoice.amount,
    currency: invoice.currency || "XAF",
    notes: invoice.notes,
    paidAt: invoice.paid_at ? fmt(invoice.paid_at) : null,
    issuer: { phone: settings.phone_display, email: settings.email },
  });
}

/* Appelé par le webhook K-PAY ET la page de retour (idempotent). */
export async function applyInvoicePayment(env: any, payment: any, status: string) {
  if (!payment?.invoice_id || status !== "COMPLETED") return;
  const invoice = await env.DB.prepare("SELECT * FROM invoices WHERE id = ?").bind(payment.invoice_id).first();
  if (!invoice || invoice.status === "paye") return;
  const paidAt = nowIso();
  const res = await env.DB.prepare("UPDATE invoices SET status = 'paye', paid_at = ?, payment_external_id = ?, updated_at = ? WHERE id = ? AND status != 'paye'")
    .bind(paidAt, payment.external_id, paidAt, invoice.id)
    .run();
  if (!res.meta?.changes) return; // déjà traité par un appel concurrent

  const project = await env.DB.prepare("SELECT * FROM client_projects WHERE id = ?").bind(invoice.project_id).first();
  const client = await env.DB.prepare("SELECT * FROM clients WHERE id = ?").bind(project.client_id).first();
  await logActivity(env.DB, { projectId: project.id, clientId: client.id, actor: "system", action: "invoice_paid", detail: `${invoice.title} — ${formatMoney(invoice.amount, invoice.currency)}` });
  await env.DB.prepare("INSERT INTO messages (project_id, author, kind, body, created_at) VALUES (?, 'system', 'text', ?, ?)")
    .bind(project.id, `Paiement reçu : ${invoice.title} (${formatMoney(invoice.amount, invoice.currency)}). Merci ! Votre reçu est disponible dans l'onglet Paiements.`, paidAt)
    .run();
  await Promise.all([
    notifyClient(client, {
      subject: `Paiement reçu — ${invoice.title}`,
      title: "Merci, votre paiement est bien reçu ✓",
      body: `Nous avons bien reçu ${formatMoney(invoice.amount, invoice.currency)} pour « ${invoice.title} ». Votre reçu est téléchargeable dans votre espace, onglet Paiements.`,
      cta: "Voir mon reçu",
    }),
    notifyAdmin({
      subject: `💰 Paiement reçu — ${client.name} (${formatMoney(invoice.amount, invoice.currency)})`,
      title: "Facture payée via K-PAY",
      lines: [`Projet : ${project.title}`, `Facture : ${invoice.number} — ${invoice.title}`, `Référence : ${payment.kpay_reference || payment.external_id}`],
    }),
  ]);
}
