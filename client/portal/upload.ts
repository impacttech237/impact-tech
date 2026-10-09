/* ------------------------------------------------------------------
   Envoi de fichiers par morceaux de 8 Mo (R2 multipart) : chaque
   morceau est réessayé jusqu'à 5 fois avec une attente croissante.
   Une coupure réseau en 3G ne fait donc jamais repartir de zéro.
------------------------------------------------------------------- */
export interface UploadOptions {
  projectId: number;
  file: File | Blob;
  name?: string;
  category?: string;
  checklistItemId?: number;
  onProgress?: (fraction: number) => void;
  signal?: AbortSignal;
  base?: string; // "/api/portal" (client) ou "/api/admin/portal" (admin)
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function json(res: Response) {
  const data: any = await res.json().catch(() => ({}));
  if (!res.ok || data?.ok === false) throw new Error(data?.error || `Erreur ${res.status}`);
  return data;
}

function putPart(url: string, blob: Blob, onProgress: (loaded: number) => void, signal?: AbortSignal): Promise<any> {
  // XHR plutôt que fetch : seul moyen d'avoir la progression d'envoi.
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.upload.onprogress = (e) => onProgress(e.loaded);
    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText || "{}");
        if (xhr.status >= 200 && xhr.status < 300 && data.ok !== false) resolve(data);
        else reject(new Error(data.error || `Erreur ${xhr.status}`));
      } catch {
        reject(new Error(`Erreur ${xhr.status}`));
      }
    };
    xhr.onerror = () => reject(new Error("network"));
    xhr.ontimeout = () => reject(new Error("timeout"));
    xhr.timeout = 10 * 60 * 1000;
    signal?.addEventListener("abort", () => xhr.abort());
    xhr.onabort = () => reject(new DOMException("Envoi annulé", "AbortError"));
    xhr.send(blob);
  });
}

export async function uploadFile(o: UploadOptions) {
  const base = o.base || "/api/portal";
  const name = o.name || (o.file as File).name || "fichier";
  const mime = o.file.type || "application/octet-stream";
  const root = `${base}/projects/${o.projectId}/uploads`;
  const start = await json(
    await fetch(`${root}/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, size: o.file.size, mime }),
      signal: o.signal,
    })
  );
  const { key, uploadId, partSize } = start;
  const total = o.file.size;
  const parts: { partNumber: number; etag: string }[] = [];
  let done = 0;

  try {
    for (let offset = 0, n = 1; offset < total; offset += partSize, n++) {
      const blob = o.file.slice(offset, Math.min(offset + partSize, total));
      let attempt = 0;
      for (;;) {
        try {
          const url = `${root}/part?key=${encodeURIComponent(key)}&uploadId=${encodeURIComponent(uploadId)}&part=${n}`;
          const res = await putPart(url, blob, (loaded) => o.onProgress?.(Math.min(0.99, (done + loaded) / total)), o.signal);
          parts.push({ partNumber: res.partNumber, etag: res.etag });
          done += blob.size;
          o.onProgress?.(Math.min(0.99, done / total));
          break;
        } catch (e: any) {
          if (e?.name === "AbortError" || ++attempt > 5) throw e;
          await sleep(1000 * 2 ** attempt); // 2s, 4s, 8s, 16s, 32s
        }
      }
    }
    const res = await json(
      await fetch(`${root}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, uploadId, parts, name, mime, size: total, category: o.category, checklistItemId: o.checklistItemId }),
      })
    );
    o.onProgress?.(1);
    return res.file;
  } catch (e) {
    fetch(`${root}/abort`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key, uploadId }) }).catch(() => {});
    throw e;
  }
}
