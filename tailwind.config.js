/**
 * IMPACT TECH — Tailwind config
 * Les tokens sont mappés sur les variables CSS déclarées dans app/globals.css
 * (source : token.css / design-system.md fournis par le client).
 */
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Marque
        red: { DEFAULT: "#C0202B", dark: "#96131B", soft: "rgba(192,32,43,.1)" },
        cream: { DEFAULT: "#F7EFD9", soft: "#FBF6EA" },
        // Neutres
        ink: "#1A1A17",
        body: "#5E5E5E",
        graylight: "#B4B4B4",
        line: "#F0EDE6",
        black: "#0E0E0C",
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
