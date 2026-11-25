// Fonctions partagées par les scripts d'import.
export const slug = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
export const nu = s => String(s || '').replace(/\*\*/g, '');
export const MOIS = { janvier: 1, février: 2, fevrier: 2, mars: 3, avril: 4, mai: 5, juin: 6, juillet: 7, août: 8, aout: 8, septembre: 9, octobre: 10, novembre: 11, décembre: 12, decembre: 12 };

export function parseDate(brut) {
  const partiel = String(brut || '').match(/^(\p{L}+)\s+(\d{4})$/u); // « novembre 2008 » : pas de jour connu
  if (partiel && MOIS[partiel[1].toLowerCase()]) return { iso: `${partiel[2]}-${String(MOIS[partiel[1].toLowerCase()]).padStart(2, '0')}`, lieu: null };
  const m = String(brut || '').match(/^(\d{1,2})(?:er)?\s+(\p{L}+)\s+(\d{4})(?:\s*,\s*(.+))?$/u);
  if (!m || !MOIS[m[2].toLowerCase()]) return { iso: null, lieu: null };
  const iso = `${m[3]}-${String(MOIS[m[2].toLowerCase()]).padStart(2, '0')}-${String(m[1]).padStart(2, '0')}`;
  return { iso, lieu: m[4] || null };
}

// Valeur structurée « au mieux » : on garde toujours le texte, le nombre n'est ajouté que s'il est sans ambiguïté.
export function parseValeur(v) {
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

// Construit les faits d'une fiche au format v2 (delais, montants, roles, definitions, listes, pieges).
export function construireFaits(t, ajouterActeur) {
  const faits = [];
  const ajouter = (type, o) => faits.push({
    id: `${t.id}.${type}.${String(faits.filter(f => f.type === type).length + 1).padStart(2, '0')}`,
    texte: t.id, type, ...o, themes: [t.theme], niveau: null, confiance: 'a_verifier',
  });
  for (const d of t.delais || []) ajouter('delai', { article: d.a, enonce: d.q, valeur_texte: d.v, ...parseValeur(d.v), note: d.n || null });
  for (const m of t.montants || []) ajouter('montant', { article: m.a, enonce: m.q, valeur_texte: m.v, ...parseValeur(m.v), note: m.n || null });
  for (const r of t.roles || []) { const id = slug(r.acteur); ajouterActeur(id, r.acteur, t.id); ajouter('role', { article: r.a, enonce: r.acteur, valeur_texte: r.r, acteurs: [id], note: null }); }
  for (const d of t.definitions || []) ajouter('definition', { article: d.a || null, enonce: d.t, valeur_texte: d.d, note: null });
  for (const l of t.listes || []) ajouter('liste', { article: l.a || null, enonce: l.titre, valeur_texte: (l.items || []).join(' ; '), items: l.items || [], note: null });
  for (const p of t.pieges || []) ajouter('piege', { article: null, enonce: nu(p).slice(0, 90), valeur_texte: p, note: null });
  return faits;
}
