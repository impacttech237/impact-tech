/* Moteur d'exercices d'Excellence COSUMAF (olympiades/js/exercices.js, lignes 1 à 217) : générateurs, rendu, correction.
   Initialisé par app.js avec les fonctions de la plateforme : EXO(B). */
/* Moteur d'exercices : générateurs d'items + rendu + correction (réutilisé par les exercices, jeux et l'examen blanc) */
window.EXO = B => {
'use strict';
const { $, $$, esc, md, shuffle, S, save, touchDay } = B;

const norm = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[’']/g, "'").trim();
const sample = (a, n) => shuffle(a).slice(0, n);
const parseNum = t => { const x = Number(String(t).replace(/\s| /g, '').replace(',', '.').replace('%', '')); return Number.isFinite(x) && String(t).trim() !== '' ? x : null; };
const fmt = n => Number(n).toLocaleString('fr-FR', { maximumFractionDigits: 2 });

/* =============== générateurs =============== */
const chapters = (f = {}) => S.packs.filter(p => !f.pack || p.id === f.pack).flatMap(p => p.chapitres.filter(c => !f.ch || c.id === f.ch).map(c => ({ p, c })));
const defs = f => chapters(f).flatMap(({ p, c }) => (c.definitions || []).map(d => ({ ...d, p, c })));

const gen = B.gen = {
  qcm(f, n) {
    return sample(B.questions(f), n).map(q => {
      const order = shuffle(q.choix.map((_, i) => i));
      return { kind: 'qcm', q: q.q, choix: order.map(i => q.choix[i]), bonne: order.indexOf(q.bonne), explication: q.explication, qid: q.id, src: `${q.pack.titre} · ${q.chap.titre}` };
    });
  },
  vf(f, n) {
    const D = defs(f);
    if (D.length < 4) return [];
    return sample(D, n).map(d => {
      const vrai = Math.random() < 0.5;
      let other = d;
      if (!vrai) { const pool = D.filter(x => x.terme !== d.terme && x.definition !== d.definition); other = pool[Math.floor(Math.random() * pool.length)]; }
      return { kind: 'vf', enonce: `<b>${esc(d.terme)}</b> : ${esc(other.definition)}`, vrai,
        explication: vrai ? 'Exact : c\'est bien la définition de ce terme.' : `Faux. Cette définition correspond à « ${esc(other.terme)} ». <b>${esc(d.terme)}</b> : ${esc(d.definition)}`, src: `${d.p.titre} · ${d.c.titre}` };
    });
  },
  trous(f, n) {
    const out = [];
    const all = chapters(f);
    // 1) phrases à trous écrites à la main
    all.forEach(({ p, c }) => (c.trous || []).forEach(t => out.push(trousFromText(t, `${p.titre} · ${c.titre}`, all))));
    // 2) trous automatiques sur les définitions : retrouver le terme, ou deux mots-clés
    const D = defs(f), terms = D.map(d => d.terme).filter(t => t.length <= 32);
    D.forEach(d => {
      if (Math.random() < 0.5 && d.terme.length <= 32) {
        out.push(trousFromText(`{{${d.terme}}} : ${d.definition}`, `${d.p.titre} · ${d.c.titre}`, all, terms));
      } else {
        const words = [...new Set((d.definition.match(/[A-Za-zÀ-ÿ'’-]{7,}/g) || []).filter(w => !norm(d.terme).includes(norm(w))))];
        if (words.length < 2) { if (d.terme.length <= 32) out.push(trousFromText(`{{${d.terme}}} : ${d.definition}`, `${d.p.titre} · ${d.c.titre}`, all, terms)); return; }
        const pick = sample(words, 2); let txt = `${d.terme} : ${d.definition}`;
        pick.forEach(w => { txt = txt.replace(w, `{{${w}}}`); });
        out.push(trousFromText(txt, `${d.p.titre} · ${d.c.titre}`, all, words));
      }
    });
    return sample(out, n);
  },
  qro(f, n) {
    // réponses ouvertes : une question (carte ou définition), une réponse libre jugée sur ses mots-clés
    const out = [];
    chapters(f).forEach(({ p, c }) => (c.cartes || []).forEach(k => {
      const kw = keywords(k.verso); if (kw.length) out.push({ kind: 'qro', q: k.recto, modele: k.verso, kw, w: 2, src: `${p.titre} · ${c.titre}` });
    }));
    defs(f).forEach(d => { const kw = keywords(d.definition); if (kw.length >= 2) out.push({ kind: 'qro', q: `Définis : ${d.terme}.`, modele: d.definition, kw, w: 2, src: `${d.p.titre} · ${d.c.titre}` }); });
    return sample(out, n);
  },
  calcul(f, n) {
    const ids = f.pack ? [f.pack] : Object.keys(B.calculs);
    const fns = ids.flatMap(id => (B.calculs[id] || []).map(fn => ({ id, fn })));
    if (!fns.length) return [];
    const out = [];
    for (let i = 0; i < n; i++) { const { id, fn } = fns[i % fns.length]; const it = fn(); it.src = S.packs.find(p => p.id === id)?.titre || ''; out.push(it); }
    return shuffle(out);
  },
  classer(f, n) {
    const items = chapters(f).flatMap(({ p, c }) => (c.classer || []).flatMap(k => k.items.map(it => ({
      kind: 'classer', titre: k.titre, buckets: k.buckets, texte: it.t, bonne: it.b, why: it.why || '', src: `${p.titre} · ${c.titre}` }))));
    return sample(items, n);
  },
  ordre(f, n) {
    const items = chapters(f).flatMap(({ p, c }) => (c.ordre || []).map(o => ({ kind: 'ordre', titre: o.titre, items: o.items, consigne: o.consigne || '', src: `${p.titre} · ${c.titre}` })));
    return sample(items, n);
  },
};
/* réponses ouvertes : mots-clés de la réponse modèle et recherche dans la réponse libre */
const STOP = new Set('dans pour avec sans sont etre elle elles leur leurs cette ces ses aux des les une par sur que qui est ont plus moins tout tous toute toutes comme mais ainsi alors donc dont lors apres avant entre vers chez aussi peut peuvent doit doivent fait faire etc dire seulement evalues cela celui celle ceux selon lorsque quand puis'.split(' '));
const squash = s => norm(s).replace(/(\d)[\s ](?=\d{3}(\D|$))/g, '$1').replace(/(\d),(\d)/g, '$1.$2');
const tokens = s => squash(s).split(/[^a-z0-9.%]+/).map(w => w.replace(/^\.+|\.+$/g, '')).filter(Boolean);
function keywords(txt) {
  const seen = new Set(), ks = [];
  tokens(txt).forEach(w => { if (seen.has(w) || (!/\d/.test(w) && (w.length < 4 || STOP.has(w)))) return; seen.add(w); ks.push(w); });
  // les chiffres d'abord, puis les mots longs ; 6 mots-clés au plus
  return ks.map((w, i) => ({ w, i })).sort((a, b) => (/\d/.test(b.w) - /\d/.test(a.w)) || (b.w.length - a.w.length) || a.i - b.i).slice(0, 6).sort((a, b) => a.i - b.i).map(x => x.w);
}
const hasKw = (k, toks) => toks.some(t => t === k || (!/\d/.test(k) && k.length >= 5 && t.length >= 5 && t.slice(0, 5) === k.slice(0, 5) && (k.length < 8 || t.slice(0, 7) === k.slice(0, 7))));
function trousFromText(txt, src, all, extraBank = []) {
  const blanks = []; const parts = [];
  let last = 0; txt.replace(/\{\{([^}]+)\}\}/g, (m, w, idx) => { parts.push(txt.slice(last, idx)); blanks.push(w); last = idx + m.length; return m; });
  parts.push(txt.slice(last));
  let pool = [...new Set(extraBank.filter(w => !blanks.some(b => norm(b) === norm(w))))];
  if (pool.length < 3) pool = [...new Set(all.flatMap(({ c }) => (c.definitions || []).map(d => d.terme)).filter(w => w.length <= 32 && !blanks.some(b => norm(b) === norm(w))))];
  const bank = shuffle([...blanks, ...sample(pool, Math.max(2, 5 - blanks.length))]);
  return { kind: 'trous', parts, blanks, bank, src, explication: '' };
}

/* =============== rendu + correction par type =============== */
const optLetter = i => 'ABCD'[i];
const K = {
  qcm: {
    render(it, host, o) {
      const st = it.state ??= { v: null };
      host.innerHTML = `<p class="ex-q">${esc(it.q)}</p><div class="ex-opts">${it.choix.map((c, i) => `<button class="ex-opt ${st.v === i ? 'sel' : ''}" data-i="${i}"><span>${optLetter(i)}</span>${esc(c)}</button>`).join('')}</div>`;
      $$('.ex-opt', host).forEach(b => b.onclick = () => { if (it.locked) return; st.v = +b.dataset.i; K.qcm.render(it, host, o); o.onChange?.(); });
    },
    grade: it => { const ok = it.state?.v === it.bonne; return { answered: it.state?.v != null, ok, score: ok ? 1 : 0, html: `${it.explication ? esc(it.explication) : ''}`, good: `Bonne réponse : <b>${esc(it.choix[it.bonne])}</b>` }; },
    mark(it, host) { $$('.ex-opt', host).forEach((b, i) => { b.disabled = true; if (i === it.bonne) b.classList.add('ok'); else if (i === it.state?.v) b.classList.add('ko'); }); },
  },
  vf: {
    render(it, host, o) {
      const st = it.state ??= { v: null };
      host.innerHTML = `<p class="ex-q">Vrai ou faux ?</p><div class="ex-stmt">${it.enonce}</div><div class="ex-vf"><button class="ex-opt ${st.v === true ? 'sel' : ''}" data-v="1">${B.ic('check')} Vrai</button><button class="ex-opt ${st.v === false ? 'sel' : ''}" data-v="0">${B.ic('x')} Faux</button></div>`;
      $$('.ex-opt', host).forEach(b => b.onclick = () => { if (it.locked) return; st.v = b.dataset.v === '1'; K.vf.render(it, host, o); o.onChange?.(); });
    },
    grade: it => { const ok = it.state?.v === it.vrai; return { answered: it.state?.v != null, ok, score: ok ? 1 : 0, html: it.explication, good: `C'était : <b>${it.vrai ? 'Vrai' : 'Faux'}</b>` }; },
    mark(it, host) { $$('.ex-opt', host).forEach(b => { b.disabled = true; const v = b.dataset.v === '1'; if (v === it.vrai) b.classList.add('ok'); else if (v === it.state?.v) b.classList.add('ko'); }); },
  },
  trous: {
    render(it, host, o) {
      const st = it.state ??= { v: it.blanks.map(() => null), cur: 0 };
      const html = it.parts.map((t, i) => esc(t) + (i < it.blanks.length ? `<span class="blank ${st.cur === i ? 'cur' : ''} ${st.v[i] != null ? 'filled' : ''}" data-i="${i}">${st.v[i] != null ? esc(it.bank[st.v[i]]) : '&nbsp;'.repeat(8)}</span>` : '')).join('');
      host.innerHTML = `<p class="ex-q">Complète le texte avec les bons mots.</p><div class="ex-stmt trous">${html}</div>
        <div class="bank">${it.bank.map((w, i) => `<button class="chipw ${st.v.includes(i) ? 'used' : ''}" data-i="${i}">${esc(w)}</button>`).join('')}</div>`;
      $$('.blank', host).forEach(b => b.onclick = () => { if (it.locked) return; const i = +b.dataset.i; if (st.v[i] != null) st.v[i] = null; st.cur = i; K.trous.render(it, host, o); o.onChange?.(); });
      $$('.chipw', host).forEach(b => b.onclick = () => {
        if (it.locked) return; const w = +b.dataset.i; if (st.v.includes(w)) return;
        let slot = st.v[st.cur] == null ? st.cur : st.v.findIndex(x => x == null); if (slot < 0) slot = st.cur;
        st.v[slot] = w; const nxt = st.v.findIndex(x => x == null); st.cur = nxt < 0 ? slot : nxt;
        K.trous.render(it, host, o); o.onChange?.();
      });
    },
    grade: it => {
      const v = it.state?.v || [], good = it.blanks.filter((b, i) => v[i] != null && norm(it.bank[v[i]]) === norm(b)).length;
      return { answered: v.length === it.blanks.length && v.every(x => x != null), ok: good === it.blanks.length, score: good / it.blanks.length, html: it.explication || '', good: `Réponse : ${it.blanks.map(b => `<b>${esc(b)}</b>`).join(' · ')}` };
    },
    mark(it, host) {
      $$('.blank', host).forEach((b, i) => { const w = it.state.v[i] != null ? it.bank[it.state.v[i]] : null; const ok = w != null && norm(w) === norm(it.blanks[i]); b.classList.add(ok ? 'ok' : 'ko'); if (!ok) b.innerHTML = `<s>${esc(w || '…')}</s> ${esc(it.blanks[i])}`; });
      $$('.chipw', host).forEach(b => b.disabled = true);
    },
  },
  qro: {
    render(it, host, o) {
      const st = it.state ??= { v: '' };
      host.innerHTML = `<p class="ex-q">${esc(it.q)}</p><textarea class="qro-in" id="qin" rows="4" placeholder="Réponds avec tes mots : chiffres, délais et termes précis comptent." ${it.locked ? 'disabled' : ''}>${esc(st.v)}</textarea><small class="muted">Réponse ouverte : on vérifie les éléments clés (termes, chiffres, délais).</small>`;
      const ta = $('#qin', host); ta.oninput = () => { st.v = ta.value; o.onChange?.(); };
      if (!it.locked) setTimeout(() => ta.focus(), 50);
    },
    check(it) {
      const toks = tokens(it.state?.v || ''), found = it.kw.filter(k => hasKw(k, toks));
      return { found, miss: it.kw.filter(k => !found.includes(k)), cov: found.length / it.kw.length };
    },
    grade(it) {
      const { cov, found } = K.qro.check(it), ok = cov >= 0.5 && found.length >= Math.min(2, it.kw.length);
      return { answered: (it.state?.v || '').trim().length >= 3, ok, score: ok ? 1 : cov >= 0.3 ? Math.round(cov * 100) / 100 : 0, html: '', good: `Réponse attendue : <b>${esc(it.modele)}</b>` };
    },
    mark(it, host) {
      const ta = $('#qin', host); ta.disabled = true; const r = K.qro.check(it); ta.classList.add(K.qro.grade(it).ok ? 'ok' : 'ko');
      host.insertAdjacentHTML('beforeend', `<div class="qro-kw">${r.found.map(k => `<span class="kw ok">${esc(k)}</span>`).join('')}${r.miss.map(k => `<span class="kw ko">${esc(k)}</span>`).join('')}<small class="muted">${r.found.length} / ${it.kw.length} éléments clés retrouvés</small></div>`);
    },
  },
  calcul: {
    render(it, host, o) {
      const st = it.state ??= { v: '' };
      host.innerHTML = `<div class="ex-stmt calc">${it.enonce}</div><label class="calc-in">Ta réponse : <input id="cin" inputmode="decimal" autocomplete="off" value="${esc(st.v)}" placeholder="ex. 1250,5"> <span>${esc(it.unite || '')}</span></label>`;
      const inp = $('#cin', host); inp.oninput = () => { st.v = inp.value; o.onChange?.(); }; if (!it.locked) setTimeout(() => inp.focus(), 50); else inp.disabled = true;
      inp.onkeydown = e => { if (e.key === 'Enter') o.onEnter?.(); };
    },
    grade: it => {
      const x = parseNum(it.state?.v ?? ''); const tol = Math.max(it.tol || 0, Math.abs(it.reponse) * 0.0005);
      const ok = x != null && Math.abs(x - it.reponse) <= tol + 1e-9;
      return { answered: x != null, ok, score: ok ? 1 : 0, html: it.corrige, good: `Réponse attendue : <b>${fmt(it.reponse)} ${esc(it.unite || '')}</b>` };
    },
    mark(it, host) { const i = $('#cin', host); i.disabled = true; i.classList.add(K.calcul.grade(it).ok ? 'ok' : 'ko'); },
  },
  classer: {
    render(it, host, o) {
      const st = it.state ??= { v: null };
      host.innerHTML = `<p class="ex-q">${esc(it.titre)}</p><div class="ex-stmt">${esc(it.texte)}</div><div class="ex-opts">${it.buckets.map((b, i) => `<button class="ex-opt ${st.v === i ? 'sel' : ''}" data-i="${i}">${esc(b)}</button>`).join('')}</div>`;
      $$('.ex-opt', host).forEach(b => b.onclick = () => { if (it.locked) return; st.v = +b.dataset.i; K.classer.render(it, host, o); o.onChange?.(); });
    },
    grade: it => { const ok = it.state?.v === it.bonne; return { answered: it.state?.v != null, ok, score: ok ? 1 : 0, html: it.why ? esc(it.why) : '', good: `À classer dans : <b>${esc(it.buckets[it.bonne])}</b>` }; },
    mark(it, host) { $$('.ex-opt', host).forEach((b, i) => { b.disabled = true; if (i === it.bonne) b.classList.add('ok'); else if (i === it.state?.v) b.classList.add('ko'); }); },
  },
  ordre: {
    render(it, host, o) {
      it.shuf ??= shuffle(it.items.map((_, i) => i)); const st = it.state ??= { seq: [] };
      host.innerHTML = `<p class="ex-q">${esc(it.titre)}</p><p class="muted">${esc(it.consigne || 'Touche les étapes dans le bon ordre.')}</p>
        <ol class="slots">${it.items.map((_, i) => `<li class="slot ${st.seq[i] != null ? 'filled' : ''}">${st.seq[i] != null ? esc(it.items[st.seq[i]]) : ''}</li>`).join('')}</ol>
        <div class="bank">${it.shuf.map(i => `<button class="chipw ${st.seq.includes(i) ? 'used' : ''}" data-i="${i}">${esc(it.items[i])}</button>`).join('')}</div>
        <button class="btn ghost sm" id="undo" style="margin-top:12px">${B.ic('rotate-ccw')} Effacer</button>`;
      $$('.chipw', host).forEach(b => b.onclick = () => { if (it.locked) return; const i = +b.dataset.i; if (st.seq.includes(i) || st.seq.length >= it.items.length) return; st.seq.push(i); K.ordre.render(it, host, o); o.onChange?.(); });
      $('#undo', host).onclick = () => { if (it.locked) return; st.seq = []; K.ordre.render(it, host, o); o.onChange?.(); };
    },
    grade: it => {
      const s = it.state?.seq || [], good = s.filter((x, i) => x === i).length;
      return { answered: s.length === it.items.length, ok: good === it.items.length, score: good / it.items.length, html: `<ol>${it.items.map(x => `<li>${esc(x)}</li>`).join('')}</ol>`, good: 'Ordre correct :' };
    },
    mark(it, host) { $$('.slot', host).forEach((s, i) => s.classList.add(it.state.seq[i] === i ? 'ok' : 'ko')); $$('.chipw', host).forEach(b => b.disabled = true); $('#undo', host).hidden = true; },
  },
};

const mount = (it, host, o = {}) => K[it.kind].render(it, host, o);
const grade = it => { const r = K[it.kind].grade(it); r.w = it.w || (it.kind === 'calcul' ? 2 : 1); return r; };
const reveal = (it, host) => { it.locked = true; K[it.kind].mark(it, host); };
B.items = { mount, grade, reveal, norm, K };

/* enregistre une réponse QCM dans les points faibles */
const recordQcm = (it, ok) => {
  if (!it.qid) return;
  S.store.quiz[it.qid] = ok ? 1 : 0;
  if (ok) { if (S.store.errors[it.qid] > 1) S.store.errors[it.qid]--; else delete S.store.errors[it.qid]; } else S.store.errors[it.qid] = (S.store.errors[it.qid] || 0) + 1;
};
B.items.recordQcm = recordQcm;
};
