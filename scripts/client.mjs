#!/usr/bin/env node
/* ------------------------------------------------------------------
   Clients du portail en ligne de commande (utilisé par Claude au
   démarrage d'un projet, voir le skill « nouveau-client »).

     node scripts/client.mjs create --name "Malcom Ebassa" --company "Airgé" --phone "+237 6XX XX XX XX"
          [--email x@y.cm] [--pack "Impact Sur Mesure"] [--title "Projet sur mesure — Airgé"]
          [--notes "Notes internes"] [--amount 500000] [--en] [--local]
     node scripts/client.mjs list [--local]
     node scripts/client.mjs packs

   Réutilise le code du site (src/lib/portal/projects.ts) : le projet est
   créé depuis le modèle de son pack (étapes, échéances, « ce qu'on attend
   de vous »), exactement comme le bouton de l'admin.
------------------------------------------------------------------- */
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

const SITE = "https://impacttech237.com";
const args = process.argv.slice(2);
const cmd = args[0];
const flag = (name) => args.includes(`--${name}`);
const opt = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const target = flag("local") ? "--local" : "--remote";
const persist = flag("local") && process.env.Q_PERSIST ? [`--persist-to=${process.env.Q_PERSIST}`] : [];

/* ── D1 via wrangler, avec la même interface que dans le Worker ── */
const WRANGLER = join(process.cwd(), "node_modules", "wrangler", "bin", "wrangler.js");
function wrangler(extra) {
  const out = execFileSync(process.execPath, [WRANGLER, "d1", "execute", "impact-tech-db", target, ...persist, "--json", ...extra], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  return JSON.parse(out.slice(out.indexOf("[")));
}
const lit = (v) => (v == null ? "NULL" : typeof v === "number" ? String(v) : typeof v === "boolean" ? (v ? "1" : "0") : `'${String(v).replace(/'/g, "''")}'`);
function inline(sql, params) {
  let i = 0;
  return sql.replace(/\?/g, () => lit(params[i++])).replace(/\s+/g, " ").trim();
}
const db = {
  prepare(sql) {
    const stmt = (params) => ({
      sql: inline(sql, params),
      bind: (...p) => stmt(p),
      async all() {
        return { results: wrangler([`--command=${this.sql}`])[0]?.results || [] };
      },
      async first() {
        return (await this.all()).results[0] || null;
      },
      async run() {
        // wrangler ne renvoie pas toujours last_row_id (en local notamment) : RETURNING id le donne partout.
        const insert = /^INSERT\b/i.test(this.sql) && !/\bRETURNING\b/i.test(this.sql);
        const r = wrangler([`--command=${this.sql}${insert ? " RETURNING id" : ""}`])[0] || {};
        const meta = { ...(r.meta || {}) };
        if (insert && r.results?.[0]?.id) meta.last_row_id = r.results[0].id;
        return { meta, success: r.success };
      },
    });
    return stmt([]);
  },
  // Écritures groupées : un seul fichier SQL.
  async batch(stmts) {
    const dir = mkdtempSync(join(tmpdir(), "client-"));
    const file = join(dir, "batch.sql");
    writeFileSync(file, stmts.map((s) => s.sql).join(";\n") + ";\n", "utf8");
    wrangler([`--file=${file}`]);
    return [];
  },
};

/* Code du site, empaqueté à la volée (les imports TypeScript sans extension). */
async function siteLib() {
  const dir = mkdtempSync(join(tmpdir(), "client-lib-"));
  const entry = join(dir, "entry.ts");
  const root = process.cwd().replace(/\\/g, "/");
  writeFileSync(
    entry,
    `export { createProjectFromTemplate, getTemplates } from "${root}/src/lib/portal/projects";
     export { uniqueClientSlug, referralCode, nowIso, clampText, logActivity } from "${root}/src/lib/portal/util";
     export { generateAccessToken } from "${root}/src/lib/portal-auth";`
  );
  const outfile = join(dir, "lib.mjs");
  await build({ entryPoints: [entry], bundle: true, format: "esm", platform: "node", outfile, logLevel: "error" });
  return import(pathToFileURL(outfile).href);
}

if (cmd === "create") {
  const lib = await siteLib();
  const name = lib.clampText(opt("name"), 200);
  const email = lib.clampText(opt("email"), 200).toLowerCase();
  const phone = lib.clampText(opt("phone"), 50);
  const company = lib.clampText(opt("company"), 200);
  if (!name) throw new Error("--name est obligatoire (nom du responsable)");
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Email invalide");
  if (!email && !phone) throw new Error("Indiquez au moins --phone ou --email");

  const existing = await db
    .prepare("SELECT id, name, company, slug FROM clients WHERE (company = ? AND ? != '') OR (phone = ? AND ? != '') OR (email = ? AND ? != '')")
    .bind(company, company, phone, phone, email, email)
    .first();
  if (existing && !flag("force")) throw new Error(`Ce client existe déjà : #${existing.id} ${existing.name} (${existing.company || "—"}) → ${SITE}/espace/${existing.slug}. Ajoutez --force pour en créer un autre.`);

  const slug = await lib.uniqueClientSlug(db, opt("slug") || company || name);
  let ref = lib.referralCode();
  if (await db.prepare("SELECT id FROM clients WHERE referral_code = ?").bind(ref).first()) ref = lib.referralCode() + lib.referralCode().slice(0, 2);
  await db
    .prepare(
      `INSERT INTO clients (name, email, phone, company, access_token, slug, locale, referral_code, internal_notes, active, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`
    )
    .bind(name, email, phone || null, company || null, lib.generateAccessToken(), slug, flag("en") ? "en" : "fr", ref, opt("notes") || null, lib.nowIso())
    .run();
  const client = await db.prepare("SELECT * FROM clients WHERE slug = ?").bind(slug).first();
  if (!client?.id) throw new Error("Client non retrouvé après création");
  await lib.logActivity(db, { clientId: client.id, actor: "admin", action: "client_created", detail: name, visible: false });

  const pack = opt("pack") || "Impact Sur Mesure";
  const amount = opt("amount") ? parseInt(opt("amount"), 10) : null;
  const tpl = (await lib.getTemplates(db)).find((t) => t.pack === pack);
  if (!tpl) throw new Error(`Pack « ${pack} » inconnu (voir : node scripts/client.mjs packs)`);
  const title = opt("title") || `${tpl.title} — ${company || name}`;
  const { projectId, template } = await lib.createProjectFromTemplate(db, { clientId: client.id, title, pack, amount });
  const project = projectId ? { id: projectId } : await db.prepare("SELECT id FROM client_projects WHERE client_id = ? ORDER BY id DESC").bind(client.id).first();
  await lib.logActivity(db, { projectId: project?.id, clientId: client.id, actor: "admin", action: "project_created", detail: title, visible: false });

  const first = name.split(" ")[0];
  console.log(`Client #${client.id} créé : ${name}${company ? ` (${company})` : ""}`);
  console.log(`Projet #${project?.id ?? "?"} : ${title} — modèle « ${template?.pack || pack} »`);
  console.log(`Espace client : ${SITE}/espace/${slug}`);
  console.log(`Message à envoyer :\nBonjour ${first}, voici votre espace client Impact Tech : ${SITE}/espace/${slug}\nVous y suivrez votre projet, nous enverrez vos fichiers et signerez vos documents.`);
  console.log(`Connexion : ${email ? "le client reçoit son code par email" : "pas d'email → générer un code dans l'admin (Portail Client → Clients → Générer un code)"}`);
} else if (cmd === "list") {
  const { results } = await db
    .prepare(
      `SELECT c.id, c.name, c.company, c.slug, c.phone, c.email,
              (SELECT title || ' [' || status || ']' FROM client_projects p WHERE p.client_id = c.id ORDER BY p.id DESC LIMIT 1) AS projet
       FROM clients c ORDER BY c.id`
    )
    .all();
  for (const c of results) console.log(`#${c.id}  ${c.company || c.name}  (${c.name})  ${c.phone || ""} ${c.email || ""}  ${SITE}/espace/${c.slug}  — ${c.projet || "aucun projet"}`);
} else if (cmd === "packs") {
  const lib = await siteLib();
  const tpls = await lib.getTemplates(db);
  for (const t of tpls) console.log(`« ${t.pack} » — ${t.title} : ${t.steps.length} étapes, ${t.checklist.length} éléments attendus, ${t.delay_days ? `${t.delay_days} j` : "délai selon étapes"}`);
} else {
  console.log("Commandes : create --name … --company … --phone … [--email] [--pack] [--title] [--notes] [--amount] [--en] [--local] [--force] | list | packs");
}
