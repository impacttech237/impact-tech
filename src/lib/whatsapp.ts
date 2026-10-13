/* ------------------------------------------------------------------
   Envoi automatique du code d'accès par WhatsApp (WhatsApp Cloud API de
   Meta, modèle de message « authentification » avec bouton « Copier le
   code »).

   Actif seulement si ces variables existent (wrangler secret put …) :
     WHATSAPP_TOKEN          jeton permanent (utilisateur système Meta)
     WHATSAPP_PHONE_ID       identifiant du numéro d'envoi (Phone number ID)
   Facultatif :
     WHATSAPP_OTP_TEMPLATE   nom du modèle approuvé (défaut : code_acces)
     WHATSAPP_OTP_LANG       langue du modèle (défaut : fr)

   Sans configuration, ou si Meta refuse l'envoi, l'appelant revient au
   fonctionnement manuel (email à Impact Tech avec un lien WhatsApp prêt).
------------------------------------------------------------------- */

const GRAPH = "https://graph.facebook.com/v21.0";

export const whatsappConfigured = (env: any) => !!(env?.WHATSAPP_TOKEN && env?.WHATSAPP_PHONE_ID);

/* Numéro au format international sans « + » (237XXXXXXXXX). Un numéro
   camerounais à 9 chiffres reçoit l'indicatif 237. */
export function toWhatsappNumber(phone: string): string {
  const d = String(phone || "").replace(/\D/g, "").replace(/^00/, "");
  return d.length === 9 ? `237${d}` : d;
}

export async function sendWhatsappCode(env: any, phone: string, code: string, locale = "fr"): Promise<{ ok: boolean; error?: string }> {
  if (!whatsappConfigured(env)) return { ok: false, error: "not_configured" };
  const to = toWhatsappNumber(phone);
  if (to.length < 10) return { ok: false, error: "bad_number" };
  const lang = locale === "en" && env.WHATSAPP_OTP_LANG_EN ? env.WHATSAPP_OTP_LANG_EN : env.WHATSAPP_OTP_LANG || "fr";
  try {
    const res = await fetch(`${GRAPH}/${env.WHATSAPP_PHONE_ID}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${env.WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "template",
        template: {
          name: env.WHATSAPP_OTP_TEMPLATE || "code_acces",
          language: { code: lang },
          components: [
            { type: "body", parameters: [{ type: "text", text: code }] },
            // Bouton « Copier le code » du modèle d'authentification.
            { type: "button", sub_type: "url", index: "0", parameters: [{ type: "text", text: code }] },
          ],
        },
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (res.ok) return { ok: true };
    const body: any = await res.json().catch(() => ({}));
    return { ok: false, error: body?.error?.message || `HTTP ${res.status}` };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
