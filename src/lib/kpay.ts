/* ------------------------------------------------------------------
   Client K-PAY — paiements Mobile Money (mode Gateway, page hébergée).
   Voir .claude/skills/kpay-payments/SKILL.md pour l'architecture complète
   et le détail de l'API (ne jamais dupliquer cette doc ici).
------------------------------------------------------------------- */

const KPAY_BASE_URL = "https://admin.kpay.site";

function kpayHeaders(env) {
  return {
    "X-API-Key": env.KPAY_API_KEY,
    "X-Secret-Key": env.KPAY_SECRET_KEY,
    "Content-Type": "application/json",
  };
}

/* Initie un paiement en mode Gateway (le client choisit MTN MoMo / Orange Money
   sur la page hébergée K-PAY — on ne connaît pas son opérateur à l'avance). */
export async function initGatewayPayment(env, { amount, currency = "XAF", externalId, description, returnUrl, cancelUrl, customerEmail }) {
  const res = await fetch(`${KPAY_BASE_URL}/api/v1/payments/init`, {
    method: "POST",
    headers: kpayHeaders(env),
    body: JSON.stringify({
      amount,
      currency,
      externalId,
      description,
      returnUrl,
      cancelUrl,
      ...(customerEmail ? { customerEmail } : {}),
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data?.message || `Erreur K-PAY (${res.status})`);
    err.statusCode = res.status;
    err.kpayError = data;
    throw err;
  }
  return data; // { id, reference, status, mode: "GATEWAY", gatewayUrl, ... }
}

/* Consulte le statut d'un paiement (polling de secours — le webhook reste
   la source d'autorité pour marquer une commande payée). */
export async function getPayment(env, paymentId) {
  const res = await fetch(`${KPAY_BASE_URL}/api/v1/payments/${encodeURIComponent(paymentId)}`, {
    method: "GET",
    headers: kpayHeaders(env),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data?.message || `Erreur K-PAY (${res.status})`);
    err.statusCode = res.status;
    throw err;
  }
  return data;
}

async function hmacSha256Hex(secret, message) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function timingSafeEqualHex(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/* Vérifie la signature de la redirection retour du gateway :
   {returnUrl}?status&reference&externalId&ts&sig
   sig = HMAC-SHA256(gatewaySecret, "status|reference|externalId|ts").
   Rejette aussi si ts a plus de 10 minutes (anti-rejeu). Ne JAMAIS marquer
   payé sur cette seule vérification : reconfirmer via getPayment(). */
export async function verifyGatewayReturnSignature(env, query) {
  const { status, reference, externalId = "", ts, sig } = query;
  if (!status || !reference || !ts || !sig) return false;
  const expected = await hmacSha256Hex(env.KPAY_GATEWAY_SECRET, `${status}|${reference}|${externalId}|${ts}`);
  if (!timingSafeEqualHex(sig, expected)) return false;
  return Date.now() - Number(ts) < 10 * 60 * 1000;
}

/* Vérifie la signature d'un webhook K-PAY (header X-KPAY-Signature), calculée
   sur le corps BRUT reçu — ne jamais re-sérialiser le JSON avant de vérifier. */
export async function verifyWebhookSignature(env, rawBody, signatureHeader) {
  if (!signatureHeader) return false;
  const expected = await hmacSha256Hex(env.KPAY_WEBHOOK_SECRET, rawBody);
  return timingSafeEqualHex(signatureHeader, expected);
}

/* Génère un externalId unique et lisible pour la réconciliation. */
export function generatePaymentExternalId() {
  const rand = crypto.randomUUID().split("-")[0];
  return `IMPACT-${Date.now()}-${rand}`;
}
