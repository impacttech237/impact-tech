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
});

console.log("Bundles client OK : public/client.js + public/admin/bundle.js");
