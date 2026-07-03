/* ------------------------------------------------------------------
   /api/admin/* — routes protégées du dashboard admin.
------------------------------------------------------------------- */
import { Hono } from "hono";
import {
  requireAdmin,
  getAdminPassword,
  createSessionToken,
  sessionCookieHeader,
  clearCookieHeader,
  DEFAULT_PASSWORD,
} from "../lib/auth";
import { RESOURCES } from "../lib/admin-resources";

const app = new Hono();

const SETTINGS_KEYS = [
  "site_name", "phone_display", "phone_link", "email", "address", "hours",
  "location_note", "hours_note", "facebook", "linkedin", "instagram",
  "marquee_items", "hero_pills",
];

app.post("/login", async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body) return c.json({ ok: false, error: "Corps de requête invalide" }, 400);

  const expected = getAdminPassword(c.env);
  if (body.password !== expected) {
    return c.json({ ok: false, error: "Mot de passe incorrect." }, 401);
  }

  const token = await createSessionToken(c.env);
  c.header("Set-Cookie", sessionCookieHeader(token));
  return c.json({ ok: true, usingDefaultPassword: expected === DEFAULT_PASSWORD });
});

app.post("/logout", (c) => {
  c.header("Set-Cookie", clearCookieHeader());
  return c.json({ ok: true });
});

app.get("/me", async (c) => {
  const denied = await requireAdmin(c);
  if (denied) return denied;
  return c.json({ ok: true, dbAvailable: !!c.env.DB });
});

app.get("/settings", async (c) => {
  const denied = await requireAdmin(c);
  if (denied) return denied;
  if (!c.env.DB) return c.json({ ok: false, error: "Base de données indisponible." }, 503);

  const { results } = await c.env.DB.prepare("SELECT key, value FROM settings").all();
  return c.json({ ok: true, settings: Object.fromEntries(results.map((r) => [r.key, r.value])) });
});

app.put("/settings", async (c) => {
  const denied = await requireAdmin(c);
  if (denied) return denied;
  if (!c.env.DB) return c.json({ ok: false, error: "Base de données indisponible." }, 503);

  const body = await c.req.json().catch(() => null);
  const entries = Object.entries(body?.settings || {}).filter(([k]) => SETTINGS_KEYS.includes(k));
  if (!entries.length) return c.json({ ok: false, error: "Aucun réglage valide fourni." }, 400);

  const stmt = c.env.DB.prepare(
    "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
  );
  await c.env.DB.batch(entries.map(([k, v]) => stmt.bind(k, String(v ?? ""))));
  return c.json({ ok: true });
});

app.get("/:resource", async (c) => {
  const denied = await requireAdmin(c);
  if (denied) return denied;

  const res = RESOURCES[c.req.param("resource")];
  if (!res) return c.json({ ok: false, error: "Ressource inconnue." }, 404);
  if (!c.env.DB) return c.json({ ok: false, error: "Base de données indisponible." }, 503);

  const { results } = await c.env.DB.prepare(`SELECT * FROM ${res.table} ORDER BY ${res.orderBy}`).all();
  return c.json({ ok: true, items: results });
});

app.post("/:resource", async (c) => {
  const denied = await requireAdmin(c);
  if (denied) return denied;

  const res = RESOURCES[c.req.param("resource")];
  if (!res) return c.json({ ok: false, error: "Ressource inconnue." }, 404);
  if (res.noCreate) return c.json({ ok: false, error: "Création non autorisée pour cette ressource." }, 405);
  if (!c.env.DB) return c.json({ ok: false, error: "Base de données indisponible." }, 503);

  const body = await c.req.json().catch(() => null);
  if (!body) return c.json({ ok: false, error: "Corps de requête invalide" }, 400);

  const cols = res.columns.filter((col) => body[col] !== undefined);
  if (!cols.length) return c.json({ ok: false, error: "Aucun champ fourni." }, 400);

  const placeholders = cols.map(() => "?").join(", ");
  try {
    const result = await c.env.DB.prepare(`INSERT INTO ${res.table} (${cols.join(", ")}) VALUES (${placeholders})`)
      .bind(...cols.map((col) => body[col]))
      .run();
    return c.json({ ok: true, id: result.meta.last_row_id });
  } catch (e) {
    return c.json({ ok: false, error: e?.message || "Erreur d'insertion." }, 400);
  }
});

app.put("/:resource/:id", async (c) => {
  const denied = await requireAdmin(c);
  if (denied) return denied;

  const res = RESOURCES[c.req.param("resource")];
  const id = parseInt(c.req.param("id"), 10);
  if (!res || !Number.isFinite(id)) return c.json({ ok: false, error: "Ressource inconnue." }, 404);
  if (!c.env.DB) return c.json({ ok: false, error: "Base de données indisponible." }, 503);

  const body = await c.req.json().catch(() => null);
  if (!body) return c.json({ ok: false, error: "Corps de requête invalide" }, 400);

  const cols = res.columns.filter((col) => body[col] !== undefined);
  if (!cols.length) return c.json({ ok: false, error: "Aucun champ à mettre à jour." }, 400);

  const assignments = cols.map((col) => `${col} = ?`).join(", ");
  try {
    await c.env.DB.prepare(`UPDATE ${res.table} SET ${assignments} WHERE id = ?`)
      .bind(...cols.map((col) => body[col]), id)
      .run();
    return c.json({ ok: true });
  } catch (e) {
    return c.json({ ok: false, error: e?.message || "Erreur de mise à jour." }, 400);
  }
});

app.delete("/:resource/:id", async (c) => {
  const denied = await requireAdmin(c);
  if (denied) return denied;

  const res = RESOURCES[c.req.param("resource")];
  const id = parseInt(c.req.param("id"), 10);
  if (!res || !Number.isFinite(id)) return c.json({ ok: false, error: "Ressource inconnue." }, 404);
  if (!c.env.DB) return c.json({ ok: false, error: "Base de données indisponible." }, 503);

  await c.env.DB.prepare(`DELETE FROM ${res.table} WHERE id = ?`).bind(id).run();
  return c.json({ ok: true });
});

export default app;
