/* Carte mentale d'Excellence COSUMAF (olympiades/js/mindmap.js), sans la page. Initialisée par app.js : MINDMAP(B). */
/* Carte mentale (mind map) générée automatiquement à partir des fiches, définitions et exemples */
window.MINDMAP = B => {
'use strict';
const { $, $$, esc, md, S } = B;
const COL = ['#e0703a', '#2f6f86', '#dfa93b', '#d4563a', '#4a8a5a', '#8a5aa8', '#3d6a80', '#c2527a'];
const clip = (t, n) => { t = String(t).replace(/\*\*/g, '').replace(/\s+/g, ' ').trim(); return t.length <= n ? t : t.slice(0, n - 1).replace(/\s+\S*$/, '') + '…'; };
const wrap = (t, w = 20) => { const words = t.split(' '); const lines = []; let cur = ''; words.forEach(x => { if ((cur + ' ' + x).trim().length > w && cur) { lines.push(cur); cur = x; } else cur = (cur + ' ' + x).trim(); }); if (cur) lines.push(cur); return lines.slice(0, 3); };
const keyTerms = txt => { const b = [...String(txt).matchAll(/\*\*([^*]{2,40})\*\*/g)].map(m => m[1].replace(/[ :]+$/, '')); const uniq = [...new Set(b)]; return uniq.slice(0, 4); };

/* ---------- construction de l'arbre ---------- */
function chapterTree(p, c) {
  const branches = [];
  branches.push({ label: 'En bref', leaves: [{ label: clip(c.resume.court, 60), info: `<p>${esc(c.resume.court)}</p>` }] });
  (c.fiches || []).forEach(f => {
    const t = keyTerms(f.contenu);
    branches.push({ label: clip(f.titre, 30), info: md(f.contenu), leaves: t.map(x => ({ label: clip(x, 34), info: md(f.contenu) })) });
  });
  if ((c.definitions || []).length) branches.push({ label: 'Définitions', leaves: c.definitions.slice(0, 6).map(d => ({ label: clip(d.terme, 30), info: `<p><b>${esc(d.terme)}</b> : ${esc(d.definition)}</p>` })) });
  if ((c.exemples || []).length) branches.push({ label: 'Exemples', leaves: c.exemples.slice(0, 4).map(x => ({ label: clip(x.titre, 32), info: `<h4>${esc(x.titre)}</h4>${md(x.texte)}` })) });
  if ((c.mnemos || []).length) branches.push({ label: 'Mnémo', leaves: [{ label: clip(c.mnemos[0], 50), info: md(c.mnemos[0]) }] });
  return { label: clip(c.titre.replace(/^[^·]*·\s*/, ''), 40), branches };
}
function courseTree(p) {
  return { label: clip(p.titre, 34), branches: p.chapitres.map(c => ({ label: clip(c.titre.replace(/^[^·]*·\s*/, ''), 26), go: `#/carte/${p.id}?ch=${c.id}`, info: `<p><b>${esc(c.titre)}</b></p><p>${esc(c.resume.court)}</p><a class="btn sm" href="#/carte/${p.id}?ch=${c.id}">Ouvrir la carte du chapitre →</a>`,
    leaves: (c.fiches || []).slice(0, 2).map(f => ({ label: clip(f.titre, 28), info: md(f.contenu) })) })) };
}

/* ---------- dessin SVG radial ---------- */
function drawMap(tree, host, panel) {
  const B_ = tree.branches; const GAP = 62, BX = 250, LX = 470;
  const PAST = ['#fff27a', '#ffb8d1', '#a9f0d0', '#bcd7ff', '#ffd3a3', '#d9c8ff', '#c4f1dd', '#ffc9c9'];
  const YARN = ['#e0312b', '#2f6fd8', '#1e9e62', '#e0702a', '#8a4bd6', '#d6428a', '#12a3a0', '#b8860b'];
  const nodes = [], links = []; let minX = -130, maxX = 130, minY = -150, maxY = 150;
  const upd = (x, y, w = 90, h = 30) => { minX = Math.min(minX, x - w); maxX = Math.max(maxX, x + w); minY = Math.min(minY, y - h); maxY = Math.max(maxY, y + h); };
  const cnt = b => Math.max(1, b.leaves.length); const total = B_.reduce((a, b) => a + cnt(b), 0);
  let acc = 0; const sides = [[], []]; let order = 0;
  B_.forEach((b, bi) => { const s = acc < total / 2 ? 0 : 1; sides[s].push({ b, bi }); acc += cnt(b); });
  const size = (text, lvl) => { const lines = wrap(text, lvl === 1 ? 15 : 21); const fs = lvl === 1 ? 15 : 12.5; return { lines, fs, w: Math.max(...lines.map(l => l.length)) * fs * .58 + (lvl === 1 ? 30 : 44), h: lines.length * (fs + 4) + (lvl === 1 ? 26 : 16) }; };
  sides.forEach((list, s) => {
    const dir = s === 0 ? 1 : -1; const H = list.reduce((a, { b }) => a + cnt(b), 0) * GAP; let y0 = -H / 2;
    list.forEach(({ b, bi }) => {
      const m = cnt(b), by = y0 + m * GAP / 2, bx = dir * BX, sb = size(b.label, 1);
      const bn = { x: bx, y: by, text: b.label, bi, lvl: 1, info: b.info, go: b.go, ...sb, d: order * .06 }; nodes.push(bn); upd(bx, by, sb.w / 2 + 20, sb.h / 2 + 20);
      links.push({ x1: 0, y1: -92, x2: bx, y2: by - sb.h / 2 + 3, bi, d: order * .06 });
      b.leaves.forEach((l, li) => { const ly = y0 + (li + 0.5) * GAP, lx = dir * LX, sl = size(l.label, 2);
        nodes.push({ x: lx, y: ly, text: l.label, bi, lvl: 2, info: l.info, ...sl, d: order * .06 + .25 + li * .05 }); upd(lx, ly, sl.w / 2 + 20, sl.h / 2 + 20);
        links.push({ x1: bx, y1: by - sb.h / 2 + 3, x2: lx, y2: ly - sl.h / 2 + 3, bi, d: order * .06 + .3 + li * .05, leaf: true }); });
      y0 += m * GAP; order++;
    });
  });
  const pad = 50, vb = { x: minX - pad, y: minY - pad, w: maxX - minX + pad * 2, h: maxY - minY + pad * 2 }; const init = { ...vb };
  const pin = (x, y, c = '#d4281c') => `<circle cx="${x}" cy="${y}" r="7" fill="${c}" stroke="#1b1410" stroke-width="2"/><circle cx="${x - 2}" cy="${y - 2.5}" r="2.2" fill="#fff" opacity=".75"/>`;
  const node = (nd, i) => {
    const { w, h, lines, fs } = nd, rot = (((i * 37) % 9) - 4) * .8, col = PAST[nd.bi % PAST.length];
    if (nd.lvl === 1) return `<g class="mnode ${nd.go || nd.info ? 'click' : ''}" data-i="${i}" style="--d:${nd.d}s" transform="translate(${nd.x},${nd.y}) rotate(${rot})">
      <rect class="nbg" x="${-w / 2 + 4}" y="${-h / 2 + 6}" width="${w}" height="${h}" rx="3" fill="#1b1410" opacity=".45"/>
      <path class="nbg" d="M${-w / 2} ${-h / 2} H${w / 2} V${h / 2 - 14} L${w / 2 - 14} ${h / 2} H${-w / 2}Z" fill="${col}" stroke="#1b1410" stroke-width="2.6" stroke-linejoin="round"/>
      <path d="M${w / 2 - 14} ${h / 2} V${h / 2 - 14} H${w / 2}" fill="rgba(0,0,0,.18)" stroke="#1b1410" stroke-width="2"/>
      ${lines.map((l, k) => `<text x="0" y="${-h / 2 + 20 + k * (fs + 4)}" text-anchor="middle" font-size="${fs}" font-weight="800" fill="#1b1410">${esc(l)}</text>`).join('')}${pin(0, -h / 2 + 3)}</g>`;
    return `<g class="mnode ${nd.go || nd.info ? 'click' : ''}" data-i="${i}" style="--d:${nd.d}s" transform="translate(${nd.x},${nd.y}) rotate(${rot})">
      <rect x="${-w / 2 + 3}" y="${-h / 2 + 5}" width="${w}" height="${h}" rx="9" fill="#1b1410" opacity=".4"/>
      <rect class="nbg" x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="9" fill="#fffdf6" stroke="${YARN[nd.bi % YARN.length]}" stroke-width="3.2"/>
      <circle cx="${-w / 2 + 13}" cy="0" r="4.5" fill="${PAST[nd.bi % PAST.length]}" stroke="#1b1410" stroke-width="1.8"/>
      ${lines.map((l, k) => `<text x="${6}" y="${-h / 2 + 8 + (k + 1) * (fs + 3) - 2}" text-anchor="middle" font-size="${fs}" font-weight="600" fill="#1b1410">${esc(l)}</text>`).join('')}</g>`;
  };
  const yarn = l => { const dx = l.x2 - l.x1, sag = l.leaf ? 22 : 38; const d = `M${l.x1} ${l.y1} C${l.x1 + dx * .35} ${l.y1 + sag} ${l.x2 - dx * .35} ${l.y2 + sag} ${l.x2} ${l.y2}`; const c = YARN[l.bi % YARN.length];
    return `<path class="yarn" pathLength="1" d="${d}" stroke="${c}" stroke-width="${l.leaf ? 3.2 : 5}" style="--d:${l.d}s"/><path class="yarn2" d="${d}" stroke-width="${l.leaf ? 3.2 : 5}"/>`; };
  const cl = wrap(tree.label, 16).slice(0, 3); const who = B.pick(tree.label);
  const center = `<g class="mnode" style="--d:0s" transform="rotate(-3)">
    <rect x="-96" y="-84" width="200" height="${178 + cl.length * 22}" fill="#1b1410" opacity=".45" transform="translate(6,8)"/>
    <rect x="-100" y="-96" width="200" height="${182 + cl.length * 22}" fill="#fff" stroke="#1b1410" stroke-width="2.6"/>
    <rect x="-84" y="-70" width="168" height="144" fill="#bcd7ff" stroke="#1b1410" stroke-width="2"/>
    ${cl.map((l, k) => `<text x="0" y="${98 + k * 22}" text-anchor="middle" font-size="22" font-weight="700" fill="#1b1410" style="font-family:'Caveat','Comic Sans MS',cursive">${esc(l)}</text>`).join('')}
    ${pin(0, -92)}<rect x="-30" y="-110" width="60" height="22" fill="#ffd23a" opacity=".85" transform="rotate(-4)"/></g>`;
  host.innerHTML = `<svg id="mm" viewBox="${vb.x} ${vb.y} ${vb.w} ${vb.h}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Carte mentale">
    ${links.map(yarn).join('')}${nodes.map(node).join('')}${center}</svg>
    <div class="mm-tools"><button id="zi" title="Zoom +">${B.ic('plus')}</button><button id="zo" title="Zoom −">${B.ic('minus')}</button><button id="zr" title="Recentrer">${B.ic('locate-fixed')}</button></div>`;
  const svg = $('#mm'); const set = () => svg.setAttribute('viewBox', `${vb.x} ${vb.y} ${vb.w} ${vb.h}`);
  const zoom = (k, cx = vb.x + vb.w / 2, cy = vb.y + vb.h / 2) => { vb.x = cx - (cx - vb.x) * k; vb.y = cy - (cy - vb.y) * k; vb.w *= k; vb.h *= k; set(); };
  $('#zi').onclick = () => zoom(0.75); $('#zo').onclick = () => zoom(1.33); $('#zr').onclick = () => { Object.assign(vb, init); set(); };
  svg.addEventListener('wheel', e => { e.preventDefault(); const r = svg.getBoundingClientRect(); const cx = vb.x + (e.clientX - r.left) / r.width * vb.w, cy = vb.y + (e.clientY - r.top) / r.height * vb.h; zoom(e.deltaY > 0 ? 1.12 : 0.89, cx, cy); }, { passive: false });
  let drag = null, moved = false;
  svg.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY, vx: vb.x, vy: vb.y }; moved = false; });
  svg.addEventListener('pointermove', e => { if (!drag) return; const r = svg.getBoundingClientRect(); const dx = (e.clientX - drag.x) / r.width * vb.w, dy = (e.clientY - drag.y) / r.height * vb.h; if (Math.abs(e.clientX - drag.x) + Math.abs(e.clientY - drag.y) > 4) moved = true; vb.x = drag.vx - dx; vb.y = drag.vy - dy; set(); });
  window.addEventListener('pointerup', () => { drag = null; }, { once: false });
  $$('.mnode', host).forEach(g => g.addEventListener('click', () => { if (moved) return; const nd = nodes[+g.dataset.i]; $$('.mnode', host).forEach(x => x.classList.remove('sel')); g.classList.add('sel'); panel.innerHTML = nd.info ? `<div class="card" style="margin-top:14px"><h3>${esc(nd.text)}</h3>${nd.info}</div>` : ''; panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }));
}
B.mm = { chapterTree, courseTree, drawMap };
};
