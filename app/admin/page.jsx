"use client";

/* ------------------------------------------------------------------
   DASHBOARD ADMIN — /admin
   Gestion complète du contenu du site (base D1 Cloudflare) :
   demandes de devis, services, offres, projets, témoignages,
   chiffres, FAQ, articles, étapes process, newsletter et réglages.
------------------------------------------------------------------- */
import { useCallback, useEffect, useState } from "react";

/* ---------- Configuration des ressources éditables ---------- */

const FIELD_TYPES = { text: "text", textarea: "textarea", number: "number", bool: "bool", list: "list" };

const RESOURCES = [
  {
    key: "services",
    label: "Services",
    icon: "🧩",
    titleField: "title",
    fields: [
      { name: "title", label: "Titre", type: "text", required: true },
      { name: "slug", label: "Slug (ancre URL)", type: "text", required: true },
      { name: "tag", label: "Tag (badge)", type: "text" },
      { name: "short_desc", label: "Description courte (carte accueil)", type: "text" },
      { name: "headline", label: "Titre détaillé (page services)", type: "text" },
      { name: "accent", label: "Mot accentué du titre", type: "text" },
      { name: "description", label: "Description complète", type: "textarea" },
      { name: "features", label: "Inclusions (une par ligne)", type: "list" },
      { name: "ideal", label: "Idéal pour", type: "text" },
      { name: "price", label: "Prix (ex : 200 000 FCFA ou Sur devis)", type: "text" },
      { name: "delay", label: "Délai (ex : ≈ 2 semaines)", type: "text" },
      { name: "image", label: "Image (chemin /images/...)", type: "text" },
      { name: "sort_order", label: "Ordre d'affichage", type: "number" },
      { name: "active", label: "Visible sur le site", type: "bool", default: 1 },
    ],
  },
  {
    key: "offers",
    label: "Offres (packs)",
    icon: "💼",
    titleField: "tag",
    fields: [
      { name: "tag", label: "Nom du pack", type: "text", required: true },
      { name: "title", label: "Titre", type: "text", required: true },
      { name: "price", label: "Prix (ex : 200 000 ou Sur devis)", type: "text" },
      { name: "is_quote", label: "Sur devis (pas de FCFA affiché)", type: "bool" },
      { name: "popular", label: "Badge « Le plus demandé »", type: "bool" },
      { name: "features", label: "Inclusions (une par ligne)", type: "list" },
      { name: "image", label: "Image (chemin /images/...)", type: "text" },
      { name: "sort_order", label: "Ordre d'affichage", type: "number" },
      { name: "active", label: "Visible sur le site", type: "bool", default: 1 },
    ],
  },
  {
    key: "projects",
    label: "Réalisations",
    icon: "🏗️",
    titleField: "title",
    fields: [
      { name: "title", label: "Titre du projet", type: "text", required: true },
      { name: "category", label: "Catégorie (filtre)", type: "text" },
      { name: "description", label: "Description", type: "textarea" },
      { name: "result", label: "Résultat obtenu (ex : Ventes x2)", type: "text" },
      { name: "image", label: "Image (chemin /images/...)", type: "text" },
      { name: "sort_order", label: "Ordre d'affichage", type: "number" },
      { name: "active", label: "Visible sur le site", type: "bool", default: 1 },
    ],
  },
  {
    key: "testimonials",
    label: "Avis clients",
    icon: "⭐",
    titleField: "name",
    fields: [
      { name: "name", label: "Nom", type: "text", required: true },
      { name: "role", label: "Rôle / activité", type: "text" },
      { name: "text", label: "Témoignage", type: "textarea", required: true },
      { name: "initials", label: "Initiales (avatar)", type: "text" },
      { name: "sort_order", label: "Ordre d'affichage", type: "number" },
      { name: "active", label: "Visible sur le site", type: "bool", default: 1 },
    ],
  },
  {
    key: "stats",
    label: "Chiffres clés",
    icon: "📊",
    titleField: "label",
    fields: [
      { name: "label", label: "Libellé (ex : Projets livrés)", type: "text", required: true },
      { name: "value", label: "Valeur (nombre)", type: "number", required: true },
      { name: "suffix", label: "Suffixe (ex : +, %, jours)", type: "text" },
      { name: "note", label: "Note (sous le libellé)", type: "text" },
      { name: "sort_order", label: "Ordre d'affichage", type: "number" },
      { name: "active", label: "Visible sur le site", type: "bool", default: 1 },
    ],
  },
  {
    key: "faqs",
    label: "FAQ",
    icon: "❓",
    titleField: "question",
    fields: [
      { name: "question", label: "Question", type: "text", required: true },
      { name: "answer", label: "Réponse", type: "textarea", required: true },
      { name: "sort_order", label: "Ordre d'affichage", type: "number" },
      { name: "active", label: "Visible sur le site", type: "bool", default: 1 },
    ],
  },
  {
    key: "posts",
    label: "Blog",
    icon: "📰",
    titleField: "title",
    fields: [
      { name: "title", label: "Titre de l'article", type: "text", required: true },
      { name: "category", label: "Catégorie (ex : Conseils, Guide)", type: "text" },
      { name: "date", label: "Date affichée (ex : 28 juin 2026)", type: "text" },
      { name: "read_time", label: "Temps de lecture (ex : 5 min)", type: "text" },
      { name: "excerpt", label: "Extrait", type: "textarea" },
      { name: "image", label: "Image (chemin /images/...)", type: "text" },
      { name: "featured", label: "Article à la une", type: "bool" },
      { name: "sort_order", label: "Ordre d'affichage", type: "number" },
      { name: "active", label: "Visible sur le site", type: "bool", default: 1 },
    ],
  },
  {
    key: "process-steps",
    label: "Méthode (étapes)",
    icon: "🛠️",
    titleField: "title",
    fields: [
      { name: "num", label: "Numéro (ex : 01)", type: "text" },
      { name: "title", label: "Titre de l'étape", type: "text", required: true },
      { name: "description", label: "Description", type: "textarea" },
      { name: "sort_order", label: "Ordre d'affichage", type: "number" },
      { name: "active", label: "Visible sur le site", type: "bool", default: 1 },
    ],
  },
];

const SETTINGS_FIELDS = [
  { name: "site_name", label: "Nom du site" },
  { name: "phone_display", label: "Téléphone affiché" },
  { name: "phone_link", label: "Téléphone (format lien, ex : +237600000000)" },
  { name: "email", label: "Email de contact" },
  { name: "address", label: "Adresse / localisation" },
  { name: "hours", label: "Horaires" },
  { name: "location_note", label: "Note localisation" },
  { name: "hours_note", label: "Note horaires" },
  { name: "facebook", label: "Lien Facebook" },
  { name: "linkedin", label: "Lien LinkedIn" },
  { name: "instagram", label: "Lien Instagram" },
  { name: "marquee_items", label: "Bandeau défilant (un mot par ligne)", type: "list" },
  { name: "hero_pills", label: "Arguments du hero (un par ligne)", type: "list" },
];

const REQUEST_STATUSES = [
  { value: "new", label: "Nouvelle", color: "bg-red-soft text-red" },
  { value: "in_progress", label: "En cours", color: "bg-amber-100 text-amber-700" },
  { value: "done", label: "Traitée", color: "bg-emerald-100 text-emerald-700" },
];

/* ---------- Helpers API ---------- */

async function api(path, options = {}) {
  const res = await fetch(`/api/admin/${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) throw new Error("__unauthorized__");
  if (!res.ok || data.ok === false) throw new Error(data.error || `Erreur ${res.status}`);
  return data;
}

/* ---------- Petits composants UI ---------- */

function Button({ children, variant = "primary", ...props }) {
  const styles = {
    primary: "bg-[#C0202B] text-white hover:bg-[#96131B]",
    ghost: "bg-transparent text-ink border border-[#D8D3C4] hover:border-[#C0202B] hover:text-[#C0202B]",
    danger: "bg-transparent text-[#C0202B] border border-[#C0202B]/30 hover:bg-[#C0202B] hover:text-white",
  };
  return (
    <button
      {...props}
      className={`rounded-lg px-4 py-2 text-sm font-semibold transition disabled:opacity-50 ${styles[variant]} ${props.className || ""}`}
    >
      {children}
    </button>
  );
}

function Input({ label, ...props }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#5E5E5E]">{label}</span>
      <input
        {...props}
        className="w-full rounded-lg border border-[#D8D3C4] bg-white px-3 py-2 text-sm text-[#1A1A17] outline-none focus:border-[#C0202B]"
      />
    </label>
  );
}

function Textarea({ label, ...props }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#5E5E5E]">{label}</span>
      <textarea
        {...props}
        className="w-full rounded-lg border border-[#D8D3C4] bg-white px-3 py-2 text-sm text-[#1A1A17] outline-none focus:border-[#C0202B]"
      />
    </label>
  );
}

function Checkbox({ label, checked, onChange }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-[#1A1A17]">
      <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-[#C0202B]" />
      {label}
    </label>
  );
}

/* ---------- Formulaire générique d'un élément ---------- */

function listToText(jsonStr) {
  try {
    const arr = JSON.parse(jsonStr || "[]");
    return Array.isArray(arr) ? arr.join("\n") : "";
  } catch {
    return "";
  }
}

function textToList(text) {
  return JSON.stringify(
    (text || "")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
  );
}

function ItemForm({ resource, item, onSaved, onCancel }) {
  const isNew = !item?.id;
  const [values, setValues] = useState(() => {
    const v = {};
    for (const f of resource.fields) {
      if (f.type === "list") v[f.name] = listToText(item?.[f.name]);
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
    <form onSubmit={submit} className="space-y-4 rounded-xl border border-[#D8D3C4] bg-[#FBF6EA] p-5">
      <h3 className="font-semibold text-[#1A1A17]">
        {isNew ? `Ajouter — ${resource.label}` : `Modifier — ${item[resource.titleField]}`}
      </h3>
      <div className="grid gap-4 sm:grid-cols-2">
        {resource.fields.map((f) => {
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
      {error && <p className="text-sm text-[#C0202B]">{error}</p>}
      <div className="flex gap-3">
        <Button type="submit" disabled={saving}>{saving ? "Enregistrement..." : "Enregistrer"}</Button>
        <Button type="button" variant="ghost" onClick={onCancel}>Annuler</Button>
      </div>
    </form>
  );
}

/* ---------- Panneau CRUD générique ---------- */

function ResourcePanel({ resource, onUnauthorized }) {
  const [items, setItems] = useState(null);
  const [editing, setEditing] = useState(null); // null | "new" | item
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

  useEffect(() => {
    setItems(null);
    setEditing(null);
    load();
  }, [load]);

  const remove = async (item) => {
    if (!confirm(`Supprimer « ${item[resource.titleField]} » ? Cette action est définitive.`)) return;
    try {
      await api(`${resource.key}/${item.id}`, { method: "DELETE" });
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  const toggleActive = async (item) => {
    try {
      await api(`${resource.key}/${item.id}`, { method: "PUT", body: JSON.stringify({ active: item.active ? 0 : 1 }) });
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  if (items === null) return <p className="text-sm text-[#5E5E5E]">Chargement...</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-[#1A1A17]">
          {resource.icon} {resource.label} <span className="text-sm font-normal text-[#5E5E5E]">({items.length})</span>
        </h2>
        {!editing && <Button onClick={() => setEditing("new")}>+ Ajouter</Button>}
      </div>

      {error && <p className="text-sm text-[#C0202B]">{error}</p>}

      {editing && (
        <ItemForm
          resource={resource}
          item={editing === "new" ? null : editing}
          onSaved={() => { setEditing(null); load(); }}
          onCancel={() => setEditing(null)}
        />
      )}

      <div className="overflow-hidden rounded-xl border border-[#D8D3C4] bg-white">
        {items.length === 0 ? (
          <p className="p-4 text-sm text-[#5E5E5E]">Aucun élément pour le moment.</p>
        ) : (
          <ul className="divide-y divide-[#F0EDE6]">
            {items.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-[#1A1A17]">
                  {item[resource.titleField] || `#${item.id}`}
                </span>
                {"active" in item && (
                  <button
                    onClick={() => toggleActive(item)}
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${item.active ? "bg-emerald-100 text-emerald-700" : "bg-gray-200 text-gray-500"}`}
                    title="Cliquer pour changer la visibilité"
                  >
                    {item.active ? "Visible" : "Masqué"}
                  </button>
                )}
                <Button variant="ghost" className="!px-3 !py-1" onClick={() => setEditing(item)}>Modifier</Button>
                <Button variant="danger" className="!px-3 !py-1" onClick={() => remove(item)}>Supprimer</Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ---------- Panneau des demandes de devis ---------- */

function RequestsPanel({ onUnauthorized }) {
  const [items, setItems] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const data = await api("requests");
      setItems(data.items);
    } catch (err) {
      if (err.message === "__unauthorized__") return onUnauthorized();
      setError(err.message);
      setItems([]);
    }
  }, [onUnauthorized]);

  useEffect(() => { load(); }, [load]);

  const setStatus = async (item, status) => {
    try {
      await api(`requests/${item.id}`, { method: "PUT", body: JSON.stringify({ status }) });
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  const remove = async (item) => {
    if (!confirm(`Supprimer la demande de ${item.name} ?`)) return;
    try {
      await api(`requests/${item.id}`, { method: "DELETE" });
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  if (items === null) return <p className="text-sm text-[#5E5E5E]">Chargement...</p>;

  const newCount = items.filter((i) => i.status === "new").length;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-[#1A1A17]">
        📥 Demandes de devis <span className="text-sm font-normal text-[#5E5E5E]">({items.length} au total, {newCount} nouvelle{newCount > 1 ? "s" : ""})</span>
      </h2>
      {error && <p className="text-sm text-[#C0202B]">{error}</p>}
      {items.length === 0 ? (
        <p className="rounded-xl border border-[#D8D3C4] bg-white p-4 text-sm text-[#5E5E5E]">
          Aucune demande pour le moment. Elles apparaîtront ici dès qu'un visiteur enverra le formulaire de contact.
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((r) => {
            const status = REQUEST_STATUSES.find((s) => s.value === r.status) || REQUEST_STATUSES[0];
            return (
              <li key={r.id} className="rounded-xl border border-[#D8D3C4] bg-white p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <strong className="text-[#1A1A17]">{r.name}</strong>
                  {r.company && <span className="text-sm text-[#5E5E5E]">· {r.company}</span>}
                  <span className={`ml-auto rounded-full px-2.5 py-0.5 text-xs font-semibold ${status.color}`}>{status.label}</span>
                </div>
                <p className="mt-1 text-xs text-[#5E5E5E]">
                  {r.created_at} · {r.project_type || "Type non précisé"} · {r.budget || "Budget non précisé"}
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-[#1A1A17]">{r.message}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                  {r.phone && (
                    <a className="font-semibold text-[#C0202B] hover:underline" href={`https://wa.me/${r.phone.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer">
                      WhatsApp : {r.phone}
                    </a>
                  )}
                  {r.email && (
                    <a className="font-semibold text-[#C0202B] hover:underline" href={`mailto:${r.email}`}>{r.email}</a>
                  )}
                  <div className="ml-auto flex items-center gap-2">
                    <select
                      value={r.status}
                      onChange={(e) => setStatus(r, e.target.value)}
                      className="rounded-lg border border-[#D8D3C4] bg-white px-2 py-1 text-xs"
                    >
                      {REQUEST_STATUSES.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                    <Button variant="danger" className="!px-3 !py-1" onClick={() => remove(r)}>Supprimer</Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* ---------- Panneau newsletter ---------- */

function SubscribersPanel({ onUnauthorized }) {
  const [items, setItems] = useState(null);

  const load = useCallback(async () => {
    try {
      const data = await api("subscribers");
      setItems(data.items);
    } catch (err) {
      if (err.message === "__unauthorized__") return onUnauthorized();
      setItems([]);
    }
  }, [onUnauthorized]);

  useEffect(() => { load(); }, [load]);

  const remove = async (item) => {
    if (!confirm(`Désinscrire ${item.email} ?`)) return;
    await api(`subscribers/${item.id}`, { method: "DELETE" });
    load();
  };

  if (items === null) return <p className="text-sm text-[#5E5E5E]">Chargement...</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-[#1A1A17]">
          ✉️ Newsletter <span className="text-sm font-normal text-[#5E5E5E]">({items.length} abonné{items.length > 1 ? "s" : ""})</span>
        </h2>
        {items.length > 0 && (
          <Button variant="ghost" onClick={() => navigator.clipboard.writeText(items.map((i) => i.email).join(", "))}>
            Copier tous les emails
          </Button>
        )}
      </div>
      <div className="overflow-hidden rounded-xl border border-[#D8D3C4] bg-white">
        {items.length === 0 ? (
          <p className="p-4 text-sm text-[#5E5E5E]">Aucun abonné pour le moment.</p>
        ) : (
          <ul className="divide-y divide-[#F0EDE6]">
            {items.map((i) => (
              <li key={i.id} className="flex items-center gap-3 px-4 py-2.5">
                <span className="flex-1 text-sm text-[#1A1A17]">{i.email}</span>
                <span className="text-xs text-[#5E5E5E]">{i.created_at}</span>
                <Button variant="danger" className="!px-3 !py-1" onClick={() => remove(i)}>Retirer</Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ---------- Panneau réglages ---------- */

function SettingsPanel({ onUnauthorized }) {
  const [values, setValues] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await api("settings");
        const v = {};
        for (const f of SETTINGS_FIELDS) {
          v[f.name] = f.type === "list" ? listToText(data.settings[f.name]) : (data.settings[f.name] ?? "");
        }
        setValues(v);
      } catch (err) {
        if (err.message === "__unauthorized__") return onUnauthorized();
        setValues({});
        setMessage(err.message);
      }
    })();
  }, [onUnauthorized]);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    const settings = {};
    for (const f of SETTINGS_FIELDS) {
      settings[f.name] = f.type === "list" ? textToList(values[f.name]) : values[f.name];
    }
    try {
      await api("settings", { method: "PUT", body: JSON.stringify({ settings }) });
      setMessage("✓ Réglages enregistrés. Ils sont immédiatement visibles sur le site.");
    } catch (err) {
      setMessage(err.message);
    }
    setSaving(false);
  };

  if (values === null) return <p className="text-sm text-[#5E5E5E]">Chargement...</p>;

  return (
    <form onSubmit={submit} className="space-y-4">
      <h2 className="text-lg font-bold text-[#1A1A17]">⚙️ Réglages du site</h2>
      <div className="grid gap-4 rounded-xl border border-[#D8D3C4] bg-white p-5 sm:grid-cols-2">
        {SETTINGS_FIELDS.map((f) =>
          f.type === "list" ? (
            <div key={f.name} className="sm:col-span-2">
              <Textarea label={f.label} rows={4} value={values[f.name]} onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))} />
            </div>
          ) : (
            <Input key={f.name} label={f.label} value={values[f.name]} onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))} />
          )
        )}
      </div>
      {message && <p className={`text-sm ${message.startsWith("✓") ? "text-emerald-700" : "text-[#C0202B]"}`}>{message}</p>}
      <Button type="submit" disabled={saving}>{saving ? "Enregistrement..." : "Enregistrer les réglages"}</Button>
    </form>
  );
}

/* ---------- Écran de connexion ---------- */

function LoginScreen({ onLogin }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [warning, setWarning] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Connexion impossible");
      if (data.usingDefaultPassword) setWarning(true);
      onLogin();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-2xl border border-[#D8D3C4] bg-white p-8 shadow-md2">
        <div className="text-center">
          <p className="text-2xl font-bold text-[#1A1A17]">
            impact<span className="text-[#C0202B]">.</span>Tech
          </p>
          <p className="mt-1 text-sm text-[#5E5E5E]">Dashboard d'administration</p>
        </div>
        <Input
          label="Mot de passe"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoFocus
        />
        {error && <p className="text-sm text-[#C0202B]">{error}</p>}
        {warning && (
          <p className="text-xs text-amber-700">
            ⚠️ Vous utilisez le mot de passe par défaut. Définissez ADMIN_PASSWORD dans Cloudflare Pages.
          </p>
        )}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Connexion..." : "Se connecter"}
        </Button>
      </form>
    </div>
  );
}

/* ---------- Page principale ---------- */

const TABS = [
  { key: "requests", label: "Demandes", icon: "📥" },
  ...RESOURCES.map((r) => ({ key: r.key, label: r.label, icon: r.icon })),
  { key: "subscribers", label: "Newsletter", icon: "✉️" },
  { key: "settings", label: "Réglages", icon: "⚙️" },
];

export default function AdminPage() {
  const [state, setState] = useState("loading"); // loading | login | app
  const [tab, setTab] = useState("requests");
  const [dbAvailable, setDbAvailable] = useState(true);

  const checkSession = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/me");
      if (res.ok) {
        const data = await res.json();
        setDbAvailable(data.dbAvailable);
        setState("app");
      } else {
        setState("login");
      }
    } catch {
      setState("login");
    }
  }, []);

  useEffect(() => { checkSession(); }, [checkSession]);

  const onUnauthorized = useCallback(() => setState("login"), []);

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    setState("login");
  };

  if (state === "loading") {
    return <div className="flex min-h-screen items-center justify-center text-sm text-[#5E5E5E]">Chargement...</div>;
  }

  if (state === "login") {
    return <LoginScreen onLogin={() => checkSession()} />;
  }

  const resource = RESOURCES.find((r) => r.key === tab);

  return (
    <div className="mx-auto flex min-h-screen max-w-7xl flex-col md:flex-row">
      {/* Barre latérale */}
      <aside className="shrink-0 border-b border-[#D8D3C4] bg-white p-4 md:min-h-screen md:w-60 md:border-b-0 md:border-r">
        <div className="mb-6 flex items-center justify-between md:block">
          <p className="text-xl font-bold text-[#1A1A17]">
            impact<span className="text-[#C0202B]">.</span>Tech
            <span className="ml-2 rounded bg-[#C0202B]/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-[#C0202B]">admin</span>
          </p>
          <div className="flex items-center gap-2 md:mt-3">
            <a href="/" target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-[#5E5E5E] hover:text-[#C0202B]">
              Voir le site ↗
            </a>
            <button onClick={logout} className="text-xs font-semibold text-[#C0202B] hover:underline">
              Déconnexion
            </button>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`whitespace-nowrap rounded-lg px-3 py-2 text-left text-sm font-medium transition ${
                tab === t.key ? "bg-[#C0202B] text-white" : "text-[#1A1A17] hover:bg-[#F4F1E9]"
              }`}
            >
              <span className="mr-2">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Contenu */}
      <main className="flex-1 p-4 md:p-8">
        {!dbAvailable && (
          <p className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
            ⚠️ Base de données indisponible (mode dev local sans wrangler). Lancez <code>npm run preview</code> ou
            déployez sur Cloudflare Pages pour gérer le contenu réel.
          </p>
        )}
        {tab === "requests" && <RequestsPanel onUnauthorized={onUnauthorized} />}
        {tab === "subscribers" && <SubscribersPanel onUnauthorized={onUnauthorized} />}
        {tab === "settings" && <SettingsPanel onUnauthorized={onUnauthorized} />}
        {resource && <ResourcePanel resource={resource} onUnauthorized={onUnauthorized} />}
      </main>
    </div>
  );
}
