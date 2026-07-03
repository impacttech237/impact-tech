/* Flèche diagonale (↗) utilisée dans les boutons pill. */
export default function ArrowIcon(props) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M3.5 12.5 12.5 3.5M5.5 3.5h7v7" />
    </svg>
  );
}
