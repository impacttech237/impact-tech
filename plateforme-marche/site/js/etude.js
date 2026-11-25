/* Effets de l'entraînement, repris de la plateforme Excellence COSUMAF (olympiades/js/coach.js, fun.js, persos.js) :
   sons WebAudio, coach qui réagit, confettis, étincelles, petits visages. */
(() => {
'use strict';
const E = window.E = {};
const COULEURS = { kofi: '#8fa9ff', amina: '#ffcb52', leo: '#5fd3b3', nadia: '#b99cff', samir: '#ff7f7f', fatou: '#ff9f5a', jean: '#8fa9ff', lina: '#ffcb52' };
E.noms = Object.keys(COULEURS);
E.perso = (qui = 'kofi', humeur = 'joy', taille = 160, o = {}) => { const k = COULEURS[qui] ? qui : 'kofi';
  return `<div class="pz ${o.fixe ? '' : 'bob'}" style="width:${taille}px;height:${taille}px;--pc:${COULEURS[k]}"><span class="blob"></span><img src="/img/persos/${k}-${humeur}.svg" alt="" width="${taille}" height="${taille}" ${o.flip ? 'style="transform:scaleX(-1)"' : ''} draggable="false"></div>`; };
E.choisir = (graine = '') => { let h = 0; for (const c of String(graine)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return E.noms[h % E.noms.length]; };
E.cheer = (r = 1, taille = 170) => E.perso(r >= .8 ? 'kofi' : r >= .5 ? 'amina' : 'samir', r >= .8 ? 'lol' : r >= .5 ? 'joy' : 'proud', taille);
const FACE = { laugh: 'lol', angry: 'angry', think: 'think', wow: 'wow', smile: 'joy', sad: 'sad' };
E.face = (type, taille = 34) => `<span class="rface" style="width:${taille}px;height:${taille}px"><img src="/img/persos/kofi-${FACE[type] || 'joy'}.svg" alt="" draggable="false"></span>`;

/* ---------- sons ---------- */
let ctx = null, muet = false;
try { muet = localStorage.getItem('mf.mute') === '1'; } catch { /* ignore */ }
const AC = () => (ctx ||= new (window.AudioContext || window.webkitAudioContext)());
const ton = (f, t0, d, type = 'sine', g = .13, f2) => {
  if (muet) return; try { const c = AC(), o = c.createOscillator(), v = c.createGain(), t = c.currentTime + t0;
    o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
    v.gain.setValueAtTime(0.0001, t); v.gain.exponentialRampToValueAtTime(g, t + .015); v.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(v); v.connect(c.destination); o.start(t); o.stop(t + d + .02); } catch { /* audio indisponible */ }
};
E.sfx = {
  ok() { ton(660, 0, .1, 'triangle'); ton(990, .09, .18, 'triangle'); },
  ko() { ton(220, 0, .18, 'sawtooth', .08, 140); ton(150, .14, .26, 'sawtooth', .07, 90); },
  flip() { ton(500, 0, .06, 'square', .05, 900); },
  tick() { ton(1100, 0, .03, 'square', .035); },
  pop() { ton(420, 0, .07, 'sine', .1, 760); },
  win() { [523, 659, 784, 1047].forEach((f, i) => ton(f, i * .09, .22, 'triangle', .12)); ton(1318, .4, .4, 'triangle', .1); },
  lose() { [392, 330, 262].forEach((f, i) => ton(f, i * .14, .24, 'sine', .1)); },
  get muet() { return muet; },
  basculer() { muet = !muet; try { localStorage.setItem('mf.mute', muet ? '1' : '0'); } catch { /* ignore */ } if (!muet) E.sfx.pop(); return muet; },
};

/* ---------- coach ---------- */
const DIT = { ok: ['Bien joué !', 'Exactement !', 'Tu gères !', 'Yes !', 'Parfait !', 'Trop fort !', 'Bravo !'], ko: ['Pas grave !', 'Presque !', 'On retient !', 'Courage !', 'Aïe… la prochaine !'], win: ['Incroyable !', 'Champion·ne !', 'Quel score !'] };
let el, bulleT, qui = 'kofi';
const construire = () => { if (el) return; el = document.createElement('div'); el.id = 'coach'; el.innerHTML = '<div class="cbub"></div><div class="cwho"></div>'; document.body.appendChild(el); };
const dessiner = humeur => { el.querySelector('.cwho').innerHTML = E.perso(qui, humeur, 140, { fixe: true }); };
E.coach = {
  show(w) { construire(); qui = w || E.choisir(location.hash); el.classList.add('on'); dessiner('joy'); },
  hide() { if (el) { el.classList.remove('on'); el.querySelector('.cbub').classList.remove('on'); } },
  say(humeur, texte, ms = 2600) {
    if (!el || !el.classList.contains('on')) return; dessiner(humeur);
    const w = el.querySelector('.cwho'); w.classList.remove('hop'); void w.offsetWidth; w.classList.add('hop');
    const b = el.querySelector('.cbub'); b.textContent = texte; b.classList.add('on'); clearTimeout(bulleT); bulleT = setTimeout(() => b.classList.remove('on'), ms);
  },
  react(ok, serie = 0) {
    const l = DIT[ok ? 'ok' : 'ko']; if (ok) E.sfx.ok(); else E.sfx.ko();
    this.say(ok ? (serie >= 3 ? 'lol' : 'joy') : 'sad', serie >= 3 && ok ? `${serie} d'affilée !` : l[Math.floor(Math.random() * l.length)]);
  },
  win(texte) { E.sfx.win(); this.say('lol', texte || DIT.win[Math.floor(Math.random() * DIT.win.length)], 4000); },
};

/* ---------- bouton son ---------- */
const boutonSon = () => { if (document.getElementById('snd')) return; const b = document.createElement('button'); b.id = 'snd'; b.setAttribute('aria-label', 'Activer ou couper le son');
  const set = () => { b.innerHTML = window.ic(E.sfx.muet ? 'volume-x' : 'volume-2'); b.classList.toggle('off', E.sfx.muet); }; set();
  b.onclick = () => { E.sfx.basculer(); set(); }; document.body.appendChild(b); };
window.addEventListener('load', () => setTimeout(boutonSon, 0));

/* ---------- confettis et étincelles ---------- */
const CONF = ['#ffe14a', '#ff5f8f', '#12b3a0', '#6f95fb', '#ff9d3c', '#fff', '#e0312b', '#7fe0b5'];
E.confetti = (n = 110) => {
  const box = document.createElement('div'); box.className = 'confetti';
  for (let i = 0; i < n; i++) { const p = document.createElement('i'); const w = 7 + Math.random() * 9;
    p.style.cssText = `left:${Math.random() * 100}%;background:${CONF[i % CONF.length]};width:${w}px;height:${w * (Math.random() < .5 ? 1 : 1.6)}px;border-radius:${Math.random() < .35 ? '50%' : '2px'};--dx:${(Math.random() * 240 - 120).toFixed(0)}px;--rot:${(Math.random() * 900 - 450).toFixed(0)}deg;--t:${(1.8 + Math.random() * 1.6).toFixed(2)}s;animation-delay:${(Math.random() * .5).toFixed(2)}s`;
    box.appendChild(p); }
  document.body.appendChild(box); setTimeout(() => box.remove(), 4200);
};
const etincelle = (x, y) => { for (let i = 0; i < 7; i++) { const s = document.createElement('div'); s.className = 'spark'; const a = i / 7 * Math.PI * 2 + Math.random(), d = 30 + Math.random() * 34;
  s.style.cssText = `left:${x - 11}px;top:${y - 11}px;--dx:${Math.cos(a) * d}px;--dy:${Math.sin(a) * d}px`;
  s.innerHTML = `<svg viewBox="0 0 60 60"><path d="M30 3 Q33 27 57 30 Q33 33 30 57 Q27 33 3 30 Q27 27 30 3Z" fill="${CONF[i % CONF.length]}" stroke="#1b1410" stroke-width="3" stroke-linejoin="round"/></svg>`;
  document.body.appendChild(s); setTimeout(() => s.remove(), 760); } };
document.addEventListener('pointerdown', e => { if (e.target.closest('.btn,.opt,.chip,.rates button,.fcard')) etincelle(e.clientX, e.clientY); });

/* touches clavier de l'activité en cours (Espace, 1-4, A-D) */
E.touches = null;
document.addEventListener('keydown', e => { if (E.touches && !e.metaKey && !e.ctrlKey && !e.target.matches('input,select,textarea')) E.touches(e); });
})();
