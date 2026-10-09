/* ------------------------------------------------------------------
   /api/admin/portal — projets : vue d'ensemble « Qui attend qui ? »,
   espace de travail d'un projet (étapes, checklist, coffre, point de
   la semaine, livraison, journal), modèles de projet par pack.
------------------------------------------------------------------- */
import { Hono } from "hono";
import { notifyClient } from "../../lib/portal/mail";
import {
  computeProgress,
  createProjectFromTemplate,
  DEFAULT_TEMPLATES,
  getTemplates,
  hydrateTemplate,
  projectSnapshot,
  waitingBoard,
} from "../../lib/portal/projects";
import { addDays, clampText, logActivity, nowIso, parseJson, randomToken, safeUrl } from "../../lib/portal/util";
import { decryptSecret, encryptSecret } from "../../lib/portal/vault";
import { deleteProjectObjects } from "../../lib/portal/files";

const app = new Hono();

const getProject = (db: any, id: any) =>
  db
    .prepare("SELECT p.*, c.name AS client_name, c.email AS client_email, c.phone AS client_phone, c.locale AS client_locale, c.slug AS client_slug, c.access_token AS client_token FROM client_projects p JOIN clients c ON c.id = p.client_id WHERE p.id = ?")
    .bind(parseInt(String(id), 10))
    .first();

const clientOf = (p: any) => ({ id: p.client_id, name: p.client_name, email: p.client_email, locale: p.client_locale, slug: p.client_slug, access_token: p.client_token });

/* ── Vue d'ensemble ── */

app.get("/overview", async (c) => {
  const board = await waitingBoard(c.env.DB);
  const [activity, counts] = await Promise.all([
    c.env.DB.prepare(
      `SELECT a.*, p.title AS project_title, c.name AS client_name FROM activity_log a
       LEFT JOIN client_projects p ON p.id = a.project_id LEFT JOIN clients c ON c.id = COALESCE(a.client_id, p.client_id)
       WHERE a.action NOT LIKE 'notif:%' ORDER BY a.created_at DESC LIMIT 30`
    ).all(),
    c.env.DB.batch([
      c.env.DB.prepare("SELECT COUNT(*) AS n FROM clients"),
      c.env.DB.prepare("SELECT COUNT(*) AS n FROM client_projects WHERE status IN ('actif','pause')"),
      c.env.DB.prepare("SELECT COUNT(*) AS n FROM client_documents WHERE status = 'sent' AND needs_signature = 1"),
      c.env.DB.prepare("SELECT COUNT(*) AS n FROM invoices WHERE status = 'envoye' AND kind = 'facture'"),
      c.env.DB.prepare("SELECT COALESCE(SUM(amount),0) AS n FROM invoices WHERE status = 'paye'"),
      c.env.DB.prepare("SELECT COUNT(*) AS n FROM project_requests WHERE status = 'nouveau'"),
    ]),
  ]);
  const n = (i: number) => counts[i]?.results?.[0]?.n || 0;
  return c.json({
    ok: true,
    ...board,
    activity: activity.results || [],
    stats: { clients: n(0), activeProjects: n(1), toSign: n(2), unpaid: n(3), cashed: n(4), newRequests: n(5) },
  });
});

/* ── Projets ── */

app.get("/clients/:clientId/projects", async (c) => {
  const { results } = await c.env.DB.prepare("SELECT * FROM client_projects WHERE client_id = ? ORDER BY created_at DESC").bind(parseInt(c.req.param("clientId"), 10)).all();
  return c.json({ ok: true, projects: results || [] });
});

app.post("/projects", async (c) => {
  const body = await c.req.json().catch(() => null);
  const clientId = parseInt(body?.client_id, 10);
  const title = clampText(body?.title, 200);
  if (!clientId || !title) return c.json({ ok: false, error: "Client et titre requis" }, 400);
  const client = await c.env.DB.prepare("SELECT id FROM clients WHERE id = ?").bind(clientId).first();
  if (!client) return c.json({ ok: false, error: "Client introuvable" }, 404);
  const { projectId } = await createProjectFromTemplate(c.env.DB, {
    clientId,
    title,
    pack: clampText(body?.pack, 100),
    templateId: body?.template_id ? parseInt(body.template_id, 10) : null,
    amount: body?.amount ? Math.round(Number(body.amount)) : null,
    currency: body?.currency === "EUR" ? "EUR" : "XAF",
    startDate: body?.start_date || undefined,
    description: clampText(body?.description, 5000),
  });
  await logActivity(c.env.DB, { projectId, clientId, actor: "admin", action: "project_created", detail: title });
  return c.json({ ok: true, id: projectId });
});

/* Espace de travail complet d'un projet. */
app.get("/projects/:id", async (c) => {
  const project = await getProject(c.env.DB, c.req.param("id"));
  if (!project) return c.json({ ok: false, error: "Projet introuvable" }, 404);
  const snap = await projectSnapshot(c.env.DB, project.id);
  const [activity, counts] = await Promise.all([
    c.env.DB.prepare("SELECT * FROM activity_log WHERE project_id = ? AND action NOT LIKE 'notif:%' ORDER BY created_at DESC LIMIT 100").bind(project.id).all(),
    c.env.DB.batch([
      c.env.DB.prepare("SELECT COUNT(*) AS n FROM messages WHERE project_id = ? AND author = 'client' AND read_by_admin_at IS NULL").bind(project.id),
      c.env.DB.prepare("SELECT COUNT(*) AS n FROM project_requests WHERE project_id = ? AND status = 'nouveau'").bind(project.id),
      c.env.DB.prepare("SELECT COUNT(*) AS n FROM client_files WHERE project_id = ? AND message_id IS NULL").bind(project.id),
    ]),
  ]);
  const progress = computeProgress(snap.steps);
  return c.json({
    ok: true,
    project: { ...project, handover_links: parseJson(project.handover_links, []) },
    steps: snap.steps,
    checklist: snap.checklist,
    progress: progress.percent,
    activity: activity.results || [],
    counts: { unreadMessages: counts[0]?.results?.[0]?.n || 0, newRequests: counts[1]?.results?.[0]?.n || 0, files: counts[2]?.results?.[0]?.n || 0 },
  });
});

const PROJECT_FIELDS: Record<string, "text" | "int" | "url" | "date" | "json"> = {
  title: "text",
  description: "text",
  status: "text",
  pack: "text",
  start_date: "date",
  due_date: "date",
  preview_url: "url",
  site_url: "url",
  admin_url: "url",
  amount: "int",
  currency: "text",
  revision_rounds: "int",
  revision_used: "int",
  support_days: "int",
  support_until: "date",
  hosting_renewal_at: "date",
  domain_renewal_at: "date",
  renewal_amount: "int",
  handover_notes: "text",
  handover_links: "json",
  internal_notes: "text",
};

app.put("/projects/:id", async (c) => {
  const project = await getProject(c.env.DB, c.req.param("id"));
  if (!project) return c.json({ ok: false, error: "Projet introuvable" }, 404);
  const body = await c.req.json().catch(() => null);
  if (!body) return c.json({ ok: false, error: "Corps invalide" }, 400);
  const fields: string[] = [];
  const vals: any[] = [];
  for (const [key, type] of Object.entries(PROJECT_FIELDS)) {
    if (body[key] === undefined) continue;
    let v = body[key];
    if (v === "" || v === null) v = null;
    else if (type === "int") v = Number.isFinite(Number(v)) ? Math.round(Number(v)) : null;
    else if (type === "url") v = safeUrl(v);
    else if (type === "date") v = String(v).slice(0, 10);
    else if (type === "json") v = JSON.stringify(Array.isArray(v) ? v.map((l: any) => ({ title: clampText(l?.title, 200), url: safeUrl(l?.url) })).filter((l: any) => l.title && l.url) : []);
    else v = clampText(v, key === "internal_notes" || key === "handover_notes" || key === "description" ? 20000 : 300);
    if (key === "status" && !["actif", "pause", "livre", "termine"].includes(v)) continue;
    fields.push(`${key} = ?`);
    vals.push(v);
  }
  if (!fields.length) return c.json({ ok: true });
  fields.push("updated_at = ?");
  vals.push(nowIso(), project.id);
  await c.env.DB.prepare(`UPDATE client_projects SET ${fields.join(", ")} WHERE id = ?`).bind(...vals).run();
  if (body.preview_url && body.preview_url !== project.preview_url) {
    await logActivity(c.env.DB, { projectId: project.id, actor: "admin", action: "preview_ready", detail: "Votre site en construction est visible" });
  }
  return c.json({ ok: true });
});

app.delete("/projects/:id", async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  await deleteProjectObjects(c.env, [id]);
  await c.env.DB.prepare("DELETE FROM client_projects WHERE id = ?").bind(id).run();
  return c.json({ ok: true });
});

/* Nouvelle clé du widget de retours (si elle a fuité). */
app.post("/projects/:id/feedback-key", async (c) => {
  const key = randomToken(12);
  await c.env.DB.prepare("UPDATE client_projects SET feedback_key = ? WHERE id = ?").bind(key, parseInt(c.req.param("id"), 10)).run();
  return c.json({ ok: true, key });
});

/* Livraison : date, fin du support, renouvellements. */
app.post("/projects/:id/deliver", async (c) => {
  const project = await getProject(c.env.DB, c.req.param("id"));
  if (!project) return c.json({ ok: false, error: "Projet introuvable" }, 404);
  const body = await c.req.json().catch(() => ({}));
  const today = new Date().toISOString().slice(0, 10);
  const supportUntil = project.support_days ? addDays(today, project.support_days) : null;
  await c.env.DB.prepare(
    "UPDATE client_projects SET status = 'livre', delivered_at = ?, support_until = COALESCE(?, support_until), hosting_renewal_at = COALESCE(hosting_renewal_at, ?), site_url = COALESCE(?, site_url), updated_at = ? WHERE id = ?"
  )
    .bind(nowIso(), supportUntil, addDays(today, 365), safeUrl(body?.site_url), nowIso(), project.id)
    .run();
  await logActivity(c.env.DB, { projectId: project.id, actor: "admin", action: "delivered", detail: "Votre site est livré 🎉" });
  c.executionCtx.waitUntil(
    notifyClient(clientOf(project), {
      subject: `Votre site est livré 🎉 — ${project.title}`,
      title: "Votre site est en ligne !",
      body: "Votre kit de livraison (accès, guides, contacts) est disponible dans votre espace. Prenez le temps de tout tester : vous ne payez que si vous êtes satisfait.",
      cta: "Voir mon kit de livraison",
    })
  );
  return c.json({ ok: true });
});

/* ── Étapes ── */

app.post("/projects/:id/steps", async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  const body = await c.req.json().catch(() => null);
  const title = clampText(body?.title, 200);
  if (!title) return c.json({ ok: false, error: "Titre requis" }, 400);
  const max = await c.env.DB.prepare("SELECT COALESCE(MAX(sort_order), -1) AS m FROM project_steps WHERE project_id = ?").bind(id).first();
  await c.env.DB.prepare("INSERT INTO project_steps (project_id, title, description, needs_validation, due_date, status, sort_order) VALUES (?, ?, ?, ?, ?, 'todo', ?)")
    .bind(id, title, clampText(body?.description, 2000), body?.needs_validation ? 1 : 0, body?.due_date || null, (max?.m ?? -1) + 1)
    .run();
  return c.json({ ok: true });
});

app.put("/steps/:id", async (c) => {
  const step = await c.env.DB.prepare("SELECT * FROM project_steps WHERE id = ?").bind(parseInt(c.req.param("id"), 10)).first();
  if (!step) return c.json({ ok: false, error: "Étape introuvable" }, 404);
  const body = await c.req.json().catch(() => null);
  const sets: string[] = [];
  const vals: any[] = [];
  if (body?.title !== undefined) sets.push("title = ?"), vals.push(clampText(body.title, 200));
  if (body?.description !== undefined) sets.push("description = ?"), vals.push(clampText(body.description, 2000));
  if (body?.due_date !== undefined) sets.push("due_date = ?"), vals.push(body.due_date || null);
  if (body?.needs_validation !== undefined) sets.push("needs_validation = ?"), vals.push(body.needs_validation ? 1 : 0);
  if (body?.sort_order !== undefined) sets.push("sort_order = ?"), vals.push(parseInt(body.sort_order, 10) || 0);

  const newStatus = body?.status;
  if (newStatus && ["todo", "in_progress", "review", "done"].includes(newStatus) && newStatus !== step.status) {
    sets.push("status = ?");
    vals.push(newStatus);
    if (newStatus === "in_progress" && !step.started_at) sets.push("started_at = ?"), vals.push(nowIso());
    if (newStatus === "done") sets.push("completed_at = ?"), vals.push(nowIso());
  }
  if (sets.length) {
    vals.push(step.id);
    await c.env.DB.prepare(`UPDATE project_steps SET ${sets.join(", ")} WHERE id = ?`).bind(...vals).run();
  }

  if (newStatus && newStatus !== step.status) {
    const project = await getProject(c.env.DB, step.project_id);
    if (newStatus === "review") {
      await logActivity(c.env.DB, { projectId: step.project_id, actor: "admin", action: "step_review", detail: step.title });
      c.executionCtx.waitUntil(
        notifyClient(clientOf(project), {
          subject: `À vous de jouer : « ${step.title} » attend votre validation`,
          title: `« ${step.title} » est prête`,
          body: "Jetez un œil et dites-nous si tout vous convient : un clic pour valider, ou dites-nous ce qu'il faut ajuster.",
          cta: "Voir et valider",
        })
      );
    } else if (newStatus === "done") {
      await logActivity(c.env.DB, { projectId: step.project_id, actor: "admin", action: "step_done", detail: step.title });
      // l'étape suivante démarre automatiquement
      const next = await c.env.DB.prepare("SELECT id FROM project_steps WHERE project_id = ? AND sort_order > ? AND status = 'todo' ORDER BY sort_order LIMIT 1")
        .bind(step.project_id, step.sort_order)
        .first();
      if (next) await c.env.DB.prepare("UPDATE project_steps SET status = 'in_progress', started_at = ? WHERE id = ?").bind(nowIso(), next.id).run();
    } else if (newStatus === "in_progress") {
      await logActivity(c.env.DB, { projectId: step.project_id, actor: "admin", action: "step_started", detail: step.title });
    }
  }
  return c.json({ ok: true });
});

app.delete("/steps/:id", async (c) => {
  await c.env.DB.prepare("DELETE FROM project_steps WHERE id = ?").bind(parseInt(c.req.param("id"), 10)).run();
  return c.json({ ok: true });
});

/* ── Checklist ── */

app.post("/projects/:id/checklist", async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  const body = await c.req.json().catch(() => null);
  const label = clampText(body?.label, 300);
  if (!label) return c.json({ ok: false, error: "Libellé requis" }, 400);
  const kind = ["file", "form", "access", "confirm"].includes(body?.kind) ? body.kind : "file";
  const questions = Array.isArray(body?.config) ? body.config.map((q: any) => ({ q: clampText(q?.q, 300), hint: clampText(q?.hint, 300), long: !!q?.long })).filter((q: any) => q.q) : null;
  const max = await c.env.DB.prepare("SELECT COALESCE(MAX(sort_order), -1) AS m FROM checklist_items WHERE project_id = ?").bind(id).first();
  await c.env.DB.prepare("INSERT INTO checklist_items (project_id, label, help, kind, category, config, status, due_date, sort_order) VALUES (?, ?, ?, ?, ?, ?, 'todo', ?, ?)")
    .bind(id, label, clampText(body?.help, 1000), kind, clampText(body?.category, 40) || null, questions?.length ? JSON.stringify(questions) : null, body?.due_date || null, (max?.m ?? -1) + 1)
    .run();
  await logActivity(c.env.DB, { projectId: id, actor: "admin", action: "checklist_added", detail: label });
  return c.json({ ok: true });
});

app.put("/checklist/:id", async (c) => {
  const item = await c.env.DB.prepare("SELECT * FROM checklist_items WHERE id = ?").bind(parseInt(c.req.param("id"), 10)).first();
  if (!item) return c.json({ ok: false, error: "Élément introuvable" }, 404);
  const body = await c.req.json().catch(() => null);
  const sets: string[] = [];
  const vals: any[] = [];
  if (body?.label !== undefined) sets.push("label = ?"), vals.push(clampText(body.label, 300));
  if (body?.help !== undefined) sets.push("help = ?"), vals.push(clampText(body.help, 1000));
  if (body?.due_date !== undefined) sets.push("due_date = ?"), vals.push(body.due_date || null);
  if (body?.status && ["todo", "sent", "ok"].includes(body.status)) {
    sets.push("status = ?");
    vals.push(body.status);
    if (body.status === "ok") sets.push("validated_at = ?"), vals.push(nowIso());
    if (body.status === "todo") sets.push("reminder_count = 0");
  }
  if (!sets.length) return c.json({ ok: true });
  vals.push(item.id);
  await c.env.DB.prepare(`UPDATE checklist_items SET ${sets.join(", ")} WHERE id = ?`).bind(...vals).run();
  if (body?.status === "ok") await logActivity(c.env.DB, { projectId: item.project_id, actor: "admin", action: "checklist_ok", detail: item.label });
  if (body?.status === "todo" && item.status !== "todo") {
    // renvoyé au client (ex : photo floue) avec un message explicatif
    const reason = clampText(body?.reason, 1000);
    await logActivity(c.env.DB, { projectId: item.project_id, actor: "admin", action: "checklist_reopened", detail: `${item.label}${reason ? ` : ${reason}` : ""}` });
    if (reason) {
      await c.env.DB.prepare("INSERT INTO messages (project_id, author, kind, body, created_at) VALUES (?, 'admin', 'text', ?, ?)")
        .bind(item.project_id, `À propos de « ${item.label} » : ${reason}`, nowIso())
        .run();
    }
  }
  return c.json({ ok: true });
});

app.delete("/checklist/:id", async (c) => {
  await c.env.DB.prepare("DELETE FROM checklist_items WHERE id = ?").bind(parseInt(c.req.param("id"), 10)).run();
  return c.json({ ok: true });
});

/* ── Coffre d'accès ── */

app.get("/projects/:id/vault", async (c) => {
  const { results } = await c.env.DB.prepare("SELECT * FROM vault_entries WHERE project_id = ? ORDER BY created_at DESC").bind(parseInt(c.req.param("id"), 10)).all();
  const entries = [];
  for (const e of results || []) entries.push({ ...e, secret_enc: undefined, secret: await decryptSecret(c.env, e.secret_enc) });
  return c.json({ ok: true, entries });
});

app.post("/projects/:id/vault", async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  const body = await c.req.json().catch(() => null);
  const label = clampText(body?.label, 120);
  if (!label) return c.json({ ok: false, error: "Libellé requis" }, 400);
  await c.env.DB.prepare("INSERT INTO vault_entries (project_id, label, url, login, secret_enc, note, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, 'admin', ?)")
    .bind(id, label, safeUrl(body?.url), clampText(body?.login, 200) || null, await encryptSecret(c.env, clampText(body?.secret, 500)), clampText(body?.note, 1000) || null, nowIso())
    .run();
  await logActivity(c.env.DB, { projectId: id, actor: "admin", action: "vault_added", detail: label });
  return c.json({ ok: true });
});

app.delete("/vault/:id", async (c) => {
  await c.env.DB.prepare("DELETE FROM vault_entries WHERE id = ?").bind(parseInt(c.req.param("id"), 10)).run();
  return c.json({ ok: true });
});

/* ── Point de la semaine ── */

app.post("/projects/:id/weekly-update", async (c) => {
  const project = await getProject(c.env.DB, c.req.param("id"));
  if (!project) return c.json({ ok: false, error: "Projet introuvable" }, 404);
  const body = await c.req.json().catch(() => null);
  const text = clampText(body?.text, 3000);
  if (!text) return c.json({ ok: false, error: "Écrivez le point de la semaine." }, 400);
  const now = nowIso();
  await c.env.DB.batch([
    c.env.DB.prepare("UPDATE client_projects SET weekly_update = ?, weekly_update_at = ? WHERE id = ?").bind(text, now, project.id),
    c.env.DB.prepare("INSERT INTO messages (project_id, author, kind, body, created_at) VALUES (?, 'admin', 'update', ?, ?)").bind(project.id, text, now),
  ]);
  await logActivity(c.env.DB, { projectId: project.id, actor: "admin", action: "weekly_update", detail: text.slice(0, 120) });
  if (body?.notify !== false) {
    c.executionCtx.waitUntil(notifyClient(clientOf(project), { subject: `Le point de la semaine — ${project.title}`, title: "Où en est votre projet", body: text, cta: "Voir mon projet" }));
  }
  return c.json({ ok: true });
});

/* Clôture d'une série de modifications. */
app.post("/projects/:id/close-round", async (c) => {
  const project = await getProject(c.env.DB, c.req.param("id"));
  if (!project) return c.json({ ok: false, error: "Projet introuvable" }, 404);
  const used = (project.revision_used || 0) + 1;
  await c.env.DB.prepare("UPDATE client_projects SET revision_used = ? WHERE id = ?").bind(used, project.id).run();
  const total = project.revision_rounds;
  await logActivity(c.env.DB, {
    projectId: project.id,
    actor: "admin",
    action: "round_closed",
    detail: total && total > 0 ? `Série de modifications ${used}/${total} terminée` : `Série de modifications n°${used} terminée`,
  });
  return c.json({ ok: true, used });
});

/* ── Modèles de projet par pack ── */

app.get("/templates", async (c) => {
  const { results } = await c.env.DB.prepare("SELECT * FROM project_templates ORDER BY sort_order, id").all();
  return c.json({ ok: true, templates: (results || []).map(hydrateTemplate), defaults: DEFAULT_TEMPLATES, effective: await getTemplates(c.env.DB) });
});

function templatePayload(body: any) {
  const steps = Array.isArray(body?.steps)
    ? body.steps.map((s: any) => ({ title: clampText(s?.title, 200), description: clampText(s?.description, 1000), needs_validation: !!s?.needs_validation, days: parseInt(s?.days, 10) || 0 })).filter((s: any) => s.title)
    : [];
  const checklist = Array.isArray(body?.checklist)
    ? body.checklist
        .map((it: any) => ({
          label: clampText(it?.label, 300),
          help: clampText(it?.help, 1000),
          kind: ["file", "form", "access", "confirm"].includes(it?.kind) ? it.kind : "file",
          category: clampText(it?.category, 40) || undefined,
          due_days: parseInt(it?.due_days, 10) || undefined,
          config: Array.isArray(it?.config) ? it.config.map((q: any) => ({ q: clampText(q?.q, 300), hint: clampText(q?.hint, 300), long: !!q?.long })).filter((q: any) => q.q) : undefined,
        }))
        .filter((it: any) => it.label)
    : [];
  const intOrNull = (v: any) => (v === "" || v == null || !Number.isFinite(Number(v)) ? null : Math.round(Number(v)));
  return {
    pack: clampText(body?.pack, 100),
    title: clampText(body?.title, 200),
    delay_days: intOrNull(body?.delay_days),
    revision_rounds: intOrNull(body?.revision_rounds),
    support_days: intOrNull(body?.support_days),
    steps: JSON.stringify(steps),
    checklist: JSON.stringify(checklist),
    contract_template_id: intOrNull(body?.contract_template_id),
  };
}

app.post("/templates", async (c) => {
  const p = templatePayload(await c.req.json().catch(() => null));
  if (!p.pack) return c.json({ ok: false, error: "Pack requis" }, 400);
  const res = await c.env.DB.prepare(
    "INSERT INTO project_templates (pack, title, delay_days, revision_rounds, support_days, steps, checklist, contract_template_id, active, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)"
  )
    .bind(p.pack, p.title, p.delay_days, p.revision_rounds, p.support_days, p.steps, p.checklist, p.contract_template_id, nowIso())
    .run();
  return c.json({ ok: true, id: res.meta.last_row_id });
});

app.put("/templates/:id", async (c) => {
  const p = templatePayload(await c.req.json().catch(() => null));
  if (!p.pack) return c.json({ ok: false, error: "Pack requis" }, 400);
  await c.env.DB.prepare(
    "UPDATE project_templates SET pack = ?, title = ?, delay_days = ?, revision_rounds = ?, support_days = ?, steps = ?, checklist = ?, contract_template_id = ?, updated_at = ? WHERE id = ?"
  )
    .bind(p.pack, p.title, p.delay_days, p.revision_rounds, p.support_days, p.steps, p.checklist, p.contract_template_id, nowIso(), parseInt(c.req.param("id"), 10))
    .run();
  return c.json({ ok: true });
});

app.delete("/templates/:id", async (c) => {
  await c.env.DB.prepare("DELETE FROM project_templates WHERE id = ?").bind(parseInt(c.req.param("id"), 10)).run();
  return c.json({ ok: true });
});

export default app;
