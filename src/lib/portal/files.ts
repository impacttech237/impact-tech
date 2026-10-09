/* ------------------------------------------------------------------
   Fichiers du portail (R2, bucket MEDIA) — privés, jamais servis par
   /media/*. Upload en plusieurs parties pour les gros fichiers (vidéos)
   et lecture avec Range (lecture vidéo/audio en streaming).
------------------------------------------------------------------- */

export const MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024; // 5 Go
export const MAX_PART_SIZE = 95 * 1024 * 1024; // limite de corps de requête Workers (100 Mo)
export const MAX_DOCUMENT_SIZE = 30 * 1024 * 1024; // documents/contrats (hash + signature en mémoire)

// Types affichables directement dans le navigateur. Tout le reste (HTML, SVG,
// scripts...) est forcé en téléchargement : un fichier uploadé ne doit jamais
// pouvoir exécuter du code sur impacttech237.com.
const INLINE_TYPES = /^(image\/(png|jpe?g|gif|webp|avif|heic)|video\/(mp4|webm|quicktime|ogg)|audio\/(mpeg|mp3|mp4|ogg|wav|webm|aac|x-m4a|x-wav)|application\/pdf)$/i;

export function isInlineType(mime: string): boolean {
  return INLINE_TYPES.test(mime || "");
}

export function sanitizeFileName(name: string): string {
  const cleaned = String(name || "fichier")
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, "_")
    .trim()
    .slice(0, 180);
  return cleaned || "fichier";
}

export function fileKey(prefix: string, projectId: number, name: string): string {
  const ext = (sanitizeFileName(name).split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 10) || "bin";
  return `${prefix}/${projectId}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
}

/* Lecture d'un objet R2 avec prise en charge de l'en-tête Range. */
export async function streamObject(
  c: any,
  key: string,
  opts: { name: string; mime?: string; download?: boolean }
): Promise<Response> {
  const bucket = c.env.MEDIA;
  if (!bucket) return c.json({ ok: false, error: "Stockage indisponible" }, 503);

  const rangeHeader = c.req.header("range");
  let range: any = undefined;
  if (rangeHeader) {
    const m = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader.trim());
    if (m) {
      const start = m[1] ? parseInt(m[1], 10) : undefined;
      const end = m[2] ? parseInt(m[2], 10) : undefined;
      if (start !== undefined && end !== undefined) range = { offset: start, length: end - start + 1 };
      else if (start !== undefined) range = { offset: start };
      else if (end !== undefined) range = { suffix: end };
    }
  }

  let obj: any;
  try {
    obj = await bucket.get(key, range ? { range } : undefined);
  } catch {
    // plage hors du fichier
    const head = await bucket.head(key);
    if (!head) return c.json({ ok: false, error: "Fichier introuvable" }, 404);
    return new Response(null, { status: 416, headers: { "content-range": `bytes */${head.size}` } });
  }
  if (!obj) return c.json({ ok: false, error: "Fichier introuvable" }, 404);

  const mime = opts.mime || obj.httpMetadata?.contentType || "application/octet-stream";
  const inline = !opts.download && isInlineType(mime);
  const headers = new Headers();
  headers.set("content-type", inline ? mime : "application/octet-stream");
  headers.set(
    "content-disposition",
    `${inline ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(opts.name)}`
  );
  headers.set("x-content-type-options", "nosniff");
  // Le lecteur PDF de Chrome refuse de s'afficher sous CSP sandbox : on ne
  // l'applique qu'aux téléchargements (les types inline ne sont pas scriptables).
  if (!inline) headers.set("content-security-policy", "sandbox; default-src 'none'");
  headers.set("cache-control", "private, max-age=3600");
  headers.set("accept-ranges", "bytes");
  if (obj.httpEtag) headers.set("etag", obj.httpEtag);

  if (range && (obj as any).range) {
    const r = (obj as any).range;
    const offset = r.offset ?? obj.size - (r.suffix ?? 0);
    const length = r.length ?? obj.size - offset;
    headers.set("content-range", `bytes ${offset}-${offset + length - 1}/${obj.size}`);
    headers.set("content-length", String(length));
    return new Response(obj.body, { status: 206, headers });
  }
  headers.set("content-length", String(obj.size));
  return new Response(obj.body, { status: 200, headers });
}

export async function sha256Hex(data: ArrayBuffer | Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

/* Supprime de R2 tous les objets d'un ou plusieurs projets (fichiers,
   documents, PDF signés, signatures, captures) avant la suppression en base. */
export async function deleteProjectObjects(env: any, projectIds: number[]) {
  if (!env.MEDIA || !projectIds.length) return;
  const ph = projectIds.map(() => "?").join(",");
  const [files, docs, sigs, reqs] = await env.DB.batch([
    env.DB.prepare(`SELECT r2_key AS k FROM client_files WHERE project_id IN (${ph})`).bind(...projectIds),
    env.DB.prepare(`SELECT file_key, r2_key, admin_signature_key FROM client_documents WHERE project_id IN (${ph})`).bind(...projectIds),
    env.DB.prepare(`SELECT s.signature_r2 AS k FROM signatures s JOIN client_documents d ON d.id = s.document_id WHERE d.project_id IN (${ph})`).bind(...projectIds),
    env.DB.prepare(`SELECT screenshot_key AS k FROM project_requests WHERE project_id IN (${ph}) AND screenshot_key IS NOT NULL`).bind(...projectIds),
  ]);
  const keys: string[] = [];
  for (const r of files.results || []) keys.push(r.k);
  for (const r of docs.results || []) keys.push(r.file_key, r.r2_key, r.admin_signature_key);
  for (const r of sigs.results || []) keys.push(r.k);
  for (const r of reqs.results || []) keys.push(r.k);
  const list = keys.filter(Boolean);
  for (let i = 0; i < list.length; i += 1000) await env.MEDIA.delete(list.slice(i, i + 1000)).catch(() => {});
}

/* ── Upload multipart R2 (gros fichiers, reprise partie par partie) ── */

export async function createMultipart(env: any, key: string, mime: string) {
  const upload = await env.MEDIA.createMultipartUpload(key, {
    httpMetadata: { contentType: mime || "application/octet-stream" },
  });
  return upload.uploadId as string;
}

export async function uploadPart(env: any, key: string, uploadId: string, partNumber: number, body: ReadableStream | ArrayBuffer) {
  const upload = env.MEDIA.resumeMultipartUpload(key, uploadId);
  const part = await upload.uploadPart(partNumber, body);
  return { partNumber: part.partNumber, etag: part.etag };
}

export async function completeMultipart(env: any, key: string, uploadId: string, parts: { partNumber: number; etag: string }[]) {
  const upload = env.MEDIA.resumeMultipartUpload(key, uploadId);
  const sorted = [...parts].sort((a, b) => a.partNumber - b.partNumber);
  const obj = await upload.complete(sorted);
  return obj;
}

export async function abortMultipart(env: any, key: string, uploadId: string) {
  try {
    await env.MEDIA.resumeMultipartUpload(key, uploadId).abort();
  } catch {}
}
