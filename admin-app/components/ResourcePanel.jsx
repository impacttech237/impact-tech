import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api";
import { Button, Input, Textarea, Checkbox, Card, Badge, Modal, ImageField, SectionsEditor } from "./ui";
import { Plus, Pencil, Trash2 } from "../lib/icons";

function listToText(jsonStr) {
  try { const arr = JSON.parse(jsonStr || "[]"); return Array.isArray(arr) ? arr.join("\n") : ""; } catch { return ""; }
}
function textToList(text) {
  return JSON.stringify((text || "").split("\n").map((l) => l.trim()).filter(Boolean));
}
function sectionsFromJson(jsonStr) {
  let arr = [];
  try { const p = JSON.parse(jsonStr || "[]"); if (Array.isArray(p)) arr = p; } catch {}
  return arr.map((s) => ({
    title: s?.title || "",
    paragraphs: Array.isArray(s?.paragraphs) ? s.paragraphs.join("\n\n") : "",
    bullets: Array.isArray(s?.bullets) ? s.bullets.join("\n") : "",
    quote: s?.quote || "",
    callout: s?.callout || "",
  }));
}
function sectionsToJson(editing) {
  const arr = (editing || [])
    .map((s) => ({
      title: (s.title || "").trim(),
      paragraphs: (s.paragraphs || "").split(/\n{2,}/).map((x) => x.trim()).filter(Boolean),
      bullets: (s.bullets || "").split("\n").map((x) => x.trim()).filter(Boolean),
      quote: (s.quote || "").trim(),
      callout: (s.callout || "").trim(),
    }))
    .filter((s) => s.title || s.paragraphs.length || s.bullets.length || s.quote || s.callout);
  return JSON.stringify(arr);
}

function ItemForm({ resource, item, onSaved, onCancel }) {
  const isNew = !item?.id;
  const [values, setValues] = useState(() => {
    const v = {};
    for (const f of resource.fields) {
      if (f.type === "list") v[f.name] = listToText(item?.[f.name]);
      else if (f.type === "sections") v[f.name] = sectionsFromJson(item?.[f.name]);
      else if (f.type === "bool") v[f.name] = item?.[f.name] ?? f.default ?? 0;
      else v[f.name] = item?.[f.name] ?? "";
    }
    return v;
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (name, val) => setValues((v) => ({ ...v, [name]: val }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const payload = {};
    for (const f of resource.fields) {
      if (f.type === "list") payload[f.name] = textToList(values[f.name]);
      else if (f.type === "sections") payload[f.name] = sectionsToJson(values[f.name]);
      else if (f.type === "bool") payload[f.name] = values[f.name] ? 1 : 0;
      else if (f.type === "number") payload[f.name] = values[f.name] === "" ? 0 : Number(values[f.name]);
      else payload[f.name] = values[f.name];
    }
    try {
      if (isNew) await api(resource.key, { method: "POST", body: JSON.stringify(payload) });
      else await api(`${resource.key}/${item.id}`, { method: "PUT", body: JSON.stringify(payload) });
      onSaved();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        {resource.fields.map((f) => {
          if (f.type === "sections")
            return <SectionsEditor key={f.name} value={values[f.name]} onChange={(val) => set(f.name, val)} />;
          if (f.type === "image")
            return (
              <div key={f.name} className="sm:col-span-2">
                <ImageField label={f.label} value={values[f.name]} onChange={(val) => set(f.name, val)} />
              </div>
            );
          if (f.type === "textarea" || f.type === "list")
            return (
              <div key={f.name} className="sm:col-span-2">
                <Textarea label={f.label} rows={f.type === "list" ? 5 : 4} value={values[f.name]} required={f.required} onChange={(e) => set(f.name, e.target.value)} />
              </div>
            );
          if (f.type === "bool")
            return (
              <div key={f.name} className="flex items-end pb-1">
                <Checkbox label={f.label} checked={values[f.name]} onChange={(val) => set(f.name, val ? 1 : 0)} />
              </div>
            );
          return (
            <Input
              key={f.name}
              label={f.label}
              type={f.type === "number" ? "number" : "text"}
              value={values[f.name]}
              required={f.required}
              onChange={(e) => set(f.name, e.target.value)}
            />
          );
        })}
      </div>
      {error && <p className="text-sm text-adm-red">{error}</p>}
      <div className="flex gap-3">
        <Button type="submit" loading={saving}>{saving ? "Enregistrement..." : "Enregistrer"}</Button>
        <Button type="button" variant="ghost" onClick={onCancel}>Annuler</Button>
      </div>
    </form>
  );
}

export default function ResourcePanel({ resource, onUnauthorized }) {
  const [items, setItems] = useState(null);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const data = await api(resource.key);
      setItems(data.items);
    } catch (err) {
      if (err.message === "__unauthorized__") return onUnauthorized();
      setError(err.message);
      setItems([]);
    }
  }, [resource.key, onUnauthorized]);

  useEffect(() => { setItems(null); setEditing(null); load(); }, [load]);

  const remove = async (item) => {
    if (!confirm(`Supprimer « ${item[resource.titleField]} » ?`)) return;
    try { await api(`${resource.key}/${item.id}`, { method: "DELETE" }); load(); } catch (err) { alert(err.message); }
  };

  const toggleActive = async (item) => {
    try { await api(`${resource.key}/${item.id}`, { method: "PUT", body: JSON.stringify({ active: item.active ? 0 : 1 }) }); load(); } catch (err) { alert(err.message); }
  };

  if (items === null) return <p className="text-sm text-adm-text-3">Chargement...</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-head text-lg font-semibold text-adm-text">
          {resource.label} <span className="text-sm font-normal text-adm-text-3">({items.length})</span>
        </h2>
        {!editing && <Button size="sm" icon={Plus} onClick={() => setEditing("new")}>Ajouter</Button>}
      </div>

      {error && <p className="text-sm text-adm-red">{error}</p>}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing === "new" ? `Ajouter — ${resource.label}` : `Modifier — ${editing?.[resource.titleField] || ""}`} wide>
        {editing && (
          <ItemForm
            resource={resource}
            item={editing === "new" ? null : editing}
            onSaved={() => { setEditing(null); load(); }}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>

      <div className="overflow-hidden rounded-xl border border-adm-border">
        {items.length === 0 ? (
          <p className="bg-adm-surface p-6 text-sm text-adm-text-3">Aucun élément pour le moment.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-adm-border bg-adm-surface-2">
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-adm-text-3">Nom</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-adm-text-3">Statut</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-adm-text-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-adm-surface">
              {items.map((item) => (
                <tr key={item.id} className="border-b border-adm-border last:border-0 transition-colors hover:bg-adm-surface-2">
                  <td className="px-4 py-3 text-adm-text font-medium truncate max-w-[300px]">
                    {item[resource.titleField] || `#${item.id}`}
                  </td>
                  <td className="px-4 py-3">
                    {"active" in item && (
                      <button onClick={() => toggleActive(item)} className="cursor-pointer transition-opacity hover:opacity-80">
                        <Badge variant={item.active ? "success" : "default"}>
                          {item.active ? "Visible" : "Masqué"}
                        </Badge>
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" icon={Pencil} onClick={() => setEditing(item)}>Modifier</Button>
                      <Button variant="danger" size="sm" icon={Trash2} onClick={() => remove(item)}>Supprimer</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
