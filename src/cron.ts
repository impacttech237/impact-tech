/* ------------------------------------------------------------------
   Tâches planifiées (cron quotidien, voir wrangler.toml [triggers]).
   Le but : ne plus jamais avoir à courir après un client.
   - relance des éléments attendus (« ce qu'on attend de vous »)
   - relance des signatures et factures en attente
   - renouvellements hébergement / domaine (J-30, J-7)
   - santé des sites livrés (en ligne ? temps de réponse)
   - lundi : récapitulatif « Qui attend qui ? » pour l'admin
------------------------------------------------------------------- */
import { notifyAdmin, notifyClient } from "./lib/portal/mail";
import { waitingBoard } from "./lib/portal/projects";
import { addDays, formatMoney, logActivity, nowIso, todayIso } from "./lib/portal/util";

const DAY = 864e5;
const MAX_REMINDERS = 2;

export async function runScheduled(env: any, cron?: string) {
  if (!env.DB) return;
  const tasks: [string, () => Promise<void>][] = [
    ["checklist", () => checklistReminders(env)],
    ["signatures", () => signatureReminders(env)],
    ["invoices", () => invoiceReminders(env)],
    ["questionnaires", () => questionnaireReminders(env)],
    ["renewals", () => renewalReminders(env)],
    ["health", () => healthChecks(env)],
  ];
  if (new Date().getUTCDay() === 1) tasks.push(["digest", () => weeklyDigest(env)]);
  for (const [name, fn] of tasks) {
    try {
      await fn();
    } catch (e) {
      console.error(`cron ${name}:`, (e as Error).message);
    }
  }
}

/* Une relance par client (tous les éléments en retard dans un seul email). */
async function checklistReminders(env: any) {
  const today = todayIso();
  const { results } = await env.DB.prepare(
    `SELECT i.id, i.label, i.due_date, i.reminder_count, i.last_reminder_at, i.project_id, p.title AS project_title, p.client_id,
            c.name, c.email, c.locale, c.slug, c.access_token
     FROM checklist_items i JOIN client_projects p ON p.id = i.project_id JOIN clients c ON c.id = p.client_id
     WHERE i.status = 'todo' AND p.status = 'actif' AND c.active = 1 AND i.reminder_count < ? AND i.due_date IS NOT NULL AND i.due_date <= ?`
  )
    .bind(MAX_REMINDERS, today)
    .all();

  const byProject = new Map<number, any[]>();
  for (const it of results || []) {
    // 1re relance à l'échéance, 2e relance 4 jours plus tard
    if (it.reminder_count === 1 && it.last_reminder_at && Date.now() - new Date(it.last_reminder_at).getTime() < 4 * DAY) continue;
    if (!byProject.has(it.project_id)) byProject.set(it.project_id, []);
    byProject.get(it.project_id)!.push(it);
  }

  for (const [projectId, items] of byProject) {
    const c0 = items[0];
    const client = { name: c0.name, email: c0.email, locale: c0.locale, slug: c0.slug, access_token: c0.access_token };
    const second = items.some((i) => i.reminder_count >= 1);
    const sent = await notifyClient(client, {
      subject: second ? `Petit rappel : votre projet attend quelques éléments` : `Il nous manque quelques éléments pour avancer`,
      title: "Pour avancer sur votre projet, il nous manque :",
      body: `${items.map((i) => `• ${i.label}`).join("\n")}\n\nVous pouvez tout envoyer en quelques clics depuis votre espace (photos, fichiers, réponses). Plus vite on les reçoit, plus vite votre site est prêt !`,
      cta: "Envoyer les éléments",
    });
    const stmts = items.map((i) =>
      env.DB.prepare("UPDATE checklist_items SET reminder_count = reminder_count + 1, last_reminder_at = ? WHERE id = ?").bind(nowIso(), i.id)
    );
    await env.DB.batch(stmts);
    await logActivity(env.DB, { projectId, actor: "system", action: "reminder_sent", detail: `${items.length} élément(s)${sent.ok ? "" : " (email non parti)"}`, visible: false });
  }
}

async function signatureReminders(env: any) {
  const limit = new Date(Date.now() - 3 * DAY).toISOString();
  const { results } = await env.DB.prepare(
    `SELECT d.id, d.title, d.project_id, c.name, c.email, c.locale, c.slug, c.access_token
     FROM client_documents d JOIN client_projects p ON p.id = d.project_id JOIN clients c ON c.id = p.client_id
     WHERE d.status = 'sent' AND d.needs_signature = 1 AND d.sent_at < ?
       AND NOT EXISTS (SELECT 1 FROM activity_log a WHERE a.project_id = d.project_id AND a.action = 'reminder_signature' AND a.detail = d.title)`
  )
    .bind(limit)
    .all();
  for (const d of results || []) {
    await notifyClient(d, {
      subject: `Rappel : « ${d.title} » attend votre signature`,
      title: "Un document attend votre signature",
      body: `« ${d.title} » est prêt depuis quelques jours. La signature prend moins d'une minute, au doigt sur votre téléphone.`,
      cta: "Lire et signer",
    });
    await logActivity(env.DB, { projectId: d.project_id, actor: "system", action: "reminder_signature", detail: d.title, visible: false });
  }
}

/* Questionnaire ouvert ou non, pas envoyé après 3 jours : un seul rappel. */
async function questionnaireReminders(env: any) {
  const limit = new Date(Date.now() - 3 * DAY).toISOString();
  const { results } = await env.DB.prepare(
    `SELECT q.id, q.token, q.title, q.project_id, q.client_id, c.name, c.email, c.locale, c.slug, c.access_token
     FROM questionnaires q JOIN clients c ON c.id = q.client_id
     WHERE q.status IN ('sent','in_progress') AND q.created_at < ? AND c.email != ''
       AND NOT EXISTS (SELECT 1 FROM activity_log a WHERE a.client_id = q.client_id AND a.action = 'reminder_questionnaire' AND a.detail = q.title)`
  )
    .bind(limit)
    .all();
  for (const q of results || []) {
    await notifyClient(q, {
      subject: `Petit rappel : « ${q.title} »`,
      title: "Votre questionnaire attend vos réponses",
      body: `Il ne prend que quelques minutes, et vos réponses sont enregistrées au fur et à mesure.

Le lien : https://impacttech237.com/q/${q.token}`,
      cta: "Ouvrir mon espace",
    });
    await logActivity(env.DB, { projectId: q.project_id, clientId: q.client_id, actor: "system", action: "reminder_questionnaire", detail: q.title, visible: false });
  }
}

async function invoiceReminders(env: any) {
  const today = todayIso();
  const weekAgo = new Date(Date.now() - 7 * DAY).toISOString();
  const { results } = await env.DB.prepare(
    `SELECT i.*, c.name, c.email, c.locale, c.slug, c.access_token
     FROM invoices i JOIN client_projects p ON p.id = i.project_id JOIN clients c ON c.id = p.client_id
     WHERE i.kind = 'facture' AND i.status = 'envoye' AND i.due_date IS NOT NULL AND i.due_date < ?
       AND NOT EXISTS (SELECT 1 FROM activity_log a WHERE a.project_id = i.project_id AND a.action = 'reminder_invoice' AND a.detail = i.number AND a.created_at > ?)`
  )
    .bind(today, weekAgo)
    .all();
  for (const inv of results || []) {
    await notifyClient(inv, {
      subject: `Rappel : facture ${inv.number}`,
      title: "Votre facture est en attente de règlement",
      body: `« ${inv.title} » — ${formatMoney(inv.amount, inv.currency)}. Vous pouvez la régler en un clic par Mobile Money (MTN / Orange) depuis votre espace.`,
      cta: "Payer maintenant",
    });
    await logActivity(env.DB, { projectId: inv.project_id, actor: "system", action: "reminder_invoice", detail: inv.number, visible: false });
  }
}

async function renewalReminders(env: any) {
  for (const days of [30, 7]) {
    const target = addDays(todayIso(), days);
    const { results } = await env.DB.prepare(
      `SELECT p.id, p.title, p.hosting_renewal_at, p.domain_renewal_at, p.renewal_amount, p.currency, c.name, c.email, c.locale, c.slug, c.access_token
       FROM client_projects p JOIN clients c ON c.id = p.client_id
       WHERE p.status IN ('livre','termine') AND (p.hosting_renewal_at = ? OR p.domain_renewal_at = ?)`
    )
      .bind(target, target)
      .all();
    for (const p of results || []) {
      const what = p.hosting_renewal_at === target && p.domain_renewal_at === target ? "l'hébergement et le nom de domaine" : p.hosting_renewal_at === target ? "l'hébergement" : "le nom de domaine";
      await notifyClient(p, {
        subject: `Votre site : renouvellement dans ${days} jours`,
        title: `Renouvellement de ${what}`,
        body: `Pour que votre site reste en ligne, ${what} doit être renouvelé avant le ${new Date(target).toLocaleDateString("fr-FR")}${p.renewal_amount ? ` (${formatMoney(p.renewal_amount, p.currency)})` : ""}. On s'occupe de tout : vous recevrez la facture dans votre espace.`,
        cta: "Voir mon espace",
      });
      await notifyAdmin({ subject: `🔁 Renouvellement J-${days} — ${p.name}`, title: p.title, lines: [`${what} : ${new Date(target).toLocaleDateString("fr-FR")}`, "Pensez à envoyer la facture de renouvellement."] });
      await logActivity(env.DB, { projectId: p.id, actor: "system", action: "renewal_reminder", detail: `J-${days} : ${what}`, visible: false });
    }
  }
}

async function healthChecks(env: any) {
  const { results } = await env.DB.prepare("SELECT id, title, site_url, health_status FROM client_projects WHERE site_url IS NOT NULL AND status IN ('livre','termine')").all();
  for (const p of results || []) {
    const start = Date.now();
    let status = 0;
    try {
      const res = await fetch(p.site_url, { method: "GET", redirect: "follow", signal: AbortSignal.timeout(10000), headers: { "user-agent": "ImpactTech-Monitor/1.0" } });
      status = res.status;
      await res.body?.cancel();
    } catch {
      status = 0;
    }
    const ms = Date.now() - start;
    await env.DB.prepare("UPDATE client_projects SET health_status = ?, health_ms = ?, health_checked_at = ? WHERE id = ?").bind(status, ms, nowIso(), p.id).run();
    const wasUp = !p.health_status || (p.health_status >= 200 && p.health_status < 400);
    const isUp = status >= 200 && status < 400;
    if (wasUp && !isUp) {
      await notifyAdmin({ subject: `🔴 Site hors ligne : ${p.title}`, title: "Un site client ne répond plus", lines: [p.site_url, status ? `Code HTTP ${status}` : "Aucune réponse (délai dépassé)"] });
      await logActivity(env.DB, { projectId: p.id, actor: "system", action: "site_down", detail: String(status), visible: false });
    }
  }
}

async function weeklyDigest(env: any) {
  const board = await waitingBoard(env.DB);
  if (!board.projects.length) return;
  const weekAgo = new Date(Date.now() - 6.5 * DAY).toISOString();
  const staleUpdate = board.projects.filter((p: any) => p.status === "actif" && (!p.weekly_update_at || p.weekly_update_at < weekAgo));
  const lines: string[] = [];
  if (board.late.length) lines.push(`⏰ En retard : ${board.late.map((p: any) => `${p.client_name} (${p.current_step})`).join(", ")}`);
  if (board.waitingUs.length) lines.push(`🛠 On attend NOUS : ${board.waitingUs.map((p: any) => `${p.client_name} — ${p.waiting_us[0]}`).join(" · ")}`);
  if (board.waitingClient.length) lines.push(`⏳ On attend le CLIENT : ${board.waitingClient.map((p: any) => `${p.client_name} — ${p.waiting_client.length} élément(s)`).join(" · ")}`);
  if (staleUpdate.length) lines.push(`✍️ Pensez au « point de la semaine » pour : ${staleUpdate.map((p: any) => p.client_name).join(", ")}`);
  await notifyAdmin({ subject: "📋 Récap du lundi — portail client", title: "Qui attend qui ?", lines });
}
