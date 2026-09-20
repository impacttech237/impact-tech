/* ------------------------------------------------------------------
   /api/admin/surveys/* — gestion admin des formulaires prospects.
------------------------------------------------------------------- */
import { Hono } from "hono";
import { requireAdmin } from "../lib/auth";
import {
  getFormStructureForAdmin,
  getResponses,
  getResponseDetail,
  getFormStats,
  exportResponsesCsv,
} from "../lib/surveys";

const app = new Hono();

app.use("*", async (c, next) => {
  const denied = await requireAdmin(c);
  if (denied) return denied;
  if (!c.env.DB) return c.json({ ok: false, error: "Base de données indisponible." }, 503);
  await next();
});

/* ── Formulaires ── */

app.get("/forms", async (c) => {
  const { results } = await c.env.DB.prepare("SELECT * FROM survey_forms ORDER BY id").all();
  return c.json({ ok: true, forms: results });
});

app.put("/forms/:id", async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  const body = await c.req.json().catch(() => null);
  if (!body) return c.json({ ok: false, error: "Corps invalide." }, 400);

  const allowed = ["title", "description", "redirect_url", "active"];
  const cols = allowed.filter((col) => body[col] !== undefined);
  if (!cols.length) return c.json({ ok: false, error: "Aucun champ à mettre à jour." }, 400);

  const assignments = cols.map((col) => `${col} = ?`).join(", ");
  await c.env.DB.prepare(`UPDATE survey_forms SET ${assignments} WHERE id = ?`)
    .bind(...cols.map((col) => body[col]), id)
    .run();
  return c.json({ ok: true });
});

app.get("/forms/:id/structure", async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  const form = await getFormStructureForAdmin(c.env.DB, id);
  if (!form) return c.json({ ok: false, error: "Formulaire introuvable." }, 404);
  return c.json({ ok: true, form });
});

/* ── Sections ── */

app.post("/sections", async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body?.form_id || !body?.title) return c.json({ ok: false, error: "form_id et title requis." }, 400);

  const result = await c.env.DB.prepare(
    "INSERT INTO survey_sections (form_id, title, description, sort_order, condition) VALUES (?, ?, ?, ?, ?)"
  )
    .bind(body.form_id, body.title, body.description || null, body.sort_order ?? 0, body.condition ? JSON.stringify(body.condition) : null)
    .run();
  return c.json({ ok: true, id: result.meta.last_row_id });
});

app.put("/sections/:id", async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  const body = await c.req.json().catch(() => null);
  if (!body) return c.json({ ok: false, error: "Corps invalide." }, 400);

  const allowed = ["title", "description", "sort_order", "condition"];
  const cols = allowed.filter((col) => body[col] !== undefined);
  if (!cols.length) return c.json({ ok: false, error: "Aucun champ." }, 400);

  const values = cols.map((col) => (col === "condition" && body[col] ? JSON.stringify(body[col]) : body[col]));
  const assignments = cols.map((col) => `${col} = ?`).join(", ");
  await c.env.DB.prepare(`UPDATE survey_sections SET ${assignments} WHERE id = ?`)
    .bind(...values, id)
    .run();
  return c.json({ ok: true });
});

app.delete("/sections/:id", async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  await c.env.DB.batch([
    c.env.DB.prepare("DELETE FROM survey_questions WHERE section_id = ?").bind(id),
    c.env.DB.prepare("DELETE FROM survey_sections WHERE id = ?").bind(id),
  ]);
  return c.json({ ok: true });
});

/* ── Questions ── */

app.post("/questions", async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body?.section_id || !body?.type || !body?.label) {
    return c.json({ ok: false, error: "section_id, type et label requis." }, 400);
  }

  const result = await c.env.DB.prepare(
    "INSERT INTO survey_questions (section_id, type, label, description, required, sort_order, config) VALUES (?, ?, ?, ?, ?, ?, ?)"
  )
    .bind(
      body.section_id,
      body.type,
      body.label,
      body.description || null,
      body.required ? 1 : 0,
      body.sort_order ?? 0,
      body.config ? JSON.stringify(body.config) : null
    )
    .run();
  return c.json({ ok: true, id: result.meta.last_row_id });
});

app.put("/questions/:id", async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  const body = await c.req.json().catch(() => null);
  if (!body) return c.json({ ok: false, error: "Corps invalide." }, 400);

  const allowed = ["type", "label", "description", "required", "sort_order", "config"];
  const cols = allowed.filter((col) => body[col] !== undefined);
  if (!cols.length) return c.json({ ok: false, error: "Aucun champ." }, 400);

  const values = cols.map((col) => {
    if (col === "config" && body[col]) return JSON.stringify(body[col]);
    if (col === "required") return body[col] ? 1 : 0;
    return body[col];
  });
  const assignments = cols.map((col) => `${col} = ?`).join(", ");
  await c.env.DB.prepare(`UPDATE survey_questions SET ${assignments} WHERE id = ?`)
    .bind(...values, id)
    .run();
  return c.json({ ok: true });
});

app.delete("/questions/:id", async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  await c.env.DB.prepare("DELETE FROM survey_questions WHERE id = ?").bind(id).run();
  return c.json({ ok: true });
});

/* ── Réponses ── */

app.get("/responses", async (c) => {
  const formId = parseInt(c.req.query("form_id") || "0", 10);
  if (!formId) return c.json({ ok: false, error: "form_id requis." }, 400);

  const page = parseInt(c.req.query("page") || "1", 10);
  const search = c.req.query("search") || undefined;
  const completedParam = c.req.query("completed");
  const completed = completedParam === "true" ? true : completedParam === "false" ? false : undefined;

  const data = await getResponses(c.env.DB, formId, { page, search, completed });
  return c.json({ ok: true, ...data });
});

app.get("/responses/:id", async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  const detail = await getResponseDetail(c.env.DB, id);
  if (!detail.response) return c.json({ ok: false, error: "Réponse introuvable." }, 404);
  return c.json({ ok: true, ...detail });
});

app.delete("/responses/:id", async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  await c.env.DB.batch([
    c.env.DB.prepare("DELETE FROM survey_answers WHERE response_id = ?").bind(id),
    c.env.DB.prepare("DELETE FROM survey_responses WHERE id = ?").bind(id),
  ]);
  return c.json({ ok: true });
});

/* ── Stats ── */

app.get("/stats/:formId", async (c) => {
  const formId = parseInt(c.req.param("formId"), 10);
  const stats = await getFormStats(c.env.DB, formId);
  return c.json({ ok: true, ...stats });
});

/* ── Export CSV ── */

app.get("/export/:formId", async (c) => {
  const formId = parseInt(c.req.param("formId"), 10);
  const csv = await exportResponsesCsv(c.env.DB, formId);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="enquete-${formId}-${Date.now()}.csv"`,
    },
  });
});

export default app;
