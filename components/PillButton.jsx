import ArrowIcon from "./ArrowIcon";

/* ------------------------------------------------------------------
   PillButton — bouton pill avec cercle-flèche animé au hover
   variant : "dark" | "cream" | "outline"
------------------------------------------------------------------- */
export default function PillButton({
  href = "#",
  children,
  variant = "dark",
  className = "",
  ...rest
}) {
  return (
    <a href={href} className={`btn-pill btn-pill--${variant} ${className}`} {...rest}>
      <span>{children}</span>
      <span className="btn-pill__circle" aria-hidden="true">
        <ArrowIcon />
        <ArrowIcon />
      </span>
    </a>
  );
}
