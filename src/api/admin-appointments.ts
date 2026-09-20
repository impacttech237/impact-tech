/* ------------------------------------------------------------------
   /api/admin/appointments/* — gestion admin de l'agenda.
------------------------------------------------------------------- */
import { Hono } from "hono";
import { requireAdmin } from "../lib/auth";
import { getAuthUrl, exchangeCode, isConnected, disconnect, deleteEvent } from "../lib/google-calendar";
import { SITE_URL } from "../lib/seo";

const app = new Hono();

app.use("*", async (c, next) => {
  const denied = await requireAdmin(c);
  if (denied) return denied;
  if (!c.env.DB) return c.json({ ok: false, error: "Base de données indisponible." }, 503);
  await next();
});

/* ── Types de RDV ── */

app.get("/types", async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM appointment_types ORDER BY sort_order"
  ).all();
  return c.json({ ok: true, types: results });
});

app.post("/types", async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body?.title || !body?.slug) return c.json({ ok: false, error: "title et slug requis." }, 400);

  const result = await c.env.DB.prepare(
    `INSERT INTO appointment_types (slug, title, description, duration, color, location, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    body.slug, body.title, body.description || null,
    body.duration || 30, body.color || "#C0202B",
    body.location || null, body.sort_order ?? 0
  ).run();
  return c.json({ ok: true, id: result.meta.last_row_id });
});

app.put("/types/:id", async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  const body = await c.req.json().catch(() => null);
  if (!body) return c.json({ ok: false, error: "Corps invalide." }, 400);

  const allowed = ["slug", "title", "description", "duration", "color", "location", "active", "sort_order"];
  const cols = allowed.filter((col) => body[col] !== undefined);
  if (!cols.length) return c.json({ ok: false, error: "Aucun champ." }, 400);

  const assignments = cols.map((col) => `${col} = ?`).join(", ");
  await c.env.DB.prepare(`UPDATE appointment_types SET ${assignments} WHERE id = ?`)
    .bind(...cols.map((col) => body[col]), id)
    .run();
  return c.json({ ok: true });
});

app.delete("/types/:id", async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  await c.env.DB.prepare("DELETE FROM appointment_types WHERE id = ?").bind(id).run();
  return c.json({ ok: true });
});

/* ── Plages horaires ── */

app.get("/availability", async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM availability_rules ORDER BY day_of_week, start_time"
  ).all();
  return c.json({ ok: true, rules: results });
});

app.post("/availability", async (c) => {
  const body = await c.req.json().catch(() => null);
  if (body?.day_of_week === undefined || !body?.start_time || !body?.end_time) {
    return c.json({ ok: false, error: "day_of_week, start_time et end_time requis." }, 400);
  }

  const result = await c.env.DB.prepare(
    "INSERT INTO availability_rules (day_of_week, start_time, end_time) VALUES (?, ?, ?)"
  ).bind(body.day_of_week, body.start_time, body.end_time).run();
  return c.json({ ok: true, id: result.meta.last_row_id });
});

app.put("/availability/:id", async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  const body = await c.req.json().catch(() => null);
  if (!body) return c.json({ ok: false, error: "Corps invalide." }, 400);

  const allowed = ["day_of_week", "start_time", "end_time", "active"];
  const cols = allowed.filter((col) => body[col] !== undefined);
  if (!cols.length) return c.json({ ok: false, error: "Aucun champ." }, 400);

  const assignments = cols.map((col) => `${col} = ?`).join(", ");
  await c.env.DB.prepare(`UPDATE availability_rules SET ${assignments} WHERE id = ?`)
    .bind(...cols.map((col) => body[col]), id)
    .run();
  return c.json({ ok: true });
});

app.delete("/availability/:id", async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  await c.env.DB.prepare("DELETE FROM availability_rules WHERE id = ?").bind(id).run();
  return c.json({ ok: true });
});

/* ── Rendez-vous ── */

app.get("/list", async (c) => {
  const status = c.req.query("status");
  const from = c.req.query("from");
  const to = c.req.query("to");
  const page = parseInt(c.req.query("page") || "1", 10);
  const limit = 20;
  const offset = (page - 1) * limit;

  let where = "1=1";
  const binds: any[] = [];

  if (status) { where += " AND a.status = ?"; binds.push(status); }
  if (from) { where += " AND a.start_time >= ?"; binds.push(from); }
  if (to) { where += " AND a.start_time <= ?"; binds.push(to); }

  const countRow = await c.env.DB.prepare(
    `SELECT COUNT(*) as total FROM appointments a WHERE ${where}`
  ).bind(...binds).first<{ total: number }>();

  const { results } = await c.env.DB.prepare(
    `SELECT a.*, t.title as type_title, t.color as type_color, t.duration as type_duration
     FROM appointments a JOIN appointment_types t ON t.id = a.type_id
     WHERE ${where} ORDER BY a.start_time DESC LIMIT ? OFFSET ?`
  ).bind(...binds, limit, offset).all();

  return c.json({ ok: true, appointments: results, total: countRow?.total || 0, page });
});

app.put("/appointments/:id", async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  const body = await c.req.json().catch(() => null);
  if (!body) return c.json({ ok: false, error: "Corps invalide." }, 400);

  if (body.status === "cancelled") {
    const row = await c.env.DB.prepare("SELECT gcal_event_id FROM appointments WHERE id = ?").bind(id).first<any>();
    if (row?.gcal_event_id) {
      try { await deleteEvent(c.env, row.gcal_event_id); } catch {}
    }
    await c.env.DB.prepare(
      "UPDATE appointments SET status = 'cancelled', cancelled_at = datetime('now') WHERE id = ?"
    ).bind(id).run();
    return c.json({ ok: true });
  }

  const allowed = ["status", "notes"];
  const cols = allowed.filter((col) => body[col] !== undefined);
  if (!cols.length) return c.json({ ok: false, error: "Aucun champ." }, 400);
  const assignments = cols.map((col) => `${col} = ?`).join(", ");
  await c.env.DB.prepare(`UPDATE appointments SET ${assignments} WHERE id = ?`)
    .bind(...cols.map((col) => body[col]), id)
    .run();
  return c.json({ ok: true });
});

app.delete("/appointments/:id", async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  const row = await c.env.DB.prepare("SELECT gcal_event_id FROM appointments WHERE id = ?").bind(id).first<any>();
  if (row?.gcal_event_id) {
    try { await deleteEvent(c.env, row.gcal_event_id); } catch {}
  }
  await c.env.DB.prepare("DELETE FROM appointments WHERE id = ?").bind(id).run();
  return c.json({ ok: true });
});

/* ── Google Calendar OAuth ── */

app.get("/gcal/status", async (c) => {
  const connected = await isConnected(c.env);
  return c.json({ ok: true, connected });
});

app.get("/gcal/connect", async (c) => {
  const redirectUri = `${SITE_URL}/api/admin/appointments/gcal/callback`;
  const url = getAuthUrl(c.env, redirectUri);
  return c.json({ ok: true, url });
});

app.get("/gcal/callback", async (c) => {
  const code = c.req.query("code");
  if (!code) {
    return c.html(`<p>Erreur : aucun code reçu. <a href="/admin">Retour</a></p>`);
  }

  const redirectUri = `${SITE_URL}/api/admin/appointments/gcal/callback`;
  try {
    await exchangeCode(c.env, code, redirectUri);
    return c.html(`<!doctype html><html><head><meta charset="utf-8"><title>Google Calendar connecté</title>
<style>body{font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#0e0e0c;color:#f7efd9}
.card{text-align:center;max-width:400px}h1{color:#3ecf6e}a{color:#C0202B;font-weight:600}</style>
</head><body><div class="card"><h1>✓ Connecté !</h1><p>Google Calendar est maintenant lié à votre agenda Impact Tech.</p>
<p><a href="/admin">Retour au dashboard</a></p></div></body></html>`);
  } catch (e) {
    return c.html(`<p>Erreur OAuth : ${(e as Error).message}. <a href="/admin">Retour</a></p>`);
  }
});

app.post("/gcal/disconnect", async (c) => {
  await disconnect(c.env);
  return c.json({ ok: true });
});

export default app;
