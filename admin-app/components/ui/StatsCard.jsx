export function StatsCard({ icon: Icon, label, value, trend, trendUp, className = "" }) {
  return (
    <div className={`rounded-xl border border-adm-border bg-adm-surface p-5 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="rounded-lg bg-adm-surface-2 p-2.5 text-adm-text-2">
          {Icon && <Icon size={20} />}
        </div>
        {trend && (
          <span className={`flex items-center gap-1 text-xs font-semibold ${trendUp ? "text-emerald-400" : "text-adm-red"}`}>
            {trendUp ? "↑" : "↓"} {trend}
          </span>
        )}
      </div>
      <p className="mt-4 font-head text-2xl font-bold text-adm-text">{value}</p>
      <p className="mt-1 text-sm text-adm-text-3">{label}</p>
    </div>
  );
}
