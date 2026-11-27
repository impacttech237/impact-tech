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
const FAMILLES = [['delai', 'duree', 'echeance', 'periode'], ['agrement', 'agreer', 'agree', 'agrer', 'habilitation', 'licence'], ['sanction', 'amende', 'penalite', 'peine', 'pecuniaire', 'disciplinaire'],
  ['commission', 'courtage', 'frais', 'tarif', 'tarification', 'cout', 'redevance', 'remuneration', 'honoraires'], ['montant', 'somme', 'plafond'], ['sdb', 'courtier', 'negociateur'], ['sgo', 'gestionnaire'],
  ['opc', 'opcvm', 'fonds'], ['cosumaf', 'regulateur'], ['cotation', 'cote', 'ipo'], ['interdit', 'interdiction', 'prohibe', 'defendu'], ['declaration', 'notification', 'declarer', 'notifier'],
  ['radiation', 'retrait', 'delistage'], ['suspension', 'suspendre', 'suspendu', 'interruption'], ['abroge', 'abrogation', 'remplace', 'supprime'], ['cac', 'auditeur', 'audit'],
  ['dirigeant', 'dirige', 'diriger', 'dg', 'pdg', 'directeur'], ['conservation', 'archivage', 'conserver'], ['initie', 'privilegie'], ['lbc', 'blanchiment', 'lcb'], ['capital', 'capitaux'], ['visa', 'autorisation'],
  ['acheter', 'achat', 'acquisition', 'acquerir'], ['vendre', 'vente', 'cession', 'ceder'], ['investisseur', 'souscripteur', 'epargnant', 'porteur'], ['bvmac', 'bourse']];
/* ce que laisse entendre la forme de la question : on remonte les repères du bon type */
const INTENTS = [[/\b(?:combien de temps|dans quel delai|quel delai|a quelle echeance|jusqu'a quand|quand|delais?|duree)\b/, 'delai'], [/\b(?:combien|quel montant|quels montants|cout|plafond|minimum|minimal|maximum|taux|pourcentage|tarif|capital|seuil)\b/, 'montant'],
  [/\b(?:qui|quel organe|qui est charge|responsable|competent|competente)\b/, 'role'], [/\b(?:qu'est[- ]ce|c'est quoi|que signifie|que veut dire|definition|definir|signifie)\b/, 'definition']];
const STOPS = new Set("de du des la le les un une et au aux en d l a ou pour par sur dans qui que quoi quel quelle quels quelles est sont ce cet cette ces se sa son ses leur leurs il elle ils on y combien comment faut faire met mettre mets prend prendre doit doivent peut peuvent avoir etre avec sans plus quand lorsque si ne pas non oui mon ma mes qu est art article articles cas fait faite pourcent".split(' '));

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
    const tt = toks(prep(it.nt)).map(stem), tx = toks(prep(it.nx)).map(stem), tf = new Map();
    tt.forEach(t => tf.set(t, (tf.get(t) || 0) + 3)); tx.forEach(t => tf.set(t, (tf.get(t) || 0) + 1));
    len[i] = tt.length * 3 + tx.length; tot += len[i]; it._tt = new Set(tt);
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

/* ---------- la recherche ---------- */
function analyser(q) {
  let n = prep(' ' + norm(q) + ' ');
  const phrases = []; n = n.replace(/"([^"]+)"/g, (m, p) => { phrases.push(p.trim()); return ' ' + p + ' '; });
  const exclus = []; n = n.replace(/(?:^|\s)-([a-z0-9]{2,})/g, (m, x) => { exclus.push(stem(x)); return ' '; });
  const intents = new Set(); INTENTS.forEach(([re, y]) => { if (re.test(n)) intents.add(y); });
  const art = (n.match(/\bart(?:icles?)?\.?\s*(\d+)/) || [])[1] || '';
  CANON.forEach(([re, c]) => { n = n.replace(re, ' ' + c + ' '); re.lastIndex = 0; });
  n = n.replace(/\b(?:combien de temps|dans quel delai|quel delai|a quelle echeance|jusqu'a quand)\b/g, ' delai ').replace(/\b(?:combien coute|combien payer|quel cout)\b/g, ' montant ');
  n = n.replace(/\b[ldsjcmnt]'/g, ' ');
  const mots = toks(n).filter(t => t.length > 1 && !STOPS.has(t) && !/^\d$/.test(t) || /^\d{2,}/.test(t));
  const vu = new Set(), cs = []; mots.forEach(w => { const k = stem(w); if (!vu.has(k)) { vu.add(k); cs.push(w); } });
  return { cs, intents, art, phrases, exclus, brut: norm(q).trim() };
}
function search(q, { type = '', course = '' } = {}) {
  const I = inverse(), docs = build(), A = analyser(q);
  if (!A.cs.length) return { hits: [], toks: [], fuzzy: false, relaxed: false };
  const ok = i => { const it = docs[i]; return (!type || it.type === type) && (!course || it.p.id === course); };
  const corrections = [], hl = new Set();
  const conc = A.cs.map((w, i) => { const { c, typo } = candidats(I, w, i === A.cs.length - 1 && w.length >= 3); if (typo) corrections.push([w, typo]); hl.add(w); c.forEach((p, t) => { if (p >= .6 || t.length >= 4) hl.add(I.surf.get(t) && p >= .72 ? I.surf.get(t) : t); }); return c; });
  const excl = new Set(); A.exclus.forEach(x => { const l = I.post.get(x) || []; for (let k = 0; k < l.length; k += 2) excl.add(l[k]); });
  const n = conc.length, needStrict = n <= 2 ? n : Math.ceil(n * .65);
  const run = need => { const acc = new Map();
    conc.forEach(c => { const best = new Map();
      c.forEach((p, t) => { const l = I.post.get(t), w = idf(I, t) * p; for (let k = 0; k < l.length; k += 2) { const i = l[k]; if (!ok(i)) continue; const tf = l[k + 1], b = tf * 2.2 / (tf + 1.2 * (.4 + .6 * I.len[i] / I.avg)); const v = w * b; if (v > (best.get(i) || 0)) best.set(i, v); } });
      best.forEach((v, i) => { const a = acc.get(i); if (a) { a.sc += v; a.m++; } else acc.set(i, { sc: v, m: 1 }); }); });
    const out = [], sig = A.cs.map(w => stem(w)); const phrase = A.brut.replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ').trim();
    acc.forEach((a, i) => { if (a.m < need) return; const it = docs[i]; let sc = a.sc * (a.m / n) ** 1.5;
      if (n > 1 && it.nt.includes(phrase)) sc *= 2; else if (n > 1 && it.nx.includes(phrase)) sc *= 1.35;
      if (it.nt === phrase) sc *= 2; if (n > 1 && sig.every(t => it._tt.has(t))) sc *= 1.25;
      if (A.intents.size && (A.intents.has(it.y) || (it.type === 'definition' && A.intents.has('definition')))) sc *= 1.6;
      if (A.intents.has('role') && it.type === 'acteur') sc *= 1.8;
      if ((it.type === 'acteur' || it.type === 'definition') && it._tt.size <= 5 && sig.some(t => it._tt.has(t))) sc *= 1.5;
      if (A.art && it.art && norm(it.art).includes(A.art)) sc *= 2.5;
      if (A.phrases.length && !A.phrases.every(p => (it.nt + ' ' + it.nx).includes(prep(p)) || (it.nt + ' ' + it.nx).includes(p))) return;
      if (excl.has(i)) return;
      sc *= TYPES[it.type].w; if (it.abroge) sc *= .3; out.push({ it, sc, matched: a.m }); });
    return out.sort((a, b) => b.sc - a.sc); };
  let hits = run(needStrict), relaxed = false;
  if (!hits.length && n > 1) { hits = run(1); relaxed = hits.length > 0; }
  return { hits, toks: [...hl].filter(t => t.length > 1), fuzzy: corrections.length ? A.cs.map(w => (corrections.find(c => c[0] === w) || [0, w])[1]) : false, relaxed };
}

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
