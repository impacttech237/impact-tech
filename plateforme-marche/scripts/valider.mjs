// Validation du modèle de données. Erreurs = bloquantes ; avertissements = à traiter mais non bloquants.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const racine = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const lire = f => JSON.parse(fs.readFileSync(f, 'utf8'));

export const TYPES_TEXTE = ['instruction', 'reglement', 'reglement_general', 'reglement_ueac', 'reglement_bvmac', 'instruction_bvmac', 'acte_additionnel', 'circulaire', 'lignes_directrices', 'communique', 'traite', 'convention', 'acte_uniforme', 'guide'];
export const ORGANISMES = ['cosumaf', 'bvmac', 'cemac', 'umac', 'ueac', 'ohada'];
export const COUVERTURES = ['complete', 'partielle', 'contexte'];
export const STATUTS = ['en_vigueur', 'abroge', 'modifie', 'projet'];
export const SOURCES_STATUT = ['verifie', 'deduit', 'non_verifie'];
export const CONFIANCES = ['verifie', 'a_verifier', 'illisible'];
export const TYPES_FAIT = ['delai', 'montant', 'seuil', 'ratio', 'role', 'definition', 'procedure', 'liste', 'piege'];
const SANS_ARTICLE = new Set(['piege', 'definition', 'liste']);

export function charger() {
  const d = path.join(racine, 'data');
  const textes = fs.readdirSync(path.join(d, 'textes')).filter(f => f.endsWith('.json')).sort()
    .map(f => ({ ...lire(path.join(d, 'textes', f)), _fichier: f }));
  const faits = fs.readdirSync(path.join(d, 'faits')).filter(f => f.endsWith('.json')).sort()
    .flatMap(f => lire(path.join(d, 'faits', f)).map(x => ({ ...x, _fichier: f })));
  return { textes, faits, themes: lire(path.join(d, 'themes.json')), acteurs: lire(path.join(d, 'acteurs.json')) };
}

export function valider({ textes, faits, themes, acteurs }) {
  const erreurs = [], avertissements = [];
  const E = (code, msg) => erreurs.push({ code, msg });
  const W = (code, msg) => avertissements.push({ code, msg });

  const idsTextes = new Map(), idsThemes = new Set(themes.map(t => t.id)), idsActeurs = new Set(acteurs.map(a => a.id));
  const ordres = new Set();

  for (const t of textes) {
    const c = `texte ${t.id}`;
    if (!t.id) { E('T01', `${t._fichier} : id manquant`); continue; }
    if (t._fichier !== t.id + '.json') E('T02', `${c} : le fichier s'appelle ${t._fichier}`);
    if (idsTextes.has(t.id)) E('T03', `${c} : id en double`);
    idsTextes.set(t.id, t);
    if (!TYPES_TEXTE.includes(t.type)) E('T04', `${c} : type « ${t.type} » inconnu`);
    if (!t.titre) E('T05', `${c} : titre vide`);
    if (!t.numero) E('T06', `${c} : numéro vide`);
    if (!idsThemes.has(t.theme)) E('T07', `${c} : thème « ${t.theme} » inconnu`);
    if (!ORGANISMES.includes(t.organisme)) E('T15', `${c} : organisme « ${t.organisme} » inconnu`);
    if (!COUVERTURES.includes(t.couverture)) E('T16', `${c} : couverture « ${t.couverture} » inconnue`);
    if (!STATUTS.includes(t.statut)) E('T08', `${c} : statut « ${t.statut} » inconnu`);
    if (!SOURCES_STATUT.includes(t.statut_source)) E('T09', `${c} : statut_source « ${t.statut_source} » inconnu`);
    if (!CONFIANCES.includes(t.confiance)) E('T10', `${c} : confiance « ${t.confiance} » inconnue`);
    if (ordres.has(t.ordre)) E('T11', `${c} : ordre ${t.ordre} déjà pris`);
    ordres.add(t.ordre);
    if (t.confiance === 'verifie' && (!t.verifie_le || !t.verifie_par)) E('T12', `${c} : marqué « verifie » sans date ni relecteur`);
    if (t.statut === 'abroge' !== (t.abroge_par || []).length > 0) E('T13', `${c} : statut « ${t.statut} » incohérent avec abroge_par`);
    if (!t.date_adoption) W('T20', `${c} : date « ${t.date_texte} » non interprétée`);
    for (const x of t.abroge_externes || []) if (!x.preuve) E('T14', `${c} : abrogation externe « ${x.reference} » sans preuve`);
  }

  // relations entre textes (symétrie, existence, chronologie)
  for (const t of textes) {
    for (const cible of t.abroge || []) {
      const o = idsTextes.get(cible);
      if (!o) { E('R01', `${t.id} abroge ${cible} : texte inconnu`); continue; }
      if (cible === t.id) E('R02', `${t.id} s'abroge lui-même`);
      if (!(o.abroge_par || []).includes(t.id)) E('R03', `${t.id} abroge ${cible}, mais ${cible} ne le mentionne pas dans abroge_par`);
      if (t.date_adoption && o.date_adoption && t.date_adoption < o.date_adoption) W('R04', `${t.id} (${t.date_adoption}) abroge ${cible} (${o.date_adoption}), plus récent`);
    }
    for (const par of t.abroge_par || []) {
      const o = idsTextes.get(par);
      if (!o) E('R05', `${t.id} abrogé par ${par} : texte inconnu`);
      else if (!(o.abroge || []).includes(t.id)) E('R06', `${t.id} dit être abrogé par ${par}, mais ${par} ne l'abroge pas`);
    }
    for (const m of t.modifie || []) {
      const o = idsTextes.get(m.texte);
      if (!o) { E('R07', `${t.id} modifie ${m.texte} : texte inconnu`); continue; }
      if (!(o.modifie_par || []).some(x => x.texte === t.id)) E('R08', `${t.id} modifie ${m.texte}, mais ${m.texte} ne le mentionne pas dans modifie_par`);
      if (!m.preuve) E('R09', `${t.id} modifie ${m.texte} sans preuve`);
      if (t.date_adoption && o.date_adoption && t.date_adoption < o.date_adoption) W('R10', `${t.id} (${t.date_adoption}) modifie ${m.texte} (${o.date_adoption}), plus récent`);
    }
    for (const m of t.modifie_par || []) {
      const o = idsTextes.get(m.texte);
      if (!o) E('R11', `${t.id} modifié par ${m.texte} : texte inconnu`);
      else if (!(o.modifie || []).some(x => x.texte === t.id)) E('R12', `${t.id} dit être modifié par ${m.texte}, mais ${m.texte} ne le modifie pas`);
    }
  }

  // faits
  const idsFaits = new Set(), vus = new Map();
  for (const f of faits) {
    const c = `fait ${f.id}`;
    if (idsFaits.has(f.id)) E('F01', `${c} : id en double`);
    idsFaits.add(f.id);
    const t = idsTextes.get(f.texte);
    if (!t) { E('F02', `${c} : texte « ${f.texte} » inconnu`); continue; }
    if (!f.id.startsWith(f.texte + '.')) E('F03', `${c} : l'id ne commence pas par le texte`);
    if (f._fichier !== f.texte + '.json') E('F04', `${c} : rangé dans ${f._fichier}`);
    if (!TYPES_FAIT.includes(f.type)) E('F05', `${c} : type « ${f.type} » inconnu`);
    if (!f.enonce) E('F06', `${c} : énoncé vide`);
    if (!f.valeur_texte) E('F07', `${c} : valeur vide`);
    if (!SANS_ARTICLE.has(f.type) && !f.article) E('F08', `${c} : article manquant`);
    else if (f.article && !/^(art\.|annexe|alinéa|titre|chap|préambule|ex\.|chapeau|résolution|tarif|section|tableau|§|point|principe|ligne|rubrique|dernier|lettre|instruction|règl|diligence|visa|[IVX]+\b|introduction|table|mentions|schéma|partie|acte additionnel|préambule)/i.test(f.article)) W('F21', `${c} : article au format inhabituel « ${f.article} »`);
    if (f.type_valeur === 'nombre' && (typeof f.valeur !== 'number' || !f.unite)) E('F09', `${c} : valeur numérique sans nombre ou sans unité`);
    if (!CONFIANCES.includes(f.confiance)) E('F10', `${c} : confiance « ${f.confiance} » inconnue`);
    if (f.confiance === 'verifie' && t.confiance !== 'verifie') E('F11', `${c} : « verifie » alors que le texte ${t.id} ne l'est pas`);
    for (const th of f.themes || []) if (!idsThemes.has(th)) E('F12', `${c} : thème « ${th} » inconnu`);
    if (f.type === 'role') for (const a of f.acteurs || []) if (!idsActeurs.has(a)) E('F13', `${c} : acteur « ${a} » inconnu`);
    const cle = [f.texte, f.type, f.enonce].join('|');
    if (vus.has(cle)) {
      const autre = vus.get(cle);
      if (autre.valeur_texte === f.valeur_texte && autre.article === f.article) W('F20', `${c} : doublon de ${autre.id}`);
      else W('F22', `${c} : même énoncé que ${autre.id} avec une valeur différente (« ${f.valeur_texte} » / « ${autre.valeur_texte} »)`);
    } else vus.set(cle, f);
  }
  for (const t of textes) if (!faits.some(f => f.texte === t.id)) W('F30', `texte ${t.id} : aucun fait`);

  return { erreurs, avertissements };
}
