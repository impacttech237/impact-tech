/* Recherche dans les cours d'Excellence COSUMAF (olympiades/js/recherche.js), sans la page. Initialisée par app.js : RECH(B). */
/* Recherche globale : définitions, fiches, cartes, questions, exemples, résumés, schémas — dans tous les cours */
window.RECH = B => {
'use strict';
const { $, $$, esc, S } = B;
const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[’']/g, "'");
const strip = t => String(t || '').replace(/\*\*/g, '').replace(/(^|\n)\s*(?:[-*]|\d+\.)\s+/g, '$1').replace(/\n+/g, ' · ').replace(/\s+/g, ' ').trim();

const TYPES = {
  definition: { nom: 'Définitions', ic: 'book-marked', w: 1.6, tab: 'gloss', col: '#ffe14a' },
  fiche: { nom: 'Fiches', ic: 'notebook-pen', w: 1.3, tab: 'fiches', col: '#ffb8d1' },
  schema: { nom: 'Schémas', ic: 'network', w: 1.1, tab: 'schemas', col: '#bcd7ff' },
  prof: { nom: 'Cours oral', ic: 'message-circle', w: 1.2, tab: 'prof', col: '#ffd0a8' },
  exemple: { nom: 'Exemples', ic: 'lightbulb', w: 1.1, tab: 'exemples', col: '#a9f0d0' },
  resume: { nom: 'Résumés', ic: 'book-open', w: 1.0, tab: 'resume', col: '#ffd3a3' },
  carte: { nom: 'Flashcards', ic: 'layers', w: .9, tab: 'cartes', col: '#d9c8ff' },
  question: { nom: 'Questions', ic: 'circle-check', w: .8, tab: 'quiz', col: '#c4f1dd' },
  texte: { nom: 'Textes officiels', sing: 'Texte officiel', ic: 'file-text', w: 1.5, tab: '', col: '#fff27a' },
  repere: { nom: 'Délais, montants, rôles', sing: 'Repère', ic: 'scale', w: 1.1, tab: '', col: '#a9f0d0' },
  acteur: { nom: 'Acteurs', ic: 'users', w: 1.3, tab: '', col: '#bcd7ff' },
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

function search(q, { type = '', course = '' } = {}) {
  const toks = norm(q).split(/[^a-z0-9']+/).filter(t => t.length > 1); if (!toks.length) return { hits: [], toks, fuzzy: false };
  const phrase = norm(q).trim();
  const score = (it, ts, strict) => { let sc = 0, matched = 0;
    for (const t of ts) { let m = 0;
      if (it.nt === t) m += 14; else if (it.nt.startsWith(t)) m += 9; else if (new RegExp('\\b' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).test(it.nt)) m += 7; else if (it.nt.includes(t)) m += 4;
      if (it.nx.includes(t)) m += (it.nx.split(t).length - 1 > 2 ? 3 : 2);
      if (m) matched++; sc += m; }
    if (strict && matched < ts.length) return 0;
    if (!matched) return 0;
    if (toks.length > 1 && it.nt.includes(phrase)) sc += 12; if (toks.length > 1 && it.nx.includes(phrase)) sc += 5;
    return sc * TYPES[it.type].w; };
  const all = build().filter(it => (!type || it.type === type) && (!course || it.p.id === course));
  let hits = all.map(it => ({ it, sc: score(it, toks, true) })).filter(h => h.sc > 0);
  let fuzzy = false;
  if (!hits.length) { // tolérance : fautes de frappe sur les mots du titre
    const words = new Set(); all.forEach(it => it.nt.split(/[^a-z0-9']+/).forEach(w => w.length > 3 && words.add(w)));
    const fix = toks.map(t => { if (t.length < 4) return t; let best = t, bd = t.length > 6 ? 3 : 2; words.forEach(w => { const d = lev(t, w); if (d < bd) { bd = d; best = w; } }); return best; });
    if (fix.join() !== toks.join()) { fuzzy = fix; hits = all.map(it => ({ it, sc: score(it, fix, true) })).filter(h => h.sc > 0); }
    if (!hits.length) hits = all.map(it => ({ it, sc: score(it, toks, false) * .5 })).filter(h => h.sc > 0);
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
