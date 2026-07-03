/* ------------------------------------------------------------------
   Web App Manifest — PWA basique (icône écran d'accueil mobile)
------------------------------------------------------------------- */
export default function manifest() {
  return {
    name: "IMPACT TECH — Agence web au Cameroun",
    short_name: "IMPACT TECH",
    description:
      "Sites, applications et solutions digitales à prix accessible, depuis le Cameroun.",
    start_url: "/",
    display: "standalone",
    background_color: "#0E0E0C",
    theme_color: "#C0202B",
    icons: [
      {
        src: "/icon-square.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
