export function Select({ label, options = [], className = "", ...props }) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-adm-text-3">{label}</span>}
      <div className="relative">
        <select
          {...props}
          className={`w-full appearance-none rounded-lg border border-adm-border-2 bg-adm-surface-3 px-3 py-2 pr-8 text-sm text-adm-text outline-none transition-colors focus:border-adm-red focus:ring-1 focus:ring-adm-red ${className}`}
        >
          {options.map((o) => (
            <option key={typeof o === "string" ? o : o.value} value={typeof o === "string" ? o : o.value}>
              {typeof o === "string" ? o : o.label}
            </option>
          ))}
        </select>
        <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-adm-text-3" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
      </div>
    </label>
  );
}
