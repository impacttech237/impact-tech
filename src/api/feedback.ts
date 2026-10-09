/* ------------------------------------------------------------------
   /api/feedback/:key — widget de retours intégré aux sites en
   développement (<script src="https://impacttech237.com/feedback.js"
   data-key="..."></script>). Le client clique sur un élément de la
   page, écrit son commentaire : capture, page et appareil sont
   enregistrés comme « retour » dans son projet.
   Pas de cookie (le site en dev est sur un autre domaine) : la clé
   du projet fait office d'autorisation, avec limitation de débit.
------------------------------------------------------------------- */
import { Hono } from "hono";
import { notifyAdmin } from "../lib/portal/mail";
import { clampText, clientIp, logActivity, nowIso, safeUrl } from "../lib/portal/util";
import { shouldNotify } from "./portal/common";

const app = new Hono();
const MAX_PER_HOUR = 60;
const MAX_SCREENSHOT = 2 * 1024 * 1024;

app.use("*", async (c, next) => {
  if (c.req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "access-control-allow-origin": "*",
        "access-control-allow-methods": "GET, POST, OPTIONS",
        "access-control-allow-headers": "content-type",
        "access-control-max-age": "86400",
      },
    });
  }
  await next();
  c.res.headers.set("access-control-allow-origin", "*");
  c.res.headers.set("cache-control", "no-store");
});

async function projectByKey(db: any, key: string) {
  if (!/^[a-f0-9]{16,64}$/.test(key || "")) return null;
  return db
    .prepare(
      `SELECT p.id, p.title, p.status, p.revision_used, p.delivered_at, p.client_id, c.name AS client_name
       FROM client_projects p JOIN clients c ON c.id = p.client_id WHERE p.feedback_key = ? AND c.active = 1`
    )
    .bind(key)
    .first();
}

app.get("/:key/config", async (c) => {
  const p = await projectByKey(c.env.DB, c.req.param("key"));
  if (!p || p.status === "termine") return c.json({ ok: false }, 404);
  return c.json({ ok: true, project: p.title, firstName: String(p.client_name || "").split(" ")[0] });
});

app.post("/:key", async (c) => {
  const p = await projectByKey(c.env.DB, c.req.param("key"));
  if (!p || p.status === "termine") return c.json({ ok: false, error: "Projet introuvable" }, 404);

  const since = new Date(Date.now() - 3600 * 1000).toISOString();
  const recent = await c.env.DB.prepare("SELECT COUNT(*) AS n FROM project_requests WHERE project_id = ? AND created_at > ?").bind(p.id, since).first();
  if ((recent?.n || 0) >= MAX_PER_HOUR) return c.json({ ok: false, error: "Trop de retours d'un coup, réessayez dans un moment." }, 429);

  const body = await c.req.json().catch(() => null);
  const comment = clampText(body?.comment, 3000);
  if (!comment) return c.json({ ok: false, error: "Commentaire vide" }, 400);

  let screenshotKey: string | null = null;
  const shot = String(body?.screenshot || "");
  const m = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(shot);
  if (m && c.env.MEDIA) {
    const raw = atob(m[2]);
    if (raw.length <= MAX_SCREENSHOT) {
      const bytes = new Uint8Array(raw.length);
      for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
      screenshotKey = `feedback/${p.id}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${m[1] === "jpeg" ? "jpg" : m[1]}`;
      await c.env.MEDIA.put(screenshotKey, bytes, { httpMetadata: { contentType: `image/${m[1]}` } });
    }
  }

  const num = (v: any) => (Number.isFinite(Number(v)) ? Math.max(0, Math.min(100000, Number(v))) : null);
  const kind = p.delivered_at ? "support" : "retour";
  await c.env.DB.prepare(
    `INSERT INTO project_requests (project_id, kind, comment, page_url, pos_x, pos_y, selector, viewport, device, screenshot_key, round, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'nouveau', ?)`
  )
    .bind(
      p.id,
      kind,
      comment,
      safeUrl(body?.pageUrl),
      num(body?.x),
      num(body?.y),
      clampText(body?.selector, 500) || null,
      clampText(body?.viewport, 40) || null,
      clampText(body?.device, 40) || null,
      screenshotKey,
      kind === "retour" ? (p.revision_used || 0) + 1 : null,
      nowIso()
    )
    .run();
  await logActivity(c.env.DB, { projectId: p.id, clientId: p.client_id, actor: "client", action: "feedback", detail: comment.slice(0, 120), ip: clientIp(c) });
  if (await shouldNotify(c.env.DB, p.id, "widget", 15)) {
    c.executionCtx.waitUntil(
      notifyAdmin({ subject: `✏️ Retours sur le site — ${p.client_name}`, title: p.title, lines: [comment, body?.pageUrl ? `Page : ${body.pageUrl}` : ""].filter(Boolean) })
    );
  }
  return c.json({ ok: true });
});

export default app;
