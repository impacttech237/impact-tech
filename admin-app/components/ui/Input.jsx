export function Input({ label, icon: Icon, suffix, className = "", ...props }) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-adm-text-3">{label}</span>}
      <div className="relative">
        {Icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-adm-text-3">
            <Icon size={16} />
          </span>
        )}
        <input
          {...props}
          className={`w-full rounded-lg border border-adm-border-2 bg-adm-surface-3 px-3 py-2 text-sm text-adm-text placeholder-adm-text-3 outline-none transition-colors focus:border-adm-red focus:ring-1 focus:ring-adm-red ${Icon ? "pl-9" : ""} ${suffix ? "pr-10" : ""} ${className}`}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-adm-text-3">{suffix}</span>
        )}
      </div>
    </label>
  );
}
