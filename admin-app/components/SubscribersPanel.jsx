import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api";
import { Button } from "./ui";
import { Copy, Trash2 } from "../lib/icons";

export default function SubscribersPanel({ onUnauthorized }) {
  const [items, setItems] = useState(null);

  const load = useCallback(async () => {
    try { const data = await api("subscribers"); setItems(data.items); } catch (err) {
      if (err.message === "__unauthorized__") return onUnauthorized();
      setItems([]);
    }
  }, [onUnauthorized]);

  useEffect(() => { load(); }, [load]);

  const remove = async (item) => {
    if (!confirm(`Desinscrire ${item.email} ?`)) return;
    await api(`subscribers/${item.id}`, { method: "DELETE" });
    load();
  };

  if (items === null) return <p className="text-sm text-adm-text-3">Chargement...</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-head text-lg font-semibold text-adm-text">
          Newsletter <span className="text-sm font-normal text-adm-text-3">({items.length} abonne{items.length > 1 ? "s" : ""})</span>
        </h2>
        {items.length > 0 && (
          <Button variant="ghost" size="sm" icon={Copy} onClick={() => navigator.clipboard.writeText(items.map((i) => i.email).join(", "))}>
            Copier les emails
          </Button>
        )}
      </div>
      {items.length === 0 ? (
        <p className="rounded-xl border border-adm-border bg-adm-surface p-6 text-sm text-adm-text-3">Aucun abonne.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-adm-border">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-adm-border bg-adm-surface-2">
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-adm-text-3">Email</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-adm-text-3">Date</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-adm-text-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="bg-adm-surface">
              {items.map((i) => (
                <tr key={i.id} className="border-b border-adm-border last:border-0 hover:bg-adm-surface-2">
                  <td className="px-4 py-3 text-adm-text">{i.email}</td>
                  <td className="px-4 py-3 text-xs text-adm-text-3">{i.created_at}</td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="danger" size="sm" icon={Trash2} onClick={() => remove(i)}>Retirer</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
