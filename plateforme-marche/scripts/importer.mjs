// Importe les fiches de nouveaux/*.json (format v2 + métadonnées) dans data/.
// Usage : node scripts/importer.mjs        (idempotent : réécrit les textes de nouveaux/, ne touche pas aux autres)
//
// Champs d'une fiche : id, ordre, type, organisme, num, date, titre, theme, objet, trente, retenir[], delais[], montants[],
//   roles[], definitions[], listes[], pieges[], qr[]  (comme la v2), plus :
//   source: { fichier_local, url_officielle }          d'où vient le texte
//   couverture: "complete" | "partielle" | "contexte"  jusqu'où la fiche détaille le texte
//   relations: { abroge:[id], abroge_externes:[{reference,preuve}], modifie:[{texte,articles,preuve}] }
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseDate, construireFaits, nu } from './lib.mjs';

const racine = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const data = path.join(racine, 'data'), entree = path.join(racine, 'nouveaux');
const lire = f => JSON.parse(fs.readFileSync(f, 'utf8'));
const ecrire = (f, o) => fs.writeFileSync(f, JSON.stringify(o, null, 2) + '\n');
const COUVERTURES = ['complete', 'partielle', 'contexte'];

const acteurs = new Map(lire(path.join(data, 'acteurs.json')).map(a => [a.id, { ...a, textes: new Set(a.textes) }]));
const ajouterActeur = (id, nom, texte) => { const a = acteurs.get(id) || { id, nom, textes: new Set() }; a.textes.add(texte); acteurs.set(id, a); };

const fichiers = fs.existsSync(entree) ? fs.readdirSync(entree).filter(f => f.endsWith('.json') && !f.startsWith('_')).sort() : [];
const fiches = fichiers.map(f => ({ ...lire(path.join(entree, f)), _f: f }));
const ids = new Set(fiches.map(t => t.id));
const existe = id => ids.has(id) || fs.existsSync(path.join(data, 'textes', id + '.json'));
const relations = [];

for (const t of fiches) {
  for (const k of ['id', 'ordre', 'type', 'organisme', 'num', 'date', 'titre', 'theme', 'objet', 'couverture']) if (t[k] === undefined || t[k] === '') { console.error(`${t._f} : champ « ${k} » manquant`); process.exit(1); }
  if (!COUVERTURES.includes(t.couverture)) { console.error(`${t._f} : couverture « ${t.couverture} » inconnue`); process.exit(1); }
  if (t._f !== t.id + '.json') { console.error(`${t._f} : le fichier doit s'appeler ${t.id}.json`); process.exit(1); }
  const { iso, lieu } = parseDate(t.date);
  const rel = t.relations || {};
  const corpus = [t.titre, t.objet, t.trente, ...(t.retenir || []), ...(t.pieges || [])].map(nu).join(' ¶ ');
  for (const p of [...(rel.abroge_externes || []), ...(rel.modifie || [])]) if (!corpus.includes(p.preuve)) { console.error(`${t.id} : preuve introuvable dans la fiche : « ${p.preuve} »`); process.exit(1); }
  for (const c of rel.abroge || []) { if (!existe(c)) { console.error(`${t.id} abroge ${c} : texte inconnu`); process.exit(1); } relations.push({ type: 'abroge', source: t.id, cible: c }); }
  for (const m of rel.modifie || []) { if (!existe(m.texte)) { console.error(`${t.id} modifie ${m.texte} : texte inconnu`); process.exit(1); } relations.push({ type: 'modifie', source: t.id, cible: m.texte, articles: m.articles }); }

  const texte = {
    id: t.id, ordre: t.ordre, type: t.type, organisme: t.organisme, numero: t.num, titre: t.titre, theme: t.theme,
    date_texte: t.date, date_adoption: iso, lieu: lieu || t.lieu || null, entree_en_vigueur: null,
    statut: 'en_vigueur', statut_source: 'non_verifie',
    abroge: rel.abroge || [], abroge_par: [], modifie: (rel.modifie || []).map(m => ({ texte: m.texte, articles: m.articles, preuve: m.preuve })), modifie_par: [],
    abroge_externes: rel.abroge_externes || [],
    couverture: t.couverture,
    source: { pdf: null, url_officielle: t.source?.url_officielle || null, fichier_local: t.source?.fichier_local || null, origine: t.source?.origine || 'lu depuis le PDF officiel (OCR si scan)' },
    verifie_le: null, verifie_par: null, confiance: 'a_verifier',
    contenu: { objet: t.objet, essentiel: t.trente || '', retenir: t.retenir || [], listes: t.listes || [], pieges: t.pieges || [], qr: t.qr || [] },
  };
  ecrire(path.join(data, 'textes', t.id + '.json'), texte);
  ecrire(path.join(data, 'faits', t.id + '.json'), construireFaits(t, ajouterActeur));
}

// Relations supplémentaires entre textes déjà présents (nouveaux/_relations.json) :
// [{ "type": "abroge", "source": "r04-25", "cible": "r01-14", "retire_externe": "Règlement 01/14" }]
const fSupp = path.join(entree, '_relations.json');
for (const r of fs.existsSync(fSupp) ? lire(fSupp) : []) {
  if (!existe(r.source) || !existe(r.cible)) { console.error(`_relations.json : texte inconnu (${r.source} → ${r.cible})`); process.exit(1); }
  const f = path.join(data, 'textes', r.source + '.json'), s = lire(f);
  if (!s.abroge.includes(r.cible)) s.abroge.push(r.cible);
  if (r.retire_externe) s.abroge_externes = (s.abroge_externes || []).filter(x => !x.reference.startsWith(r.retire_externe));
  ecrire(f, s);
  relations.push({ type: 'abroge', source: r.source, cible: r.cible });
}

// Réciproques sur les textes visés (et les nouveaux textes entre eux).
for (const r of relations) {
  const f = path.join(data, 'textes', r.cible + '.json'), c = lire(f);
  if (r.type === 'abroge') {
    if (!c.abroge_par.includes(r.source)) c.abroge_par.push(r.source);
    c.statut = 'abroge'; if (c.statut_source !== 'verifie') c.statut_source = 'deduit';
  } else if (!c.modifie_par.some(x => x.texte === r.source)) c.modifie_par.push({ texte: r.source, articles: r.articles });
  ecrire(f, c);
}

ecrire(path.join(data, 'acteurs.json'), [...acteurs.values()].map(a => ({ id: a.id, nom: a.nom, textes: [...a.textes].sort() })).sort((a, b) => a.nom.localeCompare(b.nom, 'fr')));
console.log(`Importés : ${fiches.length} textes (${fiches.map(t => t.id).join(', ')}). Relations appliquées : ${relations.length}.`);
