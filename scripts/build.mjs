/* ------------------------------------------------------------------
   Bundle des scripts client via esbuild — aucune dépendance à un
   framework/adaptateur : deux bundles indépendants.
   1) client/main.ts        -> public/client.js   (gsap + lenis, tout le site)
   2) admin-app/main.jsx     -> public/admin/bundle.js (React, dashboard admin)
------------------------------------------------------------------- */
import { build } from "esbuild";

await build({
  entryPoints: ["client/main.ts"],
  outfile: "public/client.js",
  bundle: true,
  format: "esm",
  target: "es2020",
  minify: true,
  sourcemap: false,
});

await build({
  entryPoints: ["admin-app/main.jsx"],
  outfile: "public/admin/bundle.js",
  bundle: true,
  format: "esm",
  target: "es2020",
  minify: true,
  sourcemap: false,
  jsx: "automatic",
  jsxImportSource: "react",
  // Le tsconfig.json racine impose jsxImportSource "hono/jsx" (pour src/, rendu serveur).
  // tsconfigRaw court-circuite la lecture du fichier disque pour CE build précis,
  // sinon esbuild applique le jsxImportSource du tsconfig.json même par-dessus l'option ci-dessus.
  tsconfigRaw: JSON.stringify({
    compilerOptions: { jsx: "react-jsx", jsxImportSource: "react" },
  }),
});

await build({
  entryPoints: ["client/survey.ts"],
  outfile: "public/survey.js",
  bundle: true,
  format: "esm",
  target: "es2020",
  minify: true,
  sourcemap: false,
});

await build({
  entryPoints: ["client/booking.ts"],
  outfile: "public/booking.js",
  bundle: true,
  format: "esm",
  target: "es2020",
  minify: true,
  sourcemap: false,
});

await build({
  entryPoints: ["client/portal.ts"],
  outfile: "public/portal.js",
  bundle: true,
  format: "esm",
  target: "es2020",
  minify: true,
  sourcemap: false,
});

console.log("Bundles client OK : public/client.js + public/admin/bundle.js + public/survey.js + public/booking.js + public/portal.js");
