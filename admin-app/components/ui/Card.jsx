export function Card({ children, padding = "p-6", hover = false, className = "" }) {
  return (
    <div className={`rounded-xl border border-adm-border bg-adm-surface ${padding} transition-colors duration-200 hover:border-adm-border-2 ${hover ? "hover:-translate-y-0.5 transition-all" : ""} ${className}`}>
      {children}
    </div>
  );
}
