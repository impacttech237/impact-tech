const colors = {
  default: "bg-adm-surface-2 text-adm-text-2",
  success: "bg-emerald-500/12 text-emerald-400",
  warning: "bg-amber-500/12 text-amber-400",
  danger: "bg-adm-red/12 text-adm-red",
  info: "bg-blue-500/12 text-blue-400",
};

export function Badge({ children, variant = "default", className = "" }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${colors[variant]} ${className}`}>
      {children}
    </span>
  );
}
