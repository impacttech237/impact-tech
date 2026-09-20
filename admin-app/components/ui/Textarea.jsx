export function Textarea({ label, className = "", ...props }) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-adm-text-3">{label}</span>}
      <textarea
        {...props}
        className={`w-full rounded-lg border border-adm-border-2 bg-adm-surface-3 px-3 py-2 text-sm text-adm-text placeholder-adm-text-3 outline-none transition-colors focus:border-adm-red focus:ring-1 focus:ring-adm-red min-h-[100px] ${className}`}
      />
    </label>
  );
}
