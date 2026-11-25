// Build : valide les données, puis prépare dist/ (site + données + service worker).
// Usage : node scripts/build.mjs
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { charger, valider, racine } from './valider.mjs';

const donnees = charger();
const { erreurs, avertissements } = valider(donnees);
const { textes, faits, themes, acteurs } = donnees;

const par = (arr, f) => arr.reduce((o, x) => { const k = f(x); o[k] = (o[k] || 0) + 1; return o; }, {});
const groupes = {};
for (const a of avertissements) (groupes[a.code] ||= []).push(a.msg);

console.log(`Textes : ${textes.length}   Faits : ${faits.length}   Acteurs : ${acteurs.length}   Thèmes : ${themes.length}`);
console.log('Faits par type :', par(faits, f => f.type));
console.log('Confiance des textes :', par(textes, t => t.confiance), '  Statuts :', par(textes, t => t.statut));

if (avertissements.length) {
  console.log(`\n${avertissements.length} avertissement(s) :`);
  for (const [code, msgs] of Object.entries(groupes)) {
    console.log(`  [${code}] ${msgs.length}`);
    for (const m of msgs.slice(0, 4)) console.log('     ' + m);
    if (msgs.length > 4) console.log(`     … ${msgs.length - 4} autre(s)`);
  }
}
if (erreurs.length) {
  console.error(`\n${erreurs.length} ERREUR(S) — build arrêté :`);
  for (const e of erreurs.slice(0, 40)) console.error(`  [${e.code}] ${e.msg}`);
  if (erreurs.length > 40) console.error(`  … ${erreurs.length - 40} autre(s)`);
  process.exit(1);
}

const dist = path.join(racine, 'dist');
fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(path.join(dist, 'data', 'contenu'), { recursive: true });
const ecrire = (f, o) => fs.writeFileSync(path.join(dist, f), typeof o === 'string' ? o : JSON.stringify(o));

// 1. Site statique
const copier = (de, vers) => {
  fs.mkdirSync(vers, { recursive: true });
  for (const e of fs.readdirSync(de, { withFileTypes: true })) {
    const s = path.join(de, e.name), d = path.join(vers, e.name);
    if (e.isDirectory()) copier(s, d); else fs.copyFileSync(s, d);
  }
};
copier(path.join(racine, 'site'), dist);

// 2. Données du site
const nbFaits = (id, type) => faits.filter(f => f.texte === id && (!type || f.type === type)).length;
const index = {
  textes: textes.map(t => ({
    id: t.id, ordre: t.ordre, type: t.type, organisme: t.organisme, numero: t.numero, titre: t.titre, theme: t.theme,
    date_texte: t.date_texte, date_adoption: t.date_adoption, statut: t.statut, statut_source: t.statut_source,
    abroge: t.abroge, abroge_par: t.abroge_par, modifie: t.modifie.map(m => ({ texte: m.texte, articles: m.articles })),
    modifie_par: t.modifie_par, abroge_externes: (t.abroge_externes || []).map(x => x.reference),
    couverture: t.couverture, confiance: t.confiance, url: t.source?.url_officielle || null,
    n: { delai: nbFaits(t.id, 'delai'), montant: nbFaits(t.id, 'montant'), role: nbFaits(t.id, 'role'), definition: nbFaits(t.id, 'definition'), piege: nbFaits(t.id, 'piege'), liste: nbFaits(t.id, 'liste') },
  })),
  themes, acteurs: acteurs.map(a => ({ id: a.id, nom: a.nom })),
};
const compact = faits.map(f => {
  const o = { id: f.id, t: f.texte, y: f.type, q: f.enonce, v: f.valeur_texte, h: f.themes?.[0] };
  if (f.article) o.a = f.article; if (f.note) o.n = f.note; if (f.items) o.i = f.items; if (f.acteurs?.length) o.c = f.acteurs;
  if (f.type_valeur === 'nombre') { o.x = f.valeur; o.u = f.unite; }
  return o;
});
const retenir = [];
for (const t of textes) {
  const contenu = t.contenu || {};
  ecrire(`data/contenu/${t.id}.json`, { objet: contenu.objet, essentiel: contenu.essentiel, retenir: contenu.retenir || [], listes: contenu.listes || [], pieges: contenu.pieges || [], qr: contenu.qr || [], origine: t.source?.origine || null });
  (contenu.retenir || []).forEach((x, i) => retenir.push({ t: t.id, i, x }));
}
const empreinte = crypto.createHash('sha1').update(JSON.stringify([index, compact, retenir])).digest('hex').slice(0, 10);
index.version = empreinte;
index.genere_le = new Date().toISOString().slice(0, 10);
index.stats = { textes: textes.length, faits: faits.length, a_verifier: textes.filter(t => t.confiance !== 'verifie').length };
ecrire('data/index.json', index);
ecrire('data/faits.json', compact);
ecrire('data/retenir.json', retenir);

// 3. Service worker (cache hors ligne versionné)
const liste = [];
const parcourir = d => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) parcourir(p); else liste.push('/' + path.relative(dist, p).replace(/\\/g, '/')); } };
parcourir(dist);
const fichiers = liste.filter(f => f !== '/sw.js').sort();
const h = crypto.createHash('sha1');
for (const f of fichiers) { h.update(f); h.update(fs.readFileSync(path.join(dist, f))); }
const versionSw = h.digest('hex').slice(0, 10);
const sw = fs.readFileSync(path.join(dist, 'sw.js'), 'utf8').replace('__VERSION__', versionSw).replace('__FICHIERS__', JSON.stringify(['/', ...fichiers]));
ecrire('sw.js', sw);

// 4. Rapport de relecture
const lignes = textes.slice().sort((a, b) => nbFaits(b.id) - nbFaits(a.id)).map(t => {
  const n = nbFaits(t.id);
  return `| ${t.id} | ${t.type} ${t.numero} | ${t.date_adoption || t.date_texte} | ${t.statut}${t.statut_source === 'non_verifie' ? ' (non vérifié)' : t.statut_source === 'deduit' ? ' (déduit)' : ''} | ${t.couverture} | ${n} | ${n} |`;
});
const md = `# Rapport de relecture

Textes : ${textes.length} · Faits : ${faits.length} · Faits à vérifier : ${faits.filter(f => f.confiance !== 'verifie').length}

| Texte | Référence | Date | Statut | Couverture | Faits | À vérifier |
|---|---|---|---|---|---|---|
${lignes.join('\n')}
`;
fs.writeFileSync(path.join(racine, 'rapport-relecture.md'), md); // interne : hors de dist/ (non publié)

const taille = d => { let n = 0; const p = x => { for (const e of fs.readdirSync(x, { withFileTypes: true })) { const f = path.join(x, e.name); e.isDirectory() ? p(f) : n += fs.statSync(f).size; } }; p(d); return n; };
console.log(`\nBuild OK (version ${empreinte}) -> dist/ : ${fichiers.length} fichiers, ${(taille(dist) / 1024).toFixed(0)} Ko`);
