/* ------------------------------------------------------------------
   Email — envoi via MailChannels (gratuit avec Cloudflare Workers).
   Requiert un enregistrement DNS SPF sur le domaine expéditeur :
   v=spf1 include:relay.mailchannels.net -all
   + un enregistrement TXT _mailchannels.impacttech237.com :
   v=mc1 cfid=impact-tech.impacttech237.workers.dev
------------------------------------------------------------------- */

interface EmailOptions {
  to: string;
  toName?: string;
  subject: string;
  html: string;
  text?: string;
}

const FROM_EMAIL = "rdv@impacttech237.com";
const FROM_NAME = "Impact Tech";

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const payload = {
    personalizations: [
      {
        to: [{ email: options.to, name: options.toName || options.to }],
      },
    ],
    from: { email: FROM_EMAIL, name: FROM_NAME },
    subject: options.subject,
    content: [
      ...(options.text ? [{ type: "text/plain", value: options.text }] : []),
      { type: "text/html", value: options.html },
    ],
  };

  try {
    const res = await fetch("https://api.mailchannels.net/tx/v1/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.status === 202 || res.ok;
  } catch (e) {
    console.error("sendEmail error:", (e as Error).message);
    return false;
  }
}

/* ── Templates email RDV ── */

function baseLayout(content: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0e0e0c;font-family:'Inter',system-ui,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0e0e0c;padding:32px 16px">
<tr><td align="center">
<table width="100%" style="max-width:540px;background:#1a1a17;border-radius:12px;overflow:hidden">
<tr><td style="background:#C0202B;padding:20px 24px">
  <p style="margin:0;color:#fff;font-size:18px;font-weight:700">impact<span style="color:#f7efd9">.</span>Tech</p>
</td></tr>
<tr><td style="padding:28px 24px;color:#f7efd9;font-size:14px;line-height:1.6">
  ${content}
</td></tr>
<tr><td style="padding:16px 24px;border-top:1px solid #2a2a25;color:rgba(247,239,217,0.4);font-size:11px;text-align:center">
  © Impact Tech — impacttech237.com
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

export function appointmentConfirmationEmail(data: {
  clientName: string;
  typeName: string;
  date: string;
  time: string;
  duration: number;
  location?: string;
  cancelUrl: string;
}): { subject: string; html: string } {
  const subject = `Confirmation de votre RDV — ${data.typeName}`;
  const html = baseLayout(`
    <h2 style="margin:0 0 16px;color:#f7efd9;font-size:20px">Rendez-vous confirmé ✓</h2>
    <p>Bonjour <strong>${data.clientName}</strong>,</p>
    <p>Votre rendez-vous a bien été enregistré :</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0">
      <tr><td style="padding:8px 0;color:rgba(247,239,217,0.6);width:100px">Type</td><td style="padding:8px 0;color:#f7efd9;font-weight:600">${data.typeName}</td></tr>
      <tr><td style="padding:8px 0;color:rgba(247,239,217,0.6)">Date</td><td style="padding:8px 0;color:#f7efd9;font-weight:600">${data.date}</td></tr>
      <tr><td style="padding:8px 0;color:rgba(247,239,217,0.6)">Heure</td><td style="padding:8px 0;color:#f7efd9;font-weight:600">${data.time}</td></tr>
      <tr><td style="padding:8px 0;color:rgba(247,239,217,0.6)">Durée</td><td style="padding:8px 0;color:#f7efd9;font-weight:600">${data.duration} min</td></tr>
      ${data.location ? `<tr><td style="padding:8px 0;color:rgba(247,239,217,0.6)">Lieu</td><td style="padding:8px 0;color:#f7efd9;font-weight:600">${data.location}</td></tr>` : ""}
    </table>
    <p>Si vous devez annuler, cliquez sur le bouton ci-dessous :</p>
    <p style="text-align:center;margin:24px 0">
      <a href="${data.cancelUrl}" style="display:inline-block;background:#C0202B;color:#fff;text-decoration:none;padding:12px 28px;border-radius:100px;font-weight:600;font-size:14px">Annuler le RDV</a>
    </p>
    <p style="color:rgba(247,239,217,0.5);font-size:12px">À bientôt !</p>
  `);
  return { subject, html };
}

export function appointmentCancellationEmail(data: {
  clientName: string;
  typeName: string;
  date: string;
  time: string;
}): { subject: string; html: string } {
  const subject = `RDV annulé — ${data.typeName}`;
  const html = baseLayout(`
    <h2 style="margin:0 0 16px;color:#f7efd9;font-size:20px">Rendez-vous annulé</h2>
    <p>Bonjour <strong>${data.clientName}</strong>,</p>
    <p>Votre rendez-vous du <strong>${data.date}</strong> à <strong>${data.time}</strong> (${data.typeName}) a été annulé.</p>
    <p>Si vous souhaitez reprendre rendez-vous, rendez-vous sur notre page de réservation :</p>
    <p style="text-align:center;margin:24px 0">
      <a href="https://impacttech237.com/rdv" style="display:inline-block;background:#C0202B;color:#fff;text-decoration:none;padding:12px 28px;border-radius:100px;font-weight:600;font-size:14px">Reprendre un RDV</a>
    </p>
  `);
  return { subject, html };
}

export function appointmentNotificationEmail(data: {
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  typeName: string;
  date: string;
  time: string;
  duration: number;
  notes?: string;
}): { subject: string; html: string } {
  const subject = `Nouveau RDV — ${data.clientName} (${data.typeName})`;
  const html = baseLayout(`
    <h2 style="margin:0 0 16px;color:#f7efd9;font-size:20px">Nouveau rendez-vous 📅</h2>
    <table style="width:100%;border-collapse:collapse;margin:16px 0">
      <tr><td style="padding:8px 0;color:rgba(247,239,217,0.6);width:100px">Client</td><td style="padding:8px 0;color:#f7efd9;font-weight:600">${data.clientName}</td></tr>
      ${data.clientEmail ? `<tr><td style="padding:8px 0;color:rgba(247,239,217,0.6)">Email</td><td style="padding:8px 0;color:#f7efd9">${data.clientEmail}</td></tr>` : ""}
      ${data.clientPhone ? `<tr><td style="padding:8px 0;color:rgba(247,239,217,0.6)">Tél.</td><td style="padding:8px 0;color:#f7efd9">${data.clientPhone}</td></tr>` : ""}
      <tr><td style="padding:8px 0;color:rgba(247,239,217,0.6)">Type</td><td style="padding:8px 0;color:#f7efd9;font-weight:600">${data.typeName}</td></tr>
      <tr><td style="padding:8px 0;color:rgba(247,239,217,0.6)">Date</td><td style="padding:8px 0;color:#f7efd9;font-weight:600">${data.date}</td></tr>
      <tr><td style="padding:8px 0;color:rgba(247,239,217,0.6)">Heure</td><td style="padding:8px 0;color:#f7efd9;font-weight:600">${data.time} (${data.duration} min)</td></tr>
      ${data.notes ? `<tr><td style="padding:8px 0;color:rgba(247,239,217,0.6)">Notes</td><td style="padding:8px 0;color:#f7efd9">${data.notes}</td></tr>` : ""}
    </table>
    <p style="text-align:center;margin:24px 0">
      <a href="https://impacttech237.com/admin" style="display:inline-block;background:#C0202B;color:#fff;text-decoration:none;padding:12px 28px;border-radius:100px;font-weight:600;font-size:14px">Voir dans l'admin</a>
    </p>
  `);
  return { subject, html };
}
