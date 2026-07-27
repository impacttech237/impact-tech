/* Génère db/seed-d1.sql : importe le contenu DEFAULTS (+ articles enrichis)
   dans les tables D1, avec le MÊME mapping de champs que src/lib/content.ts.
   Usage: node scripts/gen-seed.mjs  puis  wrangler d1 execute ... --file db/seed-d1.sql
   Note: offers et settings ne sont PAS régénérés (déjà présents en base). */
import esbuild from "esbuild";
import { writeFileSync, rmSync } from "fs";
import path from "path";

const entry = `
import { DEFAULTS } from "../src/lib/defaults.js";
import { hydrateArticle } from "../src/lib/articles.ts";
export function getData() {
  return { DEFAULTS, posts: DEFAULTS.posts.map((p, i) => ({ ...hydrateArticle(p), _i: i })) };
}
`;
const tmpEntry = path.resolve("scripts/_seed-entry.mjs");
const tmpBundle = path.resolve("scripts/_seed-bundle.mjs");
writeFileSync(tmpEntry, entry);
const res = await esbuild.build({ entryPoints: [tmpEntry], bundle: true, format: "esm", platform: "node", write: false });
writeFileSync(tmpBundle, res.outputFiles[0].text);
const { getData } = await import("file://" + tmpBundle);
const { DEFAULTS, posts } = getData();

const q = (v) => `'${String(v ?? "").replace(/'/g, "''")}'`;
const j = (v) => q(JSON.stringify(v ?? []));
const n = (v) => Number(v || 0);

let sql = "-- Généré par scripts/gen-seed.mjs — ne pas éditer à la main.\n";

function block(table, cols, rows) {
  sql += `\nDELETE FROM ${table};\n`;
  sql += `INSERT INTO ${table} (${cols.join(", ")}) VALUES\n`;
  sql += rows.join(",\n") + ";\n";
}

// services
block("services",
  ["slug","tag","title","short_desc","headline","accent","description","features","ideal","price","delay","image","sort_order","active"],
  DEFAULTS.services.map((s, i) =>
    `(${q(s.slug)}, ${q(s.tag)}, ${q(s.title)}, ${q(s.shortDesc)}, ${q(s.headline)}, ${q(s.accent)}, ${q(s.description)}, ${j(s.features)}, ${q(s.ideal)}, ${q(s.price)}, ${q(s.delay)}, ${q(s.image)}, ${i}, 1)`));

// projects
block("projects",
  ["title","category","description","result","image","sort_order","active"],
  DEFAULTS.projects.map((p, i) =>
    `(${q(p.title)}, ${q(p.category)}, ${q(p.description)}, ${q(p.result)}, ${q(p.image)}, ${i}, 1)`));

// testimonials
block("testimonials",
  ["name","role","text","initials","sort_order","active"],
  DEFAULTS.testimonials.map((t, i) =>
    `(${q(t.name)}, ${q(t.role)}, ${q(t.text)}, ${q(t.initials)}, ${i}, 1)`));

// stats
block("stats",
  ["value","suffix","label","note","sort_order","active"],
  DEFAULTS.stats.map((s, i) =>
    `(${n(s.value)}, ${q(s.suffix)}, ${q(s.label)}, ${q(s.note)}, ${i}, 1)`));

// faqs
block("faqs",
  ["question","answer","sort_order","active"],
  DEFAULTS.faqs.map((f, i) =>
    `(${q(f.q)}, ${q(f.a)}, ${i}, 1)`));

// process_steps
block("process_steps",
  ["num","title","description","sort_order","active"],
  DEFAULTS.processSteps.map((p, i) =>
    `(${q(p.num)}, ${q(p.title)}, ${q(p.description)}, ${i}, 1)`));

// posts (contenu enrichi via hydrateArticle)
block("posts",
  ["title","category","date","read_time","excerpt","image","featured","sort_order","active","eyebrow","lead","secondary_image","author","sections"],
  posts.map((a) =>
    `(${q(a.title)}, ${q(a.category)}, ${q(a.date)}, ${q(a.readTime)}, ${q(a.excerpt)}, ${q(a.image)}, ${a.featured ? 1 : 0}, ${a._i}, 1, ${q(a.eyebrow)}, ${q(a.lead)}, ${q(a.secondaryImage)}, ${q(a.author)}, ${j(a.sections)})`));

writeFileSync(path.resolve("db/seed-d1.sql"), sql);
rmSync(tmpEntry); rmSync(tmpBundle);
console.log("db/seed-d1.sql généré :", sql.length, "octets");
