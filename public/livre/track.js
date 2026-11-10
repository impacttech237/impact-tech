/* Suivi Meta (pixel) + évènements de l'entonnoir de la page /livre.
   Renseigner PIXEL_ID (Gestionnaire d'évènements Meta > Sources de données). Vide = aucun suivi chargé. */
(function () {
  var PIXEL_ID = '';
  var PRODUCT = { content_ids: ['prd_k518lp13'], content_name: 'Livre IA - premiers revenus', content_type: 'product', value: 13500, currency: 'XAF' };
  function fbqSafe() { if (window.fbq) window.fbq.apply(null, arguments); }

  if (PIXEL_ID) {
    !function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments) };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = []; t = b.createElement(e); t.async = !0;
      t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s) }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    window.fbq('init', PIXEL_ID);
    window.fbq('track', 'PageView');
    window.fbq('track', 'ViewContent', PRODUCT);
  }

  var checkoutSent = false;
  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!t || !t.closest) return;
    if (!checkoutSent && t.closest('.buy-widget')) { checkoutSent = true; fbqSafe('track', 'InitiateCheckout', PRODUCT); }
    if (t.closest('[data-lead]')) { fbqSafe('track', 'Lead', { content_name: 'Extrait gratuit WhatsApp' }); }
  }, true);
})();
