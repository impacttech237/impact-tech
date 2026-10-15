/* ------------------------------------------------------------------
   /api/portal — projet du client : tableau de bord, étapes,
   checklist (« ce qu'on attend de vous »), coffre d'accès, avis.
------------------------------------------------------------------- */
import { Hono } from "hono";
import { RIGHT_ERRORS, actorName, can } from "../../lib/portal-auth";
import { notifyAdmin } from "../../lib/portal/mail";
import { clientNextActions, computeProgress, projectSnapshot } from "../../lib/portal/projects";
import { clampText, clientIp, logActivity, nowIso, parseJson } from "../../lib/portal/util";
import { decryptSecret, encryptSecret } from "../../lib/portal/vault";
import { fail, ownedProject, ownedRow, shouldNotify, withClient } from "./common";

const app = new Hono();

/* Champs du projet visibles par le client (jamais les notes internes). */
function publicProject(p: any) {
  return {
    id: p.id,
    title: p.title,
    description: p.description,
    pack: p.pack,
    status: p.status,
    start_date: p.start_date,
    due_date: p.due_date,
    preview_url: p.preview_url,
    site_url: p.site_url,
    admin_url: p.admin_url,
    amount: p.amount,
    currency: p.currency,
    revision_rounds: p.revision_rounds,
    revision_used: p.revision_used || 0,
    support_days: p.support_days,
    delivered_at: p.delivered_at,
    support_until: p.support_until,
    hosting_renewal_at: p.hosting_renewal_at,
    domain_renewal_at: p.domain_renewal_at,
    renewal_amount: p.renewal_amount,
    handover_notes: p.handover_notes,
    handover_links: parseJson(p.handover_links, []),
    weekly_update: p.weekly_update,
    weekly_update_at: p.weekly_update_at,
    health_status: p.health_status,
    health_checked_at: p.health_checked_at,
    feedback_key: p.feedback_key,
  };
}

/* Tableau de bord : où en est mon projet / que dois-je faire / quoi de neuf. */
app.get("/projects/:id", async (c) => {
  const r = await withClient(c);
  if ("denied" in r) return r.denied;
  const project = await ownedProject(c, r.client, c.req.param("id"));
  if (!project) return fail(c, "Projet introuvable", 404);

  const snap = await projectSnapshot(c.env.DB, project.id);
  const progress = computeProgress(snap.steps);
  const [feed, review] = await Promise.all([
    c.env.DB.prepare("SELECT id, actor, actor_name, action, detail, created_at FROM activity_log WHERE project_id = ? AND visible = 1 ORDER BY created_at DESC LIMIT 20").bind(project.id).all(),
    c.env.DB.prepare("SELECT rating, text, created_at FROM client_reviews WHERE project_id = ? LIMIT 1").bind(project.id).first(),
  ]);

  return c.json({
    ok: true,
    project: publicProject(project),
    progress: progress.percent,
    currentStepId: progress.current?.id || null,
    steps: snap.steps,
    checklist: snap.checklist,
    actions: clientNextActions(snap),
    unreadMessages: snap.unreadMessages,
    openRequests: snap.openRequests,
    feed: feed.results || [],
    review: review || null,
  });
});

/* ── Étapes : valider, demander des changements, satisfaction ── */

async function advanceAfter(db: any, step: any) {
  const next = await db
    .prepare("SELECT id FROM project_steps WHERE project_id = ? AND sort_order > ? AND status = 'todo' ORDER BY sort_order LIMIT 1")
    .bind(step.project_id, step.sort_order)
    .first();
  if (next) await db.prepare("UPDATE project_steps SET status = 'in_progress', started_at = ? WHERE id = ?").bind(nowIso(), next.id).run();
}

app.post("/steps/:id/validate", async (c) => {
  const r = await withClient(c);
  if ("denied" in r) return r.denied;
  if (!can(r.client, "decide")) return fail(c, RIGHT_ERRORS.decide, 403);
  const step = await ownedRow(c, r.client, "project_steps", c.req.param("id"));
  if (!step) return fail(c, "Étape introuvable", 404);
  if (step.status !== "review") return fail(c, "Cette étape n'attend pas votre validation.", 409);
  const body = await c.req.json().catch(() => null);
  const comment = clampText(body?.comment, 2000);
  const ip = clientIp(c);
  const now = nowIso();

  await c.env.DB.prepare(
    "UPDATE project_steps SET status = 'done', completed_at = ?, validated_at = ?, validated_ip = ?, validation_comment = ? WHERE id = ?"
  )
    .bind(now, now, ip, comment || null, step.id)
    .run();
  await advanceAfter(c.env.DB, step);
  await logActivity(c.env.DB, { projectId: step.project_id, clientId: r.client.id, actor: "client", actorName: actorName(r.client), action: "step_validated", detail: step.title, ip });
  c.executionCtx.waitUntil(
    notifyAdmin({
      subject: `✅ ${r.client.name} a validé « ${step.title} »`,
      title: "Étape validée par le client",
      lines: [`Projet : ${step.project_title}`, `Étape : ${step.title}`, comment ? `Commentaire : ${comment}` : ""].filter(Boolean),
    })
  );
  return c.json({ ok: true });
});

app.post("/steps/:id/changes", async (c) => {
  const r = await withClient(c);
  if ("denied" in r) return r.denied;
  if (!can(r.client, "decide")) return fail(c, RIGHT_ERRORS.decide, 403);
  const step = await ownedRow(c, r.client, "project_steps", c.req.param("id"));
  if (!step) return fail(c, "Étape introuvable", 404);
  if (step.status !== "review") return fail(c, "Cette étape n'attend pas votre avis.", 409);
  const body = await c.req.json().catch(() => null);
  const comment = clampText(body?.comment, 4000);
  if (!comment) return fail(c, "Dites-nous ce qu'il faut changer.");

  await c.env.DB.prepare("UPDATE project_steps SET status = 'in_progress', validation_comment = ? WHERE id = ?").bind(comment, step.id).run();
  const project = await c.env.DB.prepare("SELECT revision_used FROM client_projects WHERE id = ?").bind(step.project_id).first();
  await c.env.DB.prepare("INSERT INTO project_requests (project_id, kind, comment, round, status, created_at) VALUES (?, 'retour', ?, ?, 'nouveau', ?)")
    .bind(step.project_id, `[${step.title}] ${comment}`, (project?.revision_used || 0) + 1, nowIso())
    .run();
  await logActivity(c.env.DB, { projectId: step.project_id, clientId: r.client.id, actor: "client", actorName: actorName(r.client), action: "step_changes_requested", detail: step.title, ip: clientIp(c) });
  c.executionCtx.waitUntil(
    notifyAdmin({
      subject: `✏️ ${r.client.name} demande des changements (${step.title})`,
      title: "Changements demandés",
      lines: [`Projet : ${step.project_title}`, `Étape : ${step.title}`, comment],
    })
  );
  return c.json({ ok: true });
});

app.post("/steps/:id/satisfaction", async (c) => {
  const r = await withClient(c);
  if ("denied" in r) return r.denied;
  const step = await ownedRow(c, r.client, "project_steps", c.req.param("id"));
  if (!step) return fail(c, "Étape introuvable", 404);
  const body = await c.req.json().catch(() => null);
  const rating = Math.max(1, Math.min(5, parseInt(body?.rating, 10) || 0));
  if (!rating) return fail(c, "Note invalide");
  const comment = clampText(body?.comment, 1000);
  await c.env.DB.prepare("UPDATE project_steps SET satisfaction = ?, satisfaction_comment = ? WHERE id = ?").bind(rating, comment || null, step.id).run();
  await logActivity(c.env.DB, { projectId: step.project_id, clientId: r.client.id, actor: "client", actorName: actorName(r.client), action: "satisfaction", detail: `${step.title} : ${rating}/5`, visible: false });
  if (rating <= 2) {
    c.executionCtx.waitUntil(
      notifyAdmin({
        subject: `⚠️ Client peu satisfait — ${r.client.name}`,
        title: `Note de ${rating}/5 sur « ${step.title} »`,
        lines: [`Projet : ${step.project_title}`, comment ? `Commentaire : ${comment}` : "Pas de commentaire.", "À appeler rapidement."],
      })
    );
  }
  return c.json({ ok: true });
});

/* ── Checklist : formulaires guidés et confirmations ── */

app.post("/checklist/:id/answer", async (c) => {
  const r = await withClient(c);
  if ("denied" in r) return r.denied;
  const item = await ownedRow(c, r.client, "checklist_items", c.req.param("id"));
  if (!item) return fail(c, "Élément introuvable", 404);
  const body = await c.req.json().catch(() => null);
  const questions = parseJson<any[]>(item.config, []);
  const answers: string[] = Array.isArray(body?.answers) ? body.answers.slice(0, 50).map((a: any) => clampText(a, 5000)) : [];
  const final = body?.final !== false; // brouillon possible (final: false)

  const status = final ? "sent" : item.status === "ok" ? "ok" : "todo";
  await c.env.DB.prepare("UPDATE checklist_items SET answer = ?, status = ?, sent_at = CASE WHEN ? = 'sent' THEN ? ELSE sent_at END WHERE id = ?")
    .bind(JSON.stringify(answers), status, status, nowIso(), item.id)
    .run();
  if (final) {
    await logActivity(c.env.DB, { projectId: item.project_id, clientId: r.client.id, actor: "client", actorName: actorName(r.client), action: "checklist_sent", detail: item.label });
    if (await shouldNotify(c.env.DB, item.project_id, `checklist-${item.id}`, 30)) {
      c.executionCtx.waitUntil(
        notifyAdmin({
          subject: `📝 ${r.client.name} a répondu : ${item.label}`,
          title: item.label,
          lines: [`Projet : ${item.project_title}`, ...questions.map((q: any, i: number) => `${q.q} → ${answers[i] || "—"}`)],
        })
      );
    }
  }
  return c.json({ ok: true, status });
});

app.post("/checklist/:id/done", async (c) => {
  const r = await withClient(c);
  if ("denied" in r) return r.denied;
  const item = await ownedRow(c, r.client, "checklist_items", c.req.param("id"));
  if (!item) return fail(c, "Élément introuvable", 404);
  const body = await c.req.json().catch(() => null);
  const note = clampText(body?.note, 2000);
  await c.env.DB.prepare("UPDATE checklist_items SET status = 'sent', sent_at = ?, answer = COALESCE(?, answer) WHERE id = ? AND status != 'ok'")
    .bind(nowIso(), note ? JSON.stringify([note]) : null, item.id)
    .run();
  await logActivity(c.env.DB, { projectId: item.project_id, clientId: r.client.id, actor: "client", actorName: actorName(r.client), action: "checklist_sent", detail: item.label });
  if (await shouldNotify(c.env.DB, item.project_id, "checklist-done", 20)) {
    c.executionCtx.waitUntil(
      notifyAdmin({ subject: `📦 ${r.client.name} a envoyé : ${item.label}`, title: "Élément envoyé par le client", lines: [`Projet : ${item.project_title}`, item.label, note] })
    );
  }
  return c.json({ ok: true });
});

/* ── Coffre d'accès ── */

app.get("/projects/:id/vault", async (c) => {
  const r = await withClient(c);
  if ("denied" in r) return r.denied;
  if (!can(r.client, "vault")) return fail(c, RIGHT_ERRORS.vault, 403);
  const project = await ownedProject(c, r.client, c.req.param("id"));
  if (!project) return fail(c, "Projet introuvable", 404);
  const { results } = await c.env.DB.prepare("SELECT * FROM vault_entries WHERE project_id = ? ORDER BY created_at DESC").bind(project.id).all();
  const entries = [];
  for (const e of results || []) {
    entries.push({ id: e.id, label: e.label, url: e.url, login: e.login, note: e.note, created_by: e.created_by, created_at: e.created_at, secret: await decryptSecret(c.env, e.secret_enc) });
  }
  return c.json({ ok: true, entries });
});

app.post("/projects/:id/vault", async (c) => {
  const r = await withClient(c);
  if ("denied" in r) return r.denied;
  if (!can(r.client, "vault")) return fail(c, RIGHT_ERRORS.vault, 403);
  const project = await ownedProject(c, r.client, c.req.param("id"));
  if (!project) return fail(c, "Projet introuvable", 404);
  const body = await c.req.json().catch(() => null);
  const label = clampText(body?.label, 120);
  if (!label) return fail(c, "Indiquez de quoi il s'agit (ex : Nom de domaine).");
  const secret = await encryptSecret(c.env, clampText(body?.secret, 500));
  await c.env.DB.prepare("INSERT INTO vault_entries (project_id, label, url, login, secret_enc, note, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, 'client', ?)")
    .bind(project.id, label, clampText(body?.url, 300) || null, clampText(body?.login, 200) || null, secret, clampText(body?.note, 1000) || null, nowIso())
    .run();
  if (body?.checklistItemId) {
    await c.env.DB.prepare("UPDATE checklist_items SET status = 'sent', sent_at = ? WHERE id = ? AND project_id = ? AND status = 'todo'")
      .bind(nowIso(), parseInt(body.checklistItemId, 10), project.id)
      .run();
  }
  await logActivity(c.env.DB, { projectId: project.id, clientId: r.client.id, actor: "client", actorName: actorName(r.client), action: "vault_added", detail: label });
  if (await shouldNotify(c.env.DB, project.id, "vault", 20)) {
    c.executionCtx.waitUntil(notifyAdmin({ subject: `🔐 ${r.client.name} a ajouté un accès`, title: "Nouvel accès dans le coffre", lines: [`Projet : ${project.title}`, label] }));
  }
  return c.json({ ok: true });
});

app.delete("/vault/:id", async (c) => {
  const r = await withClient(c);
  if ("denied" in r) return r.denied;
  if (!can(r.client, "vault")) return fail(c, RIGHT_ERRORS.vault, 403);
  const entry = await ownedRow(c, r.client, "vault_entries", c.req.param("id"));
  if (!entry) return fail(c, "Accès introuvable", 404);
  if (entry.created_by !== "client") return fail(c, "Cet accès a été ajouté par Impact Tech.", 403);
  await c.env.DB.prepare("DELETE FROM vault_entries WHERE id = ?").bind(entry.id).run();
  await logActivity(c.env.DB, { projectId: entry.project_id, clientId: r.client.id, actor: "client", actorName: actorName(r.client), action: "vault_removed", detail: entry.label, visible: false });
  return c.json({ ok: true });
});

/* ── Avis client (fin de projet) ── */

app.post("/projects/:id/review", async (c) => {
  const r = await withClient(c);
  if ("denied" in r) return r.denied;
  const project = await ownedProject(c, r.client, c.req.param("id"));
  if (!project) return fail(c, "Projet introuvable", 404);
  const body = await c.req.json().catch(() => null);
  const rating = Math.max(1, Math.min(5, parseInt(body?.rating, 10) || 0));
  const text = clampText(body?.text, 2000);
  if (!rating) return fail(c, "Choisissez une note.");
  const existing = await c.env.DB.prepare("SELECT id FROM client_reviews WHERE project_id = ?").bind(project.id).first();
  if (existing) {
    await c.env.DB.prepare("UPDATE client_reviews SET rating = ?, text = ?, allow_publish = ? WHERE id = ?").bind(rating, text, body?.allowPublish ? 1 : 0, existing.id).run();
  } else {
    await c.env.DB.prepare("INSERT INTO client_reviews (project_id, client_id, rating, text, allow_publish, created_at) VALUES (?, ?, ?, ?, ?, ?)")
      .bind(project.id, r.client.id, rating, text, body?.allowPublish ? 1 : 0, nowIso())
      .run();
  }
  await logActivity(c.env.DB, { projectId: project.id, clientId: r.client.id, actor: "client", actorName: actorName(r.client), action: "review", detail: `${rating}/5` });
  c.executionCtx.waitUntil(
    notifyAdmin({ subject: `⭐ Avis ${rating}/5 de ${r.client.name}`, title: "Nouvel avis client", lines: [`Projet : ${project.title}`, text || "(sans commentaire)", body?.allowPublish ? "Le client accepte la publication." : "Publication non autorisée."] })
  );
  return c.json({ ok: true });
});

export default app;
