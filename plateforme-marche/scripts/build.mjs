// Build : valide les données, puis prépare dist/ (site + données + service worker).
// Usage : node scripts/build.mjs
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { charger, valider, racine } from './valider.mjs';
import { genererPages } from './pages-textes.mjs';
import { preparerPdf } from './pdf.mjs';

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
// Guides « Découvrir » et « Comprendre » : chaque fait cité doit exister et venir d'un texte en vigueur
const guides = JSON.parse(fs.readFileSync(path.join(racine, 'data', 'guides.json'), 'utf8')).sort((a, b) => a.porte.localeCompare(b.porte) || a.ordre - b.ordre);
{ const idsFaits = new Map(faits.map(f => [f.id, f])); const st = new Map(textes.map(t => [t.id, t.statut]));
  for (const g of guides) for (const b of g.blocs) for (const id of b.faits || []) {
    if (!idsFaits.has(id)) erreurs.push({ code: 'G1', msg: `guide ${g.id} : fait inconnu ${id}` });
    else if (st.get(idsFaits.get(id).texte) === 'abroge') erreurs.push({ code: 'G2', msg: `guide ${g.id} : ${id} vient d'un texte abrogé` }); } }
console.log(`Guides : ${guides.length} chapitres`);
if (erreurs.length) {
  console.error(`\n${erreurs.length} ERREUR(S) — build arrêté :`);
  for (const e of erreurs.slice(0, 40)) console.error(`  [${e.code}] ${e.msg}`);
  if (erreurs.length > 40) console.error(`  … ${erreurs.length - 40} autre(s)`);
  process.exit(1);
}

const dist = path.join(racine, 'dist');
fs.rmSync(dist, { recursive: true, force: true, maxRetries: 20, retryDelay: 500 });
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

// 1 bis. PDF officiels
const pdf = preparerPdf({ dist, racine });
console.log(`PDF : ${Object.keys(pdf.taille).length} disponibles${pdf.manquants.length ? ', ABSENTS : ' + pdf.manquants.join(', ') : ''}`);

// 2. Données du site
const nbFaits = (id, type) => faits.filter(f => f.texte === id && (!type || f.type === type)).length;
const index = {
  textes: textes.map(t => ({
    id: t.id, ordre: t.ordre, type: t.type, organisme: t.organisme, numero: t.numero, titre: t.titre, theme: t.theme,
    date_texte: t.date_texte, date_adoption: t.date_adoption, statut: t.statut, statut_source: t.statut_source,
    abroge: t.abroge, abroge_par: t.abroge_par, modifie: t.modifie.map(m => ({ texte: m.texte, articles: m.articles })),
    modifie_par: t.modifie_par, abroge_externes: (t.abroge_externes || []).map(x => x.reference),
    couverture: t.couverture, confiance: t.confiance, url: t.source?.url_officielle || null, pdf: pdf.taille[t.id] || 0,
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
ecrire('data/guides.json', guides);
ecrire('data/retenir.json', retenir);

// Cours (repris d'Excellence COSUMAF) : data/cours/*.json -> dist/data/cours/<id>.json + dist/data/cours.json (index)
{
  const ordre = ['p0-cadre', 'p1-entrer-en-bourse', 'p2-appel-public', 'p3-placement-prive', 'p4-vie-du-titre', 'p5-ordre-denouement', 'p6-intermediaires', 'p7-fonds', 'p8-conformite-sanctions', 'p9-reperes', 'epreuves'];
  const liens = JSON.parse(fs.readFileSync(path.join(racine, 'data', 'cours-textes.json'), 'utf8'));
  fs.mkdirSync(path.join(dist, 'data', 'cours'), { recursive: true });
  const somme = (p, k) => p.chapitres.reduce((n, c) => n + (c[k] || []).length, 0);
  const idx = ordre.map(id => {
    const p = JSON.parse(fs.readFileSync(path.join(racine, 'data', 'cours', id + '.json'), 'utf8'));
    fs.writeFileSync(path.join(dist, 'data', 'cours', id + '.json'), JSON.stringify(p));
    const themes = liens[id] || [];
    return { id, titre: p.titre, court: p.court, couleur: p.couleur, description: p.description, themes,
      textes: themes.length ? textes.filter(t => themes.includes(t.theme)).map(t => t.id) : [],
      chapitres: p.chapitres.map(c => ({ id: c.id, titre: c.titre, niveau: c.niveau })),
      n: { fiches: somme(p, 'fiches'), cartes: somme(p, 'cartes'), questions: somme(p, 'questions'), schemas: somme(p, 'schemas'), definitions: somme(p, 'definitions'), exercices: somme(p, 'trous') + somme(p, 'classer') + somme(p, 'ordre') } };
  });
  fs.writeFileSync(path.join(dist, 'data', 'cours.json'), JSON.stringify(idx));
  console.log(`Cours : ${idx.length} (${idx.reduce((n, c) => n + c.n.fiches, 0)} fiches, ${idx.reduce((n, c) => n + c.n.cartes, 0)} cartes, ${idx.reduce((n, c) => n + c.n.questions, 0)} questions)`);
}

// 2 bis. Pages statiques par texte (référencement) ; LANCEMENT=1 et SITE_URL pour la mise en ligne publique
const siteUrl = (process.env.SITE_URL || 'https://marche-cemac-preview.impacttech237.workers.dev').replace(/\/$/, '');
const nbPages = genererPages({ dist, racine, textes, faits, siteUrl, lancement: process.env.LANCEMENT === '1', pdf: pdf.taille, guides });
console.log(`Pages statiques : ${nbPages} (indexation ${process.env.LANCEMENT === '1' ? 'OUVERTE' : 'fermée : préversion'}, ${siteUrl})`);

// 3. Service worker (cache hors ligne versionné)
const liste = [];
const parcourir = d => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) parcourir(p); else liste.push('/' + path.relative(dist, p).replace(/\\/g, '/')); } };
parcourir(dist);
const fichiers = liste.filter(f => f !== '/sw.js' && !f.startsWith('/textes/') && !f.startsWith('/decouvrir/') && !f.startsWith('/cours/') && !f.startsWith('/comprendre/') && !f.startsWith('/admin/') && !f.startsWith('/pdf/') && f !== '/sitemap.xml').sort();
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
