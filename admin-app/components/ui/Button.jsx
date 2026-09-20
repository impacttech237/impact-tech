import { LoadingSpinner } from "./LoadingSpinner";

const variants = {
  primary: "bg-adm-red text-white hover:bg-adm-red-dark",
  secondary: "bg-adm-surface-2 text-adm-text border border-adm-border-2 hover:bg-adm-surface-3",
  ghost: "bg-transparent text-adm-text-2 hover:bg-adm-surface-2 hover:text-adm-text",
  danger: "bg-transparent text-adm-red border border-adm-red/30 hover:bg-adm-red hover:text-white",
};

const sizes = {
  sm: "px-3 py-1.5 text-xs gap-1.5",
  md: "px-4 py-2 text-sm gap-2",
  lg: "px-5 py-2.5 text-base gap-2",
};

export function Button({ children, variant = "primary", size = "md", icon: Icon, loading, className = "", ...props }) {
  return (
    <button
      {...props}
      disabled={props.disabled || loading}
      className={`inline-flex items-center justify-center rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {loading ? <LoadingSpinner size={size === "sm" ? 14 : 16} /> : Icon && <Icon size={size === "sm" ? 14 : 16} />}
      {children}
    </button>
  );
}
