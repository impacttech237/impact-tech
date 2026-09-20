export function Checkbox({ label, checked, onChange }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-sm text-adm-text">
      <input
        type="checkbox"
        checked={!!checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-adm-border-2 bg-adm-surface-3 accent-adm-red"
      />
      {label}
    </label>
  );
}
