export async function api(path, options = {}) {
  const res = await fetch(`/api/admin/${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (path.startsWith("surveys/export/")) return res;
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) throw new Error("__unauthorized__");
  if (!res.ok || data.ok === false) throw new Error(data.error || `Erreur ${res.status}`);
  return data;
}

export async function apiForm(path, formData) {
  const res = await fetch(`/api/admin/${path}`, { method: "POST", body: formData });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) throw new Error("__unauthorized__");
  if (!res.ok || data.ok === false) throw new Error(data.error || `Erreur ${res.status}`);
  return data;
}

export async function uploadImage(file) {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) throw new Error("__unauthorized__");
  if (!res.ok || data.ok === false) throw new Error(data.error || `Erreur ${res.status}`);
  return data.url;
}
