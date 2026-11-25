// Conversion UNIQUE de la v2 (olympiades-2/data) vers le modèle de la nouvelle plateforme.
// Usage : node scripts/convertir-v2.mjs [--force]
// Après la conversion, on édite les fichiers de data/ à la main : le script refuse d'écraser sans --force.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ici = path.dirname(fileURLToPath(import.meta.url));
const racine = path.join(ici, '..');
const v2 = path.join(racine, '..', 'olympiades-2', 'data');
const sortie = path.join(racine, 'data');
const force = process.argv.includes('--force');

if (fs.existsSync(path.join(sortie, 'textes')) && fs.readdirSync(path.join(sortie, 'textes')).length && !force) {
  console.error('data/textes existe déjà et peut contenir des corrections manuelles. Relance avec --force pour écraser.');
  process.exit(1);
}

const lire = f => JSON.parse(fs.readFileSync(f, 'utf8'));
const ecrire = (f, o) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, JSON.stringify(o, null, 2) + '\n'); };
const slug = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const nu = s => String(s || '').replace(/\*\*/g, '');

const TYPES = { 'Instruction': 'instruction', 'Règlement': 'reglement', 'Règlement général': 'reglement_general', 'Règlement UEAC': 'reglement_ueac' };
const MOIS = { janvier: 1, février: 2, fevrier: 2, mars: 3, avril: 4, mai: 5, juin: 6, juillet: 7, août: 8, aout: 8, septembre: 9, octobre: 10, novembre: 11, décembre: 12, decembre: 12 };

function parseDate(brut) {
  const m = String(brut || '').match(/^(\d{1,2})(?:er)?\s+(\p{L}+)\s+(\d{4})(?:\s*,\s*(.+))?$/u);
  if (!m || !MOIS[m[2].toLowerCase()]) return { iso: null, lieu: null };
  const iso = `${m[3]}-${String(MOIS[m[2].toLowerCase()]).padStart(2, '0')}-${String(m[1]).padStart(2, '0')}`;
  return { iso, lieu: m[4] || null };
}

// Valeur structurée « au mieux » : on garde toujours le texte, le nombre n'est ajouté que s'il est sans ambiguïté.
function parseValeur(v) {
  const t = String(v).replace(/[  ]/g, ' ').trim();
  if (/\b(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\b/i.test(t)) return { type_valeur: 'date', valeur: null, unite: null, borne: null };
  const borne = /^(au plus|maximum|max\.?|jusqu|moins de|inférieur)/i.test(t) ? 'max' : /^(au moins|minimum|plus de|supérieur|≥)/i.test(t) ? 'min' : 'exact';
  const m = t.match(/(\d{1,3}(?:\s\d{3})+|\d+)(?:[,.](\d+))?\s*(milliards?|millions?|M\b)?\s*(jours? ouvr(?:és|ables)|jours? calendaires?|jours?|mois|ans|années?|semaines?|heures?|%|FCFA)?(\s+par\s+jour)?/i);
  if (!m) return { type_valeur: 'texte', valeur: null, unite: null, borne: null };
  let n = Number(m[1].replace(/\s/g, '') + (m[2] ? '.' + m[2] : ''));
  let unite = m[4] ? m[4].toLowerCase().replace(/^jour$/, 'jours').replace(/^années?$/, 'ans').replace(/^an$/, 'ans').replace(/^jours? ouvrables?$/, 'jours ouvrables').replace(/^jours? calendaires?$/, 'jours calendaires').replace(/^semaine$/, 'semaines').replace(/^heure$/, 'heures') : null;
  if (m[3]) { n *= /milliard/i.test(m[3]) ? 1e9 : 1e6; unite = unite || 'FCFA'; }
  if (!unite) return { type_valeur: 'texte', valeur: null, unite: null, borne: null };
  if (m[5]) unite += ' par jour';
  return { type_valeur: 'nombre', valeur: n, unite, borne };
}

const themes = lire(path.join(v2, 'themes.json'));
const fichiers = fs.readdirSync(path.join(v2, 'textes')).filter(f => f.endsWith('.json')).sort();
const textes = fichiers.map(f => lire(path.join(v2, 'textes', f)));
const ids = new Set(textes.map(t => t.id));

// Abrogations déduites du texte des fiches (à confirmer à la main : statut_source = "deduit").
function detecterAbrogations() {
  const rel = new Map(); // cible -> { par, preuve }
  for (const t of textes) {
    const champs = [t.objet, t.trente, ...(t.retenir || []), ...(t.pieges || [])].map(nu);
    for (const c of champs) {
      const motifs = [
        /abroge\s+(?:l['’]\s*)?Instruction\s+(?:n°\s*)?(\d{2}-\d{2})/gi,
        /Instruction\s+(?:n°\s*)?(\d{2}-\d{2})[^.;]{0,40}?\babroge\b/gi,
      ];
      for (const re of motifs) {
        for (const m of c.matchAll(re)) {
          const cible = 'i' + m[1];
          const avant = c.slice(Math.max(0, m.index - 4), m.index);
          if (/n['’]\s*$/i.test(avant)) continue;
          if (ids.has(cible) && cible !== t.id) rel.set(cible, { par: t.id, preuve: c.slice(Math.max(0, m.index - 30), m.index + m[0].length + 30) });
        }
      }
    }
  }
  return rel;
}
const abrogations = detecterAbrogations();

// Relations relevées à la main dans les fiches ; la phrase de preuve DOIT figurer dans la fiche du texte source,
// sinon la conversion s'arrête (on ne garde pas une relation sans trace).
const RELATIONS = [
  { type: 'modifie', source: 'r03-26', cible: 'r01-22', articles: 'art. 88 à 91', preuve: 'modifie les art. 88 à 91 du Règlement 01/22' },
  { type: 'abroge_externe', source: 'r01-22', reference: 'Règlement 06/03 du 12 novembre 2003', preuve: 'Il abroge le Règlement 06/03 du 12 novembre 2003' },
  { type: 'abroge_externe', source: 'r04-25', reference: 'Règlement 01/14 (ancien régime d’inscription en compte)', preuve: 'l\'ancien Règlement 01/14' },
];
for (const r of RELATIONS) {
  const t = textes.find(x => x.id === r.source);
  const corpus = [t.titre, t.objet, t.trente, ...(t.retenir || []), ...(t.pieges || [])].map(nu).join(' ¶ ');
  if (!corpus.includes(r.preuve)) { console.error(`Preuve introuvable pour la relation ${r.type} de ${r.source} : « ${r.preuve} »`); process.exit(1); }
  if (r.cible && !ids.has(r.cible)) { console.error(`Cible inconnue : ${r.cible}`); process.exit(1); }
}

const acteursMap = new Map();
const compteurs = { delai: 0, montant: 0, role: 0, definition: 0, liste: 0, piege: 0 };

for (const t of textes) {
  const { iso, lieu } = parseDate(t.date);
  const abrogePar = abrogations.get(t.id);
  const abroge = [...abrogations.entries()].filter(([, r]) => r.par === t.id).map(([cible]) => cible);

  const texte = {
    id: t.id, ordre: t.ordre, type: TYPES[t.type] || t.type, numero: t.num, titre: t.titre, theme: t.theme,
    date_texte: t.date, date_adoption: iso, lieu, entree_en_vigueur: null,
    statut: abrogePar ? 'abroge' : 'en_vigueur',
    statut_source: abrogePar ? 'deduit' : 'non_verifie',
    abroge, abroge_par: abrogePar ? [abrogePar.par] : [],
    modifie: RELATIONS.filter(r => r.type === 'modifie' && r.source === t.id).map(r => ({ texte: r.cible, articles: r.articles, preuve: r.preuve })),
    modifie_par: RELATIONS.filter(r => r.type === 'modifie' && r.cible === t.id).map(r => ({ texte: r.source, articles: r.articles })),
    abroge_externes: RELATIONS.filter(r => r.type === 'abroge_externe' && r.source === t.id).map(r => ({ reference: r.reference, preuve: r.preuve })),
    source: { pdf: null, url_officielle: null, origine: 'v2 olympiades-2 (scan lu par OCR)' },
    verifie_le: null, verifie_par: null, confiance: 'a_verifier',
    contenu: { objet: t.objet, essentiel: t.trente, retenir: t.retenir || [], listes: t.listes || [], pieges: t.pieges || [], qr: t.qr || [] },
  };
  ecrire(path.join(sortie, 'textes', t.id + '.json'), texte);

  const faits = [];
  const ajouter = (type, o) => { const n = ++compteurs[type]; faits.push({ id: `${t.id}.${type}.${String(faits.filter(f => f.type === type).length + 1).padStart(2, '0')}`, texte: t.id, type, ...o, themes: [t.theme], niveau: null, confiance: 'a_verifier' }); return n; };

  for (const d of t.delais || []) ajouter('delai', { article: d.a, enonce: d.q, valeur_texte: d.v, ...parseValeur(d.v), note: d.n || null });
  for (const m of t.montants || []) ajouter('montant', { article: m.a, enonce: m.q, valeur_texte: m.v, ...parseValeur(m.v), note: m.n || null });
  for (const r of t.roles || []) {
    const id = slug(r.acteur);
    const a = acteursMap.get(id) || { id, nom: r.acteur, textes: new Set() };
    a.textes.add(t.id); acteursMap.set(id, a);
    ajouter('role', { article: r.a, enonce: r.acteur, valeur_texte: r.r, acteurs: [id], note: null });
  }
  for (const d of t.definitions || []) ajouter('definition', { article: d.a || null, enonce: d.t, valeur_texte: d.d, note: null });
  for (const l of t.listes || []) ajouter('liste', { article: l.a || null, enonce: l.titre, valeur_texte: (l.items || []).join(' ; '), items: l.items || [], note: null });
  for (const p of t.pieges || []) ajouter('piege', { article: null, enonce: nu(p).slice(0, 90), valeur_texte: p, note: null });

  ecrire(path.join(sortie, 'faits', t.id + '.json'), faits);
}

ecrire(path.join(sortie, 'themes.json'), themes);
ecrire(path.join(sortie, 'acteurs.json'), [...acteursMap.values()].map(a => ({ id: a.id, nom: a.nom, textes: [...a.textes].sort() })).sort((a, b) => a.nom.localeCompare(b.nom, 'fr')));

console.log(`Convertis : ${textes.length} textes.`);
console.log('Faits :', compteurs);
console.log('Abrogations déduites (à confirmer) :');
for (const [cible, r] of abrogations) console.log(`  ${cible} abrogé par ${r.par}  «…${r.preuve.replace(/\s+/g, ' ')}…»`);
