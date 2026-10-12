/* ------------------------------------------------------------------
   /api/admin/portal/* — gestion du portail client (protégée admin).
------------------------------------------------------------------- */
import { Hono } from "hono";
import { requireAdmin } from "../../lib/auth";
import clients from "./clients";
import projects from "./projects";
import documents from "./documents";
import comms from "./comms";
import billing from "./billing";
import questionnaires from "./questionnaires";

const app = new Hono();

app.use("*", async (c, next) => {
  const denied = await requireAdmin(c);
  if (denied) return denied;
  if (!c.env.DB) return c.json({ ok: false, error: "Base de données indisponible" }, 503);
  await next();
  if (!c.res.headers.has("cache-control")) c.res.headers.set("cache-control", "private, no-store");
});

app.route("/", clients);
app.route("/", projects);
app.route("/", documents);
app.route("/", comms);
app.route("/", billing);
app.route("/", questionnaires);

export default app;
