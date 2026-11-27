/* Recherche de Boussole CEMAC : moteur BM25 maison, tolérant (accents, pluriels, fautes, sigles, synonymes, nombres, questions en langage naturel). Initialisée par app.js : RECH(B). */
window.RECH = B => {
'use strict';
const { $, $$, esc, S } = B;
const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[’']/g, "'");
const strip = t => String(t || '').replace(/\*\*/g, '').replace(/(^|\n)\s*(?:[-*]|\d+\.)\s+/g, '$1').replace(/\n+/g, ' · ').replace(/\s+/g, ' ').trim();

const TYPES = {
  repere: { nom: 'Délais, montants, rôles', sing: 'Repère', ic: 'scale', w: 2.4, tab: '', col: '#a9f0d0' },
  texte: { nom: 'Textes officiels', sing: 'Texte officiel', ic: 'file-text', w: 2.0, tab: '', col: '#fff27a' },
  acteur: { nom: 'Acteurs', ic: 'users', w: 1.6, tab: '', col: '#bcd7ff' },
  definition: { nom: 'Définitions', ic: 'book-marked', w: 1.5, tab: 'gloss', col: '#ffe14a' },
  fiche: { nom: 'Fiches', ic: 'notebook-pen', w: 1.0, tab: 'fiches', col: '#ffb8d1' },
  resume: { nom: 'Résumés', ic: 'book-open', w: .8, tab: 'resume', col: '#ffd3a3' },
  schema: { nom: 'Schémas', ic: 'network', w: .7, tab: 'schemas', col: '#bcd7ff' },
  exemple: { nom: 'Exemples', ic: 'lightbulb', w: .55, tab: 'exemples', col: '#a9f0d0' },
  prof: { nom: 'Cours oral', ic: 'message-circle', w: .5, tab: 'prof', col: '#ffd0a8' },
  carte: { nom: 'Flashcards', ic: 'layers', w: .4, tab: 'cartes', col: '#d9c8ff' },
  question: { nom: 'Questions', ic: 'circle-check', w: .35, tab: 'quiz', col: '#c4f1dd' },
};

/* ---------- normalisation du texte : nombres, sigles, expressions ---------- */
const nombres = s => { let p; do { p = s; s = s.replace(/(\d)[   ](\d{3})(?!\d)/g, '$1$2'); } while (s !== p);
  return s.replace(/(\d),(\d)/g, '$1.$2')
    .replace(/(\d+(?:\.\d+)?)\s*(?:milliards?|mds?)(?![a-z])/g, (m, n) => String(Math.round(parseFloat(n) * 1e9)))
    .replace(/(\d+(?:\.\d+)?)\s*(?:millions?|mio)(?![a-z])/g, (m, n) => String(Math.round(parseFloat(n) * 1e6))); };
const sigles = s => s.replace(/\b(?:[a-z]\.){2,}[a-z]?/g, m => m.replace(/\./g, ''));
/* expressions longues -> sigle (côté requête : remplacement ; côté documents : ajout du sigle) */
const CANON = [
  [/\b(?:societes?|intermediaires?) de (?:bourse|marche)\b/g, 'sdb'], [/\bsocietes? de gestion (?:d'?opc|d'organismes? de placement collectif|de portefeuille)\b/g, 'sgo'],
  [/\borganismes? de placement collectif(?: en valeurs mobilieres)?\b/g, 'opc'], [/\boffres? publiques? de vente\b/g, 'opv'], [/\boffres? publiques? d'achat\b/g, 'opa'], [/\boffres? publiques? d'echange\b/g, 'ope'],
  [/\bappels? publics? a l'epargne\b/g, 'ape'], [/\bintroductions? en bourse\b/g, 'ipo'], [/\bcommission de surveillance du marche financier(?: de l'afrique centrale)?\b/g, 'cosumaf'],
  [/\bbourse des valeurs mobilieres(?: de l'afrique centrale)?\b/g, 'bvmac'], [/\blutte contre le blanchiment(?: de capitaux)?(?: et le financement du terrorisme)?\b/g, 'lbc'],
  [/\bcommissaires? aux comptes\b/g, 'cac'], [/\bpetites? et moyennes? entreprises?\b/g, 'pme'], [/\bvaleurs? liquidatives?\b/g, 'vl'], [/\bdirecteurs? generaux?\b/g, 'dg'],
  [/\bdocuments? d'information simplifies?\b/g, 'dis'], [/\bdocuments? d'information\b/g, 'prospectus'], [/\bdepositaires? centraux?\b/g, 'depocentral'], [/\bfonds communs? de placement\b/g, 'fcp'],
];
/* synonymes (mots simples, sous forme normalisée) : chacun trouve les autres, avec un poids moindre */
const FAMILLES = [['delai', 'duree', 'echeance', 'periode'], ['agrement', 'agreer', 'agree', 'agrer', 'habilitation', 'licence'], ['sanction', 'amende', 'penalite', 'peine', 'pecuniaire', 'disciplinaire', 'risque', 'encourt', 'puni', 'punit'],
  ['commission', 'courtage', 'frais', 'tarif', 'tarification', 'cout', 'redevance', 'remuneration', 'honoraires'], ['montant', 'somme', 'plafond'], ['sdb', 'courtier', 'negociateur'], ['sgo', 'gestionnaire'],
  ['opc', 'opcvm', 'fonds'], ['cosumaf', 'regulateur'], ['cotation', 'cote', 'ipo'], ['interdit', 'interdiction', 'prohibe', 'defendu'], ['declaration', 'notification', 'declarer', 'notifier'],
  ['radiation', 'retrait', 'delistage'], ['suspension', 'suspendre', 'suspendu', 'interruption'], ['abroge', 'abrogation', 'remplace', 'supprime'], ['cac', 'auditeur', 'audit'],
  ['dirigeant', 'dirige', 'diriger', 'dg', 'pdg', 'directeur'], ['conservation', 'archivage', 'conserver'], ['initie', 'privilegie'], ['lbc', 'blanchiment', 'lcb'], ['capital', 'capitaux'], ['visa', 'autorisation'],
  ['acheter', 'achat', 'acquisition', 'acquerir'], ['vendre', 'vente', 'cession', 'ceder'], ['investisseur', 'souscripteur', 'epargnant', 'porteur'], ['bvmac', 'bourse'], ['heure', 'horaire', 'seance', 'ouverture', 'cloture'], ['obligatoire', 'impose', 'exige', 'requis'], ['siege', 'domicile', 'adresse'], ['dossier', 'demande', 'candidature']];
const STOPS = new Set("de du des la le les un une et au aux en d l a ou pour par sur dans qui que quoi quel quelle quels quelles est sont ce cet cette ces se sa son ses leur leurs il elle ils on y combien comment faut faire met mettre mets prend prendre doit doivent peut peuvent avoir etre avec sans plus quand lorsque si ne pas non oui mon ma mes qu est art article articles cas fait faite pourcent difference differences entre vs versus comparer distinguer".split(' '));

/* ---------- radical (stemmer français léger) ---------- */
const SUF = ['issements', 'issement', 'ements', 'ement', 'ations', 'ation', 'ateurs', 'ateur', 'atrices', 'atrice', 'ites', 'ite', 'ions', 'ion', 'euses', 'euse', 'eurs', 'eur', 'ees', 'ee', 'es', 'e'];
const stem = w => { if (w.length < 4 || /^\d/.test(w)) return w;
  if (w.endsWith('eaux')) return w.slice(0, -1); if (w.endsWith('aux') && w.length > 5) return w.slice(0, -3) + 'al';
  for (const s of SUF) if (w.endsWith(s) && w.length - s.length >= (/^ement/.test(s) ? 6 : 4)) return w.slice(0, -s.length);
  return /[sx]$/.test(w) && w.length > 4 ? w.slice(0, -1) : w; };
const toks = s => (s.match(/\d+(?:\.\d+)?|[a-z]+/g) || []);
/* clé « phonétique » : tolère « agrèment/agrement », « placment », « fiksing »… */
const cle = w => w.replace(/ph/g, 'f').replace(/ck|qu|q/g, 'k').replace(/c(?=[aou])/g, 'k').replace(/y/g, 'i').replace(/h/g, '').replace(/(.)\1+/g, '$1').replace(/[eaiou]+$/, '');
/* distance de Damerau-Levenshtein (transpositions comptées pour 1) */
const dl = (a, b, max) => { if (Math.abs(a.length - b.length) > max) return max + 1; const d = []; for (let i = 0; i <= a.length; i++) { d[i] = [i]; } for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) { d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1); }
  return d[a.length][b.length]; };

/* ---------- documents et index inversé ---------- */
let INDEX = null, sig = '', INV = null;
function build() {
  const s = S.packs.map(p => p.id + p.chapitres.length).join() + '|' + (B.rechSig ? B.rechSig() : '');
  if (INDEX && s === sig) return INDEX; sig = s; INDEX = []; INV = null;
  S.packs.forEach(p => p.chapitres.forEach(c => {
    const base = { p, c, course: p.court || p.titre, chap: c.titre.replace(/^[^·]*·\s*/, '') };
    const add = (type, title, text, extra = {}) => INDEX.push({ ...base, type, title, text, nt: norm(title), nx: norm(text), ...extra });
    (c.definitions || []).forEach(d => add('definition', d.terme, d.definition));
    (c.fiches || []).forEach(f => add('fiche', f.titre, strip(f.contenu)));
    (c.exemples || []).forEach(x => add('exemple', x.titre, strip(x.texte)));
    (c.prof || []).forEach(x => add('prof', x.titre, strip(x.texte)));
    (c.mnemos || []).forEach(m => add('fiche', 'Astuce mnémotechnique', strip(m)));
    add('resume', c.titre, [c.resume.court, c.resume.moyen].join(' '));
    (c.cartes || []).forEach(k => add('carte', k.recto, k.verso));
    (c.questions || []).forEach(q => add('question', q.q, [q.choix[q.bonne], q.explication].join(' — ')));
    (c.schemas || []).forEach(v => add('schema', v.titre, strip([v.legende, B.viz?.words?.(v)].filter(Boolean).join(' '))));
  }));
  ((B.rechExtra && B.rechExtra()) || []).forEach(it => INDEX.push({ ...it, nt: norm(it.title), nx: norm(it.text) }));
  return INDEX;
}
const prep = s => { s = sigles(nombres(s)); CANON.forEach(([re, c]) => { if (re.test(s)) s += ' ' + c; re.lastIndex = 0; }); return s; };
function inverse() {
  const docs = build(); if (INV) return INV;
  const post = new Map(), surf = new Map(), mots = new Map(), len = new Float32Array(docs.length); let tot = 0;
  docs.forEach((it, i) => {
    const tt = toks(prep(it.nt + ' ' + norm(it.short || '') + ' ' + (it.kw || ''))).map(stem), tx = toks(prep(it.nx)).map(stem), tf = new Map();
    tt.forEach(t => tf.set(t, (tf.get(t) || 0) + 3)); tx.forEach(t => tf.set(t, (tf.get(t) || 0) + 1));
    len[i] = tt.length * 3 + tx.length; tot += len[i]; it._tt = new Set(tt); it._tf = tf;
    tf.forEach((n, t) => { let a = post.get(t); if (!a) post.set(t, a = []); a.push(i, n); });
    const raw = toks(sigles(nombres(it.nt)));
    toks(sigles(nombres(it.nx))).forEach(w => { if (w.length >= 5 && !/^\d/.test(w)) mots.set(w, (mots.get(w) || 0) + 1); });
    raw.forEach(w => { if (w.length >= 5) mots.set(w, (mots.get(w) || 0) + 1); const st = stem(w); if (!surf.has(st) && w.length > 3) surf.set(st, w); });
  });
  const pref = new Map(), phon = new Map(), vocab = [...post.keys()];
  vocab.forEach(t => { if (t.length >= 5) { const k = t.slice(0, 5); (pref.get(k) || pref.set(k, []).get(k)).push(t); } const c = cle(t); if (c.length >= 3) (phon.get(c) || phon.set(c, []).get(c)).push(t); });
  const fam = new Map(); FAMILLES.forEach((g, i) => g.forEach(w => fam.set(stem(w), i)));
  const lex = [...mots.keys()];
  return INV = { lex, post, surf, len, avg: tot / docs.length, N: docs.length, pref, phon, vocab, fam };
}
const idf = (I, t) => { const df = (I.post.get(t) || []).length / 2; return Math.log(1 + (I.N - df + .5) / (df + .5)); };

/* termes d'index pouvant répondre à un mot de la requête : exact, synonymes, mots voisins, fautes de frappe, début de mot */
function candidats(I, w, dernier) {
  const out = new Map(), add = (t, p) => { if (I.post.has(t) && (out.get(t) || 0) < p) out.set(t, p); };
  const s = stem(w); add(s, 1);
  const g = I.fam.get(s); if (g !== undefined) FAMILLES[g].forEach(x => add(stem(x), x === w ? 1 : .72));
  if (/^\d/.test(w)) return { c: out, typo: null };
  if (s.length >= 5) (I.pref.get(s.slice(0, 5)) || []).forEach(t => { let k = 0; while (k < s.length && k < t.length && s[k] === t[k]) k++; if (k >= Math.max(5, Math.min(s.length, t.length) - 3)) add(t, .55); });
  if (dernier && s.length >= 3) { let n = 0; for (const t of I.vocab) if (t.startsWith(s) && t !== s) { add(t, .5); if (++n > 40) break; } }
  let typo = null;
  if (!I.post.has(s) && out.size <= 1 && w.length >= 4) {
    const max = w.length >= 8 ? 2 : 1; const best = [];
    for (const t of I.lex) { if (Math.abs(t.length - w.length) > max) continue; const d = dl(w, t, max); if (d <= max) best.push([d, -(I.post.get(stem(t)) || []).length, t]); }
    best.sort((a, b) => a[0] - b[0] || a[1] - b[1]); best.filter(b => b[0] === best[0][0]).slice(0, 3).forEach(([d, , t]) => add(stem(t), d === 1 ? .75 : .55));
    if (best.length) typo = best[0][2];
    if (!best.length) { const ph = (I.phon.get(cle(s)) || []).slice(0, 3); ph.forEach(t => add(t, .5)); if (ph.length) typo = I.surf.get(ph[0]) || ph[0]; }
  }
  return { c: out, typo };
}

/* ---------- langage de requête : questions naturelles et syntaxe avancée ---------- */
const NL = [
  [/\b(?:combien de temps|dans quel delai|sous quel delai|au bout de combien|a quelle echeance|jusqu'a quand|quel(?:s)? (?:est|sont) (?:le|les) delais?|quels? delais?|quand|delais?|duree)\b/, 'delai'],
  [/\b(?:combien|a combien|quel(?:le)?s? (?:est|sont) (?:le|la|les) (?:montants?|taux|cout|tarif|plafonds?|capital|seuils?)|quel montant|cout|coute|tarif|taux|pourcentage|plafond|minimum|minimal|maximum|capital|seuil|prix)\b/, 'montant'],
  [/\b(?:qui|quel organe|quelle autorite|qui est charge|qui peut|qui doit|responsable|competent|competente|autorite)\b/, 'role'],
  [/\b(?:qu'est[- ]ce|c'est quoi|que signifie|que veut dire|definition|definir|signifie|designe|on appelle|a quoi sert|que fait|role de|en quoi consiste)\b/, 'definition'],
  [/\b(?:comment|etapes?|procedure|demarches?|processus|marche a suivre|conditions?|documents? (?:a fournir|requis)|liste|quels? sont les|pieces)\b/, 'procedure'],
  [/\b(?:sanction\w*|risque\w*|encourt|encourir|penalite\w*|amende\w*|puni\w*|peine\w*)\b/, 'sanction'],
  [/\b(?:difference|differences|differ\w*|vs|versus|comparer|confond\w*|distinguer|ou bien)\b/, 'comparaison'],
  [/\b(?:est[- ]ce que|peut[- ]on|peut[- ]elle|peut[- ]il|doit[- ]on|doit[- ]elle|doit[- ]il|a[- ]t[- ](?:on|elle|il)|obligatoire|interdit|autorise|permis|possible|faut[- ]il|a[- ]t[- ]on le droit)\b/, 'ouinon'],
];
const INTENT_Y = { delai: ['delai'], montant: ['montant'], role: ['role'], definition: ['definition'], procedure: ['liste'], sanction: ['montant', 'piege'], comparaison: ['piege', 'definition'], ouinon: ['piege', 'role'] };
const INTENT_NOM = { delai: 'délai', montant: 'montant', role: 'rôle', definition: 'définition', procedure: 'procédure', sanction: 'sanction', comparaison: 'comparaison', ouinon: 'question oui/non' };
const UNITES = [[/^jours?$|^jours? (?:ouvres?|calendaires?|ouvrables?)$|^j$/, 'jours'], [/^mois$/, 'mois'], [/^(?:ans?|annees?)$/, 'ans'], [/^(?:%|pour ?cent|pourcent)$/, '%'], [/^(?:fcfa|francs?|f cfa)$/, 'fcfa'], [/^heures?$/, 'heures'], [/^semaines?$/, 'semaines']];
const unite = u => { u = (u || '').trim(); for (const [re, n] of UNITES) if (re.test(u)) return n; return ''; };
const NUMOP = [[/(?:plus de|plus que|superieur(?:e)?s? a|au[- ]dessus de|depasse\w*|strictement plus de)/, '>'], [/(?:au moins|minimum de|a partir de|d'au moins|pas moins de)/, '>='], [/(?:moins de|inferieur(?:e)?s? a|en dessous de|strictement moins de)/, '<'], [/(?:au plus|maximum de|jusqu'a|pas plus de|d'au plus)/, '<='], [/(?:exactement)/, '=']];
const UNIT_RE = '(jours?(?: ouvres| calendaires| ouvrables)?|mois|ans?|annees?|%|pour ?cent|fcfa|francs?|heures?|semaines?)';
const NUM = '(\\d+(?:\\.\\d+)?)';
const mult = (n, s) => { n = parseFloat(n); s = (s || '').toLowerCase(); return s === 'k' ? n * 1e3 : /^(m|mio|millions?)$/.test(s) ? n * 1e6 : /^(md|mds|milliards?)$/.test(s) ? n * 1e9 : n; };
const ALIAS_TYPE = { repere: 'repere', reperes: 'repere', texte: 'texte', textes: 'texte', acteur: 'acteur', acteurs: 'acteur', definition: 'definition', definitions: 'definition', fiche: 'fiche', fiches: 'fiche', resume: 'resume', resumes: 'resume', schema: 'schema', schemas: 'schema', exemple: 'exemple', exemples: 'exemple', prof: 'prof', carte: 'carte', cartes: 'carte', flashcard: 'carte', flashcards: 'carte', question: 'question', questions: 'question', quiz: 'question' };
const ALIAS_Y = { delai: 'delai', delais: 'delai', montant: 'montant', montants: 'montant', role: 'role', roles: 'role', piege: 'piege', pieges: 'piege', liste: 'liste', listes: 'liste' };

function analyser(q) {
  const F = { type: '', y: '', org: '', statut: '', src: [], annee: null, art: '', th: '', cours: '', num: [], unite: '' }, interp = [], titreSeul = [];
  let reste = String(q);
  /* 1. expressions exactes et exclusions */
  const phrases = [], nonPhrases = [];
  reste = reste.replace(/(-?)"([^"]+)"/g, (m, neg, p) => { (neg ? nonPhrases : phrases).push(norm(p).trim()); return ' '; });
  /* 2. filtres champ:valeur */
  reste = reste.replace(/(?:^|\s)(type|org|organisme|statut|source|texte|annee|année|art|article|theme|thème|cours|valeur|unite|unité|titre|intitle|y)\s*:\s*(\S+)/gi, (m, k, v) => {
    k = norm(k); v = norm(v).replace(/^"|"$/g, '');
    if (k === 'type') { if (ALIAS_TYPE[v]) F.type = ALIAS_TYPE[v]; else if (ALIAS_Y[v]) { F.type = 'repere'; F.y = ALIAS_Y[v]; } interp.push('type : ' + v); }
    else if (k === 'y') { if (ALIAS_Y[v]) { F.type = 'repere'; F.y = ALIAS_Y[v]; interp.push('type : ' + v); } }
    else if (k === 'org' || k === 'organisme') { F.org = v; interp.push('organisme : ' + v.toUpperCase()); }
    else if (k === 'statut') { F.statut = /^abrog/.test(v) ? 'abroge' : 'en_vigueur'; interp.push('statut : ' + (F.statut === 'abroge' ? 'abrogé' : 'en vigueur')); }
    else if (k === 'source' || k === 'texte') { F.src.push(v.replace(/_/g, ' ')); interp.push('texte : ' + v); }
    else if (k === 'annee') { const r = v.match(/^(\d{4})\.\.(\d{4})$/), g = v.match(/^(>=?|<=?)(\d{4})$/), e = v.match(/^(\d{4})$/); F.annee = r ? [+r[1], +r[2]] : g ? (g[1][0] === '>' ? [+g[2] + (g[1] === '>' ? 1 : 0), 9999] : [0, +g[2] - (g[1] === '<' ? 1 : 0)]) : e ? [+e[1], +e[1]] : null; if (F.annee) interp.push('année : ' + v); }
    else if (k === 'art' || k === 'article') { F.art = v.replace(/[^a-z0-9.-]/g, ''); interp.push('article : ' + F.art); }
    else if (k === 'theme') { F.th = v; interp.push('thème : ' + v); }
    else if (k === 'cours') { F.cours = v; interp.push('cours : ' + v); }
    else if (k === 'unite') { F.unite = unite(v) || v; interp.push('unité : ' + v); }
    else if (k === 'valeur') { const r = v.match(/^(\d+(?:[.,]\d+)?)\.\.(\d+(?:[.,]\d+)?)$/), o = v.match(/^(>=|<=|>|<|=)?(\d+(?:[.,]\d+)?)(k|m|md|mds)?$/);
      if (r) { F.num.push({ op: '>=', v: parseFloat(r[1].replace(',', '.')) }, { op: '<=', v: parseFloat(r[2].replace(',', '.')) }); interp.push('valeur : ' + v); } else if (o) { F.num.push({ op: o[1] || '=', v: mult(o[2].replace(',', '.'), o[3]) }); interp.push('valeur ' + (o[1] || '=') + ' ' + o[2]); } }
    else if (k === 'titre' || k === 'intitle') { titreSeul.push(v); interp.push('dans le titre : ' + v); }
    return ' '; });
  /* 3. comparaisons directes : > 30 jours, >=60j, 10..30 mois */
  reste = reste.replace(/(>=|<=|>|<|=)\s*(\d+(?:[.,]\d+)?)\s*(k|md|mds|m|millions?|milliards?)?\s*(jours?|j|mois|ans?|%|fcfa|heures?|semaines?)?(?![a-z])/gi, (m, op, n, mu, u) => { F.num.push({ op, v: mult(n.replace(',', '.'), mu) }); if (u) F.unite = unite(u); interp.push('valeur ' + op + ' ' + n + (mu ? ' ' + mu : '') + (u ? ' ' + u : '')); return ' '; });
  reste = reste.replace(/(\d+(?:[.,]\d+)?)\s*\.\.\s*(\d+(?:[.,]\d+)?)\s*(jours?|j|mois|ans?|%|fcfa|heures?|semaines?)?/gi, (m, a, b, u) => { F.num.push({ op: '>=', v: parseFloat(a.replace(',', '.')) }, { op: '<=', v: parseFloat(b.replace(',', '.')) }); if (u) F.unite = unite(u); interp.push('valeur entre ' + a + ' et ' + b + (u ? ' ' + u : '')); return ' '; });
  /* 4. exclusions -mot, obligatoires +mot, OR / |, jokers mot* */
  const exclus = [], requis = [], jokers = [];
  reste = reste.replace(/(?:^|\s)-([\p{L}\d]{2,})/gu, (m, x) => { exclus.push(norm(x)); interp.push('sans « ' + x + ' »'); return ' '; });
  reste = reste.replace(/(?:^|\s)\+([\p{L}\d]{2,})/gu, (m, x) => { requis.push(stem(norm(x))); return ' ' + x + ' '; });
  reste = reste.replace(/([\p{L}\d]+)\*/gu, (m, x) => { jokers.push(norm(x)); interp.push(x + '*'); return ' '; });
  for (let i = 0; i < 4; i++) reste = reste.replace(/(\S+)\s+(?:OR|\|)\s+(\S+)/g, '$1§$2');
  let n = prep(' ' + norm(reste) + ' ');
  /* 5. contraintes numériques en langage naturel : « plus de 30 jours », « au moins 10 millions », « entre 5 et 10 ans » */
  n = n.replace(new RegExp('entre ' + NUM + ' et ' + NUM + ' ?' + UNIT_RE + '?', 'g'), (m, a, b, u) => { F.num.push({ op: '>=', v: +a }, { op: '<=', v: +b }); if (u) F.unite = unite(u); interp.push('valeur entre ' + a + ' et ' + b + (u ? ' ' + unite(u) : '')); return ' '; });
  NUMOP.forEach(([re, op]) => { n = n.replace(new RegExp('\\b' + re.source + ' ' + NUM + ' ?' + UNIT_RE + '?', 'g'), (m, a, u) => { F.num.push({ op, v: +a }); if (u) F.unite = unite(u); interp.push('valeur ' + op + ' ' + a + (u ? ' ' + unite(u) : '')); return ' '; }); });
  /* 6. forme de la question -> type de contenu attendu */
  const intents = new Set(); NL.forEach(([re, y]) => { if (re.test(n)) intents.add(y); });
  const art = F.art || (n.match(/\bart(?:icles?)?\.?\s*(\d+)/) || [])[1] || '';
  CANON.forEach(([re, c]) => { n = n.replace(re, ' ' + c + ' '); re.lastIndex = 0; });
  n = n.replace(/\b(?:combien de temps|dans quel delai|sous quel delai|a quelle echeance|jusqu'a quand|au bout de combien de temps)\b/g, ' delai ').replace(/\b(?:combien coute|combien payer|quel cout)\b/g, ' montant ');
  n = n.replace(/\b(?:qu'est[- ]ce que?|c'est quoi|que veut dire|que signifie|a quoi sert|en quoi consiste|quelle est la difference entre|quelle difference entre|difference entre|differences? entre)\b/g, ' ');
  n = n.replace(/\b[ldsjcmnt]'/g, ' ');
  const mots = toks(n.replace(/§/g, ' § ')).filter(t => t === '§' || (t.length > 1 && !STOPS.has(t)) || /^\d$/.test(t));
  /* concepts : un mot = un concept ; « a § b » = un concept à deux mots (OR) */
  const vu = new Set(), cs = []; let prev = null, lien = false;
  mots.forEach(w => { if (w === '§') { lien = true; return; } const k = stem(w);
    if (lien && prev) { prev.push(w); lien = false; return; } lien = false;
    if (vu.has(k)) return; vu.add(k); prev = [w]; cs.push(prev); });
  jokers.forEach(j => cs.push(['*' + j]));
  titreSeul.forEach(w => { if (!vu.has(stem(w))) { vu.add(stem(w)); cs.push([w]); } });
  return { cs, intents, art, phrases, nonPhrases, exclus, requis, titreSeul, F, interp, brut: norm(q).replace(/"[^"]*"/g, ' ').replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ').trim(),
    nums: toks(n).filter(t => /^\d+(\.\d+)?$/.test(t)).map(Number), dirige: /\b(?:dirige|dirigeants?|directeur general|dg|pdg|president|patron|chef)\b/.test(norm(q)) };
}

const okFiltre = (it, F, type, course) => {
  if (type && it.type !== type) return false; if (course && it.p.id !== course) return false;
  if (F.type && it.type !== F.type) return false; if (F.y && it.y !== F.y) return false;
  if (F.org && (it.org || '') !== F.org) return false;
  if (F.statut && (it.statut || (it.abroge ? 'abroge' : 'en_vigueur')) !== F.statut) return false;
  if (F.src.length && !F.src.every(s => (it.tid || '') === s || norm(it.course || '').includes(s))) return false;
  if (F.annee && !(it.yr && it.yr >= F.annee[0] && it.yr <= F.annee[1])) return false;
  if (F.art && !(it.art && norm(it.art).includes(F.art))) return false;
  if (F.th && !(it.th && it.th.includes(F.th))) return false;
  if (F.cours && !(it.p.id && it.p.id.includes(F.cours))) return false;
  if (F.num.length) { if (typeof it.x !== 'number') return false; for (const { op, v } of F.num) { if (op === '>' && !(it.x > v)) return false; if (op === '>=' && !(it.x >= v)) return false; if (op === '<' && !(it.x < v)) return false; if (op === '<=' && !(it.x <= v)) return false; if (op === '=' && it.x !== v) return false; } }
  if (F.unite && !(it.u && norm(it.u).startsWith(F.unite))) return false;
  return true;
};

/* ---------- la recherche ---------- */
function search(q, { type = '', course = '' } = {}) {
  const I = inverse(), docs = build(), A = analyser(q), F = A.F;
  const filtresSeuls = !A.cs.length && (F.type || F.y || F.org || F.statut || F.src.length || F.annee || F.art || F.th || F.cours || F.num.length || F.unite);
  if (!A.cs.length && !filtresSeuls) return { hits: [], toks: [], fuzzy: false, relaxed: false, interp: A.interp, proches: [] };
  const corrections = [], hl = new Set();
  const conc = A.cs.map((groupe, gi) => { const c = new Map();
    groupe.forEach(w => { if (w[0] === '*') { const p = stem(w.slice(1)); let k = 0; for (const t of I.vocab) if (t.startsWith(p) && ++k < 80) { if (!c.has(t)) c.set(t, .9); } hl.add(w.slice(1)); return; }
      const r = candidats(I, w, gi === A.cs.length - 1 && w.length >= 3 && groupe.length === 1); if (r.typo) corrections.push([w, r.typo]); hl.add(w);
      r.c.forEach((p, t) => { if ((c.get(t) || 0) < p) c.set(t, p); if (p >= .6 || t.length >= 4) hl.add(I.surf.get(t) && p >= .72 ? I.surf.get(t) : t); }); });
    return c; });
  const excl = new Set(); A.exclus.forEach(x => { const l = I.post.get(stem(x)) || []; for (let k = 0; k < l.length; k += 2) excl.add(l[k]); });
  const requis = A.requis;
  const doux = new Set(); if (A.cs.length >= 3) A.cs.forEach((g, i) => { if (g.length === 1 && ['cosumaf', 'bvmac'].includes(g[0])) doux.add(i); });
  const n = conc.length - doux.size;
  const comparaison = A.intents.has('comparaison');
  const needStrict = comparaison ? 1 : n <= 2 ? n : Math.ceil(n * .65);
  const phrase = A.brut, sig = A.cs.filter(g => g[0][0] !== '*').map(g => stem(g[0]));
  const iy = new Set(); A.intents.forEach(k => (INTENT_Y[k] || []).forEach(y => iy.add(y)));
  const tout = (it) => it.nt + ' ' + it.nx;
  const run = (need, ff, extra) => { const acc = new Map();
    const ordre = conc.map((c, ci) => ci).sort((a, b) => (doux.has(a) ? 1 : 0) - (doux.has(b) ? 1 : 0));
    ordre.forEach(ci => { const c = conc[ci], best = new Map();
      c.forEach((p, t) => { const l = I.post.get(t), w = idf(I, t) * p; for (let k = 0; k < l.length; k += 2) { const i = l[k]; if (!okFiltre(docs[i], ff, type, course)) continue; const tf = l[k + 1], b = tf * 2.2 / (tf + 1.2 * (.4 + .6 * I.len[i] / I.avg)); const v = w * b; if (v > (best.get(i) || 0)) best.set(i, v); } });
      if (doux.has(ci)) { best.forEach((v, i) => { const a = acc.get(i); if (a) a.sc += v * .5; }); return; }
      best.forEach((v, i) => { const a = acc.get(i); if (a) { a.sc += v; a.m++; a.set.add(ci); } else acc.set(i, { sc: v, m: 1, set: new Set([ci]) }); }); });
    if (!conc.length) docs.forEach((it, i) => { if (okFiltre(it, ff, type, course)) acc.set(i, { sc: 1, m: 0, set: new Set() }); });
    let ex = null; if (extra && extra.size) { ex = new Map(); extra.forEach((p, t) => { const l = I.post.get(t); if (!l) return; const w = idf(I, t) * p; for (let k = 0; k < l.length; k += 2) { const i = l[k]; if (acc.has(i)) ex.set(i, (ex.get(i) || 0) + w * l[k + 1] * 2.2 / (l[k + 1] + 1.2)); } }); }
    const out = [];
    acc.forEach((a, i) => { if (a.m < need) return; const it = docs[i]; let sc = n ? a.sc * (a.m / n) ** 1.5 : 1; if (ex) sc += (ex.get(i) || 0) * .25;
      if (n) { let tm = 0; conc.forEach((c, ci) => { if (doux.has(ci)) return; for (const [t, p] of c) if (p >= .72 && it._tt.has(t)) { tm++; break; } }); sc *= 1 + .8 * tm / n; }
      if (n > 1 && it.nt.includes(phrase)) sc *= 2; else if (n > 1 && tout(it).includes(phrase)) sc *= 1.35;
      if (it.nt === phrase) sc *= 2; if (n > 1 && sig.every(t => it._tt.has(t))) sc *= 1.25;
      if (iy.size && (iy.has(it.y) || (it.type === 'definition' && iy.has('definition')))) sc *= 1.6;
      if (A.intents.has('role') && it.type === 'acteur') sc *= 1.8;
      if ((it.type === 'acteur' || it.type === 'definition') && it._tt.size <= 5 && sig.some(t => it._tt.has(t))) sc *= 1.5;
      if (it.type === 'acteur' && it.short && toks(norm(it.short)).some(t => sig.includes(stem(t)))) sc *= 3;
      if (A.art && it.art && norm(it.art).includes(A.art)) sc *= 2.5;
      if (A.nums.length && typeof it.x === 'number' && A.nums.includes(it.x)) sc *= 1.6;
      if (A.titreSeul.length && !A.titreSeul.every(t => it._tt.has(stem(t)))) return;
      if (requis.length && !requis.every(t => it._tt.has(t) || (I.post.get(t) || []).includes(i))) return;
      if (A.phrases.length && !A.phrases.every(p => tout(it).includes(prep(p)) || tout(it).includes(p))) return;
      if (A.nonPhrases.length && A.nonPhrases.some(p => tout(it).includes(p))) return;
      if (excl.has(i)) return;
      sc *= TYPES[it.type].w; if (it.abroge) sc *= .3; out.push({ it, sc, matched: a.m }); });
    return out.sort((a, b) => b.sc - a.sc); };
  /* expansion par pseudo-retour de pertinence : les mots qui reviennent dans les meilleurs résultats aident à classer les autres */
  const expansion = tops => { const sc = new Map(); tops.slice(0, 6).forEach(({ it }) => (it._tf || new Map()).forEach((v, t) => { if (t.length < 4 || /^\d/.test(t)) return; sc.set(t, (sc.get(t) || 0) + v * idf(I, t)); }));
    const used = new Set(conc.flatMap(c => [...c.keys()])), ex = new Map(); [...sc].filter(([t]) => !used.has(t)).sort((a, b) => b[1] - a[1]).slice(0, 6).forEach(([t]) => ex.set(t, .5)); return ex; };
  let ff = F, hits = run(needStrict, ff), relaxed = false, filtreRelache = false;
  if (!hits.length && (F.num.length || F.unite) && n) { ff = { ...F, num: [], unite: '' }; hits = run(needStrict, ff); filtreRelache = hits.length > 0; }
  if (hits.length < 8 && n > 1) { const deja = new Set(hits.map(h => h.it)); const plus = run(1, ff).filter(h => !deja.has(h.it)).map(h => ({ ...h, sc: h.sc * .4 })); if (plus.length) { hits = hits.concat(plus); relaxed = true; } }
  if (hits.length >= 3 && n) { const r = run(relaxed ? 1 : needStrict, ff, expansion(hits)); if (r.length) hits = relaxed ? r.map(h => ({ ...h, sc: h.matched >= needStrict ? h.sc : h.sc * .4 })).sort((a, b) => b.sc - a.sc) : r; }
  const interp = A.interp.slice(); A.intents.forEach(k => interp.unshift(INTENT_NOM[k]));
  let proches = []; if (!hits.length) proches = proche(A.brut);
  return { hits, toks: [...hl].filter(t => t.length > 1), fuzzy: corrections.length ? A.cs.map(g => (corrections.find(c => c[0] === g[0]) || [0, g[0]])[1]) : false, relaxed, interp: [...new Set(interp)], proches, filtreRelache, A };
}

/* titres les plus proches quand rien n'est trouvé (trigrammes) */
let TRI = null;
const tri = s => { s = ' ' + s + ' '; const r = new Set(); for (let i = 0; i < s.length - 2; i++) r.add(s.slice(i, i + 3)); return r; };
function proche(q) { if (!q) return [];
  if (!TRI) TRI = build().filter(it => ['definition', 'texte', 'acteur', 'repere'].includes(it.type)).map(it => ({ it, t: tri(it.nt) }));
  const a = tri(q), out = []; TRI.forEach(({ it, t }) => { let c = 0; a.forEach(g => { if (t.has(g)) c++; }); const j = c / (a.size + t.size - c); if (j >= .22) out.push([it, j - (it.abroge ? .3 : 0)]); });
  return out.sort((x, y) => y[1] - x[1]).slice(0, 4).map(([it]) => it); }

/* suggestions pendant la frappe : titres de définitions, textes, acteurs et repères dont les mots commencent comme la saisie */
function suggere(q, max = 6) {
  const p = toks(norm(q)).filter(t => !STOPS.has(t)); if (!p.length) return [];
  const last = p[p.length - 1], first = p.slice(0, -1).map(stem), out = [], seen = new Set();
  build().forEach(it => { if (!['definition', 'texte', 'acteur', 'repere'].includes(it.type)) return; if (!it._tt && it.nt) it._nw = it._nw || toks(it.nt);
    const ws = it._nw || toks(it.nt); it._nw = ws; if (!ws.some(w => w.startsWith(last))) return; const st = ws.map(stem); if (!first.every(f => st.includes(f))) return;
    if (seen.has(it.nt)) return; seen.add(it.nt); out.push([it, TYPES[it.type].w - it.title.length / 120 - (it.abroge ? 3 : 0)]); });
  return out.sort((a, b) => b[1] - a[1]).slice(0, max).map(([it]) => it);
}

/* extrait autour du premier mot trouvé + surlignage */
const hlAccent = (text, toks) => { // surligne en ignorant les accents
  const n = norm(text); const spans = []; toks.forEach(k => { if (!k || k.length < 2) return; let i = 0; while ((i = n.indexOf(k, i)) >= 0) { spans.push([i, i + k.length]); i += k.length; } });
  if (!spans.length) return esc(text); spans.sort((a, b) => a[0] - b[0]); const merged = []; spans.forEach(s => { const l = merged[merged.length - 1]; if (l && s[0] <= l[1]) l[1] = Math.max(l[1], s[1]); else merged.push([...s]); });
  let out = '', pos = 0; merged.forEach(([a, b]) => { b = Math.max(b, (/^[a-z0-9]*/.exec(n.slice(b)) || [''])[0].length + b); out += esc(text.slice(pos, a)) + '<mark>' + esc(text.slice(a, b)) + '</mark>'; pos = b; }); return out + esc(text.slice(pos)); };
const snippet = (text, toks, len = 170) => { const n = norm(text); let at = -1; for (const k of toks) { const i = n.indexOf(k); if (i >= 0 && (at < 0 || i < at)) at = i; }
  if (at < 0 || text.length <= len) return text.length > len ? text.slice(0, len).replace(/\s+\S*$/, '') + '…' : text;
  const a = Math.max(0, at - 50), b = Math.min(text.length, a + len); return (a ? '…' : '') + text.slice(a, b).replace(/^\S*\s/, a ? '' : '$&').replace(/\s+\S*$/, b < text.length ? '' : '$&') + (b < text.length ? '…' : ''); };

B.rech = { search, suggere, TYPES, hlAccent, snippet, link: (it, q) => it.href || `#/cours/${it.p.id}?t=${TYPES[it.type].tab === 'cartes' || TYPES[it.type].tab === 'quiz' ? 'resume' : TYPES[it.type].tab}&ch=${it.c.id}&hl=${encodeURIComponent(q)}` };
/* surlignage des termes cherchés dans les pages de cours (paramètre hl) */
B.highlight = (root, q) => {
  const ws = toks(norm(q)).filter(t => t.length > 2 && !STOPS.has(t)); if (!ws.length || !root) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: n => n.parentElement.closest('script,style,mark,svg') || !n.textContent.trim() ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT });
  const nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(n => { const nt = norm(n.textContent); if (!ws.some(t => nt.includes(t))) return; const span = document.createElement('span'); span.innerHTML = hlAccent(n.textContent, ws); n.replaceWith(...span.childNodes); });
  const first = root.querySelector('mark'); if (first) setTimeout(() => first.scrollIntoView({ block: 'center', behavior: 'smooth' }), 250);
};
};
