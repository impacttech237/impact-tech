import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api";
import { PAYMENT_STATUSES } from "../lib/constants";
import { Badge, StatsCard } from "./ui";
import { CreditCard } from "../lib/icons";

export default function PaymentsPanel({ onUnauthorized }) {
  const [items, setItems] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try { const data = await api("payments"); setItems(data.items); } catch (err) {
      if (err.message === "__unauthorized__") return onUnauthorized();
      setError(err.message); setItems([]);
    }
  }, [onUnauthorized]);

  useEffect(() => { load(); }, [load]);

  if (items === null) return <p className="text-sm text-adm-text-3">Chargement...</p>;

  const totalCompleted = items.filter((p) => p.status === "COMPLETED").reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <div className="space-y-4">
      <h2 className="font-head text-lg font-semibold text-adm-text">Paiements</h2>
      <StatsCard icon={CreditCard} label="Total encaissé" value={`${totalCompleted.toLocaleString("fr-FR")} FCFA`} />
      <p className="text-xs text-adm-text-3">Lecture seule — le statut est mis à jour par K-PAY (webhook).</p>
      {error && <p className="text-sm text-adm-red">{error}</p>}
      {items.length === 0 ? (
        <p className="rounded-xl border border-adm-border bg-adm-surface p-6 text-sm text-adm-text-3">Aucun paiement pour le moment.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-adm-border">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-adm-border bg-adm-surface-2">
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-adm-text-3">Offre / Client</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-adm-text-3">Montant</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-adm-text-3">Statut</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-adm-text-3">Date</th>
              </tr>
            </thead>
            <tbody className="bg-adm-surface">
              {items.map((p) => {
                const status = PAYMENT_STATUSES[p.status] || PAYMENT_STATUSES.PENDING;
                return (
                  <tr key={p.id} className="border-b border-adm-border last:border-0 hover:bg-adm-surface-2">
                    <td className="px-4 py-3">
                      <p className="truncate font-medium text-adm-text">{p.offer_tag || "—"}</p>
                      <p className="text-xs text-adm-text-3">{p.customer_name} · {p.customer_phone}{p.is_test ? " · test" : ""}</p>
                    </td>
                    <td className="px-4 py-3 font-semibold text-adm-text whitespace-nowrap">{(p.amount || 0).toLocaleString("fr-FR")} {p.currency}</td>
                    <td className="px-4 py-3"><Badge variant={status.color}>{status.label}</Badge></td>
                    <td className="px-4 py-3 text-adm-text-3 text-xs whitespace-nowrap">{p.created_at}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
