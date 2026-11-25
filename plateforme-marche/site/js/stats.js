/* Audience anonyme : pas de cookie, pas d'adresse IP, pas d'identifiant durable.
   Une visite = un identifiant aléatoire gardé seulement dans l'onglet (sessionStorage).
   Pour exclure vos propres appareils : ouvrir le site avec ?notrack=1 (?notrack=0 pour réactiver). */
(() => {
'use strict';
try { const m = location.search.match(/[?&]notrack=([01])/); if (m) localStorage.setItem('mf.notrack', m[1]); } catch { /* ignore */ }
let coupe = false; try { coupe = localStorage.getItem('mf.notrack') === '1'; } catch { /* ignore */ }
const local = /^(localhost|127\.|\[::1\])/.test(location.hostname) && !/[?&]stats=1/.test(location.search);
let vid = null;
try { vid = sessionStorage.getItem('mf.vid'); if (!vid) { vid = Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4); sessionStorage.setItem('mf.vid', vid); } } catch { vid = 'x' + Math.random().toString(36).slice(2, 8); }
const P = new URLSearchParams(location.search);
let premier = true, page = '', depuisT = 0, visible = !document.hidden;
const nomPage = h => { const c = String(h || '').replace(/^#\/?/, '').split('?')[0].replace(/\/+$/, ''); return c ? (/^[a-z0-9/_-]+$/i.test(c) ? c.slice(0, 80) : 'autre') : 'accueil'; };
const envoyer = o => {
  if (coupe || local) return;
  try {
    const s = JSON.stringify({ vid, ...o });
    if (!(navigator.sendBeacon && navigator.sendBeacon('/api/t', new Blob([s], { type: 'application/json' })))) fetch('/api/t', { method: 'POST', body: s, keepalive: true }).catch(() => {});
  } catch { /* ignore */ }
};
const duree = () => { if (page && depuisT) { const s = Math.round((Date.now() - depuisT) / 1000); if (s >= 1) envoyer({ type: 'dur', page, n: s }); } depuisT = visible ? Date.now() : 0; };
window.MF = {
  pv(hash) {
    duree(); page = nomPage(hash); depuisT = visible ? Date.now() : 0;
    const o = { type: 'pv', page };
    if (premier) {
      premier = false;
      try { const r = document.referrer && new URL(document.referrer); if (r && r.hostname !== location.hostname) o.ref = r.hostname.replace(/^www\./, ''); } catch { /* ignore */ }
      o.us = P.get('utm_source'); o.uc = P.get('utm_campaign'); o.ut = P.get('utm_content');
    }
    envoyer(o);
  },
  ev(type, o = {}) { envoyer({ type, page, ...o }); },
};
document.addEventListener('visibilitychange', () => { if (document.hidden) { duree(); visible = false; depuisT = 0; } else { visible = true; depuisT = Date.now(); } });
window.addEventListener('pagehide', duree);
document.addEventListener('click', e => {
  const a = e.target.closest('a[href]'); if (!a) return;
  const h = a.getAttribute('href') || '';
  if (/^\/pdf\/[a-z0-9-]+\.pdf$/i.test(h)) window.MF.ev('pdf', { a: h.slice(5, -4) });
  else if (/^https?:\/\//.test(h) && a.hostname !== location.hostname) window.MF.ev('out', { a: a.hostname.replace(/^www\./, '') });
});
})();
