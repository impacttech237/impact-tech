/* ------------------------------------------------------------------
   IMPACT TECH — Worker Cloudflare (Hono, rendu serveur JSX)
   Remplace l'ancienne stack Next.js/OpenNext. Un seul fichier route
   les pages marketing (SSR), les API publiques et l'API admin.
------------------------------------------------------------------- */
import { Hono } from "hono";
import { getContent } from "./lib/content";
import adminApi from "./api/admin";

import HomePage from "./pages/home";
import ServicesPage from "./pages/services";
import RealisationsPage from "./pages/realisations";
import BlogPage from "./pages/blog";
import ContactPage from "./pages/contact";
import AboutPage from "./pages/a-propos";
import MentionsLegalesPage from "./pages/mentions-legales";
import ConfidentialitePage from "./pages/confidentialite";

const app = new Hono();

/* ---------- Pages marketing (SSR) ---------- */

app.get("/", async (c) => {
  const content = await getContent(c.env);
  return c.html(<HomePage content={content} />);
});

app.get("/services", async (c) => {
  const content = await getContent(c.env);
  return c.html(<ServicesPage content={content} />);
});

app.get("/realisations", async (c) => {
  const content = await getContent(c.env);
  return c.html(<RealisationsPage content={content} />);
});

app.get("/blog", async (c) => {
  const content = await getContent(c.env);
  return c.html(<BlogPage content={content} />);
});

app.get("/contact", async (c) => {
  const content = await getContent(c.env);
  return c.html(<ContactPage content={content} />);
});

app.get("/a-propos", async (c) => {
  const content = await getContent(c.env);
  return c.html(<AboutPage content={content} />);
});

app.get("/mentions-legales", async (c) => {
  const content = await getContent(c.env);
  return c.html(<MentionsLegalesPage content={content} />);
});

app.get("/confidentialite", async (c) => {
  const content = await getContent(c.env);
  return c.html(<ConfidentialitePage content={content} />);
});

/* ---------- API publiques ---------- */

app.get("/api/content", async (c) => {
  const content = await getContent(c.env);
  return c.json(content, 200, { "Cache-Control": "public, max-age=60" });
});

app.post("/api/contact", async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body) return c.json({ ok: false, error: "Corps de requête invalide" }, 400);

  const name = (body.name || "").trim();
  const phone = (body.phone || "").trim();
  const message = (body.message || "").trim();
  if (!name || !phone || !message) {
    return c.json({ ok: false, error: "Nom, téléphone et message sont obligatoires." }, 400);
  }

  if (!c.env.DB) return c.json({ ok: true, simulated: true });

  try {
    await c.env.DB.prepare(
      "INSERT INTO contact_requests (name, phone, email, company, project_type, budget, message) VALUES (?, ?, ?, ?, ?, ?, ?)"
    )
      .bind(
        name.slice(0, 200),
        phone.slice(0, 50),
        (body.email || "").trim().slice(0, 200),
        (body.company || "").trim().slice(0, 200),
        (body.type || "").trim().slice(0, 100),
        (body.budget || "").trim().slice(0, 100),
        message.slice(0, 5000)
      )
      .run();
    return c.json({ ok: true });
  } catch (e) {
    console.error("POST /api/contact:", e?.message);
    return c.json({ ok: false, error: "Erreur serveur, réessayez." }, 500);
  }
});

app.post("/api/newsletter", async (c) => {
  const body = await c.req.json().catch(() => null);
  const email = (body?.email || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return c.json({ ok: false, error: "Adresse e-mail invalide." }, 400);
  }

  if (!c.env.DB) return c.json({ ok: true, simulated: true });

  try {
    await c.env.DB.prepare("INSERT OR IGNORE INTO newsletter_subscribers (email) VALUES (?)")
      .bind(email.slice(0, 200))
      .run();
    return c.json({ ok: true });
  } catch (e) {
    console.error("POST /api/newsletter:", e?.message);
    return c.json({ ok: false, error: "Erreur serveur, réessayez." }, 500);
  }
});

/* ---------- API admin (protégée) ---------- */
app.route("/api/admin", adminApi);

export default app;
