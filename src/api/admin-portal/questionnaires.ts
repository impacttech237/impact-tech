/* ------------------------------------------------------------------
   /api/admin/portal/questionnaires — questionnaires clients.
   Créer à partir d'une définition JSON (voir src/lib/questionnaires.ts),
   partager le lien, lire les réponses, exporter en PDF.
------------------------------------------------------------------- */
import { Hono } from "hono";
import { questionnairePdf } from "../../lib/portal/pdf";
import { logActivity, nowIso, parseJson, randomToken, waLink } from "../../lib/portal/util";
import { flattenFields, formatAnswer, normalizeDefinition } from "../../lib/questionnaires";
import { SITE_URL } from "../../lib/seo";

const app = new Hono();

const linkOf = (token: string) => `${SITE_URL}/q/${token}`;

function share(q: any) {
  const url = linkOf(q.token);
  const first = q.client_name ? String(q.client_name).split(" ")[0] : "";
  const text = `Bonjour${first ? ` ${first}` : ""}, comme convenu lors de notre appel, voici le questionnaire pour préparer votre projet : ${url}\nVos réponses sont enregistrées au fur et à mesure, vous pouvez le compléter en plusieurs fois.`;
  return { url, text, whatsapp: q.client_phone ? waLink(q.client_phone, text) : `https://wa.me/?text=${encodeURIComponent(text)}` };
}

const SELECT = `SELECT q.id, q.token, q.title, q.client_id, q.project_id, q.status, q.locale, q.created_at, q.updated_at, q.opened_at, q.submitted_at,
  r.filled, r.total, r.updated_at AS saved_at, c.name AS client_name, c.phone AS client_phone, p.title AS project_title
  FROM questionnaires q
  LEFT JOIN questionnaire_responses r ON r.questionnaire_id = q.id
  LEFT JOIN clients c ON c.id = q.client_id
  LEFT JOIN client_projects p ON p.id = q.project_id`;

app.get("/questionnaires", async (c) => {
  const clientId = c.req.query("client_id");
  const { results } = await c.env.DB.prepare(`${SELECT}${clientId ? " WHERE q.client_id = ?" : ""} ORDER BY q.created_at DESC`)
    .bind(...(clientId ? [parseInt(clientId, 10)] : []))
    .all();
  return c.json({ ok: true, questionnaires: (results || []).map((q: any) => ({ ...q, link: linkOf(q.token) })) });
});

app.post("/questionnaires", async (c) => {
  const body = await c.req.json().catch(() => null);
  let def;
  try {
    def = normalizeDefinition(body?.definition, body?.locale === "en" ? "en" : "fr");
  } catch (e) {
    return c.json({ ok: false, error: `Définition invalide : ${(e as Error).message}` }, 400);
  }
  const clientId = body?.client_id ? parseInt(body.client_id, 10) : null;
  const projectId = body?.project_id ? parseInt(body.project_id, 10) : null;
  const token = randomToken(16);
  const res = await c.env.DB.prepare(
    "INSERT INTO questionnaires (token, title, client_id, project_id, definition, status, locale, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'sent', ?, ?, ?)"
  )
    .bind(token, def.title, clientId, projectId, JSON.stringify(def), body?.locale === "en" ? "en" : "fr", nowIso(), nowIso())
    .run();
  if (clientId || projectId) {
    await logActivity(c.env.DB, { projectId, clientId, actor: "admin", action: "questionnaire_sent", detail: def.title });
  }
  const q = await c.env.DB.prepare(`${SELECT} WHERE q.id = ?`).bind(res.meta.last_row_id).first();
  return c.json({ ok: true, id: q.id, link: linkOf(token), share: share(q) });
});

app.get("/questionnaires/:id", async (c) => {
  const q = await c.env.DB.prepare(`${SELECT.replace("SELECT q.id,", "SELECT q.definition, r.answers, q.id,")} WHERE q.id = ?`)
    .bind(parseInt(c.req.param("id"), 10))
    .first();
  if (!q) return c.json({ ok: false, error: "Questionnaire introuvable" }, 404);
  const answers = parseJson(q.answers, {});
  return c.json({
    ok: true,
    questionnaire: { ...q, definition: parseJson(q.definition, null), answers, link: linkOf(q.token), share: share(q), sections: answersBySection(q.definition, answers) },
  });
});

app.put("/questionnaires/:id", async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  const body = await c.req.json().catch(() => null);
  const sets: string[] = [];
  const vals: any[] = [];
  if (body?.definition !== undefined) {
    try {
      const def = normalizeDefinition(body.definition);
      sets.push("definition = ?", "title = ?");
      vals.push(JSON.stringify(def), def.title);
    } catch (e) {
      return c.json({ ok: false, error: `Définition invalide : ${(e as Error).message}` }, 400);
    }
  }
  if (body?.status && ["sent", "in_progress", "submitted", "closed"].includes(body.status)) sets.push("status = ?"), vals.push(body.status);
  if (body?.client_id !== undefined) sets.push("client_id = ?"), vals.push(body.client_id ? parseInt(body.client_id, 10) : null);
  if (body?.project_id !== undefined) sets.push("project_id = ?"), vals.push(body.project_id ? parseInt(body.project_id, 10) : null);
  if (!sets.length) return c.json({ ok: true });
  sets.push("updated_at = ?");
  vals.push(nowIso(), id);
  await c.env.DB.prepare(`UPDATE questionnaires SET ${sets.join(", ")} WHERE id = ?`).bind(...vals).run();
  return c.json({ ok: true });
});

app.post("/questionnaires/:id/duplicate", async (c) => {
  const q = await c.env.DB.prepare("SELECT * FROM questionnaires WHERE id = ?").bind(parseInt(c.req.param("id"), 10)).first();
  if (!q) return c.json({ ok: false, error: "Questionnaire introuvable" }, 404);
  const body = await c.req.json().catch(() => ({}));
  const token = randomToken(16);
  const res = await c.env.DB.prepare(
    "INSERT INTO questionnaires (token, title, client_id, project_id, definition, status, locale, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'sent', ?, ?, ?)"
  )
    .bind(token, `${q.title} (copie)`, body?.client_id ?? null, body?.project_id ?? null, q.definition, q.locale, nowIso(), nowIso())
    .run();
  return c.json({ ok: true, id: res.meta.last_row_id, link: linkOf(token) });
});

app.delete("/questionnaires/:id", async (c) => {
  await c.env.DB.prepare("DELETE FROM questionnaires WHERE id = ?").bind(parseInt(c.req.param("id"), 10)).run();
  return c.json({ ok: true });
});

/* Réponses structurées par section (pour l'admin et le PDF). */
export function answersBySection(definition: any, answers: any) {
  const def = normalizeDefinition(definition);
  const sections: { title: string; items: { label: string; group?: string; value: string }[] }[] = [];
  for (const f of flattenFields(def)) {
    let s = sections.find((x) => x.title === f.section);
    if (!s) sections.push((s = { title: f.section, items: [] }));
    s.items.push({ label: f.label, group: f.group, value: formatAnswer(answers?.[f.key]) });
  }
  return sections;
}

app.get("/questionnaires/:id/pdf", async (c) => {
  const q = await c.env.DB.prepare(
    `SELECT q.*, r.answers, r.updated_at AS saved_at, c.name AS client_name FROM questionnaires q
     LEFT JOIN questionnaire_responses r ON r.questionnaire_id = q.id LEFT JOIN clients c ON c.id = q.client_id WHERE q.id = ?`
  )
    .bind(parseInt(c.req.param("id"), 10))
    .first();
  if (!q) return c.json({ ok: false, error: "Questionnaire introuvable" }, 404);
  const fmt = (d: string | null) => (d ? new Date(d).toLocaleString("fr-FR", { timeZone: "Africa/Douala", dateStyle: "long", timeStyle: "short" }) : null);
  const bytes = await questionnairePdf({
    title: q.title,
    clientName: q.client_name || undefined,
    submittedAt: fmt(q.submitted_at),
    updatedAt: fmt(q.saved_at),
    sections: answersBySection(q.definition, parseJson(q.answers, {})),
  });
  const name = `${q.title}`.replace(/[^\p{L}\p{N} _-]+/gu, "").trim().slice(0, 80) || "questionnaire";
  return new Response(bytes, {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `${c.req.query("download") === "1" ? "attachment" : "inline"}; filename*=UTF-8''${encodeURIComponent(name)}.pdf`,
      "cache-control": "no-store",
    },
  });
});

export default app;
