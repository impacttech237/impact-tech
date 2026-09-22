import { useState, useEffect, useCallback } from "react";
import { api } from "../lib/api";
import { Button, Input, Card, Badge } from "./ui";
import { Calendar, Clock, Plus, Trash2, Edit3, Link2 } from "../lib/icons";

const DAY_NAMES = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

function GCalStatus({ onUnauthorized }) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const check = useCallback(async () => {
    try {
      const data = await api("appointments/gcal/status");
      setStatus(data.connected);
    } catch (err) {
      if (err.message === "__unauthorized__") return onUnauthorized();
    }
  }, [onUnauthorized]);

  useEffect(() => { check(); }, [check]);

  const connect = async () => {
    setLoading(true);
    try {
      const data = await api("appointments/gcal/connect");
      window.open(data.url, "_blank");
    } catch (err) {
      alert(err.message);
    }
    setLoading(false);
  };

  const disconnect = async () => {
    if (!confirm("Déconnecter Google Calendar ?")) return;
    try {
      await api("appointments/gcal/disconnect", { method: "POST" });
      setStatus(false);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <Card className="flex items-center gap-3 p-4">
      <div className="rounded-lg bg-adm-red/10 p-2 text-adm-red">
        <Calendar size={20} />
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-adm-text">Google Calendar</p>
        <p className="text-xs text-adm-text-3">
          {status === null ? "Vérification..." : status ? "Connecté — les RDV seront synchronisés" : "Non connecté"}
        </p>
      </div>
      {status === true ? (
        <div className="flex items-center gap-2">
          <Badge variant="success">Connecté</Badge>
          <Button variant="danger" size="sm" onClick={disconnect}>Déconnecter</Button>
          <Button variant="ghost" size="sm" onClick={check}>Actualiser</Button>
        </div>
      ) : status === false ? (
        <Button onClick={connect} loading={loading}>{loading ? "Connexion..." : "Connecter"}</Button>
      ) : null}
    </Card>
  );
}

function TypesManager({ onUnauthorized }) {
  const [types, setTypes] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ slug: "", title: "", description: "", duration: 30, color: "#C0202B", location: "" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api("appointments/types");
      setTypes(data.types);
    } catch (err) {
      if (err.message === "__unauthorized__") return onUnauthorized();
      setTypes([]);
    }
  }, [onUnauthorized]);

  useEffect(() => { load(); }, [load]);

  const startEdit = (type) => {
    setEditing(type ? type.id : "new");
    setForm(type || { slug: "", title: "", description: "", duration: 30, color: "#C0202B", location: "" });
  };

  const save = async () => {
    setSaving(true);
    try {
      if (editing === "new") {
        await api("appointments/types", { method: "POST", body: JSON.stringify(form) });
      } else {
        await api(`appointments/types/${editing}`, { method: "PUT", body: JSON.stringify(form) });
      }
      setEditing(null);
      load();
    } catch (err) {
      alert(err.message);
    }
    setSaving(false);
  };

  const remove = async (id) => {
    if (!confirm("Supprimer ce type de RDV ?")) return;
    try {
      await api(`appointments/types/${id}`, { method: "DELETE" });
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  const toggleActive = async (type) => {
    try {
      await api(`appointments/types/${type.id}`, { method: "PUT", body: JSON.stringify({ active: type.active ? 0 : 1 }) });
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  if (types === null) return <p className="text-sm text-adm-text-3">Chargement...</p>;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-adm-text-3">Types de RDV ({types.length})</p>
        {!editing && <Button size="sm" icon={Plus} onClick={() => startEdit(null)}>Ajouter</Button>}
      </div>

      {editing !== null && (
        <Card className="space-y-3 border-adm-red/30 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Titre" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            <Input label="Slug (URL)" value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} />
            <Input label="Durée (min)" type="number" value={form.duration} onChange={(e) => setForm((f) => ({ ...f, duration: parseInt(e.target.value) || 30 }))} />
            <Input label="Lieu" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} />
            <Input label="Couleur" type="color" value={form.color} onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))} />
          </div>
          <Input label="Description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          <div className="flex gap-2">
            <Button loading={saving} disabled={!form.title || !form.slug} onClick={save}>{saving ? "Enregistrement..." : "Enregistrer"}</Button>
            <Button variant="ghost" onClick={() => setEditing(null)}>Annuler</Button>
          </div>
        </Card>
      )}

      <div className="overflow-hidden rounded-xl border border-adm-border">
        {types.length === 0 ? (
          <p className="bg-adm-surface p-4 text-sm text-adm-text-3">Aucun type de RDV configuré.</p>
        ) : (
          <ul className="divide-y divide-adm-border bg-adm-surface">
            {types.map((t) => (
              <li key={t.id} className="flex flex-wrap items-center gap-3 px-4 py-3 hover:bg-adm-surface-2">
                <span className="h-3 w-3 rounded-full" style={{ background: t.color }} />
                <span className="min-w-0 flex-1 text-sm font-medium text-adm-text">{t.title}</span>
                <span className="text-xs text-adm-text-3">{t.duration} min</span>
                <button
                  onClick={() => toggleActive(t)}
                  className="cursor-pointer text-xs transition-opacity hover:opacity-80"
                >
                  <Badge variant={t.active ? "success" : "default"}>
                    {t.active ? "Actif" : "Inactif"}
                  </Badge>
                </button>
                <Button variant="ghost" size="sm" icon={Edit3} onClick={() => startEdit(t)}>Modifier</Button>
                <Button variant="danger" size="sm" icon={Trash2} onClick={() => remove(t.id)}>Supprimer</Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function AvailabilityManager({ onUnauthorized }) {
  const [rules, setRules] = useState(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ day_of_week: 1, start_time: "09:00", end_time: "17:00" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api("appointments/availability");
      setRules(data.rules);
    } catch (err) {
      if (err.message === "__unauthorized__") return onUnauthorized();
      setRules([]);
    }
  }, [onUnauthorized]);

  useEffect(() => { load(); }, [load]);

  const add = async () => {
    setSaving(true);
    try {
      await api("appointments/availability", { method: "POST", body: JSON.stringify(form) });
      setAdding(false);
      load();
    } catch (err) {
      alert(err.message);
    }
    setSaving(false);
  };

  const remove = async (id) => {
    if (!confirm("Supprimer cette plage ?")) return;
    try {
      await api(`appointments/availability/${id}`, { method: "DELETE" });
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  if (rules === null) return <p className="text-sm text-adm-text-3">Chargement...</p>;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-adm-text-3">Plages horaires ({rules.length})</p>
        {!adding && <Button size="sm" icon={Plus} onClick={() => setAdding(true)}>Ajouter</Button>}
      </div>

      {adding && (
        <Card className="flex flex-wrap items-end gap-3 border-adm-red/30 p-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-adm-text-3">Jour</span>
            <select
              value={form.day_of_week}
              onChange={(e) => setForm((f) => ({ ...f, day_of_week: parseInt(e.target.value) }))}
              className="cursor-pointer rounded-lg border border-adm-border-2 bg-adm-surface-3 px-3 py-2 text-sm text-adm-text outline-none transition-colors focus:border-adm-red"
            >
              {DAY_NAMES.map((d, i) => <option key={i} value={i}>{d}</option>)}
            </select>
          </label>
          <Input label="De" type="time" value={form.start_time} onChange={(e) => setForm((f) => ({ ...f, start_time: e.target.value }))} />
          <Input label="A" type="time" value={form.end_time} onChange={(e) => setForm((f) => ({ ...f, end_time: e.target.value }))} />
          <Button loading={saving} onClick={add}>{saving ? "Ajout..." : "Ajouter"}</Button>
          <Button variant="ghost" onClick={() => setAdding(false)}>Annuler</Button>
        </Card>
      )}

      <div className="overflow-hidden rounded-xl border border-adm-border">
        {rules.length === 0 ? (
          <p className="bg-adm-surface p-4 text-sm text-adm-text-3">Aucune plage horaire. Ajoutez vos disponibilités pour permettre les réservations.</p>
        ) : (
          <ul className="divide-y divide-adm-border bg-adm-surface">
            {rules.map((r) => (
              <li key={r.id} className="flex items-center gap-3 px-4 py-3 hover:bg-adm-surface-2">
                <Clock size={14} className="text-adm-text-3" />
                <span className="min-w-0 flex-1 text-sm font-medium text-adm-text">
                  {DAY_NAMES[r.day_of_week]} : {r.start_time} — {r.end_time}
                </span>
                <Button variant="danger" size="sm" icon={Trash2} onClick={() => remove(r.id)}>Supprimer</Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function AppointmentsList({ onUnauthorized }) {
  const [appointments, setAppointments] = useState(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (statusFilter) params.set("status", statusFilter);
      const data = await api(`appointments/list?${params}`);
      setAppointments(data.appointments);
      setTotal(data.total);
    } catch (err) {
      if (err.message === "__unauthorized__") return onUnauthorized();
      setAppointments([]);
    }
  }, [page, statusFilter, onUnauthorized]);

  useEffect(() => { load(); }, [load]);

  const cancel = async (id) => {
    if (!confirm("Annuler ce rendez-vous ?")) return;
    try {
      await api(`appointments/appointments/${id}`, { method: "PUT", body: JSON.stringify({ status: "cancelled" }) });
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  const remove = async (id) => {
    if (!confirm("Supprimer définitivement ce RDV ?")) return;
    try {
      await api(`appointments/appointments/${id}`, { method: "DELETE" });
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  const statusVariant = { confirmed: "success", cancelled: "danger", completed: "info" };
  const statusLabels = { confirmed: "Confirmé", cancelled: "Annulé", completed: "Terminé" };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-adm-text-3">Rendez-vous ({total})</p>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="cursor-pointer rounded-lg border border-adm-border-2 bg-adm-surface-3 px-2 py-1 text-xs text-adm-text outline-none transition-colors focus:border-adm-red"
        >
          <option value="">Tous</option>
          <option value="confirmed">Confirmés</option>
          <option value="cancelled">Annulés</option>
        </select>
      </div>

      {appointments === null ? (
        <p className="text-sm text-adm-text-3">Chargement...</p>
      ) : appointments.length === 0 ? (
        <Card className="p-4 text-sm text-adm-text-3">Aucun rendez-vous.</Card>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-adm-border">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-adm-border bg-adm-surface-2">
                <th className="px-4 py-3 text-xs font-medium uppercase text-adm-text-3">Date</th>
                <th className="px-4 py-3 text-xs font-medium uppercase text-adm-text-3">Heure</th>
                <th className="px-4 py-3 text-xs font-medium uppercase text-adm-text-3">Client</th>
                <th className="px-4 py-3 text-xs font-medium uppercase text-adm-text-3">Type</th>
                <th className="px-4 py-3 text-xs font-medium uppercase text-adm-text-3">Statut</th>
                <th className="px-4 py-3 text-xs font-medium uppercase text-adm-text-3"></th>
              </tr>
            </thead>
            <tbody className="bg-adm-surface">
              {appointments.map((a) => (
                <tr key={a.id} className="border-b border-adm-border last:border-0 hover:bg-adm-surface-2">
                  <td className="px-4 py-3 text-adm-text">{new Date(a.start_time).toLocaleDateString("fr-FR")}</td>
                  <td className="px-4 py-3 text-adm-text">{a.start_time.slice(11, 16)}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-adm-text">{a.client_name}</p>
                    {a.client_phone && <p className="text-xs text-adm-text-3">{a.client_phone}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 text-adm-text-2">
                      <span className="h-2 w-2 rounded-full" style={{ background: a.type_color }} />
                      {a.type_title}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={statusVariant[a.status] || "default"}>
                      {statusLabels[a.status] || a.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {a.status === "confirmed" && (
                      <button onClick={() => cancel(a.id)} className="cursor-pointer text-xs font-semibold text-adm-red transition-colors hover:underline">Annuler</button>
                    )}
                    <button onClick={() => remove(a.id)} className="ml-2 cursor-pointer text-xs text-adm-text-3 transition-colors hover:text-adm-red">Suppr.</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {total > 20 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="ghost" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>&larr; Précédent</Button>
          <span className="text-xs text-adm-text-3">Page {page} / {Math.ceil(total / 20)}</span>
          <Button variant="ghost" size="sm" disabled={page >= Math.ceil(total / 20)} onClick={() => setPage((p) => p + 1)}>Suivant &rarr;</Button>
        </div>
      )}
    </div>
  );
}

export default function AppointmentsPanel({ onUnauthorized }) {
  const [tab, setTab] = useState("rdv");

  const tabs = [
    { key: "rdv", label: "Rendez-vous" },
    { key: "types", label: "Types de RDV" },
    { key: "horaires", label: "Plages horaires" },
  ];

  return (
    <div className="space-y-4">
      <GCalStatus onUnauthorized={onUnauthorized} />

      <div className="flex rounded-lg border border-adm-border overflow-hidden">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`cursor-pointer px-3 py-1.5 text-xs font-semibold transition-colors ${tab === t.key ? "bg-adm-red text-white" : "bg-adm-surface text-adm-text-2 hover:bg-adm-surface-2"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "rdv" && <AppointmentsList onUnauthorized={onUnauthorized} />}
      {tab === "types" && <TypesManager onUnauthorized={onUnauthorized} />}
      {tab === "horaires" && <AvailabilityManager onUnauthorized={onUnauthorized} />}
    </div>
  );
}
