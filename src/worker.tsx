/* ------------------------------------------------------------------
   IMPACT TECH — Worker Cloudflare (Hono, rendu serveur JSX)
   Remplace l'ancienne stack Next.js/OpenNext. Un seul fichier route
   les pages marketing (SSR), les API publiques et l'API admin.
------------------------------------------------------------------- */
import { Hono } from "hono";
import { getContent } from "./lib/content";
import { DEFAULTS } from "./lib/defaults";
import { syncContactToNotion } from "./lib/notion";
import adminApi from "./api/admin";

import HomePage from "./pages/home";
import ServicesPage from "./pages/services";
import RealisationsPage from "./pages/realisations";
import BlogPage from "./pages/blog";
import ArticlePage from "./pages/article";
import ContactPage from "./pages/contact";
import AboutPage from "./pages/a-propos";
import MentionsLegalesPage from "./pages/mentions-legales";
import ConfidentialitePage from "./pages/confidentialite";
import { getArticleBySlug, getRelatedArticles, articleSlug } from "./lib/articles";
import { SITE_URL } from "./lib/seo";
import { initGatewayPayment, getPayment, verifyGatewayReturnSignature, verifyWebhookSignature, generatePaymentExternalId } from "./lib/kpay";

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

app.get("/blog/:slug", async (c) => {
  const content = await getContent(c.env);
  // Mêmes données que la liste du blog : si la table posts (D1) est vide,
  // on retombe sur DEFAULTS.posts, exactement comme BlogList/Blog. Sans ça,
  // les liens d'articles (générés depuis DEFAULTS) renverraient un 404.
  const posts = content.posts?.length ? content.posts : DEFAULTS.posts;
  const article = getArticleBySlug(posts, c.req.param("slug"));
  if (!article) return c.notFound();
  const related = getRelatedArticles(posts, article.slug, 3);
  return c.html(<ArticlePage article={article} related={related} settings={content.settings} />);
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

/* ---------- Sitemap dynamique (inclut tous les articles du blog) ---------- */
app.get("/sitemap.xml", async (c) => {
  const content = await getContent(c.env);
  const posts = content.posts?.length ? content.posts : DEFAULTS.posts;
  const staticUrls = [
    { path: "/", freq: "weekly", prio: "1.0" },
    { path: "/services", freq: "monthly", prio: "0.9" },
    { path: "/realisations", freq: "monthly", prio: "0.8" },
    { path: "/contact", freq: "yearly", prio: "0.8" },
    { path: "/a-propos", freq: "yearly", prio: "0.6" },
    { path: "/blog", freq: "weekly", prio: "0.7" },
    { path: "/mentions-legales", freq: "yearly", prio: "0.3" },
    { path: "/confidentialite", freq: "yearly", prio: "0.3" },
  ];
  const urls = [
    ...staticUrls,
    ...posts.map((p) => ({ path: `/blog/${articleSlug(p.title)}`, freq: "monthly", prio: "0.7" })),
  ];
  const body =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls
      .map((u) => `  <url><loc>${SITE_URL}${u.path}</loc><changefreq>${u.freq}</changefreq><priority>${u.prio}</priority></url>`)
      .join("\n") +
    `\n</urlset>\n`;
  return c.body(body, 200, { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" });
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

    c.executionCtx.waitUntil(
      syncContactToNotion(c.env, {
        name,
        phone,
        email: (body.email || "").trim(),
        company: (body.company || "").trim(),
        type: (body.type || "").trim(),
        budget: (body.budget || "").trim(),
        message,
      })
    );

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

/* ---------- Paiements K-PAY (Mobile Money) ----------
   Architecture complète : .claude/skills/kpay-payments/SKILL.md */

function parseOfferAmount(priceText) {
  const digits = String(priceText || "").replace(/[^\d]/g, "");
  return digits ? parseInt(digits, 10) : NaN;
}

app.post("/api/payments/init", async (c) => {
  if (!c.env.DB) return c.json({ ok: false, error: "Base de données indisponible." }, 503);

  const body = await c.req.json().catch(() => null);
  const offerTag = (body?.offerTag || "").trim();
  const customerName = (body?.customerName || "").trim().slice(0, 200);
  const customerEmail = (body?.customerEmail || "").trim().slice(0, 200);
  const customerPhone = (body?.customerPhone || "").trim().slice(0, 50);
  if (!offerTag || !customerName || !customerPhone) {
    return c.json({ ok: false, error: "Nom, téléphone et offre sont obligatoires." }, 400);
  }

  const offer = await c.env.DB.prepare("SELECT tag, price, is_quote FROM offers WHERE tag = ? AND active = 1")
    .bind(offerTag)
    .first();
  if (!offer) return c.json({ ok: false, error: "Offre introuvable." }, 404);
  if (offer.is_quote) return c.json({ ok: false, error: "Cette offre est sur devis : contactez-nous via le formulaire." }, 400);

  const amount = parseOfferAmount(offer.price);
  if (!Number.isFinite(amount) || amount < 50) {
    return c.json({ ok: false, error: "Montant de l'offre invalide." }, 422);
  }

  const externalId = generatePaymentExternalId();

  try {
    await c.env.DB.prepare(
      `INSERT INTO payments (external_id, offer_tag, amount, currency, status, customer_name, customer_email, customer_phone)
       VALUES (?, ?, ?, 'XAF', 'PENDING', ?, ?, ?)`
    )
      .bind(externalId, offerTag, amount, customerName, customerEmail, customerPhone)
      .run();

    const payment = await initGatewayPayment(c.env, {
      amount,
      externalId,
      description: `${offer.tag} — impacttech237.com`,
      returnUrl: `${SITE_URL}/api/payments/return`,
      cancelUrl: `${SITE_URL}/api/payments/return`,
      customerEmail: customerEmail || undefined,
    });

    await c.env.DB.prepare("UPDATE payments SET kpay_id = ?, kpay_reference = ?, is_test = ? WHERE external_id = ?")
      .bind(payment.id, payment.reference, payment.isTest ? 1 : 0, externalId)
      .run();

    return c.json({ ok: true, gatewayUrl: payment.gatewayUrl });
  } catch (e) {
    console.error("POST /api/payments/init:", e?.message, e?.kpayError);
    await c.env.DB.prepare("UPDATE payments SET status = 'FAILED', failure_reason = ? WHERE external_id = ?")
      .bind(e?.message || "Erreur d'initiation", externalId)
      .run()
      .catch(() => {});
    return c.json({ ok: false, error: "Impossible d'initier le paiement. Réessayez ou contactez-nous." }, 502);
  }
});

app.get("/api/payments/return", async (c) => {
  const query = c.req.query();
  const layoutPage = (title, message, ok) => c.html(
    `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
    <title>${title} — IMPACT TECH</title>
    <style>body{font-family:system-ui,sans-serif;background:#0e0e0c;color:#f7efd9;display:flex;min-height:100svh;align-items:center;justify-content:center;padding:24px;text-align:center}
    .card{max-width:440px}h1{font-size:1.6rem;margin-bottom:12px;color:${ok ? "#3ecf6e" : "#c0202b"}}p{color:rgba(247,239,217,.72);margin-bottom:24px}
    a{display:inline-block;background:#c0202b;color:#fff;text-decoration:none;padding:12px 28px;border-radius:100px;font-weight:600}</style>
    </head><body><div class="card"><h1>${title}</h1><p>${message}</p><a href="/">Retour à l'accueil</a></div></body></html>`,
    200
  );

  const validSig = c.env.DB ? await verifyGatewayReturnSignature(c.env, query) : false;
  if (!validSig) {
    return layoutPage("Lien invalide", "Ce lien de paiement est invalide ou a expiré. Si le paiement a bien été effectué, contactez-nous.", false);
  }

  const row = await c.env.DB.prepare("SELECT * FROM payments WHERE external_id = ?").bind(query.externalId).first();
  if (!row) {
    return layoutPage("Paiement introuvable", "Nous ne retrouvons pas cette transaction. Contactez-nous si le paiement a été débité.", false);
  }

  // Ne jamais faire confiance à la seule query signée : on reconfirme le
  // statut auprès de K-PAY avant d'afficher un succès (le webhook reste la
  // source d'autorité pour la mise à jour définitive de la base).
  let finalStatus = row.status;
  try {
    const payment = await getPayment(c.env, row.kpay_id);
    finalStatus = payment.status;
    await c.env.DB.prepare("UPDATE payments SET status = ?, failure_reason = ?, updated_at = datetime('now') WHERE external_id = ?")
      .bind(finalStatus, payment.failureReason || null, query.externalId)
      .run();
  } catch (e) {
    console.error("GET /api/payments/return — reconfirmation impossible:", e?.message);
  }

  if (finalStatus === "COMPLETED") {
    return layoutPage("Paiement réussi", "Merci ! Votre paiement a bien été reçu. Nous démarrons votre projet très vite.", true);
  }
  if (finalStatus === "CANCELLED") {
    return layoutPage("Paiement annulé", "Vous avez annulé le paiement. Vous pouvez réessayer à tout moment depuis la page des offres.", false);
  }
  if (finalStatus === "FAILED") {
    return layoutPage("Paiement échoué", "Le paiement n'a pas abouti. Vérifiez votre solde Mobile Money et réessayez, ou contactez-nous.", false);
  }
  return layoutPage("Paiement en attente", "Votre paiement est en cours de traitement. Vous recevrez une confirmation dès qu'il sera validé.", false);
});

app.post("/api/payments/webhook", async (c) => {
  const raw = await c.req.text();
  const signature = c.req.header("x-kpay-signature");
  const valid = c.env.DB ? await verifyWebhookSignature(c.env, raw, signature) : false;
  if (!valid) return c.json({ ok: false, error: "Invalid signature" }, 401);

  const event = JSON.parse(raw);
  const { externalId, paymentId, reference, status, failureReason } = event;

  if (externalId) {
    await c.env.DB.prepare(
      `UPDATE payments SET status = ?, kpay_id = COALESCE(kpay_id, ?), kpay_reference = COALESCE(kpay_reference, ?),
       failure_reason = ?, updated_at = datetime('now') WHERE external_id = ?`
    )
      .bind(status, paymentId || null, reference || null, failureReason || null, externalId)
      .run()
      .catch((e) => console.error("POST /api/payments/webhook — update:", e?.message));
  }

  return c.json({ ok: true });
});

/* ---------- Médias uploadés (R2, public en lecture) ---------- */
app.get("/media/*", async (c) => {
  const key = decodeURIComponent(c.req.path.replace(/^\/media\//, ""));
  if (!key || !c.env.MEDIA) return c.notFound();
  const obj = await c.env.MEDIA.get(key);
  if (!obj) return c.notFound();
  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set("etag", obj.httpEtag);
  headers.set("cache-control", "public, max-age=31536000, immutable");
  return new Response(obj.body, { headers });
});

/* ---------- API admin (protégée) ---------- */
app.route("/api/admin", adminApi);

export default app;
