/* ------------------------------------------------------------------
   /api/portal/* — API du portail client (espace /espace/<slug>).
   Chaque sous-module vérifie lui-même que la ressource appartient au
   client connecté (voir ./common.ts).
------------------------------------------------------------------- */
import { Hono } from "hono";
import auth from "./auth";
import project from "./project";
import content from "./content";
import comms from "./comms";
import billing from "./billing";

const app = new Hono();

// Réponses privées : jamais mises en cache par un proxy ou le navigateur.
app.use("*", async (c, next) => {
  await next();
  if (!c.res.headers.has("cache-control")) c.res.headers.set("cache-control", "private, no-store");
});

app.route("/", auth);
app.route("/", project);
app.route("/", content);
app.route("/", comms);
app.route("/", billing);

export default app;
