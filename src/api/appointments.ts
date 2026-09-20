/* ------------------------------------------------------------------
   /api/appointments/* — routes publiques de réservation de RDV.
------------------------------------------------------------------- */
import { Hono } from "hono";
import { getFreeBusy, createEvent, isConnected } from "../lib/google-calendar";
import {
  sendEmail,
  appointmentConfirmationEmail,
  appointmentNotificationEmail,
} from "../lib/email";
import { SITE_URL } from "../lib/seo";

const app = new Hono();

/* ── Types de RDV disponibles ── */
app.get("/types", async (c) => {
  if (!c.env.DB) return c.json({ ok: false, error: "DB indisponible" }, 503);
  const { results } = await c.env.DB.prepare(
    "SELECT id, slug, title, description, duration, color, location FROM appointment_types WHERE active = 1 ORDER BY sort_order"
  ).all();
  return c.json({ ok: true, types: results });
});

/* ── Créneaux disponibles pour un type + date ── */
app.get("/slots/:slug", async (c) => {
  if (!c.env.DB) return c.json({ ok: false, error: "DB indisponible" }, 503);

  const slug = c.req.param("slug");
  const date = c.req.query("date");
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return c.json({ ok: false, error: "Paramètre date requis (YYYY-MM-DD)." }, 400);
  }

  const type = await c.env.DB.prepare(
    "SELECT * FROM appointment_types WHERE slug = ? AND active = 1"
  ).bind(slug).first();
  if (!type) return c.json({ ok: false, error: "Type de RDV introuvable." }, 404);

  const dayOfWeek = new Date(date + "T12:00:00").getDay();

  const { results: rules } = await c.env.DB.prepare(
    "SELECT start_time, end_time FROM availability_rules WHERE day_of_week = ? AND active = 1"
  ).bind(dayOfWeek).all();

  if (rules.length === 0) {
    return c.json({ ok: true, slots: [], message: "Aucune disponibilité ce jour." });
  }

  const duration = (type as any).duration as number;
  const allSlots: { start: string; end: string }[] = [];

  for (const rule of rules) {
    const [sh, sm] = (rule.start_time as string).split(":").map(Number);
    const [eh, em] = (rule.end_time as string).split(":").map(Number);
    const startMin = sh * 60 + sm;
    const endMin = eh * 60 + em;

    for (let m = startMin; m + duration <= endMin; m += duration) {
      const startH = String(Math.floor(m / 60)).padStart(2, "0");
      const startM = String(m % 60).padStart(2, "0");
      const endMins = m + duration;
      const endH = String(Math.floor(endMins / 60)).padStart(2, "0");
      const endM2 = String(endMins % 60).padStart(2, "0");
      allSlots.push({
        start: `${date}T${startH}:${startM}:00`,
        end: `${date}T${endH}:${endM2}:00`,
      });
    }
  }

  // Filtrer les créneaux déjà réservés dans notre DB
  const { results: booked } = await c.env.DB.prepare(
    `SELECT start_time, end_time FROM appointments
     WHERE start_time >= ? AND end_time <= ? AND status != 'cancelled'`
  ).bind(`${date}T00:00:00`, `${date}T23:59:59`).all();

  // Filtrer via Google Calendar (freebusy) si connecté
  let gcalBusy: { start: string; end: string }[] = [];
  try {
    const connected = await isConnected(c.env);
    if (connected) {
      gcalBusy = await getFreeBusy(
        c.env,
        `${date}T00:00:00+01:00`,
        `${date}T23:59:59+01:00`
      );
    }
  } catch {
    // GCal non connecté ou erreur — on continue sans
  }

  const isBusy = (slotStart: string, slotEnd: string): boolean => {
    const s = new Date(slotStart).getTime();
    const e = new Date(slotEnd).getTime();

    for (const b of booked) {
      const bs = new Date(b.start_time as string).getTime();
      const be = new Date(b.end_time as string).getTime();
      if (s < be && e > bs) return true;
    }
    for (const b of gcalBusy) {
      const bs = new Date(b.start).getTime();
      const be = new Date(b.end).getTime();
      if (s < be && e > bs) return true;
    }
    return false;
  };

  // Filtrer les créneaux passés (pour aujourd'hui)
  const now = Date.now();
  const available = allSlots.filter((slot) => {
    if (new Date(slot.start + "+01:00").getTime() <= now) return false;
    return !isBusy(slot.start, slot.end);
  });

  return c.json({ ok: true, slots: available });
});

/* ── Réserver un créneau ── */
app.post("/book", async (c) => {
  if (!c.env.DB) return c.json({ ok: false, error: "DB indisponible" }, 503);

  const body = await c.req.json().catch(() => null);
  if (!body) return c.json({ ok: false, error: "Corps invalide." }, 400);

  const { typeSlug, startTime, clientName, clientEmail, clientPhone, clientCompany, notes } = body;
  if (!typeSlug || !startTime || !clientName || !clientPhone) {
    return c.json({ ok: false, error: "Type, créneau, nom et téléphone requis." }, 400);
  }

  const type = await c.env.DB.prepare(
    "SELECT * FROM appointment_types WHERE slug = ? AND active = 1"
  ).bind(typeSlug).first<any>();
  if (!type) return c.json({ ok: false, error: "Type de RDV introuvable." }, 404);

  const start = new Date(startTime);
  if (isNaN(start.getTime())) return c.json({ ok: false, error: "Créneau invalide." }, 400);
  const end = new Date(start.getTime() + type.duration * 60_000);
  const endTime = end.toISOString().replace("Z", "").split(".")[0];

  // Vérifier que le créneau n'est pas déjà pris
  const conflict = await c.env.DB.prepare(
    `SELECT id FROM appointments
     WHERE start_time = ? AND status != 'cancelled' LIMIT 1`
  ).bind(startTime).first();
  if (conflict) return c.json({ ok: false, error: "Ce créneau vient d'être réservé par quelqu'un d'autre." }, 409);

  const cancelToken = crypto.randomUUID();

  // Créer l'événement Google Calendar si connecté
  let gcalEventId: string | null = null;
  try {
    const connected = await isConnected(c.env);
    if (connected) {
      gcalEventId = await createEvent(c.env, {
        summary: `RDV ${type.title} — ${clientName}`,
        description: `Tél: ${clientPhone}${clientEmail ? `\nEmail: ${clientEmail}` : ""}${clientCompany ? `\nEntreprise: ${clientCompany}` : ""}${notes ? `\nNotes: ${notes}` : ""}`,
        location: type.location || undefined,
        start: startTime + "+01:00",
        end: endTime + "+01:00",
        attendees: clientEmail ? [clientEmail] : undefined,
      });
    }
  } catch (e) {
    console.error("GCal createEvent:", (e as Error).message);
  }

  await c.env.DB.prepare(
    `INSERT INTO appointments (type_id, start_time, end_time, client_name, client_email, client_phone, client_company, notes, cancel_token, gcal_event_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    type.id, startTime, endTime,
    clientName.trim().slice(0, 200),
    (clientEmail || "").trim().slice(0, 200),
    clientPhone.trim().slice(0, 50),
    (clientCompany || "").trim().slice(0, 200),
    (notes || "").trim().slice(0, 2000),
    cancelToken,
    gcalEventId
  ).run();

  // Formatter la date pour les emails
  const dateStr = start.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const timeStr = startTime.slice(11, 16);

  // Envoyer les emails en arrière-plan
  c.executionCtx.waitUntil((async () => {
    if (clientEmail) {
      const confirmation = appointmentConfirmationEmail({
        clientName,
        typeName: type.title,
        date: dateStr,
        time: timeStr,
        duration: type.duration,
        location: type.location || undefined,
        cancelUrl: `${SITE_URL}/api/appointments/cancel?token=${cancelToken}`,
      });
      await sendEmail({ to: clientEmail, toName: clientName, ...confirmation });
    }
    const notification = appointmentNotificationEmail({
      clientName,
      clientEmail,
      clientPhone,
      typeName: type.title,
      date: dateStr,
      time: timeStr,
      duration: type.duration,
      notes,
    });
    await sendEmail({ to: "impacttech237@gmail.com", toName: "Impact Tech", ...notification });
  })());

  return c.json({
    ok: true,
    appointment: {
      startTime,
      endTime,
      typeName: type.title,
      duration: type.duration,
    },
  });
});

/* ── Annulation par le client via lien email ── */
app.get("/cancel", async (c) => {
  if (!c.env.DB) return c.notFound();

  const token = c.req.query("token");
  if (!token) return c.notFound();

  const row = await c.env.DB.prepare(
    `SELECT a.*, t.title as type_title FROM appointments a
     JOIN appointment_types t ON t.id = a.type_id
     WHERE a.cancel_token = ? LIMIT 1`
  ).bind(token).first<any>();

  if (!row) {
    return c.html(cancelPage("Lien invalide", "Ce lien d'annulation est invalide ou a expiré.", false));
  }

  if (row.status === "cancelled") {
    return c.html(cancelPage("Déjà annulé", "Ce rendez-vous a déjà été annulé.", false));
  }

  // Vérifier si le RDV est passé
  if (new Date(row.start_time).getTime() < Date.now()) {
    return c.html(cancelPage("RDV passé", "Ce rendez-vous est déjà passé et ne peut plus être annulé.", false));
  }

  return c.html(cancelPage(
    "Annuler votre RDV ?",
    `<strong>${row.type_title}</strong> le ${new Date(row.start_time).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })} à ${(row.start_time as string).slice(11, 16)}`,
    true,
    token
  ));
});

app.post("/cancel", async (c) => {
  if (!c.env.DB) return c.json({ ok: false }, 503);

  const body = await c.req.json().catch(() => null);
  const token = body?.token;
  if (!token) return c.json({ ok: false, error: "Token manquant." }, 400);

  const row = await c.env.DB.prepare(
    `SELECT a.*, t.title as type_title FROM appointments a
     JOIN appointment_types t ON t.id = a.type_id
     WHERE a.cancel_token = ? AND a.status != 'cancelled' LIMIT 1`
  ).bind(token).first<any>();
  if (!row) return c.json({ ok: false, error: "RDV introuvable ou déjà annulé." }, 404);

  await c.env.DB.prepare(
    "UPDATE appointments SET status = 'cancelled', cancelled_at = datetime('now') WHERE id = ?"
  ).bind(row.id).run();

  // Supprimer l'événement Google Calendar
  if (row.gcal_event_id) {
    const { deleteEvent } = await import("../lib/google-calendar");
    c.executionCtx.waitUntil(deleteEvent(c.env, row.gcal_event_id).catch(() => {}));
  }

  // Email d'annulation au client
  if (row.client_email) {
    const { sendEmail: send, appointmentCancellationEmail } = await import("../lib/email");
    const dateStr = new Date(row.start_time).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
    const timeStr = (row.start_time as string).slice(11, 16);
    const email = appointmentCancellationEmail({
      clientName: row.client_name,
      typeName: row.type_title,
      date: dateStr,
      time: timeStr,
    });
    c.executionCtx.waitUntil(send({ to: row.client_email, toName: row.client_name, ...email }));
  }

  return c.json({ ok: true });
});

function cancelPage(title: string, message: string, showConfirm: boolean, token?: string): string {
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} — IMPACT TECH</title>
<style>body{font-family:system-ui,sans-serif;background:#0e0e0c;color:#f7efd9;display:flex;min-height:100svh;align-items:center;justify-content:center;padding:24px;text-align:center}
.card{max-width:440px}h1{font-size:1.6rem;margin-bottom:12px}p{color:rgba(247,239,217,.72);margin-bottom:24px}
.btn{display:inline-block;padding:12px 28px;border-radius:100px;font-weight:600;text-decoration:none;border:none;cursor:pointer;font-size:14px}
.btn-danger{background:#c0202b;color:#fff}.btn-ghost{background:transparent;color:#f7efd9;border:1px solid rgba(247,239,217,.3)}</style>
</head><body><div class="card"><h1>${title}</h1><p>${message}</p>
${showConfirm && token ? `
<div style="display:flex;gap:12px;justify-content:center">
<button class="btn btn-danger" onclick="cancelRdv()">Oui, annuler</button>
<a href="/" class="btn btn-ghost">Non, garder</a>
</div>
<p id="msg" style="margin-top:16px;display:none"></p>
<script>
async function cancelRdv(){
  document.querySelector('.btn-danger').disabled=true;
  document.querySelector('.btn-danger').textContent='Annulation...';
  try{
    const r=await fetch('/api/appointments/cancel',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:'${token}'})});
    const d=await r.json();
    if(d.ok){document.querySelector('.card').innerHTML='<h1>RDV annulé</h1><p>Votre rendez-vous a été annulé.</p><a href="/" class="btn btn-ghost">Retour à l\\'accueil</a>';}
    else{const m=document.getElementById('msg');m.textContent=d.error||'Erreur';m.style.display='block';m.style.color='#c0202b';}
  }catch{const m=document.getElementById('msg');m.textContent='Erreur réseau';m.style.display='block';}
}
</script>` : `<a href="/" class="btn btn-ghost">Retour à l'accueil</a>`}
</div></body></html>`;
}

export default app;
