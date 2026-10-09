/* Appels à /api/portal — une session expirée renvoie à l'écran de connexion. */
export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

let onUnauthorized: () => void = () => {};
export function setUnauthorizedHandler(fn: () => void) {
  onUnauthorized = fn;
}

export async function api<T = any>(path: string, opts: { method?: string; body?: any } = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api/portal${path}`, {
      method: opts.method || (opts.body ? "POST" : "GET"),
      headers: opts.body ? { "Content-Type": "application/json" } : undefined,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      credentials: "same-origin",
    });
  } catch {
    throw new ApiError("Connexion impossible. Vérifiez votre connexion internet.", 0, "network");
  }
  const data: any = await res.json().catch(() => ({}));
  if (res.status === 401 && data?.code === "unauthorized") {
    onUnauthorized();
    throw new ApiError(data.error || "Session expirée", 401, "unauthorized");
  }
  if (!res.ok || data?.ok === false) throw new ApiError(data?.error || `Erreur ${res.status}`, res.status, data?.code);
  return data as T;
}

export const fileUrl = (id: number, download = false) => `/api/portal/files/${id}${download ? "?download=1" : ""}`;
