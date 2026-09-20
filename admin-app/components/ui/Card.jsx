export function Card({ children, padding = "p-6", hover = false, className = "" }) {
  return (
    <div className={`rounded-xl border border-adm-border bg-adm-surface ${padding} ${hover ? "transition-transform hover:-translate-y-0.5" : ""} ${className}`}>
      {children}
    </div>
  );
}
