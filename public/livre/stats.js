/* Suivi d'audience anonyme de la page /livre (voir src/api/analytics.ts).
   - Aucun cookie, aucun stockage de visiteur : l'identifiant de visite vit en mémoire seulement.
   - Respecte « Do Not Track ».
   - Pour exclure TES appareils des statistiques : ouvre une fois  /livre/?notrack=1
     (pour réactiver : /livre/?notrack=0). */
(function () {
  'use strict';
  var PAGE = 'livre';
  var ENDPOINT = '/api/t';

  try {
    var qs0 = new URLSearchParams(location.search);
    if (qs0.get('notrack') === '1') localStorage.setItem('it_notrack', '1');
    if (qs0.get('notrack') === '0') localStorage.removeItem('it_notrack');
    if (localStorage.getItem('it_notrack') === '1') return;
  } catch (e) { /* stockage indisponible : on suit quand même */ }
  if (navigator.doNotTrack === '1' || window.doNotTrack === '1') return;
  if (!window.fetch && !navigator.sendBeacon) return;

  /* --- identité de la visite (mémoire uniquement) --- */
  var sid = (function () {
    var a = new Uint8Array(10), s = '', i;
    (window.crypto || window.msCrypto).getRandomValues(a);
    for (i = 0; i < a.length; i++) s += (a[i] % 36).toString(36);
    return s;
  })();

  /* --- contexte : provenance et campagne --- */
  var qs = new URLSearchParams(location.search);
  var ref = '';
  try { ref = document.referrer ? new URL(document.referrer).hostname : ''; } catch (e) {}
  if (ref === location.hostname) ref = '';
  var ctx = {
    r: ref,
    us: (qs.get('utm_source') || '').slice(0, 30),
    uc: (qs.get('utm_campaign') || '').slice(0, 40),
    ut: (qs.get('utm_content') || '').slice(0, 40),
    fb: qs.has('fbclid') ? 1 : 0
  };

  /* --- file d'envoi --- */
  var queue = [], timer = null;
  function now() { return Math.round(performance.now()); }
  function send(body) {
    try { if (navigator.sendBeacon && navigator.sendBeacon(ENDPOINT, new Blob([body], { type: 'text/plain' }))) return; } catch (e) {}
    try { fetch(ENDPOINT, { method: 'POST', body: body, keepalive: true, headers: { 'content-type': 'text/plain' } }); } catch (e) {}
  }
  function flush() {
    clearTimeout(timer); timer = null;
    if (!queue.length) return;
    send(JSON.stringify({ p: PAGE, s: sid, n: now(), c: ctx, e: queue.splice(0, 30) }));
    if (queue.length) timer = setTimeout(flush, 500);
  }
  function add(name, label, value) {
    queue.push({ n: name, l: label || '', v: value == null ? null : value, t: now() });
    if (!timer) timer = setTimeout(flush, 2500);
  }
  function slug(s, n) {
    return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, n);
  }
  function secOf(el) {
    var s = el && el.closest ? el.closest('[data-sec]') : null;
    return s ? s.getAttribute('data-sec') : 'autre';
  }

  /* --- 1. la visite --- */
  add('view');
  flush();

  /* --- 2. profondeur de lecture --- */
  var marks = { 25: 0, 50: 0, 75: 0, 100: 0 }, ticking = false;
  function onScroll() {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      var h = document.documentElement;
      var depth = (window.scrollY + window.innerHeight) / Math.max(h.scrollHeight, 1) * 100;
      [25, 50, 75, 100].forEach(function (m) {
        if (!marks[m] && depth >= (m === 100 ? 98.5 : m)) {
          marks[m] = 1; add('scroll', '', m);
          if (m === 100) markSection('14:pied');
        }
      });
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* --- 3. sections réellement vues (bande centrale de l'écran) --- */
  var seen = {};
  function markSection(name) { if (name && !seen[name]) { seen[name] = 1; add('section', name); } }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) markSection(en.target.getAttribute('data-sec')); });
    }, { rootMargin: '-40% 0px -40% 0px', threshold: 0 });
    Array.prototype.forEach.call(document.querySelectorAll('[data-sec]'), function (el) { io.observe(el); });
  }

  /* --- 4. clics : achat, extrait WhatsApp, images --- */
  var lastCta = '', checkoutDone = false;
  function modalOpen() {
    var w = document.querySelector('.cw-modal-wrapper');
    return !!w && getComputedStyle(w).display !== 'none' && w.getBoundingClientRect().height > 50;
  }
  function watchCheckout(tries) {
    if (checkoutDone) return;
    if (modalOpen()) { checkoutDone = true; add('checkout', lastCta); return; }
    if (tries > 0) setTimeout(function () { watchCheckout(tries - 1); }, 700);
  }
  document.addEventListener('click', function (e) {
    var t = e.target; if (!t || !t.closest) return;
    if (t.closest('.cw-modal-wrapper, .cw-modal-overlay')) return;
    var buy = t.closest('.buy-widget');
    if (buy) { lastCta = secOf(buy); checkoutDone = false; add('cta', lastCta); watchCheckout(6); return; }
    if (t.closest('[data-lead]')) { add('wa', 'extrait'); return; }
    var shot = t.closest('a.shot');
    if (shot) { add('zoom', slug((shot.getAttribute('href') || '').split('/').pop().replace(/\.[a-z]+$/i, ''), 30)); return; }
    var tab = t.closest('.ba-tabs button');
    if (tab) add('ba_tab', tab.getAttribute('data-ba') || '');
  }, true);

  /* --- 5. curseur avant/après et questions de la FAQ --- */
  var baDone = {};
  document.addEventListener('input', function (e) {
    var t = e.target;
    if (!t || t.type !== 'range') return;
    var ba = t.closest('.ba'); if (!ba) return;
    var id = (ba.id || '').replace(/^ba-/, '') || 'x';
    if (!baDone[id]) { baDone[id] = 1; add('ba', id); }
  }, true);
  var faqIndex = Array.prototype.slice.call(document.querySelectorAll('details'));
  document.addEventListener('toggle', function (e) {
    var d = e.target;
    if (!d || d.tagName !== 'DETAILS' || !d.open) return;
    var s = d.querySelector('summary');
    add('faq', (faqIndex.indexOf(d) + 1) + '-' + slug(s ? s.textContent : '', 28));
  }, true);

  /* --- 6. temps passé sur la page (onglet visible) --- */
  var visible = document.visibilityState === 'visible', last = performance.now(), engaged = 0;
  function tick() { var t = performance.now(); if (visible) engaged += t - last; last = t; }
  function leave() { tick(); add('leave', '', Math.round(engaged / 1000)); flush(); }
  document.addEventListener('visibilitychange', function () {
    tick(); visible = document.visibilityState === 'visible';
    if (!visible) leave();
  });
  window.addEventListener('pagehide', function () { tick(); visible = false; leave(); });
})();
