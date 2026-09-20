/**
 * IMPACT TECH — Tailwind config
 * Les tokens sont mappés sur les variables CSS déclarées dans
 * src/styles.css.tailwind-input (source : token.css design-system).
 */
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{ts,tsx}", "./admin-app/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        red: { DEFAULT: "#C0202B", dark: "#96131B", soft: "rgba(192,32,43,.1)" },
        cream: { DEFAULT: "#F7EFD9", soft: "#FBF6EA" },
        ink: "#1A1A17",
        body: "#5E5E5E",
        graylight: "#B4B4B4",
        line: "#F0EDE6",
        black: "#0E0E0C",
        adm: {
          bg: "#0e0e0c",
          surface: "#161614",
          "surface-2": "#1e1e1b",
          "surface-3": "#262622",
          border: "#2a2a26",
          "border-2": "#3a3a35",
          text: "#f7efd9",
          "text-2": "#b8b0a0",
          "text-3": "#7a7568",
          red: "#C0202B",
          "red-dark": "#96131B",
        },
      },
      fontFamily: {
        head: ["var(--f-head)"],
        body: ["var(--f-body)"],
        accent: ["var(--f-accent)"],
      },
      borderRadius: {
        btn: "10px",
        card: "20px",
        lg2: "30px",
        pill: "100px",
      },
      boxShadow: {
        sm2: "0 4px 12px rgba(26,26,23,.06)",
        md2: "0 10px 40px rgba(26,26,23,.10)",
        header: "0 6px 30px rgba(26,26,23,.08)",
      },
      transitionTimingFunction: {
        move: "cubic-bezier(0.2,0,0,1)",
      },
      maxWidth: {
        container: "1460px",
      },
    },
  },
  plugins: [],
};
