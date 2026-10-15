/* ------------------------------------------------------------------
   /api/portal — connexion et profil du client.
------------------------------------------------------------------- */
import { Hono } from "hono";
import {
  canResendCode,
  checkAuthCode,
  clearClientCookieHeader,
  clientCookieHeader,
  createClientSession,
  currentClient,
  EMAIL_CODE_VALIDITY,
  checkAnyCode,
  findClientByKey,
  findPerson,
  loginTriesLeft,
  MANUAL_CODE_VALIDITY,
  maskPhone,
  samePhone,
  storeAuthCode,
  storeMemberCode,
} from "../../lib/portal-auth";
import { emailConfigured } from "../../lib/email";
import { sendWhatsappCode, whatsappConfigured } from "../../lib/whatsapp";
import { notifyAdmin, sendCodeEmail, portalUrl } from "../../lib/portal/mail";
import { clientIp, logActivity, nowIso, portalSettings, waLink } from "../../lib/portal/util";
import { SITE_URL } from "../../lib/seo";
import { fail, withClient } from "./common";

const app = new Hono();
const MAX_CODES_PER_DAY = 8;

/* Plus de 5 tentatives dans l'heure : on bloque (réponse 429). */
async function tooManyTries(c: any, client: any) {
  const left = await loginTriesLeft(c.env.DB, client.id);
  if (left.ok) return null;
  return c.json(
    { ok: false, code: "rate_limited", error: `Trop de tentatives. Pour votre sécurité, réessayez dans ${left.retryMinutes} minute${left.retryMinutes > 1 ? "s" : ""}.` },
    429
  );
}

function maskEmail(email: string) {
  if (!email || !email.includes("@")) return "";
  const [user, domain] = email.split("@");
  return `${user.slice(0, 2)}${"•".repeat(Math.max(2, Math.min(6, user.length - 2)))}@${domain}`;
}

/* Infos publiques minimales pour l'écran de connexion. */
app.get("/lookup", async (c) => {
  if (!c.env.DB) return fail(c, "Base indisponible", 503);
  const client = await findClientByKey(c.env.DB, c.req.query("key") || "");
  if (!client) return fail(c, "Lien invalide", 404);
  const me = await currentClient(c);
  const settings = await portalSettings(c.env.DB);
  const team = await c.env.DB.prepare("SELECT COUNT(*) AS n FROM client_members WHERE client_id = ? AND active = 1").bind(client.id).first().catch(() => null);
  return c.json({
    ok: true,
    loggedIn: !!me && me.id === client.id,
    firstName: String(client.name || "").split(" ")[0],
    company: client.company || "",
    hasTeam: (team?.n || 0) > 0,
    locale: client.locale || "fr",
    hasEmail: !!client.email,
    hasPhone: !!client.phone,
    email: maskEmail(client.email),
    emailEnabled: emailConfigured(c.env),
    whatsapp: settings.whatsapp,
  });
});

/* Personne qui demande un code : le client principal, ou un membre de son
   équipe reconnu à son numéro WhatsApp ou à son email. */
type Person = { kind: "client" | "member"; row: any };
const personName = (p: Person) => String(p.row.name || "");
const storeCodeFor = (env: any, p: Person, client: any, validity: number) =>
  p.kind === "member" ? storeMemberCode(env, p.row.id, validity) : storeAuthCode(env, client.id, validity);
const unknownPerson = (c: any, client: any, what: string) =>
  logActivity(c.env.DB, { clientId: client.id, actor: "client", action: "code_phone_mismatch", detail: what, visible: false, ip: clientIp(c) });

/* Code par email. Sans email précisé : celui du client principal (bouton en
   un geste). Avec un email : celui du client ou d'un membre de son équipe. */
app.post("/request-code", async (c) => {
  if (!c.env.DB) return fail(c, "Base indisponible", 503);
  const body = await c.req.json().catch(() => null);
  const client = await findClientByKey(c.env.DB, body?.key || body?.accessToken || "");
  if (!client) return fail(c, "Lien invalide", 404);
  if (!emailConfigured(c.env)) return c.json({ ok: false, code: "email_unavailable", error: "L'envoi par email est momentanément indisponible : demandez votre code par WhatsApp." }, 503);
  const limited = await tooManyTries(c, client);
  if (limited) return limited;

  let person: Person | null;
  if (body?.email) {
    person = await findPerson(c.env.DB, client, { email: String(body.email) });
    if (!person) {
      await unknownPerson(c, client, "email");
      return c.json({ ok: false, code: "unknown_person", error: "Cet email ne correspond à aucune personne de cet espace. Utilisez l'email que vous avez donné à Impact Tech." }, 400);
    }
  } else {
    if (!client.email) return c.json({ ok: false, code: "no_email", error: "Aucun email enregistré : demandez votre code par WhatsApp." }, 400);
    person = { kind: "client", row: client };
  }
  if (!canResendCode(person.row)) return c.json({ ok: false, code: "too_soon", error: "Un code vient d'être envoyé. Patientez quelques secondes avant d'en redemander un." }, 429);
  // Plafond quotidien : protège le quota d'emails et limite le bruteforce
  // (chaque nouveau code redonne 5 essais).
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const sentToday = await c.env.DB.prepare("SELECT COUNT(*) AS n FROM activity_log WHERE client_id = ? AND action = 'code_requested' AND created_at > ?")
    .bind(client.id, since)
    .first();
  if ((sentToday?.n || 0) >= MAX_CODES_PER_DAY) {
    return c.json({ ok: false, code: "daily_limit", error: "Trop de codes demandés aujourd'hui. Demandez votre code sur WhatsApp." }, 429);
  }
  await logActivity(c.env.DB, { clientId: client.id, actor: "client", action: "code_requested", visible: false, ip: clientIp(c), actorName: person.kind === "member" ? personName(person) : null });

  const code = await storeCodeFor(c.env, person, client, EMAIL_CODE_VALIDITY);
  const sent = await sendCodeEmail({ ...client, name: person.row.name, email: person.row.email }, code);
  if (!sent.ok) return c.json({ ok: false, code: "email_failed", error: "L'email n'a pas pu partir : demandez votre code par WhatsApp." }, 502);
  return c.json({ ok: true, email: maskEmail(person.row.email) });
});

/* Code par WhatsApp : la personne confirme SON numéro (celui de la fiche du
   client ou d'un membre). S'il correspond, le code part automatiquement sur
   ce numéro (et seulement celui-là) via l'API WhatsApp. Sinon, Impact Tech
   reçoit un email avec un lien WhatsApp prêt à envoyer. */
app.post("/request-code-whatsapp", async (c) => {
  if (!c.env.DB) return fail(c, "Base indisponible", 503);
  const body = await c.req.json().catch(() => null);
  const client = await findClientByKey(c.env.DB, body?.key || "");
  if (!client) return fail(c, "Lien invalide", 404);
  const limited = await tooManyTries(c, client);
  if (limited) return limited;

  const person = await findPerson(c.env.DB, client, { phone: String(body?.phone || "") });
  if (!person) {
    await unknownPerson(c, client, "phone");
    return c.json({ ok: false, code: "phone_mismatch", error: "Ce numéro ne correspond à aucune personne de cet espace. Utilisez le numéro WhatsApp que vous avez donné à Impact Tech." }, 400);
  }
  const phone = person.row.phone;
  const name = personName(person);
  if (!canResendCode(person.row)) return c.json({ ok: false, code: "too_soon", error: "Un code vient d'être envoyé. Patientez quelques secondes avant d'en redemander un." }, 429);
  await logActivity(c.env.DB, { clientId: client.id, actor: "client", action: "code_requested_whatsapp", visible: false, ip: clientIp(c), actorName: person.kind === "member" ? name : null });

  // Envoi automatique (code valable 15 min, comme par email).
  if (whatsappConfigured(c.env)) {
    const code = await storeCodeFor(c.env, person, client, EMAIL_CODE_VALIDITY);
    const sent = await sendWhatsappCode(c.env, phone, code, client.locale);
    if (sent.ok) {
      await logActivity(c.env.DB, { clientId: client.id, actor: "system", action: "code_sent_whatsapp", visible: false });
      return c.json({ ok: true, auto: true, phone: maskPhone(phone) });
    }
    console.error("whatsapp code:", sent.error);
    await logActivity(c.env.DB, { clientId: client.id, actor: "system", action: "whatsapp_failed", detail: sent.error, visible: false });
  }

  // Repli manuel : code valable 24 h, envoyé par Impact Tech en un clic.
  const code = await storeCodeFor(c.env, person, client, MANUAL_CODE_VALIDITY);
  const first = name.split(" ")[0];
  const text =
    client.locale === "en"
      ? `Hello ${first}, your Impact Tech access code is ${code} (valid 24h). Your space: ${portalUrl(client)}`
      : `Bonjour ${first}, votre code d'accès Impact Tech est ${code} (valable 24 h). Votre espace : ${portalUrl(client)}`;
  const who = person.kind === "member" ? `${name}${person.row.role ? ` (${person.row.role})` : ""}, de l'équipe de ${client.company || client.name},` : name;
  c.executionCtx.waitUntil(
    notifyAdmin({
      subject: `🔑 Code demandé sur WhatsApp — ${client.company || client.name}`,
      title: `${who} demande son code d'accès`,
      lines: [`Numéro vérifié : ${phone}.`, "Touchez le bouton : le message avec le code s'ouvre dans WhatsApp, il ne reste qu'à l'envoyer.", "Le code est valable 24 h."],
      url: waLink(phone, text),
      cta: "Envoyer le code sur WhatsApp",
    })
  );
  return c.json({ ok: true, auto: false, phone: maskPhone(phone) });
});

app.post("/verify-code", async (c) => {
  if (!c.env.DB) return fail(c, "Base indisponible", 503);
  const body = await c.req.json().catch(() => null);
  const client = await findClientByKey(c.env.DB, body?.key || body?.accessToken || "");
  if (!client) return fail(c, "Lien invalide", 404);

  const limited = await tooManyTries(c, client);
  if (limited) return limited;
  const { result, memberId } = await checkAnyCode(c.env, client, String(body?.code || ""));
  if (result !== "ok") await logActivity(c.env.DB, { clientId: client.id, actor: "client", action: "code_failed", detail: result, visible: false, ip: clientIp(c) });
  if (result === "expired") return fail(c, "Ce code a expiré. Demandez-en un nouveau.", 401);
  if (result === "locked") return fail(c, "Trop d'essais. Demandez un nouveau code.", 429);
  if (result === "invalid") return fail(c, "Code incorrect. Vérifiez et réessayez.", 401);

  const token = await createClientSession(c.env, client.id, client.access_token, memberId);
  c.header("Set-Cookie", clientCookieHeader(token));
  const member = memberId ? await c.env.DB.prepare("SELECT name FROM client_members WHERE id = ?").bind(memberId).first() : null;
  await logActivity(c.env.DB, { clientId: client.id, actor: "client", action: "login", visible: false, ip: clientIp(c), actorName: member?.name ?? null });
  return c.json({ ok: true });
});

app.post("/logout", (c) => {
  c.header("Set-Cookie", clearClientCookieHeader());
  return c.json({ ok: true });
});

/* Profil + liste des projets. */
app.get("/me", async (c) => {
  const r = await withClient(c);
  if ("denied" in r) return r.denied;
  const client = r.client;
  const [projects, settings] = await Promise.all([
    c.env.DB.prepare("SELECT id, title, pack, status, start_date, due_date FROM client_projects WHERE client_id = ? ORDER BY created_at DESC").bind(client.id).all(),
    portalSettings(c.env.DB),
  ]);
  const m = client._member;
  c.executionCtx.waitUntil(
    m
      ? c.env.DB.prepare("UPDATE client_members SET last_seen_at = ? WHERE id = ?").bind(nowIso(), m.id).run()
      : c.env.DB.prepare("UPDATE clients SET last_seen_at = ? WHERE id = ?").bind(nowIso(), client.id).run()
  );
  return c.json({
    ok: true,
    // Qui est connecté : le client principal, ou un membre de son équipe.
    person: m
      ? { name: m.name, role: m.role || "", email: m.email || "", phone: m.phone || "", isMember: true, rights: { decide: !!m.can_decide, pay: !!m.can_pay, vault: !!m.can_vault } }
      : { name: client.name, role: "", email: client.email || "", phone: client.phone || "", isMember: false, rights: { decide: true, pay: true, vault: true } },
    client: {
      id: client.id,
      name: client.name,
      email: client.email,
      phone: client.phone,
      company: client.company,
      locale: client.locale || "fr",
      onboarded: m ? !!m.onboarded_at : !!client.onboarded_at,
      portalUrl: portalUrl(client),
      referralUrl: client.referral_code ? `${SITE_URL}/?ref=${client.referral_code}` : null,
    },
    settings: { whatsapp: settings.whatsapp, phone: settings.phone_display, email: settings.email, referralReward: settings.referral_reward },
    projects: projects.results || [],
  });
});

app.post("/me/onboarded", async (c) => {
  const r = await withClient(c);
  if ("denied" in r) return r.denied;
  if (r.client._member) await c.env.DB.prepare("UPDATE client_members SET onboarded_at = ? WHERE id = ?").bind(nowIso(), r.client._member.id).run();
  else await c.env.DB.prepare("UPDATE clients SET onboarded_at = ? WHERE id = ?").bind(nowIso(), r.client.id).run();
  return c.json({ ok: true });
});

app.post("/me/locale", async (c) => {
  const r = await withClient(c);
  if ("denied" in r) return r.denied;
  const body = await c.req.json().catch(() => null);
  const locale = body?.locale === "en" ? "en" : "fr";
  await c.env.DB.prepare("UPDATE clients SET locale = ? WHERE id = ?").bind(locale, r.client.id).run();
  return c.json({ ok: true, locale });
});

export default app;
