import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api";
import { REQUEST_STATUSES } from "../lib/constants";
import { Button, Badge, Card, Select } from "./ui";
import { Trash2 } from "../lib/icons";

export default function RequestsPanel({ onUnauthorized }) {
  const [items, setItems] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try { const data = await api("requests"); setItems(data.items); } catch (err) {
      if (err.message === "__unauthorized__") return onUnauthorized();
      setError(err.message); setItems([]);
    }
  }, [onUnauthorized]);

  useEffect(() => { load(); }, [load]);

  const setStatus = async (item, status) => {
    try { await api(`requests/${item.id}`, { method: "PUT", body: JSON.stringify({ status }) }); load(); } catch (err) { alert(err.message); }
  };

  const remove = async (item) => {
    if (!confirm(`Supprimer la demande de ${item.name} ?`)) return;
    try { await api(`requests/${item.id}`, { method: "DELETE" }); load(); } catch (err) { alert(err.message); }
  };

  if (items === null) return <p className="text-sm text-adm-text-3">Chargement...</p>;

  const newCount = items.filter((i) => i.status === "new").length;

  return (
    <div className="space-y-4">
      <h2 className="font-head text-lg font-semibold text-adm-text">
        Demandes de devis <span className="text-sm font-normal text-adm-text-3">({items.length} au total, {newCount} nouvelle{newCount > 1 ? "s" : ""})</span>
      </h2>
      {error && <p className="text-sm text-adm-red">{error}</p>}
      {items.length === 0 ? (
        <Card><p className="text-sm text-adm-text-3">Aucune demande pour le moment.</p></Card>
      ) : (
        <div className="space-y-3">
          {items.map((r) => {
            const status = REQUEST_STATUSES.find((s) => s.value === r.status) || REQUEST_STATUSES[0];
            return (
              <Card key={r.id} padding="p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <strong className="text-adm-text">{r.name}</strong>
                  {r.company && <span className="text-sm text-adm-text-3">{r.company}</span>}
                  <Badge variant={status.color} className="ml-auto">{status.label}</Badge>
                </div>
                <p className="mt-1 text-xs text-adm-text-3">
                  {r.created_at} · {r.project_type || "Type non precis"} · {r.budget || "Budget non precis"}
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-adm-text-2">{r.message}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                  {r.phone && (
                    <a className="font-semibold text-adm-red hover:underline" href={`https://wa.me/${r.phone.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer">
                      WhatsApp : {r.phone}
                    </a>
                  )}
                  {r.email && (
                    <a className="font-semibold text-adm-red hover:underline" href={`mailto:${r.email}`}>{r.email}</a>
                  )}
                  <div className="ml-auto flex items-center gap-2">
                    <select
                      value={r.status}
                      onChange={(e) => setStatus(r, e.target.value)}
                      className="rounded-lg border border-adm-border-2 bg-adm-surface-3 px-2 py-1 text-xs text-adm-text"
                    >
                      {REQUEST_STATUSES.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                    <Button variant="danger" size="sm" icon={Trash2} onClick={() => remove(r)}>Supprimer</Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
