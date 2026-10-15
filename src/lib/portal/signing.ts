/* ------------------------------------------------------------------
   Fabrication du PDF signé d'un document (client puis contresignature
   Impact Tech). Régénéré à chaque nouvelle signature à partir du
   fichier d'origine : le document signé reste toujours cohérent.
------------------------------------------------------------------- */
import { signedDocumentPdf, SignerInfo } from "./pdf";
import { sha256Hex } from "./files";

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("fr-FR", { timeZone: "Africa/Douala", dateStyle: "long", timeStyle: "short" }) + " (heure de Douala)";

async function readBytes(env: any, key: string | null): Promise<Uint8Array | null> {
  if (!key) return null;
  const obj = await env.MEDIA.get(key);
  if (!obj) return null;
  return new Uint8Array(await obj.arrayBuffer());
}

/* Empreinte du document tel qu'envoyé au client (fichier ou texte). */
export async function documentFingerprint(env: any, doc: any): Promise<string> {
  if (doc.file_key) {
    const bytes = await readBytes(env, doc.file_key);
    if (bytes) return sha256Hex(bytes);
  }
  return sha256Hex(new TextEncoder().encode(`${doc.title}\n\n${doc.content || ""}`));
}

export async function buildSignedPdf(env: any, docId: number): Promise<string | null> {
  const doc = await env.DB.prepare(
    `SELECT d.*, p.client_id, c.name AS client_name
     FROM client_documents d JOIN client_projects p ON p.id = d.project_id JOIN clients c ON c.id = p.client_id
     WHERE d.id = ?`
  )
    .bind(docId)
    .first();
  if (!doc) return null;

  const sig = await env.DB.prepare("SELECT * FROM signatures WHERE document_id = ? ORDER BY id DESC LIMIT 1").bind(docId).first();
  const signers: SignerInfo[] = [];
  if (sig) {
    signers.push({
      role: "client",
      name: sig?.signer_name || doc.client_name,
      approval: sig.approval_text,
      signedAt: fmt(sig.signed_at),
      ip: sig.ip_address,
      userAgent: sig.user_agent,
      signaturePng: await readBytes(env, sig.signature_r2),
    });
  }
  if (doc.admin_signed_at && doc.admin_signature_key) {
    signers.push({
      role: "admin",
      name: "Impact Tech",
      approval: "Lu et approuvé",
      signedAt: fmt(doc.admin_signed_at),
      signaturePng: await readBytes(env, doc.admin_signature_key),
    });
  }

  const original = await readBytes(env, doc.file_key);
  const sha = sig?.document_sha256 || doc.file_sha256 || (await documentFingerprint(env, doc));
  const bytes = await signedDocumentPdf({
    title: doc.title,
    original,
    originalName: doc.file_name,
    originalMime: doc.file_mime,
    textContent: doc.content,
    sha256: sha,
    signers,
  });

  const key = `contracts/${doc.project_id}/${doc.id}-signed-${Date.now()}.pdf`;
  await env.MEDIA.put(key, bytes, { httpMetadata: { contentType: "application/pdf" } });
  const previous = doc.r2_key;
  await env.DB.prepare("UPDATE client_documents SET r2_key = ?, updated_at = ? WHERE id = ?").bind(key, new Date().toISOString(), docId).run();
  if (previous && previous !== key && previous.startsWith("contracts/")) await env.MEDIA.delete(previous).catch(() => {});
  return key;
}

export function dataUrlToBytes(dataUrl: string): Uint8Array | null {
  const m = /^data:image\/png;base64,([A-Za-z0-9+/=]+)$/.exec(String(dataUrl || "").trim());
  if (!m) return null;
  const raw = atob(m[1]);
  if (raw.length > 600 * 1024) return null;
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  // vérifie la signature PNG (pas seulement le préfixe déclaré)
  if (out[0] !== 0x89 || out[1] !== 0x50 || out[2] !== 0x4e || out[3] !== 0x47) return null;
  return out;
}
