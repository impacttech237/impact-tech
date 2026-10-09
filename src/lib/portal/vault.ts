/* ------------------------------------------------------------------
   Coffre d'accès — chiffrement AES-256-GCM des mots de passe confiés
   par le client (nom de domaine, hébergement, réseaux sociaux).
   Clé dérivée (HKDF) de VAULT_KEY, à défaut d'AUTH_SECRET : un dump de
   la base D1 seul ne permet donc pas de lire les secrets.
   Format stocké : base64(iv[12] || ciphertext).
------------------------------------------------------------------- */

async function vaultKey(env: any): Promise<CryptoKey> {
  const secret = env?.VAULT_KEY || env?.AUTH_SECRET;
  if (!secret) throw new Error("VAULT_KEY / AUTH_SECRET manquant");
  const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), "HKDF", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "HKDF", hash: "SHA-256", salt: new TextEncoder().encode("impact-tech/vault/v1"), info: new Uint8Array() },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

function toB64(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}

function fromB64(b64: string): Uint8Array {
  const raw = atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export async function encryptSecret(env: any, plain: string): Promise<string> {
  if (!plain) return "";
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await vaultKey(env);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(plain)));
  const out = new Uint8Array(iv.length + ct.length);
  out.set(iv, 0);
  out.set(ct, iv.length);
  return toB64(out);
}

export async function decryptSecret(env: any, stored: string): Promise<string> {
  if (!stored) return "";
  try {
    const bytes = fromB64(stored);
    const key = await vaultKey(env);
    const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: bytes.slice(0, 12) }, key, bytes.slice(12));
    return new TextDecoder().decode(pt);
  } catch {
    return "";
  }
}
