import { Button } from "./Button";

export function EmptyState({ icon: Icon, message, actionLabel, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-adm-border bg-adm-surface py-12 px-6 text-center">
      {Icon && (
        <div className="mb-4 rounded-full bg-adm-surface-2 p-4 text-adm-text-3">
          <Icon size={28} />
        </div>
      )}
      <p className="text-sm text-adm-text-3">{message}</p>
      {actionLabel && onAction && (
        <Button className="mt-4" size="sm" onClick={onAction}>{actionLabel}</Button>
      )}
    </div>
  );
}
