/* ------------------------------------------------------------------
   Emails du portail (FR/EN) — gabarit commun baseLayout de lib/email.
   Toujours une seule action claire par email (un bouton).
------------------------------------------------------------------- */
import { baseLayout, sendEmailDetailed, ADMIN_EMAIL } from "../email";
import { SITE_URL } from "../seo";
import { escapeHtml } from "./util";

type Locale = "fr" | "en";

export function portalUrl(client: { slug?: string | null; access_token: string }): string {
  return client.slug ? `${SITE_URL}/espace/${client.slug}` : `${SITE_URL}/portail/${client.access_token}`;
}

function button(label: string, url: string) {
  return `<p style="text-align:center;margin:24px 0"><a href="${escapeHtml(url)}" style="display:inline-block;background:#C0202B;color:#fff;text-decoration:none;padding:13px 30px;border-radius:100px;font-weight:600;font-size:15px">${escapeHtml(label)}</a></p>`;
}

const T = {
  fr: {
    hello: (n: string) => `Bonjour <strong>${escapeHtml(n)}</strong>,`,
    linkSubject: "Votre espace client Impact Tech",
    linkTitle: "Votre espace client est prêt",
    linkBody: "Vous pourrez y suivre l'avancement de votre projet, nous envoyer vos fichiers, signer vos documents et échanger avec nous — tout au même endroit.",
    linkCta: "Ouvrir mon espace",
    linkKeep: "Ajoutez cette page à vos favoris : c'est votre lien personnel.",
    codeSubject: "Votre code d'accès — Impact Tech",
    codeTitle: "Votre code d'accès",
    codeBody: "Saisissez ce code pour entrer dans votre espace client :",
    codeValid: "Ce code est valable 15 minutes. Si vous n'avez rien demandé, ignorez simplement cet email.",
    open: "Ouvrir mon espace",
  },
  en: {
    hello: (n: string) => `Hello <strong>${escapeHtml(n)}</strong>,`,
    linkSubject: "Your Impact Tech client space",
    linkTitle: "Your client space is ready",
    linkBody: "Follow your project's progress, send us your files, sign your documents and talk with us — all in one place.",
    linkCta: "Open my space",
    linkKeep: "Bookmark this page: it is your personal link.",
    codeSubject: "Your access code — Impact Tech",
    codeTitle: "Your access code",
    codeBody: "Enter this code to access your client space:",
    codeValid: "This code is valid for 15 minutes. If you didn't request it, just ignore this email.",
    open: "Open my space",
  },
};

const loc = (l: any): Locale => (l === "en" ? "en" : "fr");

export function sendPortalLinkEmail(client: any) {
  const t = T[loc(client.locale)];
  return sendEmailDetailed({
    to: client.email,
    toName: client.name,
    subject: t.linkSubject,
    html: baseLayout(`
      <h2 style="margin:0 0 16px;color:#f7efd9;font-size:20px">${t.linkTitle}</h2>
      <p>${t.hello(client.name)}</p>
      <p>${t.linkBody}</p>
      ${button(t.linkCta, portalUrl(client))}
      <p style="color:rgba(247,239,217,0.5);font-size:12px">${t.linkKeep}</p>`),
  });
}

export function sendCodeEmail(client: any, code: string) {
  const t = T[loc(client.locale)];
  return sendEmailDetailed({
    to: client.email,
    toName: client.name,
    subject: t.codeSubject,
    html: baseLayout(`
      <h2 style="margin:0 0 16px;color:#f7efd9;font-size:20px">${t.codeTitle}</h2>
      <p>${t.hello(client.name)}</p>
      <p>${t.codeBody}</p>
      <p style="text-align:center;margin:24px 0"><span style="display:inline-block;background:#0e0e0c;color:#f7efd9;font-size:34px;font-weight:700;letter-spacing:10px;padding:16px 32px;border-radius:10px;border:1px solid #2a2a25">${escapeHtml(code)}</span></p>
      <p style="color:rgba(247,239,217,0.5);font-size:12px">${t.codeValid}</p>`),
  });
}

/* Notification générique au client : un titre, un texte, un bouton. */
export function notifyClient(client: any, msg: { subject: string; title: string; body: string; cta?: string }) {
  if (!client?.email) return Promise.resolve({ ok: false });
  const t = T[loc(client.locale)];
  return sendEmailDetailed({
    to: client.email,
    toName: client.name,
    subject: msg.subject,
    html: baseLayout(`
      <h2 style="margin:0 0 16px;color:#f7efd9;font-size:20px">${escapeHtml(msg.title)}</h2>
      <p>${t.hello(client.name)}</p>
      <p>${escapeHtml(msg.body).replace(/\n/g, "<br>")}</p>
      ${button(msg.cta || t.open, portalUrl(client))}`),
  });
}

/* Notification à Impact Tech (admin). */
export function notifyAdmin(msg: { subject: string; title: string; lines: string[]; url?: string; cta?: string }) {
  return sendEmailDetailed({
    to: ADMIN_EMAIL,
    toName: "Impact Tech",
    subject: msg.subject,
    html: baseLayout(`
      <h2 style="margin:0 0 16px;color:#f7efd9;font-size:20px">${escapeHtml(msg.title)}</h2>
      ${msg.lines.map((l) => `<p style="margin:6px 0">${escapeHtml(l)}</p>`).join("")}
      ${button(msg.cta || "Ouvrir dans l'admin", msg.url || `${SITE_URL}/admin/`)}`),
  });
}
