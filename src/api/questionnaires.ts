/* ------------------------------------------------------------------
   /api/q/:token — questionnaire client (lien secret, sans connexion).
   GET    : définition + réponses déjà enregistrées
   PUT    : sauvegarde automatique (brouillon)
   POST   /submit : envoi définitif (notifie Impact Tech)
   Les coordonnées (numéro WhatsApp, email) complètent la fiche du client
   si elle ne les a pas encore : elles servent à l'envoi du code d'accès.
------------------------------------------------------------------- */
import { Hono } from "hono";
import { notifyAdmin } from "../lib/portal/mail";
import { clientIp, logActivity, nowIso, parseJson } from "../lib/portal/util";
import { CONTACT_EMAIL, CONTACT_PHONE, normalizeDefinition, sanitizeAnswers } from "../lib/questionnaires";

const app = new Hono();

app.use("*", async (c, next) => {
  await next();
  c.res.headers.set("cache-control", "private, no-store");
});

async function load(db: any, token: string) {
  if (!/^[a-f0-9]{24,64}$/.test(token || "")) return null;
  return db
    .prepare(
      `SELECT q.*, r.answers, r.filled, r.total, r.updated_at AS saved_at, c.name AS client_name, c.phone AS client_phone, c.email AS client_email
       FROM questionnaires q
       LEFT JOIN questionnaire_responses r ON r.questionnaire_id = q.id
       LEFT JOIN clients c ON c.id = q.client_id
       WHERE q.token = ?`
    )
    .bind(token)
    .first();
}

/* Complète la fiche client avec les coordonnées du questionnaire.
   - Champ vide dans la fiche : on le remplit (et on note que c'est nous).
   - Valeur que nous avions nous-mêmes ajoutée : on la met à jour (la
     sauvegarde automatique passe pendant la frappe, « nom@gmail.c » ne doit
     pas rester figé).
   - Toute autre valeur n'est jamais écrasée : le lien du questionnaire n'est
     pas protégé par un code, on ne laisse pas changer l'email ou le numéro
     qui servent à se connecter. Une différence est signalée à l'envoi. */
const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
const digits = (v: any) => String(v || "").replace(/\D/g, "");

async function lastAutofill(db: any, clientId: number, field: string): Promise<string | null> {
  const row = await db
    .prepare("SELECT detail FROM activity_log WHERE client_id = ? AND action = 'contact_autofill' AND detail LIKE ? ORDER BY id DESC LIMIT 1")
    .bind(clientId, `${field}:%`)
    .first();
  return row ? String(row.detail).slice(field.length + 1) : null;
}

async function syncContact(c: any, q: any, answers: any, submit: boolean): Promise<string[]> {
  if (!q.client_id) return [];
  const notes: string[] = [];
  const fields = [
    { key: "phone", col: "client_phone", value: String(answers[CONTACT_PHONE] || "").trim().slice(0, 50), valid: (v: string) => digits(v).length >= 9, same: (a: string, b: string) => digits(a).slice(-9) === digits(b).slice(-9), label: "Numéro" },
    { key: "email", col: "client_email", value: String(answers[CONTACT_EMAIL] || "").trim().toLowerCase().slice(0, 200), valid: isEmail, same: (a: string, b: string) => a.toLowerCase() === String(b).toLowerCase(), label: "Email" },
  ];
  for (const f of fields) {
    if (!f.value || !f.valid(f.value)) continue;
    const current = q[f.col] ? String(q[f.col]) : "";
    if (current && f.same(f.value, current)) {
      if (submit && (await lastAutofill(c.env.DB, q.client_id, f.key)) === current) notes.push(`${f.label} ajouté à la fiche depuis le questionnaire : ${current}`);
      continue;
    }
    const ours = current ? (await lastAutofill(c.env.DB, q.client_id, f.key)) === current : false;
    if (!current || ours) {
      await c.env.DB.prepare(`UPDATE clients SET ${f.key} = ? WHERE id = ?`).bind(f.value, q.client_id).run();
      await logActivity(c.env.DB, { clientId: q.client_id, actor: "client", action: "contact_autofill", detail: `${f.key}:${f.value}`, visible: false });
      q[f.col] = f.value;
      if (submit) notes.push(`${f.label} ajouté à la fiche depuis le questionnaire : ${f.value}`);
    } else if (submit) {
      const note = `${f.label} indiqué (${f.value}) différent de la fiche (${current}) : à vérifier`;
      notes.push(note);
      await logActivity(c.env.DB, { clientId: q.client_id, actor: "client", action: "contact_mismatch", detail: note, visible: false });
    }
  }
  return notes;
}

async function save(c: any, q: any, raw: any, submit: boolean) {
  const def = normalizeDefinition(q.definition, q.locale);
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
  const contactNotes = await syncContact(c, q, answers, submit);
  await c.env.DB.prepare("UPDATE questionnaires SET status = ?, updated_at = ?, submitted_at = CASE WHEN ? THEN ? ELSE submitted_at END WHERE id = ?")
    .bind(status, now, submit ? 1 : 0, now, q.id)
    .run();
  return { filled, total, savedAt: now, status, contactNotes };
}

/* Coordonnées déjà connues : pré-remplies (le client n'a qu'à vérifier). */
function prefill(answers: any, q: any) {
  const a = { ...answers };
  if (!a[CONTACT_PHONE] && q.client_phone) a[CONTACT_PHONE] = q.client_phone;
  if (!a[CONTACT_EMAIL] && q.client_email) a[CONTACT_EMAIL] = q.client_email;
  return a;
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
      definition: normalizeDefinition(q.definition, q.locale),
      answers: prefill(parseJson(q.answers, {}), q),
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
  const { contactNotes: _n, ...res } = await save(c, q, body.answers, false);
  return c.json({ ok: true, ...res });
});

app.post("/:token/submit", async (c) => {
  const q = await load(c.env.DB, c.req.param("token"));
  if (!q) return c.json({ ok: false, error: "Ce lien n'est pas valide." }, 404);
  if (q.status === "closed") return c.json({ ok: false, error: "Ce questionnaire est clôturé." }, 409);
  const body = await c.req.json().catch(() => null);
  if (!body || typeof body.answers !== "object") return c.json({ ok: false, error: "Données invalides" }, 400);
  const { contactNotes, ...res } = await save(c, q, body.answers, true);
  const again = q.status === "submitted";
  if (q.project_id || q.client_id) {
    await logActivity(c.env.DB, { projectId: q.project_id, clientId: q.client_id, actor: "client", action: "questionnaire_submitted", detail: q.title, ip: clientIp(c) });
  }
  c.executionCtx.waitUntil(
    notifyAdmin({
      subject: `${again ? "📝 Réponses mises à jour" : "📋 Questionnaire rempli"} — ${q.client_name || q.title}`,
      title: q.title,
      lines: [`${res.filled} champ(s) rempli(s) sur ${res.total}.`, ...contactNotes, "Les réponses (et l'export PDF) sont dans l'admin : Portail Client → Questionnaires."],
    })
  );
  return c.json({ ok: true, ...res });
});

export default app;
