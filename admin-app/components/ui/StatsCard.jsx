export function StatsCard({ icon: Icon, label, value, trend, trendUp, accent = "red", className = "" }) {
  const accents = {
    red: "bg-adm-red/12 text-adm-red",
    green: "bg-emerald-500/12 text-emerald-400",
    blue: "bg-blue-500/12 text-blue-400",
    amber: "bg-amber-500/12 text-amber-400",
    purple: "bg-purple-500/12 text-purple-400",
  };
  return (
    <div className={`group rounded-xl border border-adm-border bg-adm-surface p-5 transition-all duration-200 hover:border-adm-border-2 hover:bg-adm-surface/80 ${className}`}>
      <div className="flex items-start justify-between">
        <div className={`rounded-lg p-2.5 ${accents[accent] || accents.red}`}>
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
