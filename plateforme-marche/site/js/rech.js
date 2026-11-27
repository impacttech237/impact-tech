/* Recherche dans les cours d'Excellence COSUMAF (olympiades/js/recherche.js), sans la page. Initialisée par app.js : RECH(B). */
/* Recherche globale : définitions, fiches, cartes, questions, exemples, résumés, schémas — dans tous les cours */
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

let INDEX = null, sig = '';
function build() {
  const s = S.packs.map(p => p.id + p.chapitres.length).join();
  if (INDEX && s === sig) return INDEX; sig = s; INDEX = [];
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

/* distance d'édition (tolérance aux fautes de frappe) */
const lev = (a, b) => { if (Math.abs(a.length - b.length) > 2) return 3; const d = Array.from({ length: a.length + 1 }, (_, i) => [i]); for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return d[a.length][b.length]; };

/* mots vides et familles de mots : un professionnel ne tape pas le mot exact du rédacteur */
const STOPS = new Set("de du des la le les un une et au aux en d l a ou pour par sur dans qui que quoi quel quelle quels quelles est sont ce cet cette ces se sa son ses leur leurs il elle ils on y combien comment faut faire met mettre mets prend prendre doit doivent peut peuvent avoir etre avec sans plus quand lorsque si ne pas non oui pour mon ma mes".split(' '));
const PHRASES = [[/combien de temps|dans quel delai|quel delai|en combien de temps|a quelle echeance/g, ' delai '], [/societes? de bourse/g, ' sdb '], [/offres? publiques? de vente/g, ' opv '], [/appels? publics? a l'epargne/g, ' ape '], [/combien coute|combien payer|quel cout/g, ' montant ']];
const FAMILLES = [['delai', 'duree', 'echeance'], ['agrement', 'agreer', 'agree', 'agrer', 'autorisation d\'exercer'], ['sdb', 'societe de bourse', 'societes de bourse', 'intermediaire de marche', 'intermediaires de marche'], ['opv', 'offre publique de vente'], ['ape', 'appel public a l\'epargne'], ['montant', 'plafond', 'tarif', 'frais'], ['commission', 'courtage', 'remuneration'], ['capital', 'fonds propres'], ['sanction', 'amende', 'penalite'], ['interdit', 'interdiction', 'prohibe'], ['obligation', 'obligations', 'devoir'], ['depositaire', 'depositaire central', 'conservateur']];
const stem = w => { w = w.replace(/[sx]$/, ''); return w.length >= 7 ? w.slice(0, w.length - 2) : w; };
const rx = a => new RegExp('(?:^|[^a-z0-9])' + a.split(/\s+/).map(w => stem(w).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[a-z0-9]*').join('\\s+'));
function concepts(q) {
  let n = ' ' + norm(q) + ' ';
  PHRASES.forEach(([re, to]) => { n = n.replace(re, to); });
  n = n.replace(/\b[ldsjcmnt]'/g, ' ');
  const ws = n.split(/[^a-z0-9']+/).filter(t => t.length > 1 && !STOPS.has(t));
  const seen = new Set(), out = [];
  ws.forEach(w => { const f = FAMILLES.find(g => g.includes(w) || g.includes(w.replace(/s$/, ''))); const key = f ? f[0] : w; if (seen.has(key)) return; seen.add(key);
    const alts = f ? f.map((a, i) => ({ a, w: a === w || a === w.replace(/s$/, '') ? 1 : .7, re: rx(a) })) : [{ a: w, w: 1, re: rx(w) }];
    if (f && !alts.some(x => x.w === 1)) alts.unshift({ a: w, w: 1, re: rx(w) });
    out.push({ w, alts }); });
  return out;
}

function search(q, { type = '', course = '' } = {}) {
  const cs = concepts(q); const toks = [...new Set(cs.flatMap(c => c.alts.map(x => x.a)))].filter(t => t.length > 1);
  if (!cs.length) return { hits: [], toks, fuzzy: false };
  const phrase = cs.map(c => c.w).join(' ');
  const all = build().filter(it => (!type || it.type === type) && (!course || it.p.id === course));
  const run = (cs, need) => { const out = [];
    for (const it of all) { let sc = 0, matched = 0;
      for (const c of cs) { let best = 0;
        for (const x of c.alts) { let m = 0;
          if (it.nt === x.a) m += 14; else if (x.re.test(it.nt)) m += it.nt.startsWith(x.a.split(' ')[0].slice(0, 4)) ? 9 : 7;
          if (x.re.test(it.nx)) m += 2.5; m *= x.w; if (m > best) best = m; }
        if (best) { matched++; sc += best; } }
      if (matched < need) continue;
      if (cs.length > 1 && it.nt.includes(phrase)) sc += 12;
      sc *= TYPES[it.type].w * (matched / cs.length) ** 1.6; if (it.abroge) sc *= .3;
      out.push({ it, sc, matched }); }
    return out; };
  const needStrict = cs.length <= 2 ? cs.length : Math.ceil(cs.length * .66);
  let hits = run(cs, needStrict), fuzzy = false;
  if (!hits.length) { // tolérance : fautes de frappe sur les mots du titre
    const words = new Set(); all.forEach(it => it.nt.split(/[^a-z0-9']+/).forEach(w => w.length > 3 && words.add(w)));
    const fixed = cs.map(c => { const t = c.w; if (t.length < 4) return t; let best = t, bd = t.length > 6 ? 3 : 2; words.forEach(w => { const d = lev(t, w); if (d < bd) { bd = d; best = w; } }); return best; });
    if (fixed.join() !== cs.map(c => c.w).join()) { fuzzy = fixed; hits = run(concepts(fixed.join(' ')), needStrict); }
    if (!hits.length) hits = run(cs, Math.max(1, Math.ceil(cs.length / 2))).map(h => ({ ...h, sc: h.sc * .5 }));
  }
  hits.sort((a, b) => b.sc - a.sc); return { hits, toks, fuzzy };
}

/* extrait autour du premier mot trouvé + surlignage */
const hl = (text, toks) => { let t = esc(text); toks.forEach(k => { const re = new RegExp('(' + k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi'); t = t.replace(re, '<mark>$1</mark>'); }); return t; };
const hlAccent = (text, toks) => { // surligne en ignorant les accents
  const n = norm(text); const spans = []; toks.forEach(k => { let i = 0; while ((i = n.indexOf(k, i)) >= 0) { spans.push([i, i + k.length]); i += k.length; } });
  if (!spans.length) return esc(text); spans.sort((a, b) => a[0] - b[0]); const merged = []; spans.forEach(s => { const l = merged[merged.length - 1]; if (l && s[0] <= l[1]) l[1] = Math.max(l[1], s[1]); else merged.push([...s]); });
  let out = '', pos = 0; merged.forEach(([a, b]) => { out += esc(text.slice(pos, a)) + '<mark>' + esc(text.slice(a, b)) + '</mark>'; pos = b; }); return out + esc(text.slice(pos)); };
const snippet = (text, toks, len = 170) => { const n = norm(text); let at = -1; for (const k of toks) { const i = n.indexOf(k); if (i >= 0 && (at < 0 || i < at)) at = i; }
  if (at < 0 || text.length <= len) return text.length > len ? text.slice(0, len).replace(/\s+\S*$/, '') + '…' : text;
  const a = Math.max(0, at - 50), b = Math.min(text.length, a + len); return (a ? '…' : '') + text.slice(a, b).replace(/^\S*\s/, a ? '' : '$&').replace(/\s+\S*$/, b < text.length ? '' : '$&') + (b < text.length ? '…' : ''); };

const link = (it, q) => { const base = `#/cours/${it.p.id}`; const hlq = `&hl=${encodeURIComponent(q)}`;
  if (it.type === 'carte') return `${base}/cartes?ch=${it.c.id}`; if (it.type === 'question') return `${base}/quiz?ch=${it.c.id}`;
  return `${base}?t=${TYPES[it.type].tab}&ch=${it.c.id}${hlq}`; };
B.rech = { search, TYPES, hlAccent, snippet, link: (it, q) => it.href || `#/cours/${it.p.id}?t=${TYPES[it.type].tab === 'cartes' || TYPES[it.type].tab === 'quiz' ? 'resume' : TYPES[it.type].tab}&ch=${it.c.id}&hl=${encodeURIComponent(q)}` };
/* surlignage des termes cherchés dans les pages de cours (paramètre hl) */
B.highlight = (root, q) => {
  const toks = norm(q).split(/[^a-z0-9']+/).filter(t => t.length > 1); if (!toks.length || !root) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: n => n.parentElement.closest('script,style,mark,svg') || !n.textContent.trim() ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT });
  const nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(n => { const nt = norm(n.textContent); if (!toks.some(t => nt.includes(t))) return; const span = document.createElement('span'); span.innerHTML = hlAccent(n.textContent, toks); n.replaceWith(...span.childNodes); });
  const first = root.querySelector('mark'); if (first) setTimeout(() => first.scrollIntoView({ block: 'center', behavior: 'smooth' }), 250);
};
};
