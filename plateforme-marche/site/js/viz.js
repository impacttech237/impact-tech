/* Moteur de schémas : graphiques et diagrammes animés (SVG + HTML), style « autocollants ».
   Chaque schéma = { titre, legende, type, ...données }.  B.viz.render(spec) → HTML ; B.viz.words(spec) → texte pour la recherche. */
(() => {
'use strict';
window.B = window.B || { routes: {} };
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const PAL = ['#ffe14a', '#ffb8d1', '#8fd0ff', '#a9f0d0', '#ffb36b', '#d3b8ff', '#ff8a80', '#c5e86c'];
const INK = '#1b1410';
const col = (i, o) => (o && o[i]) || PAL[i % PAL.length];
const fmt = n => (typeof n === 'number' ? n.toLocaleString('fr-FR', { maximumFractionDigits: 2 }) : String(n));
const nice = max => { const p = Math.pow(10, Math.floor(Math.log10(max || 1))), f = max / p; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p; };
let uid = 0;

/* coupe un texte en lignes de n caractères max */
const wrap = (t, n) => { const out = []; let l = ''; String(t).split(/\s+/).forEach(w => { if ((l + ' ' + w).trim().length > n && l) { out.push(l); l = w; } else l = (l + ' ' + w).trim(); }); if (l) out.push(l); return out; };
const tspans = (t, x, n, lh, y0 = 0) => wrap(t, n).map((l, i) => `<tspan x="${x}" dy="${i ? lh : y0}">${esc(l)}</tspan>`).join('');

const frame = (inner, cls = '') => `<div class="vz ${cls}">${inner}</div>`;
const legend = (items, colors) => `<div class="vz-leg">${items.map((n, i) => `<span><i style="background:${col(i, colors)}"></i>${esc(n)}</span>`).join('')}</div>`;
const detailBox = () => '<div class="vz-detail" aria-live="polite"><em>Touche un élément pour voir le détail.</em></div>';

/* ---------- barres (verticales ou horizontales, groupées) ---------- */
function bars(s) {
  const series = s.series || ['Valeur'], items = s.items, n = series.length;
  const max = nice(Math.max(...items.flatMap(i => [].concat(i.v)), 1) * (s.sans0 ? 1 : 1));
  const id = 'vz' + (++uid);
  if (s.horizontal) {
    const rowH = 18 * n + 14, W = 640, L = s.labelW || 150, H = items.length * rowH + 14, bw = W - L - 70;
    const rows = items.map((it, k) => {
      const vs = [].concat(it.v), y = 8 + k * rowH;
      return `<text x="${L - 8}" y="${y + rowH / 2 - 2}" text-anchor="end" class="vl">${esc(it.l)}</text>` + vs.map((v, j) => {
        const w = Math.max(2, v / max * bw);
        return `<g class="vb" style="--d:${(k * n + j) * .05}s"><title>${esc(it.l)} · ${esc(series[j])} : ${fmt(v)} ${esc(s.unit || '')}</title><rect x="${L}" y="${y + j * 18}" width="${w}" height="15" rx="4" fill="${col(j, s.colors)}" stroke="${INK}" stroke-width="2"/><text x="${L + w + 6}" y="${y + j * 18 + 12}" class="vn">${fmt(v)}</text></g>`;
      }).join('');
    }).join('');
    return frame(`<svg viewBox="0 0 ${W} ${H}" class="vz-svg" role="img" aria-label="${esc(s.titre)}">${rows}</svg>${n > 1 ? legend(series, s.colors) : ''}`);
  }
  const W = 640, H = 300, L = 54, B0 = 48, T = 24, pw = W - L - 16, ph = H - B0 - T, gw = pw / items.length, bw = Math.min(54, gw / (n + .6));
  const ticks = [0, .25, .5, .75, 1].map(f => { const y = T + ph - f * ph; return `<line x1="${L}" x2="${W - 12}" y1="${y}" y2="${y}" class="vg"/><text x="${L - 8}" y="${y + 4}" text-anchor="end" class="vt">${fmt(max * f)}</text>`; }).join('');
  const cols = items.map((it, k) => {
    const vs = [].concat(it.v), x0 = L + k * gw + (gw - bw * n) / 2;
    return vs.map((v, j) => { const h = v / max * ph, x = x0 + j * bw;
      return `<g class="vc" style="--d:${(k * n + j) * .06}s"><title>${esc(it.l)} · ${esc(series[j])} : ${fmt(v)} ${esc(s.unit || '')}</title><rect x="${x}" y="${T + ph - h}" width="${bw - 3}" height="${h}" rx="5" fill="${col(j, s.colors)}" stroke="${INK}" stroke-width="2"/><text x="${x + (bw - 3) / 2}" y="${T + ph - h - 6}" text-anchor="middle" class="vn">${fmt(v)}</text></g>`; }).join('')
      + `<text x="${L + k * gw + gw / 2}" y="${H - B0 + 20}" text-anchor="middle" class="vl">${tspans(it.l, L + k * gw + gw / 2, Math.max(8, Math.round(gw / 7)), 14)}</text>`;
  }).join('');
  return frame(`<svg viewBox="0 0 ${W} ${H}" class="vz-svg" role="img" aria-label="${esc(s.titre)}">${ticks}${cols}</svg>${n > 1 ? legend(series, s.colors) : ''}${s.unit ? `<div class="vz-unit">en ${esc(s.unit)}</div>` : ''}`);
}

/* ---------- courbes ---------- */
function line(s) {
  const labs = s.labels, series = s.series, W = 640, H = 300, L = 58, B0 = 56, T = 20, pw = W - L - 20, ph = H - B0 - T;
  const all = series.flatMap(x => x.v);
  let mn = s.min ?? Math.min(...all), mx = s.max ?? Math.max(...all);
  const span = nice(mx - mn) || 1; mn = Math.floor(mn / (span / 5)) * (span / 5); mx = mn + span * (Math.ceil((mx - mn) / span) || 1);
  const X = i => L + (labs.length === 1 ? pw / 2 : i / (labs.length - 1) * pw), Y = v => T + ph - (v - mn) / (mx - mn) * ph;
  const grid = [0, 1, 2, 3, 4, 5].map(f => { const v = mn + (mx - mn) * f / 5, y = Y(v); return `<line x1="${L}" x2="${W - 14}" y1="${y}" y2="${y}" class="vg"/><text x="${L - 8}" y="${y + 4}" text-anchor="end" class="vt">${fmt(Math.round(v * 10) / 10)}</text>`; }).join('');
  const step = Math.ceil(labs.length / 12);
  const xl = labs.map((l, i) => i % step === 0 ? `<text transform="translate(${X(i)},${H - B0 + 16}) rotate(-40)" text-anchor="end" class="vt">${esc(l)}</text>` : '').join('');
  const lines = series.map((sr, j) => { const c = col(j, s.colors), pts = sr.v.map((v, i) => `${X(i)},${Y(v)}`);
    return `<path d="M${pts.join(' L')}" fill="none" stroke="${INK}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" opacity=".18"/><path class="vline" pathLength="1" d="M${pts.join(' L')}" fill="none" stroke="${c === '#ffe14a' ? '#e0a800' : c}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>`
      + sr.v.map((v, i) => `<circle class="vdot" style="--d:${.5 + i * .04}s" cx="${X(i)}" cy="${Y(v)}" r="5" fill="#fff" stroke="${INK}" stroke-width="2.5"><title>${esc(labs[i])} : ${fmt(v)} ${esc(s.unit || '')}</title></circle>`).join('');
  }).join('');
  const ann = (s.notes || []).map(a => `<g class="vnote"><circle cx="${X(a.i)}" cy="${Y(series[a.s || 0].v[a.i])}" r="11" fill="none" stroke="#e0312b" stroke-width="3"/><text x="${X(a.i)}" y="${Y(series[a.s || 0].v[a.i]) - 18}" text-anchor="middle" class="vnt">${esc(a.t)}</text></g>`).join('');
  return frame(`<svg viewBox="0 0 ${W} ${H}" class="vz-svg" role="img" aria-label="${esc(s.titre)}">${grid}${xl}${lines}${ann}</svg>${series.length > 1 || series[0].n ? legend(series.map(x => x.n || ''), s.colors) : ''}${s.unit ? `<div class="vz-unit">en ${esc(s.unit)}</div>` : ''}`);
}

/* ---------- anneau ---------- */
function donut(s) {
  const items = s.items, tot = items.reduce((a, i) => a + i.v, 0), R = 90, r = 52, cx = 120, cy = 120;
  let a0 = -Math.PI / 2;
  const arcs = items.map((it, k) => { const a1 = a0 + it.v / tot * Math.PI * 2, big = a1 - a0 > Math.PI ? 1 : 0, p = (rad, a) => `${cx + rad * Math.cos(a)},${cy + rad * Math.sin(a)}`;
    const d = it.v === tot ? `M${cx},${cy - R} A${R},${R} 0 1 1 ${cx - .01},${cy - R} L${cx - .01},${cy - r} A${r},${r} 0 1 0 ${cx},${cy - r}Z` : `M${p(R, a0)} A${R},${R} 0 ${big} 1 ${p(R, a1)} L${p(r, a1)} A${r},${r} 0 ${big} 0 ${p(r, a0)}Z`;
    const g = `<path class="vslice" style="--d:${k * .1}s" d="${d}" fill="${col(k, s.colors)}" stroke="${INK}" stroke-width="2.5" data-i="${k}"><title>${esc(it.l)} : ${fmt(it.v)}${s.unit ? ' ' + esc(s.unit) : ''} (${Math.round(it.v / tot * 1000) / 10} %)</title></path>`; a0 = a1; return g; }).join('');
  const rows = items.map((it, k) => `<li><i style="background:${col(k, s.colors)}"></i><b>${esc(it.l)}</b><span>${fmt(it.v)}${s.unit ? ' ' + esc(s.unit) : ''} · ${Math.round(it.v / tot * 1000) / 10} %</span></li>`).join('');
  return frame(`<div class="vz-donut"><svg viewBox="0 0 240 240" class="vz-svg sm" role="img" aria-label="${esc(s.titre)}">${arcs}<text x="${cx}" y="${cy - 2}" text-anchor="middle" class="vbig">${esc(s.centre || fmt(tot))}</text><text x="${cx}" y="${cy + 18}" text-anchor="middle" class="vt">${esc(s.centreSous || '')}</text></svg><ul class="vz-rows">${rows}</ul></div>`);
}

/* ---------- processus (étapes reliées par des flèches) ---------- */
function flow(s) {
  const ar = s.vertical ? '↓' : '→';
  const steps = s.steps.map((st, i) => `<button class="vz-step" style="--c:${col(i, s.colors)};--d:${i * .08}s" data-i="${i}">${s.numero !== false ? `<em>${i + 1}</em>` : ''}<b>${esc(st.t)}</b>${st.s ? `<small>${esc(st.s)}</small>` : ''}</button>${i < s.steps.length - 1 ? `<span class="vz-arrow" aria-hidden="true">${ar}</span>` : ''}`).join('');
  return frame(`<div class="vz-flow ${s.vertical ? 'v' : ''}">${steps}</div>${s.steps.some(x => x.d) ? detailBox() : ''}`, 'clk');
}

/* ---------- cycle circulaire ---------- */
function cycle(s) {
  const n = s.steps.length, W = 600, H = 460, cx = 300, cy = 225, R = 165, nw = 150, nh = 50;
  const pos = i => { const a = -Math.PI / 2 + i / n * Math.PI * 2; return [cx + R * 1.28 * Math.cos(a), cy + R * Math.sin(a)]; };
  const arrows = s.steps.map((_, i) => { const [x1, y1] = pos(i), [x2, y2] = pos((i + 1) % n), mx = (x1 + x2) / 2, my = (y1 + y2) / 2, dx = mx - cx, dy = my - cy, k = 1.18;
    return `<path class="vyarn" pathLength="1" style="--d:${i * .08}s" d="M${x1},${y1} Q${cx + dx * k},${cy + dy * k} ${x2},${y2}" fill="none" stroke="${INK}" stroke-width="3" stroke-dasharray="1" marker-end="url(#ah)"/>`; }).join('');
  const nodes = s.steps.map((st, i) => { const [x, y] = pos(i);
    return `<g class="vnode" style="--d:${i * .08}s" data-i="${i}" tabindex="0"><rect x="${x - nw / 2}" y="${y - nh / 2}" width="${nw}" height="${nh}" rx="14" fill="${col(i, s.colors)}" stroke="${INK}" stroke-width="2.5"/><text x="${x}" y="${y - (wrap(st.t, 20).length - 1) * 6 + 4}" text-anchor="middle" class="vl b">${tspans(st.t, x, 20, 13)}</text></g>`; }).join('');
  return frame(`<svg viewBox="0 0 ${W} ${H}" class="vz-svg" role="img" aria-label="${esc(s.titre)}"><defs><marker id="ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10z" fill="${INK}"/></marker></defs>${arrows}<text x="${cx}" y="${cy + 4}" text-anchor="middle" class="vbig sm">${tspans(s.centre || '', cx, 16, 22)}</text>${nodes}</svg>${s.steps.some(x => x.d) ? detailBox() : ''}`, 'clk');
}

/* ---------- pyramide ---------- */
function pyramid(s) {
  const L = s.levels, n = L.length, W = 640, h = 64, gap = 5, H = n * (h + gap) + 8, top = 36;
  const rows = L.map((lv, i) => { const y = 4 + i * (h + gap), f0 = i / n, f1 = (i + 1) / n, w0 = top + f0 * (W - top * 2 - 40), w1 = top + f1 * (W - top * 2 - 40);
    const xa = (W - w0) / 2, xb = (W + w0) / 2, xc = (W + w1) / 2, xd = (W - w1) / 2;
    return `<g class="vnode" style="--d:${i * .1}s" data-i="${i}" tabindex="0"><polygon points="${xa},${y} ${xb},${y} ${xc},${y + h} ${xd},${y + h}" fill="${col(i, s.colors)}" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/><text x="${W / 2}" y="${y + h / 2 + (lv.s ? -2 : 5)}" text-anchor="middle" class="vl b">${esc(lv.t)}</text>${lv.s ? `<text x="${W / 2}" y="${y + h / 2 + 15}" text-anchor="middle" class="vt">${esc(lv.s)}</text>` : ''}</g>`; }).join('');
  const side = s.fleche ? `<g class="vside"><path d="M${W - 26},${H - 12} L${W - 26},14" stroke="#e0312b" stroke-width="5" marker-end="url(#ah2)" fill="none"/><text transform="translate(${W - 40},${H / 2}) rotate(-90)" text-anchor="middle" class="vl b" fill="#e0312b">${esc(s.fleche)}</text></g>` : '';
  return frame(`<svg viewBox="0 0 ${W} ${H}" class="vz-svg" role="img" aria-label="${esc(s.titre)}"><defs><marker id="ah2" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L10,5 L0,10z" fill="#e0312b"/></marker></defs>${rows}${side}</svg>${L.some(x => x.d) ? detailBox() : ''}`, 'clk');
}

/* ---------- arbre / organigramme ---------- */
function tree(s) {
  const node = (n, d = 0) => `<li><button class="vz-tn" style="--c:${col(n.c ?? d, s.colors)}" data-d="${esc(n.d || '')}"><b>${esc(n.t)}</b>${n.s ? `<small>${esc(n.s)}</small>` : ''}</button>${n.k && n.k.length ? `<ul>${n.k.map(k => node(k, d + 1)).join('')}</ul>` : ''}</li>`;
  return frame(`<div class="vz-tree"><ul>${node(s.racine)}</ul></div>${JSON.stringify(s).includes('"d":') ? detailBox() : ''}`, 'clk');
}

/* ---------- tableau (avec cellules colorées possibles) ---------- */
function table(s) {
  const cell = c => { const o = typeof c === 'object' && c !== null ? c : { t: c }; return `<td ${o.c ? `style="background:${o.c}"` : ''} ${o.b ? 'class="b"' : ''}>${esc(o.t)}</td>`; };
  return frame(`<div class="vz-tbl-wrap"><table class="vz-tbl"><thead><tr>${s.cols.map(c => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${s.rows.map(r => `<tr>${r.map((c, i) => i === 0 && s.entete !== false ? `<th scope="row" ${typeof c === 'object' && c.c ? `style="background:${c.c}"` : ''}>${esc(typeof c === 'object' ? c.t : c)}</th>` : cell(c)).join('')}</tr>`).join('')}</tbody></table></div>`);
}

/* ---------- ligne du temps ---------- */
function timeline(s) {
  const ev = s.events.map((e, i) => `<div class="vz-ev ${i % 2 ? 'dn' : 'up'}" style="--d:${i * .09}s;--c:${col(i, s.colors)}"><button data-i="${i}"><em>${esc(e.d)}</em><b>${esc(e.t)}</b></button><i class="dot"></i></div>`).join('');
  return frame(`<div class="vz-time"><div class="rail"></div>${ev}</div>${s.events.some(x => x.s) ? detailBox() : ''}`, 'clk');
}

/* ---------- comparaison en colonnes ---------- */
function compare(s) {
  return frame(`<div class="vz-cmp" style="--n:${s.cols.length}">${s.cols.map((c, i) => `<div class="vz-col" style="--c:${col(i, s.colors)};--d:${i * .1}s"><h4>${esc(c.t)}</h4>${c.s ? `<p class="sub">${esc(c.s)}</p>` : ''}<ul>${(c.pts || []).map(p => `<li>${esc(p)}</li>`).join('')}</ul></div>`).join('')}</div>`);
}

/* ---------- équation visuelle ---------- */
function equation(s) {
  return frame(`<div class="vz-eq">${s.parts.map((p, i) => p.op ? `<span class="op">${esc(p.op)}</span>` : `<div class="vz-term" style="--c:${col(p.c ?? i, s.colors)};--d:${i * .07}s"><b>${esc(p.t)}</b>${p.s ? `<small>${esc(p.s)}</small>` : ''}${p.v !== undefined ? `<em>${esc(p.v)}</em>` : ''}</div>`).join('')}</div>`);
}

/* ---------- chiffres clés ---------- */
function stats(s) {
  return frame(`<div class="vz-stats">${s.items.map((it, i) => `<div class="vz-stat" style="--c:${col(i, s.colors)};--d:${i * .08}s"><b>${esc(it.v)}</b><span>${esc(it.l)}</span>${it.s ? `<small>${esc(it.s)}</small>` : ''}</div>`).join('')}</div>`);
}

/* ---------- blocs de bilan (actif / passif, hauteurs proportionnelles) ---------- */
function blocks(s) {
  const side = sd => { const tot = sd.items.reduce((a, i) => a + i.v, 0); return `<div class="vz-bs"><h5>${esc(sd.t)}</h5><div class="stack" style="height:${s.hauteur || 300}px">${sd.items.map((it, i) => `<div class="blk" style="flex:${Math.max(it.v, tot * .06)};--c:${col(it.c ?? i, s.colors)};--d:${i * .08}s" title="${esc(it.l)} : ${fmt(it.v)}"><b>${esc(it.l)}</b><em>${fmt(it.v)}</em></div>`).join('')}</div><div class="tot">Total : ${fmt(tot)}</div></div>`; };
  return frame(`<div class="vz-bal">${side(s.gauche)}${side(s.droite)}</div>${s.unit ? `<div class="vz-unit">en ${esc(s.unit)}</div>` : ''}`);
}

/* ---------- cascade (waterfall) ---------- */
function waterfall(s) {
  const W = 640, H = 300, L = 54, B0 = 52, T = 26, pw = W - L - 16, ph = H - B0 - T, n = s.items.length, gw = pw / n, bw = Math.min(70, gw - 14);
  let cum = 0; const seg = s.items.map(it => { const a = it.total ? 0 : cum, b = it.total ? it.v : cum + it.v; if (!it.total) cum += it.v; else cum = it.v; return { a, b, it }; });
  const mx = nice(Math.max(...seg.flatMap(x => [x.a, x.b]), 1)), mn = Math.min(0, ...seg.flatMap(x => [x.a, x.b])), lo = mn < 0 ? -nice(-mn) : 0;
  const Y = v => T + ph - (v - lo) / (mx - lo) * ph;
  const grid = [0, .25, .5, .75, 1].map(f => { const v = lo + (mx - lo) * f; return `<line x1="${L}" x2="${W - 12}" y1="${Y(v)}" y2="${Y(v)}" class="vg"/><text x="${L - 8}" y="${Y(v) + 4}" text-anchor="end" class="vt">${fmt(v)}</text>`; }).join('');
  const bs = seg.map(({ a, b, it }, k) => { const x = L + k * gw + (gw - bw) / 2, y1 = Y(Math.max(a, b)), y2 = Y(Math.min(a, b)), c = it.total ? '#8fd0ff' : it.v >= 0 ? '#a9f0d0' : '#ff8a80';
    return `<g class="vc" style="--d:${k * .09}s"><rect x="${x}" y="${y1}" width="${bw}" height="${Math.max(3, y2 - y1)}" rx="5" fill="${it.c || c}" stroke="${INK}" stroke-width="2"/><text x="${x + bw / 2}" y="${y1 - 6}" text-anchor="middle" class="vn">${it.total ? '' : it.v > 0 ? '+' : ''}${fmt(it.v)}</text><text x="${x + bw / 2}" y="${H - B0 + 18}" text-anchor="middle" class="vl">${tspans(it.l, x + bw / 2, Math.max(8, Math.round(gw / 7)), 13)}</text></g>`; }).join('');
  return frame(`<svg viewBox="0 0 ${W} ${H}" class="vz-svg" role="img" aria-label="${esc(s.titre)}">${grid}<line x1="${L}" x2="${W - 12}" y1="${Y(0)}" y2="${Y(0)}" stroke="${INK}" stroke-width="2"/>${bs}</svg>${s.unit ? `<div class="vz-unit">en ${esc(s.unit)}</div>` : ''}`);
}

/* ---------- échelle graduée avec repères ---------- */
function scale(s) {
  const m = s.marks.length;
  return frame(`<div class="vz-scale"><div class="ends"><span>${esc(s.gauche)}</span><span>${esc(s.droite)}</span></div><div class="track" style="background:linear-gradient(90deg,${(s.degrade || ['#a9f0d0', '#ffe14a', '#ff8a80']).join(',')})"></div><div class="marks">${s.marks.map((mk, i) => `<div class="mk" style="left:${m === 1 ? 50 : 4 + i / (m - 1) * 92}%;--d:${i * .1}s"><i></i><b>${esc(mk.t)}</b>${mk.s ? `<small>${esc(mk.s)}</small>` : ''}</div>`).join('')}</div></div>`);
}

/* ---------- schéma-ensemble (boîtes imbriquées : bloc titre + sous-blocs) ---------- */
function boxes(s) {
  return frame(`<div class="vz-boxes"><div class="head" style="--c:${col(0, s.colors)}"><b>${esc(s.titreBloc)}</b>${s.sous ? `<small>${esc(s.sous)}</small>` : ''}</div>${s.fleche ? `<div class="ar">↓ ${esc(s.fleche)}</div>` : ''}<div class="grid" style="--n:${s.blocs.length > 3 ? 2 : s.blocs.length}">${s.blocs.map((b, i) => `<div class="bx" style="--c:${col(i + 1, s.colors)};--d:${i * .1}s"><b>${esc(b.t)}</b>${b.s ? `<small>${esc(b.s)}</small>` : ''}${(b.pts || []).length ? `<ul>${b.pts.map(p => `<li>${esc(p)}</li>`).join('')}</ul>` : ''}</div>`).join('')}</div></div>`);
}

const TYPES = { bars, line, donut, flow, cycle, pyramid, tree, table, timeline, compare, equation, stats, blocks, waterfall, scale, boxes };

/* texte exploitable par la recherche */
function words(s) {
  const out = [];
  const walk = o => { if (o == null) return; if (typeof o === 'string') { out.push(o); return; } if (Array.isArray(o)) { o.forEach(walk); return; } if (typeof o === 'object') for (const [k, v] of Object.entries(o)) if (!['c', 'colors', 'type'].includes(k)) walk(v); };
  walk({ ...s, titre: undefined, legende: undefined, type: undefined });
  return out.join(' ');
}

function render(s) {
  const f = TYPES[s.type]; if (!f) return `<div class="vz">Schéma « ${esc(s.type)} » inconnu</div>`;
  try { return f(s); } catch (e) { console.error(e); return '<div class="vz">Schéma indisponible</div>'; }
}

/* interactions : clic sur un élément → détail */
function wire(root) {
  root.querySelectorAll('.vz.clk').forEach(vz => {
    const box = vz.querySelector('.vz-detail'); if (!box) return;
    const spec = vz.__spec;
    const show = (title, txt) => { box.innerHTML = `<b>${esc(title)}</b> ${esc(txt || '')}`; box.classList.add('on'); B.sfx?.pop?.(); };
    vz.querySelectorAll('[data-i]').forEach(el => {
      const act = () => { const i = +el.dataset.i; vz.querySelectorAll('.sel').forEach(x => x.classList.remove('sel')); el.classList.add('sel');
        const items = spec.steps || spec.levels || spec.events; const it = items[i]; show(it.t, it.d || it.s); };
      el.addEventListener('click', act); el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); act(); } });
    });
    vz.querySelectorAll('.vz-tn').forEach(el => el.addEventListener('click', () => { vz.querySelectorAll('.sel').forEach(x => x.classList.remove('sel')); el.classList.add('sel'); show(el.querySelector('b').textContent, el.dataset.d); }));
  });
}

/* carte « schéma » complète (titre étiquette + figure + légende) */
function card(s, i = 0) {
  return `<figure class="vzcard${s.large ? " wide" : ""}" data-vz="${i}"><figcaption><span class="lbl l${(i % 6) + 1}">${esc(s.titre)}</span></figcaption>${render(s)}${s.legende ? `<p class="vz-cap">${esc(s.legende)}</p>` : ''}</figure>`;
}
function mount(root, list) {
  root.querySelectorAll('.vzcard').forEach(fig => { const s = list[+fig.dataset.vz]; const v = fig.querySelector('.vz'); if (v) v.__spec = s; });
  wire(root);
}

B.viz = { render, words, card, mount, wire, TYPES: Object.keys(TYPES) };
})();
