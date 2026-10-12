#!/usr/bin/env node
/* ------------------------------------------------------------------
   Questionnaires clients en ligne de commande (utilisé par Claude après
   un appel découverte).

     node scripts/questionnaire.mjs create questionnaires/malcom.json [--client <slug|id>] [--en] [--local]
     node scripts/questionnaire.mjs update <id|token> questionnaires/malcom.json [--local]
     node scripts/questionnaire.mjs list [--local]
     node scripts/questionnaire.mjs answers <id|token> [--local]

   Les définitions vivent dans questionnaires/*.json (dossier ignoré par
   Git : le dépôt est public et ces fichiers parlent de clients).
   Format : voir src/lib/questionnaires.ts.
------------------------------------------------------------------- */
import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { flattenFields, formatAnswer, normalizeDefinition } from "../src/lib/questionnaires.ts";

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

const sqlStr = (v) => (v == null ? "NULL" : `'${String(v).replace(/'/g, "''")}'`);

// wrangler appelé via node, sans shell : les arguments ne sont jamais réinterprétés.
const WRANGLER = join(process.cwd(), "node_modules", "wrangler", "bin", "wrangler.js");
function wrangler(extra) {
  const out = execFileSync(process.execPath, [WRANGLER, "d1", "execute", "impact-tech-db", target, ...persist, "--json", ...extra], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  const json = JSON.parse(out.slice(out.indexOf("[")));
  return json.flatMap((r) => r.results || []);
}

// Écritures (longues) : via un fichier temporaire.
function d1(sql) {
  const dir = mkdtempSync(join(tmpdir(), "q-"));
  const file = join(dir, "q.sql");
  writeFileSync(file, sql, "utf8");
  return wrangler([`--file=${file}`]);
}

// Lectures : --command, seul mode où wrangler renvoie les lignes (--file ne renvoie que des statistiques).
const d1Query = (sql) => wrangler([`--command=${sql.replace(/\s+/g, " ")}`]);

if (cmd === "create") {
  const file = args[1];
  if (!file) throw new Error("Usage : create <fichier.json> [--client slug] [--en] [--local]");
  const def = normalizeDefinition(JSON.parse(readFileSync(file, "utf8")));
  let clientId = null;
  let projectId = null;
  const client = opt("client");
  if (client) {
    const rows = d1Query(/^\d+$/.test(client) ? `SELECT id, name FROM clients WHERE id = ${parseInt(client, 10)}` : `SELECT id, name FROM clients WHERE slug = ${sqlStr(client)}`);
    if (!rows.length || !rows[0].id) throw new Error(`Client « ${client} » introuvable`);
    clientId = rows[0].id;
    // Rattache au projet actif le plus récent du client (visible dans l'onglet Questionnaires du projet).
    const [proj] = d1Query(`SELECT id, title FROM client_projects WHERE client_id = ${clientId} ORDER BY (status = 'actif') DESC, id DESC LIMIT 1`);
    projectId = proj?.id ?? null;
    console.log(`Client : ${rows[0].name}${proj ? ` — projet : ${proj.title}` : ""}`);
  }
  const token = randomBytes(16).toString("hex");
  const now = new Date().toISOString();
  d1(
    `INSERT INTO questionnaires (token, title, client_id, project_id, definition, status, locale, created_at, updated_at)
     VALUES (${sqlStr(token)}, ${sqlStr(def.title)}, ${clientId ?? "NULL"}, ${projectId ?? "NULL"}, ${sqlStr(JSON.stringify(def))}, 'sent', ${sqlStr(flag("en") ? "en" : "fr")}, ${sqlStr(now)}, ${sqlStr(now)});`
  );
  const fields = flattenFields(def).length;
  console.log(`Questionnaire créé : ${def.title} (${def.sections.length} sections, ${fields} champs)`);
  console.log(`Lien à envoyer : ${flag("local") ? "http://localhost:8799" : SITE}/q/${token}`);
} else if (cmd === "update") {
  // Remplace la définition sans changer le lien (les réponses déjà saisies sont conservées par identifiant de champ).
  const [key, file] = [args[1], args[2]];
  if (!key || !file) throw new Error("Usage : update <id|token> <fichier.json> [--local]");
  const def = normalizeDefinition(JSON.parse(readFileSync(file, "utf8")));
  const where = /^\d+$/.test(key) ? `id = ${parseInt(key, 10)}` : `token = ${sqlStr(key)}`;
  const [q] = d1Query(`SELECT id, token FROM questionnaires WHERE ${where}`);
  if (!q?.id) throw new Error("Questionnaire introuvable");
  d1(`UPDATE questionnaires SET title = ${sqlStr(def.title)}, definition = ${sqlStr(JSON.stringify(def))}, updated_at = ${sqlStr(new Date().toISOString())} WHERE id = ${q.id};`);
  console.log(`Questionnaire #${q.id} mis à jour : ${def.title} (${def.sections.length} sections, ${flattenFields(def).length} champs)`);
  console.log(`Lien inchangé : ${flag("local") ? "http://localhost:8799" : SITE}/q/${q.token}`);
} else if (cmd === "list") {
  const rows = d1Query(
    `SELECT q.id, q.title, q.status, q.token, c.name AS client, r.filled, r.total, r.updated_at FROM questionnaires q
     LEFT JOIN clients c ON c.id = q.client_id LEFT JOIN questionnaire_responses r ON r.questionnaire_id = q.id ORDER BY q.id DESC`
  );
  for (const r of rows) console.log(`#${r.id}  ${r.title}  [${r.status}]  ${r.client || "sans client"}  ${r.total ? `${r.filled}/${r.total}` : "0 réponse"}  ${SITE}/q/${r.token}`);
} else if (cmd === "answers") {
  const key = args[1];
  const where = /^\d+$/.test(key) ? `q.id = ${parseInt(key, 10)}` : `q.token = ${sqlStr(key)}`;
  const [q] = d1Query(`SELECT q.title, q.definition, q.status, r.answers, r.updated_at FROM questionnaires q LEFT JOIN questionnaire_responses r ON r.questionnaire_id = q.id WHERE ${where}`);
  if (!q) throw new Error("Questionnaire introuvable");
  const def = normalizeDefinition(q.definition);
  const answers = q.answers ? JSON.parse(q.answers) : {};
  console.log(`# ${q.title} — ${q.status}${q.updated_at ? ` (modifié ${q.updated_at})` : ""}\n`);
  let section = "";
  let group = "";
  for (const f of flattenFields(def)) {
    if (f.section !== section) {
      section = f.section;
      group = "";
      console.log(`\n## ${section}`);
    }
    if (f.group && f.group !== group) {
      group = f.group;
      console.log(`\n### ${group}`);
    }
    console.log(`- ${f.label} : ${formatAnswer(answers[f.key]) || "—"}`);
  }
} else {
  console.log("Commandes : create <fichier.json> [--client slug] [--en] [--local] | update <id|token> <fichier.json> | list | answers <id|token>");
}
