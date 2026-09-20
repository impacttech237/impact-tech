/* ------------------------------------------------------------------
   /api/surveys/* — routes publiques pour les formulaires prospects.
------------------------------------------------------------------- */
import { Hono } from "hono";
import { getFormBySlug, createResponse, saveAnswers, completeResponse } from "../lib/surveys";

const app = new Hono();

app.get("/:slug", async (c) => {
  if (!c.env.DB) return c.json({ ok: false, error: "Base de données indisponible." }, 503);

  const form = await getFormBySlug(c.env.DB, c.req.param("slug"));
  if (!form) return c.json({ ok: false, error: "Formulaire introuvable." }, 404);

  return c.json({ ok: true, form });
});

app.post("/:slug/start", async (c) => {
  if (!c.env.DB) return c.json({ ok: false, error: "Base de données indisponible." }, 503);

  const form = await c.env.DB
    .prepare("SELECT id FROM survey_forms WHERE slug = ? AND active = 1")
    .bind(c.req.param("slug"))
    .first();
  if (!form) return c.json({ ok: false, error: "Formulaire introuvable." }, 404);

  const ip = c.req.header("cf-connecting-ip") || c.req.header("x-forwarded-for") || "";
  const ua = c.req.header("user-agent") || "";

  const responseId = await createResponse(c.env.DB, form.id as number, ip, ua);
  return c.json({ ok: true, responseId });
});

app.post("/:slug/answer", async (c) => {
  if (!c.env.DB) return c.json({ ok: false, error: "Base de données indisponible." }, 503);

  const body = await c.req.json().catch(() => null);
  if (!body?.responseId || !Array.isArray(body.answers)) {
    return c.json({ ok: false, error: "responseId et answers[] requis." }, 400);
  }

  const existing = await c.env.DB
    .prepare("SELECT id FROM survey_responses WHERE id = ?")
    .bind(body.responseId)
    .first();
  if (!existing) return c.json({ ok: false, error: "Réponse introuvable." }, 404);

  await saveAnswers(
    c.env.DB,
    body.responseId,
    body.answers.map((a: any) => ({
      question_id: a.question_id,
      value: typeof a.value === "string" ? a.value : JSON.stringify(a.value),
    }))
  );

  return c.json({ ok: true });
});

app.post("/:slug/complete", async (c) => {
  if (!c.env.DB) return c.json({ ok: false, error: "Base de données indisponible." }, 503);

  const body = await c.req.json().catch(() => null);
  if (!body?.responseId) return c.json({ ok: false, error: "responseId requis." }, 400);

  const response = await c.env.DB
    .prepare("SELECT r.id, f.redirect_url FROM survey_responses r JOIN survey_forms f ON r.form_id = f.id WHERE r.id = ?")
    .bind(body.responseId)
    .first();
  if (!response) return c.json({ ok: false, error: "Réponse introuvable." }, 404);

  await completeResponse(c.env.DB, body.responseId, {
    name: body.name,
    email: body.email,
    phone: body.phone,
    company: body.company,
  });

  return c.json({
    ok: true,
    redirect: (response.redirect_url as string) || null,
  });
});

export default app;
