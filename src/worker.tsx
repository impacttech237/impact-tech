/* ------------------------------------------------------------------
   IMPACT TECH — Worker Cloudflare (Hono, rendu serveur JSX)
   Remplace l'ancienne stack Next.js/OpenNext. Un seul fichier route
   les pages marketing (SSR), les API publiques et l'API admin.
------------------------------------------------------------------- */
import { Hono } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import { getContent } from "./lib/content";
import { localeForCountry, countryFromRequest } from "./lib/geo";
import { DEFAULTS } from "./lib/defaults";
import { syncContactToNotion } from "./lib/notion";
import adminApi from "./api/admin";
import surveysApi from "./api/surveys";
import appointmentsApi from "./api/appointments";
import portalApi from "./api/portal";
import feedbackApi from "./api/feedback";
import { setEmailEnv } from "./lib/email";
import { findClientByKey } from "./lib/portal-auth";
import { applyInvoicePayment } from "./lib/portal/billing";
import { runScheduled } from "./cron";

import HomePage from "./pages/home";
import OffresPage from "./pages/offres";
import RealisationsPage from "./pages/realisations";
import BlogPage from "./pages/blog";
import ArticlePage from "./pages/article";
import ContactPage from "./pages/contact";
import AboutPage from "./pages/a-propos";
import MentionsLegalesPage from "./pages/mentions-legales";
import ConfidentialitePage from "./pages/confidentialite";
import { getArticleBySlug, getRelatedArticles, articleSlug } from "./lib/articles";
import { getFormBySlug } from "./lib/surveys";
import EnquetePage from "./pages/enquete";
import RdvPage from "./pages/rdv";
import PortailPage from "./pages/portail";
import { SITE_URL } from "./lib/seo";
import { initGatewayPayment, getPayment, verifyGatewayReturnSignature, verifyWebhookSignature, generatePaymentExternalId } from "./lib/kpay";

const app = new Hono();

const REF_COOKIE = "ref";

app.use("*", async (c, next) => {
  setEmailEnv(c.env);
  // Parrainage : ?ref=CODE sur n'importe quelle page -> cookie 90 jours,
  // relu à l'envoi du formulaire de contact (/api/contact).
  const ref = c.req.query("ref");
  if (ref && /^[A-Z0-9]{4,12}$/i.test(ref) && c.req.method === "GET") {
    setCookie(c, REF_COOKIE, ref.toUpperCase(), { path: "/", maxAge: 60 * 60 * 24 * 90, sameSite: "Lax" });
  }
  await next();
});

const LANG_COOKIE = "lang_pref";
const LANG_COOKIE_OPTS = { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "Lax" };

/* Redirection géo-langue (refonte) : au tout premier passage d'un
   visiteur (aucun cookie de préférence), on regarde son pays via
   request.cf.country (natif Cloudflare, zéro service tiers) et on le
   redirige vers /en si son pays n'est pas francophone. Dès qu'un cookie
   existe -- posé par cette redirection OU simplement en visitant une
   page FR ou EN -- on ne redirige plus jamais automatiquement : le
   sélecteur de langue et la navigation manuelle reprennent la main sans
   jamais boucler avec ce mécanisme. */
function geoRedirectToEn(c, enPath) {
  const existing = getCookie(c, LANG_COOKIE);
  if (!existing) {
    const country = countryFromRequest(c.req.raw);
    const locale = localeForCountry(country);
    if (locale === "en") {
      setCookie(c, LANG_COOKIE, "en", LANG_COOKIE_OPTS);
      return c.redirect(enPath, 302);
    }
  }
  setCookie(c, LANG_COOKIE, "fr", LANG_COOKIE_OPTS);
  return null;
}

/* ---------- Pages marketing (SSR) ---------- */

app.get("/", async (c) => {
  const redirect = geoRedirectToEn(c, "/en");
  if (redirect) return redirect;
  const content = await getContent(c.env);
  return c.html(<HomePage content={content} />);
});

app.get("/offres", async (c) => {
  const redirect = geoRedirectToEn(c, "/en/offres");
  if (redirect) return redirect;
  const content = await getContent(c.env);
  return c.html(<OffresPage content={content} />);
});

// Fusion Services -> Offres (refonte) : préserve le référencement de
// l'ancienne page /services avec une redirection permanente.
app.get("/services", (c) => c.redirect("/offres", 301));

app.get("/realisations", async (c) => {
  const redirect = geoRedirectToEn(c, "/en/realisations");
  if (redirect) return redirect;
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
  const redirect = geoRedirectToEn(c, "/en/contact");
  if (redirect) return redirect;
  const content = await getContent(c.env);
  return c.html(<ContactPage content={content} />);
});

app.get("/a-propos", async (c) => {
  const redirect = geoRedirectToEn(c, "/en/a-propos");
  if (redirect) return redirect;
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

/* ---------- Version anglaise (refonte, marché Europe du Nord) ----------
   Mêmes composants de page que le FR, locale="en" : ils basculent tout le
   texte statique et content.ts sert les colonnes _en (offres/FAQ) en
   priorité. Blog, RDV, enquête et portail restent FR uniquement (contenu
   non traduit) — voir liens de langue dans Header/Footer.
   On pose ici le cookie "en" : si le visiteur revient plus tard sur une
   URL FR (ex: la racine /), on saura qu'il a déjà choisi l'anglais et on
   ne le redirigera plus jamais automatiquement par géolocalisation. */
app.get("/en", async (c) => {
  setCookie(c, LANG_COOKIE, "en", LANG_COOKIE_OPTS);
  const content = await getContent(c.env, "en");
  return c.html(<HomePage content={content} locale="en" />);
});

app.get("/en/offres", async (c) => {
  setCookie(c, LANG_COOKIE, "en", LANG_COOKIE_OPTS);
  const content = await getContent(c.env, "en");
  return c.html(<OffresPage content={content} locale="en" />);
});

app.get("/en/realisations", async (c) => {
  setCookie(c, LANG_COOKIE, "en", LANG_COOKIE_OPTS);
  const content = await getContent(c.env, "en");
  return c.html(<RealisationsPage content={content} locale="en" />);
});

app.get("/en/contact", async (c) => {
  setCookie(c, LANG_COOKIE, "en", LANG_COOKIE_OPTS);
  const content = await getContent(c.env, "en");
  return c.html(<ContactPage content={content} locale="en" />);
});

app.get("/en/a-propos", async (c) => {
  setCookie(c, LANG_COOKIE, "en", LANG_COOKIE_OPTS);
  const content = await getContent(c.env, "en");
  return c.html(<AboutPage content={content} locale="en" />);
});

/* ---------- Prise de rendez-vous ---------- */
app.get("/rdv", (c) => {
  return c.html(<RdvPage />);
});

/* ---------- Portail client ----------
   /espace/<slug> : lien personnel lisible. /portail/<token> : anciens
   liens, redirigés vers le lien personnel quand le client en a un. */
const portalHtml = (c, key: string) =>
  c.html(`<!doctype html>${<PortailPage accessKey={key} />}`, 200, { "cache-control": "no-store", "x-frame-options": "DENY" });

app.get("/espace/:slug", (c) => portalHtml(c, c.req.param("slug")));
app.get("/espace", (c) => portalHtml(c, ""));

// Manifeste PWA propre à chaque client : « Ajouter à l'écran d'accueil »
// rouvre directement SON espace.
app.get("/espace/:slug/manifest.webmanifest", (c) => {
  const slug = c.req.param("slug").replace(/[^a-zA-Z0-9-]/g, "");
  return c.json(
    {
      name: "Mon espace — Impact Tech",
      short_name: "Impact Tech",
      start_url: `/espace/${slug}`,
      scope: `/espace/${slug}`,
      display: "standalone",
      background_color: "#0E0E0C",
      theme_color: "#0E0E0C",
      icons: [{ src: "/icon-square.png", sizes: "512x512", type: "image/png", purpose: "any maskable" }],
    },
    200,
    { "content-type": "application/manifest+json" }
  );
});

app.get("/portail/:token", async (c) => {
  const client = c.env.DB ? await findClientByKey(c.env.DB, c.req.param("token")) : null;
  if (client?.slug) return c.redirect(`/espace/${client.slug}`, 301);
  return portalHtml(c, c.req.param("token"));
});

/* ---------- Formulaires prospects (enquêtes) ---------- */
app.get("/enquete/:slug", async (c) => {
  if (!c.env.DB) return c.notFound();
  const form = await getFormBySlug(c.env.DB, c.req.param("slug"));
  if (!form) return c.notFound();
  return c.html(<EnquetePage form={form} />);
});

/* ---------- Sitemap dynamique (inclut tous les articles du blog) ---------- */
app.get("/sitemap.xml", async (c) => {
  const content = await getContent(c.env);
  const posts = content.posts?.length ? content.posts : DEFAULTS.posts;
  const staticUrls = [
    { path: "/", freq: "weekly", prio: "1.0" },
    { path: "/offres", freq: "monthly", prio: "0.9" },
    { path: "/realisations", freq: "monthly", prio: "0.8" },
    { path: "/contact", freq: "yearly", prio: "0.8" },
    { path: "/a-propos", freq: "yearly", prio: "0.6" },
    { path: "/blog", freq: "weekly", prio: "0.7" },
    { path: "/rdv", freq: "monthly", prio: "0.5" },
    { path: "/mentions-legales", freq: "yearly", prio: "0.3" },
    { path: "/confidentialite", freq: "yearly", prio: "0.3" },
    // Version anglaise (refonte, marché Europe du Nord)
    { path: "/en", freq: "weekly", prio: "0.9" },
    { path: "/en/offres", freq: "monthly", prio: "0.8" },
    { path: "/en/realisations", freq: "monthly", prio: "0.7" },
    { path: "/en/contact", freq: "yearly", prio: "0.7" },
    { path: "/en/a-propos", freq: "yearly", prio: "0.5" },
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
      "INSERT INTO contact_requests (name, phone, email, company, project_type, budget, message, referral_code) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    )
      .bind(
        name.slice(0, 200),
        phone.slice(0, 50),
        (body.email || "").trim().slice(0, 200),
        (body.company || "").trim().slice(0, 200),
        (body.type || "").trim().slice(0, 100),
        (body.budget || "").trim().slice(0, 100),
        message.slice(0, 5000),
        (getCookie(c, REF_COOKIE) || "").slice(0, 12) || null
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

  if (row.invoice_id) {
    await applyInvoicePayment(c.env, row, finalStatus).catch((e) => console.error("applyInvoicePayment:", e?.message));
    const back = await c.env.DB.prepare(
      "SELECT c.slug, c.access_token FROM invoices i JOIN client_projects p ON p.id = i.project_id JOIN clients c ON c.id = p.client_id WHERE i.id = ?"
    ).bind(row.invoice_id).first();
    const portalPath = back ? `/espace/${back.slug || back.access_token}` : "/";
    const ok = finalStatus === "COMPLETED";
    return c.html(
      `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Paiement — IMPACT TECH</title>
      <style>body{font-family:system-ui,sans-serif;background:#0e0e0c;color:#f7efd9;display:flex;min-height:100svh;align-items:center;justify-content:center;padding:24px;text-align:center}.card{max-width:440px}h1{font-size:1.6rem;margin-bottom:12px;color:${ok ? "#3ecf6e" : "#f59e0b"}}p{color:rgba(247,239,217,.72);margin-bottom:24px}a{display:inline-block;background:#c0202b;color:#fff;text-decoration:none;padding:14px 30px;border-radius:100px;font-weight:600}</style>
      </head><body><div class="card"><h1>${ok ? "Paiement reçu ✓" : finalStatus === "PENDING" || finalStatus === "PROCESSING" ? "Paiement en cours…" : "Paiement non abouti"}</h1>
      <p>${ok ? "Merci ! Votre reçu est disponible dans votre espace client." : finalStatus === "PENDING" || finalStatus === "PROCESSING" ? "Votre paiement est en cours de validation. Vous recevrez une confirmation dès qu'il sera validé." : "Le paiement n'a pas abouti. Vous pouvez réessayer depuis votre espace."}</p>
      <a href="${portalPath}">Retour à mon espace</a></div></body></html>`
    );
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
    // Facture du portail client -> passe en « payé » + reçu
    const row = await c.env.DB.prepare("SELECT * FROM payments WHERE external_id = ?").bind(externalId).first().catch(() => null);
    if (row?.invoice_id) c.executionCtx.waitUntil(applyInvoicePayment(c.env, row, status).catch((e) => console.error("webhook invoice:", e?.message)));
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

/* ---------- API formulaires prospects ---------- */
app.route("/api/surveys", surveysApi);

/* ---------- API prise de RDV ---------- */
app.route("/api/appointments", appointmentsApi);

/* ---------- API portail client ---------- */
app.route("/api/portal", portalApi);

/* ---------- Widget de retours (sites en développement) ---------- */
app.route("/api/feedback", feedbackApi);

/* ---------- API admin (protégée) ---------- */
app.route("/api/admin", adminApi);

export default {
  fetch: app.fetch,
  // Tâches planifiées (wrangler.toml [triggers]) : relances, renouvellements,
  // santé des sites livrés, récapitulatif admin.
  async scheduled(event, env, ctx) {
    setEmailEnv(env);
    ctx.waitUntil(runScheduled(env, event.cron));
  },
};
