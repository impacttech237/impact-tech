/* ------------------------------------------------------------------
   /api/q/:token — questionnaire client (lien secret, sans connexion).
   GET    : définition + réponses déjà enregistrées
   PUT    : sauvegarde automatique (brouillon)
   POST   /submit : envoi définitif (notifie Impact Tech)
------------------------------------------------------------------- */
import { Hono } from "hono";
import { notifyAdmin } from "../lib/portal/mail";
import { clientIp, logActivity, nowIso, parseJson } from "../lib/portal/util";
import { normalizeDefinition, sanitizeAnswers } from "../lib/questionnaires";

const app = new Hono();

app.use("*", async (c, next) => {
  await next();
  c.res.headers.set("cache-control", "private, no-store");
});

async function load(db: any, token: string) {
  if (!/^[a-f0-9]{24,64}$/.test(token || "")) return null;
  return db
    .prepare(
      `SELECT q.*, r.answers, r.filled, r.total, r.updated_at AS saved_at, c.name AS client_name
       FROM questionnaires q
       LEFT JOIN questionnaire_responses r ON r.questionnaire_id = q.id
       LEFT JOIN clients c ON c.id = q.client_id
       WHERE q.token = ?`
    )
    .bind(token)
    .first();
}

async function save(c: any, q: any, raw: any, submit: boolean) {
  const def = normalizeDefinition(q.definition);
  const { answers, filled, total } = sanitizeAnswers(def, raw);
  const now = nowIso();
  await c.env.DB.prepare(
    `INSERT INTO questionnaire_responses (questionnaire_id, answers, filled, total, updated_at, submitted_at, ip)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(questionnaire_id) DO UPDATE SET answers = excluded.answers, filled = excluded.filled, total = excluded.total,
       updated_at = excluded.updated_at, submitted_at = COALESCE(excluded.submitted_at, questionnaire_responses.submitted_at), ip = excluded.ip`
  )
    .bind(q.id, JSON.stringify(answers), filled, total, now, submit ? now : null, clientIp(c))
    .run();
  const status = submit ? "submitted" : q.status === "submitted" ? "submitted" : "in_progress";
  await c.env.DB.prepare("UPDATE questionnaires SET status = ?, updated_at = ?, submitted_at = CASE WHEN ? THEN ? ELSE submitted_at END WHERE id = ?")
    .bind(status, now, submit ? 1 : 0, now, q.id)
    .run();
  return { filled, total, savedAt: now, status };
}

app.get("/:token", async (c) => {
  const q = await load(c.env.DB, c.req.param("token"));
  if (!q) return c.json({ ok: false, error: "Ce lien n'est pas valide." }, 404);
  if (!q.opened_at) {
    await c.env.DB.prepare("UPDATE questionnaires SET opened_at = ? WHERE id = ?").bind(nowIso(), q.id).run();
  }
  return c.json({
    ok: true,
    questionnaire: {
      title: q.title,
      status: q.status,
      locale: q.locale || "fr",
      clientFirstName: q.client_name ? String(q.client_name).split(" ")[0] : null,
      definition: normalizeDefinition(q.definition),
      answers: parseJson(q.answers, {}),
      savedAt: q.saved_at,
      submittedAt: q.submitted_at,
    },
  });
});

app.put("/:token", async (c) => {
  const q = await load(c.env.DB, c.req.param("token"));
  if (!q) return c.json({ ok: false, error: "Ce lien n'est pas valide." }, 404);
  if (q.status === "closed") return c.json({ ok: false, error: "Ce questionnaire est clôturé." }, 409);
  const body = await c.req.json().catch(() => null);
  if (!body || typeof body.answers !== "object") return c.json({ ok: false, error: "Données invalides" }, 400);
  return c.json({ ok: true, ...(await save(c, q, body.answers, false)) });
});

app.post("/:token/submit", async (c) => {
  const q = await load(c.env.DB, c.req.param("token"));
  if (!q) return c.json({ ok: false, error: "Ce lien n'est pas valide." }, 404);
  if (q.status === "closed") return c.json({ ok: false, error: "Ce questionnaire est clôturé." }, 409);
  const body = await c.req.json().catch(() => null);
  if (!body || typeof body.answers !== "object") return c.json({ ok: false, error: "Données invalides" }, 400);
  const res = await save(c, q, body.answers, true);
  const again = q.status === "submitted";
  if (q.project_id || q.client_id) {
    await logActivity(c.env.DB, { projectId: q.project_id, clientId: q.client_id, actor: "client", action: "questionnaire_submitted", detail: q.title, ip: clientIp(c) });
  }
  c.executionCtx.waitUntil(
    notifyAdmin({
      subject: `${again ? "📝 Réponses mises à jour" : "📋 Questionnaire rempli"} — ${q.client_name || q.title}`,
      title: q.title,
      lines: [`${res.filled} champ(s) rempli(s) sur ${res.total}.`, "Les réponses (et l'export PDF) sont dans l'admin : Portail Client → Questionnaires."],
    })
  );
  return c.json({ ok: true, ...res });
});

export default app;
