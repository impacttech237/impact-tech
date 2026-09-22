import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api";
import { StatsCard, Card, Badge, Chart } from "./ui";
import { LoadingSpinner } from "./ui/LoadingSpinner";
import { FileText, Users, Calendar, CreditCard, Check, Clock, Activity } from "../lib/icons";
import { REQUEST_STATUSES } from "../lib/constants";

const MONTHS_FR = ["Jan", "Fev", "Mar", "Avr", "Mai", "Jun", "Jul", "Aou", "Sep", "Oct", "Nov", "Dec"];

function formatMonth(ym) {
  const [, m] = (ym || "").split("-");
  return MONTHS_FR[parseInt(m, 10) - 1] || ym;
}

export default function DashboardPanel({ onUnauthorized }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const d = await api("dashboard");
      setData(d);
    } catch (err) {
      if (err.message === "__unauthorized__") return onUnauthorized();
      setError(err.message);
    }
  }, [onUnauthorized]);

  useEffect(() => { load(); }, [load]);

  if (!data && !error) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size={28} className="text-adm-red" />
      </div>
    );
  }

  if (error) return <p className="text-sm text-adm-red">{error}</p>;

  const { stats, charts, recentRequests, upcomingAppointments } = data;

  const chartData = {
    labels: (charts?.monthlyRequests || []).map((r) => formatMonth(r.month)),
    datasets: [
      {
        label: "Demandes",
        data: (charts?.monthlyRequests || []).map((r) => r.count),
        borderColor: "#C0202B",
        backgroundColor: "rgba(192, 32, 43, 0.1)",
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: "#C0202B",
      },
      {
        label: "Paiements (k FCFA)",
        data: (charts?.monthlyPayments || []).map((r) => Math.round((r.total || 0) / 1000)),
        borderColor: "#22c55e",
        backgroundColor: "rgba(34, 197, 94, 0.08)",
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: "#22c55e",
      },
    ],
  };

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatsCard icon={FileText} label="Nouvelles demandes" value={stats.newRequests} accent="red" />
        <StatsCard icon={Users} label="Clients actifs" value={stats.clients} accent="blue" />
        <StatsCard icon={Calendar} label="RDV à venir" value={stats.upcomingAppointments} accent="amber" />
        <StatsCard icon={CreditCard} label="Paiements encaissés" value={`${(stats.completedPaymentsTotal || 0).toLocaleString("fr-FR")} FCFA`} accent="green" />
        <StatsCard icon={Check} label="Contrats signés" value={stats.signedContracts} accent="purple" className="col-span-2 lg:col-span-1" />
      </div>

      {/* Chart + Upcoming */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h3 className="mb-4 font-head text-sm font-semibold text-adm-text">Tendances — 6 derniers mois</h3>
          {chartData.labels.length > 0 ? (
            <Chart data={chartData} options={{ plugins: { legend: { display: true, labels: { color: "#b8b0a0", boxWidth: 12, padding: 16 } } } }} />
          ) : (
            <p className="py-10 text-center text-sm text-adm-text-3">Pas encore de données.</p>
          )}
        </Card>

        <Card>
          <h3 className="mb-4 font-head text-sm font-semibold text-adm-text flex items-center gap-2">
            <Calendar size={16} /> Prochains RDV
          </h3>
          {(!upcomingAppointments || upcomingAppointments.length === 0) ? (
            <p className="text-sm text-adm-text-3">Aucun RDV à venir.</p>
          ) : (
            <div className="space-y-3">
              {upcomingAppointments.map((a) => (
                <div key={a.id} className="flex items-start gap-3 rounded-lg bg-adm-surface-2 px-3 py-2.5">
                  <div className="mt-0.5 rounded-md bg-adm-red/10 p-1.5 text-adm-red">
                    <Clock size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-adm-text">{a.client_name}</p>
                    <p className="text-xs text-adm-text-3">{a.date} · {a.time}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Recent activity */}
      <Card>
        <h3 className="mb-4 font-head text-sm font-semibold text-adm-text flex items-center gap-2">
          <Activity size={16} /> Activité récente
        </h3>
        {(!recentRequests || recentRequests.length === 0) ? (
          <p className="text-sm text-adm-text-3">Aucune activité.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-adm-border">
                  <th className="pb-2 text-xs font-medium uppercase text-adm-text-3">Client</th>
                  <th className="pb-2 text-xs font-medium uppercase text-adm-text-3">Type</th>
                  <th className="pb-2 text-xs font-medium uppercase text-adm-text-3">Statut</th>
                  <th className="pb-2 text-xs font-medium uppercase text-adm-text-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentRequests.map((r) => {
                  const st = REQUEST_STATUSES.find((s) => s.value === r.status) || REQUEST_STATUSES[0];
                  return (
                    <tr key={r.id} className="border-b border-adm-border last:border-0">
                      <td className="py-2.5 text-adm-text">{r.name}</td>
                      <td className="py-2.5 text-adm-text-2">{r.project_type || "—"}</td>
                      <td className="py-2.5"><Badge variant={st.color}>{st.label}</Badge></td>
                      <td className="py-2.5 text-xs text-adm-text-3 whitespace-nowrap">{r.created_at}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
