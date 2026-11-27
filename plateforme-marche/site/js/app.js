/* Boussole CEMAC — application (sans dépendance). Routage par # : accueil, bibliothèque, texte, pratiquer, recherche, maîtriser, à propos. */
(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fold = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const md = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
const store = { get(k, d) { try { const v = localStorage.getItem('mf.' + k); return v == null ? d : JSON.parse(v); } catch { return d; } }, set(k, v) { try { localStorage.setItem('mf.' + k, JSON.stringify(v)); } catch { /* stockage indisponible */ } } };
const ic = (n, c) => window.ic(n, c);
const PERSO_COULEUR = { kofi: '#8fa9ff', amina: '#ffcb52', samir: '#ff7f7f', lina: '#ffcb52', leo: '#5fd3b3', nadia: '#b99cff', fatou: '#ff9f5a', jean: '#8fa9ff' };
const perso = () => '';
const lbls = txt => String(txt).split(/\s+/).filter(Boolean).map((m, i) => `<span class="lbl l${i % 6 + 1}" style="--r:${[-1.6, 1.1, -.6, 1.5, -1.1, .8][i % 6]}deg">${esc(m)}</span>`).join(' ');
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

/* ---------- libellés ---------- */
const TYPE = { instruction: 'Instruction', reglement: 'Règlement', reglement_general: 'Règlement général', reglement_ueac: 'Règlement UEAC', reglement_bvmac: 'Règlement général BVMAC', instruction_bvmac: 'Instruction BVMAC', acte_additionnel: 'Acte additionnel', circulaire: 'Lettre circulaire', lignes_directrices: 'Lignes directrices', communique: 'Communiqué', traite: 'Traité', convention: 'Convention', acte_uniforme: 'Acte uniforme', guide: 'Guide' };
const TYPE_PLURIEL = { instruction: 'Instructions COSUMAF', reglement: 'Règlements', reglement_general: 'Règlements généraux', reglement_ueac: 'Règlement UEAC', reglement_bvmac: 'Règlement général BVMAC', instruction_bvmac: 'Instructions BVMAC', acte_additionnel: 'Actes additionnels', circulaire: 'Lettres circulaires', lignes_directrices: 'Lignes directrices', communique: 'Communiqués', traite: 'Traité', convention: 'Convention', acte_uniforme: 'Acte uniforme', guide: 'Guide' };
const ORG = { cosumaf: 'COSUMAF', bvmac: 'BVMAC', cemac: 'CEMAC', umac: 'UMAC', ueac: 'UEAC', ohada: 'OHADA' };
const STATUT = { en_vigueur: 'En vigueur', abroge: 'Abrogé', modifie: 'Modifié', projet: 'Projet' };
const COUV = { complete: 'Texte couvert en entier', partielle: 'Couverture partielle', contexte: 'Fiche de contexte' };
const SECTIONS = { delai: 'Délais', montant: 'Montants et seuils', role: 'Rôles des acteurs', definition: 'Définitions', liste: 'Listes à retenir', piege: 'Pièges' };
const SPECIAL = { 'r19-intro': 'Règlement CEMAC/UMAC de 2019 (introduction en bourse des États)', 'rg-23': 'Règlement général de la COSUMAF (2023)', 'rbv-08': 'Règlement général de la BVMAC (2008)', 'rbv-25': 'Règlement général de la BVMAC (2025)', 'rfi-07': 'Règlement UEAC 14/07 (régime fiscal BVMAC)', 'r03-26': 'Règlement n° 03 du 7 octobre 2026 (placement privé)', 'r06-03': 'Règlement 06/03 (organisation du marché, ancien)' };

let D = null;
const T = id => D.T.get(id);
const shortName = t => {
  if (SPECIAL[t.id]) return SPECIAL[t.id];
  const base = TYPE[t.type] || ''; const n = t.numero || '';
  return (fold(n).startsWith(fold(base)) ? n : `${base} ${n}`.trim()).replace(/\b(\S+) \1\b/g, '$1');
};
const dateCourte = t => { const d = (t.date_texte || '').split(',')[0]; return /^\d/.test(d) ? ' du ' + d : d ? ` (${d})` : ''; };
const citation = (t, article) => `${shortName(t)}${dateCourte(t)}${article ? ', ' + article : ''}`;
const themeNom = id => D.themes.get(id)?.nom || id;

/* ---------- données ---------- */
async function charger() {
  const idx = await fetch('/data/index.json').then(r => r.json());
  D = { ...idx, faits: [], T: new Map(idx.textes.map(t => [t.id, t])), themes: new Map(idx.themes.map(t => [t.id, t])), parTexte: new Map(), parId: new Map((idx.vedettes || []).map(f => [f.id, f])) };
  // faits.json (le plus lourd) se charge en arrière-plan ; seules les pages qui en ont besoin l'attendent
  D.pret = fetch('/data/faits.json').then(r => r.json()).then(faits => {
    D.faits = faits; D.parId = new Map(faits.map(f => [f.id, f]));
    for (const f of faits) { if (!D.parTexte.has(f.t)) D.parTexte.set(f.t, []); D.parTexte.get(f.t).push(f); }
  });
}
let retenirCache = null;
const chargerRetenir = async () => retenirCache ||= await fetch('/data/retenir.json').then(r => r.json());
const contenuCache = new Map();
const chargerContenu = async id => { if (!contenuCache.has(id)) contenuCache.set(id, await fetch(`/data/contenu/${id}.json`).then(r => r.json())); return contenuCache.get(id); };

/* ---------- utilitaires d'interface ---------- */
const toast = msg => { const t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), 2200); };
const copier = async (texte, msg = 'Copié') => { try { await navigator.clipboard.writeText(texte); toast(msg); } catch { prompt('Copiez ce texte :', texte); } };
const telecharger = (nom, contenu, type) => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([contenu], { type })); a.download = nom; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); };
const csv = (lignes) => '﻿' + lignes.map(l => l.map(c => `"${String(c ?? '').replace(/"/g, '""').replace(/\*\*/g, '')}"`).join(';')).join('\r\n');
const hl = (texte, termes) => {
  let s = esc(texte);
  for (const t of termes) { if (t.length < 2) continue; const re = new RegExp('(' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi'); s = s.replace(re, '<mark>$1</mark>'); }
  return s;
};
const hlFold = (texte, termes) => { // surligne sans tenir compte des accents
  if (!termes.length) return esc(texte);
  const f = fold(texte); const marques = [];
  for (const t of termes) { if (t.length < 2) continue; let i = 0; while ((i = f.indexOf(t, i)) !== -1) { marques.push([i, i + t.length]); i += t.length; } }
  if (!marques.length) return esc(texte);
  marques.sort((a, b) => a[0] - b[0]);
  const fus = []; for (const m of marques) { const l = fus[fus.length - 1]; if (l && m[0] <= l[1]) l[1] = Math.max(l[1], m[1]); else fus.push([...m]); }
  let out = '', p = 0; for (const [a, b] of fus) { out += esc(texte.slice(p, a)) + '<mark>' + esc(texte.slice(a, b)) + '</mark>'; p = b; }
  return out + esc(texte.slice(p));
};
const badgeStatut = t => `<span class="badge ${t.statut === 'abroge' ? 'bad' : 'ok'}">${STATUT[t.statut] || t.statut}</span>`;
const badgeConfiance = () => '';
const params = q => { const o = {}; for (const [k, v] of new URLSearchParams(q || '')) o[k] = v; return o; };
const qs = o => { const p = new URLSearchParams(); for (const [k, v] of Object.entries(o)) if (v !== '' && v != null && v !== false) p.set(k, v === true ? '1' : v); const s = p.toString(); return s ? '?' + s : ''; };
const options = (map, sel, tous) => `<option value="">${tous}</option>` + Object.entries(map).map(([k, v]) => `<option value="${esc(k)}" ${k === sel ? 'selected' : ''}>${esc(v)}</option>`).join('');

/* ---------- cadre : en-tête, pied ---------- */
// Barre simple sur ordinateur (4 liens + « S'entraîner » + recherche + compte), menu plein écran sur téléphone (toutes les rubriques, par sections).
const MENU = [
  { titre: 'Comprendre', liens: [['/decouvrir', 'lightbulb', 'Découvrir', 'Les bases, sans jargon'], ['/acteurs', 'users', 'Les acteurs', 'Régulateur, bourse, sociétés'], ['/bibliotheque', 'graduation-cap', 'Cours', 'Onze cours complets'], ['/textes', 'file-text', 'Textes officiels', 'COSUMAF, BVMAC, CEMAC'], ['/pratiquer', 'clipboard-list', 'Délais et montants', 'Tous les repères chiffrés']] },
  { titre: 'S\'entraîner', liens: [['/flashcards', 'layers', 'Flashcards', 'Retourner, se noter'], ['/quiz', 'circle-check', 'Quiz', 'Séries de questions'], ['/jeux', 'gamepad-2', 'Jeux', 'Réviser en jouant'], ['/exercices', 'pencil-line', 'Exercices', 'Trous, tri, ordre'], ['/examen', 'clipboard-check', 'Examen blanc', 'Conditions réelles'], ['/olympiade', 'trophy', 'Olympiade blanche', 'Le grand test'], ['/planning', 'calendar-days', 'Plan de révision', 'Jour après jour'], ['/progres', 'activity', 'Mes progrès', 'Niveau, série, badges']] },
  { titre: 'Aide', liens: [['/guide', 'compass', 'Guide d\'utilisation', 'Prendre en main'], ['/a-propos', 'info', 'À propos', 'Le projet, les sources'], ['/methode', 'shield-check', 'Méthode et vérification', 'Comment les repères sont contrôlés'], ['/mentions', 'scale', 'Mentions légales', 'Éditeur, confidentialité']] },
];
const NAV_DIRECT = [['/decouvrir', 'Découvrir'], ['/bibliotheque', 'Cours'], ['/textes', 'Textes'], ['/acteurs', 'Acteurs']];
const lienMenu = ([h, i, l, d]) => `<a href="#${h}" data-nav="${h}" class="mlien">${ic(i)}<span><b>${l}</b><small>${d}</small></span></a>`;
const ENTRAINER = MENU[1].liens;
function fermerMenu(rendreFocus) {
  document.body.classList.remove('menu-ouvert');
  $('#burger')?.setAttribute('aria-expanded', 'false'); $('#ent')?.setAttribute('aria-expanded', 'false');
  const t = $('#tiroir'); if (t) t.hidden = true; const e = $('#entpan'); if (e) e.hidden = true;
  if (rendreFocus) $('#burger')?.focus();
}
function cadre() {
  $('#top').innerHTML = `<div class="bar">
    <a class="marque" href="#/" data-nav="/" aria-label="Boussole CEMAC, accueil">${ic('compass')}<span>Boussole <em>CEMAC</em></span></a>
    <nav class="nav" aria-label="Navigation principale">${NAV_DIRECT.map(([h, l]) => `<a href="#${h}" data-nav="${h}">${l}</a>`).join('')}
      <span class="pop"><button type="button" id="ent" aria-expanded="false" aria-controls="entpan" data-groupe="${ENTRAINER.map(x => x[0]).join(' ')}">S'entraîner ${ic('chevron-down')}</button>
        <div class="entpan" id="entpan" hidden>${ENTRAINER.map(lienMenu).join('')}</div></span></nav>
    <div class="outils"><a class="btn-ic" href="#/recherche" data-nav="/recherche" aria-label="Rechercher" title="Rechercher (Ctrl K)">${ic('search')}<span class="lib">Chercher</span></a>
      <a href="#/compte" data-nav="/compte" class="btn-ic acct" aria-label="Compte">${ic('user')}<i class="dot"></i></a>
      <button type="button" class="btn-ic" id="burger" aria-expanded="false" aria-controls="tiroir" aria-label="Menu">${ic('menu')}</button></div></div>
    <div class="tiroir" id="tiroir" role="dialog" aria-modal="true" aria-label="Menu" hidden>
      <div class="tiroir-in"><div class="tiroir-tete"><strong>${ic('compass')} Boussole CEMAC</strong><button type="button" id="mfermer" aria-label="Fermer le menu">${ic('x')}</button></div>
        <a class="mrech" href="#/recherche" data-nav="/recherche">${ic('search')} Rechercher un délai, un texte, un acteur…</a>
        ${MENU.map(g => `<section><h2>${g.titre}</h2><div class="mgrille">${g.liens.map(lienMenu).join('')}</div></section>`).join('')}
        <a class="mcompte" href="#/compte" data-nav="/compte">${ic('user')} Mon compte (facultatif)</a></div></div>`;
  majIconeCompte();
  $('#burger').onclick = () => { if ($('#tiroir').hidden) { $('#tiroir').hidden = false; document.body.classList.add('menu-ouvert'); $('#burger').setAttribute('aria-expanded', 'true'); $('#mfermer').focus(); } else fermerMenu(true); };
  $('#mfermer').onclick = () => fermerMenu(true);
  $('#tiroir').onclick = e => { if (e.target.id === 'tiroir' || e.target.closest('a')) fermerMenu(false); };
  $('#ent').onclick = e => { e.stopPropagation(); const ouvrir = $('#entpan').hidden; $('#entpan').hidden = !ouvrir; $('#ent').setAttribute('aria-expanded', String(ouvrir)); };
  $('#entpan').onclick = e => { if (e.target.closest('a')) fermerMenu(false); };
  document.addEventListener('click', e => { if (!e.target.closest('.pop')) { const p = $('#entpan'); if (p && !p.hidden) { p.hidden = true; $('#ent').setAttribute('aria-expanded', 'false'); } } });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && (!$('#tiroir').hidden || !$('#entpan').hidden)) fermerMenu(!$('#tiroir').hidden); });
  $('#foot').innerHTML = `<div class="foot-in"><div><strong>Outil d'aide à la lecture, non officiel.</strong> Il ne remplace pas les textes publiés par la COSUMAF et la BVMAC. Les textes viennent des sites officiels de la COSUMAF et de la BVMAC : citez toujours le texte publié.</div>
    <div>Gratuit, sans compte. Données du ${esc(D.genere_le)} · version ${esc(D.version)} · ${D.stats.textes} textes, ${D.stats.faits} faits. <a href="#/a-propos">À propos</a> · <a href="#/methode">Méthode</a> · <a href="#/mentions">Mentions légales</a> · <a href="/textes/">Liste des textes</a> · <a href="#/guide">Guide</a> · <a href="#/planning">Plan de révision</a> · <a href="#/olympiade">Olympiade blanche</a></div></div>`;
}
const marquerNav = path => {
  const dans = h => h === '/' ? path === '/' : path.startsWith(h) || (h === '/bibliotheque' && (path.startsWith('/texte') || path.startsWith('/cours')));
  $$('[data-nav]').forEach(a => { if (dans(a.dataset.nav)) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  const g = $('#ent'); if (g) { if (g.dataset.groupe.split(' ').some(dans)) g.setAttribute('aria-current', 'page'); else g.removeAttribute('aria-current'); }
  fermerMenu(false);
};

/* ---------- recherche ---------- */
const STOP = new Set('de du des la le les un une et au aux en d l a à ou pour par sur dans qui que est sont'.split(' '));
const termes = q => { const t = fold(q).split(/[^a-z0-9/-]+/).filter(Boolean); const k = t.filter(x => !STOP.has(x)); return k.length ? k : t; };
const has = (h, x) => h.includes(x) || (x.length > 3 && /[sx]$/.test(x) && h.includes(x.slice(0, -1)));
const tous = (h, ts) => ts.every(x => has(h, x));
// Classe des éléments : d'abord tous les mots, puis (si rien) au moins 60 % des mots.
function classer(items, fn, ts) {
  let r = items.map(i => [fn(i, ts, ts.length), i]).filter(x => x[0] > 0), relaxe = false;
  if (!r.length && ts.length > 1) { const need = Math.max(2, Math.ceil(ts.length * .6)); r = items.map(i => [fn(i, ts, need), i]).filter(x => x[0] > 0); relaxe = r.length > 0; }
  return { liste: r.sort((a, b) => b[0] - a[0]).map(x => x[1]), relaxe };
}
function noteFait(f, ts, need) {
  const t = T(f.t); const q = fold(f.q), v = fold(f.v), rest = fold((f.a || '') + ' ' + shortName(t) + ' ' + (f.n || ''));
  let s = 0, n = 0; for (const x of ts) { const a = has(q, x), b = has(v, x), c = has(rest, x); if (a || b || c) { n++; s += (a ? 3 : 0) + (b ? 2 : 0) + (c ? 1 : 0); } }
  if (n < need) return 0;
  return s - (t.statut === 'abroge' ? 2.5 : 0) + (f.y === 'delai' || f.y === 'montant' ? .4 : 0) + 0.01;
}
function noteTexte(t, ts, need) {
  const h = fold(shortName(t) + ' ' + t.titre + ' ' + t.numero + ' ' + ORG[t.organisme] + ' ' + (t.date_texte || '')); const c = fold(shortName(t));
  let s = 0, n = 0; for (const x of ts) if (has(h, x)) { n++; s += has(c, x) ? 4 : 2; }
  if (n < need) return 0;
  return s - (t.statut === 'abroge' ? 2 : 0) + 0.01;
}
function notePoint(r, ts, need) {
  const t = T(r.t); const h = fold(r.x), c = fold(shortName(t)); let s = 0, n = 0;
  for (const x of ts) { const a = has(h, x), b = has(c, x); if (a || b) { n++; s += a ? 2 : 1; } }
  return n < need ? 0 : s - (t.statut === 'abroge' ? 1.5 : 0) + 0.01;
}

/* ---------- vues ---------- */
const MAT = { accueil: '#2f7d4e', decouvrir: '#2f7d4e', comprendre: '#35569e', bibliotheque: '#2f7d4e', flashcards: '#2c7a8f', quiz: '#3a5fb8', jeux: '#3a5fb8', progres: '#2f7d4e', compte: '#2c7a8f', textes: '#2f7d4e', acteurs: '#2c7a8f', exercices: '#3a5fb8', examen: '#c2392f', olympiade: '#c2392f', planning: '#c9a46b', guide: '#2f7d4e', carte: '#6b4fb0', cours: '#2c7a8f', pratiquer: '#35569e', recherche: '#2f7d4e', maitriser: '#3a5fb8', apropos: '#2f7d4e', introuvable: '#c2392f' };
const MAT_ORG = { cosumaf: '#35569e', bvmac: '#d9692f', cemac: '#2c7a8f', umac: '#c99a2e', ueac: '#c2392f', ohada: '#6b4fb0' };
const fond = c => document.documentElement.style.setProperty('--mat', c);
const views = {};

views.accueil = async () => {
  const [gs, , ANN] = await Promise.all([chargerGuides().catch(() => []), chargerCoursIdx(), chargerAnnuaire().catch(() => [])]);
  const nbPdf = D.textes.filter(t => t.pdf).length, nbEnVigueur = D.textes.filter(t => t.statut === 'en_vigueur').length;
  const exemples = ['délai visa APE', 'capital minimum société de bourse', 'placement privé', 'agrément dirigeant'];
  const vedettes = ['rg-23.delai.16', 'rg-23.delai.07', 'rg-23.montant.07', 'aa06-17.montant.01'].map(id => D.parId.get(id)).filter(Boolean);
  const public_ = [
    ['#/decouvrir', 'lightbulb', 'Grand public', 'Je veux comprendre la bourse', 'Épargner, acheter, vendre, se protéger : les bases expliquées simplement, chaque affirmation renvoyant à son article.', 'Découvrir'],
    ['#/bibliotheque', 'graduation-cap', 'Étudiants', 'J\'étudie le marché financier', 'Onze cours complets : résumés, fiches, schémas animés et glossaire, puis flashcards et quiz pour retenir.', 'Ouvrir les cours'],
    ['#/recherche', 'scale', 'Professionnels', 'Je travaille avec la réglementation', 'Un délai, un montant, un rôle ? Retrouvez-le en quelques secondes avec l\'article, le statut du texte et le PDF officiel.', 'Rechercher'],
  ];
  const outils = [
    ['#/flashcards', 'layers', 'Flashcards', 'Retournez la carte, notez-vous : les cartes difficiles reviennent vite, les acquises de plus en plus tard.'],
    ['#/quiz', 'circle-check', 'Quiz', 'Des séries de 10 questions sur les délais et les montants, avec l\'article de référence après chaque réponse.'],
    ['#/jeux', 'gamepad-2', 'Jeux', 'Memory, vrai/faux éclair, mot mystère, défi de 60 secondes : réviser sans s\'en rendre compte.'],
    ['#/progres', 'activity', 'Progrès', 'Niveau, points, série de jours, calendrier, badges : voyez ce que vous maîtrisez déjà.'],
  ];
  const sources = [
    ['library', `${D.textes.length} textes, avec leur statut`, 'En vigueur ou abrogé, et par quel texte remplacé. Plus de doute sur la version à citer.'],
    ['download', `${nbPdf} PDF officiels à télécharger`, 'Chaque fiche propose le document complet, et un lien vers le site de la COSUMAF ou de la BVMAC.'],
    ['quote', 'Chaque repère cite son article', 'Copiez la référence en un clic : « Instruction 23-24 du 18 juillet 2024, art. 2 ».'],
  ];
  const faq = [
    ['C\'est vraiment gratuit ?', 'Oui. Tout est gratuit, sans publicité, et il n\'y a rien à débloquer.'],
    ['Faut-il créer un compte ?', 'Non. Tout fonctionne sans compte. Un compte facultatif (e-mail et mot de passe) sauvegarde votre progression et la synchronise entre vos appareils.'],
    ['Ce site est-il officiel ?', 'Non. C\'est un outil d\'aide à la lecture : il ne remplace pas les textes publiés par la COSUMAF et la BVMAC. Citez toujours le texte publié.'],
    ['D\'où viennent les textes ?', 'Ils ont été téléchargés sur les sites officiels de la COSUMAF et de la BVMAC. Chaque fiche renvoie vers eux.'],
    ['Puis-je l\'utiliser sans connexion ?', 'Oui, après une première visite, les pages et les données fonctionnent sans réseau. Les PDF demandent une connexion.'],
    ['Que devient ma vie privée ?', 'La mesure d\'audience est anonyme : ni cookie, ni adresse IP. Votre progression reste sur votre appareil, sauf si vous créez un compte.'],
  ];
  const extraits = ['bourse-en-bref', 'qui-protege', 'ou-sont-mes-titres'].map(id => gs.find(g => g.id === id)).filter(Boolean);
  return { title: 'Boussole CEMAC : la bourse et ses règles, textes, délais, montants', html: `
    <section class="hero">
      <h1 class="h1"><span class="lbl l6" style="--r:-2deg">Boussole</span><br><span class="lbl l1" style="--r:1.2deg">CEMAC</span></h1>
      <span class="hand">La bourse et ses règles, de A à Z</span>
      <p class="lead">Un délai, un montant, un rôle ? Retrouvez-le dans les textes de la COSUMAF et de la BVMAC, avec l'article cité. Gratuit, sans compte.</p>
      <form class="bigsearch" id="hs" role="search"><label for="hq" class="sr">Rechercher dans les textes</label><input id="hq" type="search" placeholder="Ex. : délai visa APE, capital minimum, conservation 10 ans" autocomplete="off"><button class="btn" type="submit">${ic('search')} Rechercher</button></form>
      <div class="chips" aria-label="Exemples de recherche">${exemples.map(e => `<a class="chip" href="#/recherche${qs({ q: e })}">${esc(e)}</a>`).join('')}</div>
    </section>

    <div class="band" aria-label="Le site en chiffres">
      <div><b>${D.textes.length}</b><span>textes</span></div><div><b>${D.stats.faits.toLocaleString('fr-FR')}</b><span>repères sourcés</span></div><div><b>${nbPdf}</b><span>PDF officiels</span></div><div><b>${coursIdx.length}</b><span>cours</span></div><div><b>${coursIdx.reduce((n, c) => n + c.n.fiches, 0)}</b><span>fiches</span></div><div><b>${coursIdx.reduce((n, c) => n + c.n.questions, 0)}</b><span>questions</span></div><div><b>0 €</b><span>sans compte</span></div>
    </div>

    <section class="land"><h2 class="sec"><span class="lbl l2">Pour qui ?</span></h2>
      <div class="aud">${public_.map(([h, i, quoi, t, d, cta]) => `<a class="card aud-c" href="${h}"><span class="ico">${ic(i)}</span><small>${quoi}</small><h3>${t}</h3><p>${d}</p><span class="btn sm">${cta} ${ic('arrow-right')}</span></a>`).join('')}</div>
    </section>

    ${ANN.length ? `<section class="land"><h2 class="sec"><span class="lbl l5">Les acteurs du marché</span></h2>
      <p class="lead">Le régulateur, la bourse, ${ANN.filter(a => a.type === 'societe-de-bourse').length} sociétés de bourse, ${ANN.filter(a => a.type === 'sgo').length} sociétés de gestion et leurs dirigeants : retrouvez qui fait quoi, avec les logos et les coordonnées officielles.</p>
      <div class="vedettes" style="margin-top:20px">${ANN.filter(a => ['cosumaf', 'bvmac'].includes(a.id)).map(a => `<a class="card vedette" href="#/acteurs/${a.id}">${logoActeur(a, 'grand')}<div><small>${TYPE_ACTEUR[a.type]}</small><b>${esc(a.nom.replace(/^[^:]*:\s*/, ''))}</b>${a.dirigeants?.[0] ? `<span class="vdir">${photoDir(a.dirigeants[0])}<span>${esc(a.dirigeants[0].nom)}<small>${esc(a.dirigeants[0].titre)}</small></span></span>` : ''}</div></a>`).join('')}</div>
      
      <p style="margin-top:18px"><a class="btn" href="#/acteurs">${ic('users')} Voir tous les acteurs</a></p></section>` : ''}

    <section class="land"><h2 class="sec"><span class="lbl l6">Une réponse en quelques secondes</span></h2>
      <p class="lead">Voici ce que renvoie le site. Chaque ligne cite l'article et le texte d'origine.</p>
      <div class="sheet"><div class="facts">${vedettes.map(f => factHtml(f, true)).join('')}</div></div>
      <p><a class="btn" href="#/pratiquer">${ic('clipboard-list')} Voir tous les délais et montants</a></p>
    </section>

    <section class="land"><h2 class="sec"><span class="lbl l4">Comment ça marche</span></h2>
      <ol class="steps">
        <li><span class="n">1</span><h3>Cherchez</h3><p>Tapez un mot : « visa », « capital minimum », « 30 jours ». La recherche tolère les accents et les pluriels.</p></li>
        <li><span class="n">2</span><h3>Lisez à la source</h3><p>Chaque résultat indique l'article, le texte, son statut et renvoie vers le PDF officiel.</p></li>
        <li><span class="n">3</span><h3>Retenez</h3><p>Flashcards, quiz et jeux reprennent ce que vous venez de lire, pour qu'il en reste quelque chose.</p></li>
      </ol>
    </section>

    <section class="land"><h2 class="sec"><span class="lbl l1">Pour retenir</span></h2>
      <div class="doors">${outils.map(([h, i, t, d]) => `<a class="card door" href="${h}"><h3><span class="ico">${ic(i)}</span>${t}</h3><p>${d}</p></a>`).join('')}</div>
    </section>

    <section class="land"><h2 class="sec"><span class="lbl l5">Toujours à la source</span></h2>
      <div class="srcgrid">${sources.map(([i, t, d]) => `<div class="sheet"><span class="ico2">${ic(i)}</span><h3>${esc(t)}</h3><p>${esc(d)}</p></div>`).join('')}</div>
      <p class="chips" style="margin-top:6px"><a class="btn" href="#/bibliotheque">${ic('library')} Ouvrir la bibliothèque</a><a class="btn ghost" href="/textes/">${ic('file-text')} Liste des ${D.textes.length} textes</a></p>
    </section>

    ${extraits.length ? `<section class="land"><h2 class="sec"><span class="lbl l6">Pour commencer à lire</span></h2>
      <ol class="list guides" style="margin-top:0">${extraits.map(g => `<li><a class="card item" href="#/${g.porte}/${g.id}"><span class="t">${esc(g.titre)}</span><span class="sub">${esc(g.accroche)}</span><span class="meta"><span>${g.porte === 'decouvrir' ? 'Découvrir' : 'Comprendre'}</span></span></a></li>`).join('')}</ol></section>` : ''}

    <section class="land"><h2 class="sec"><span class="lbl l2">Questions fréquentes</span></h2>
      <div class="faq">${faq.map(([q, r]) => `<details class="qa"><summary>${esc(q)}</summary><div>${esc(r)}</div></details>`).join('')}</div>
    </section>

    <section class="land final">
      <h2 class="h1">${lbls('Prêt à chercher ?')}</h2>
      <p class="lead">${nbEnVigueur} textes en vigueur, du règlement général aux lettres circulaires, à portée de clic.</p>
      <p class="chips" style="justify-content:center"><a class="btn" href="#/recherche">${ic('search')} Rechercher</a><a class="btn ghost" href="#/bibliotheque">${ic('library')} Ouvrir les cours</a></p>
    </section>`,
    after() { $('#hs').addEventListener('submit', e => { e.preventDefault(); location.hash = '#/recherche' + qs({ q: $('#hq').value.trim() }); }); } };
};

const SHORT = { cadre: 'Le cadre', titres: 'Titres', agrement: 'Agrément', ape: 'Appel public', pp: 'Placement privé', opc: 'Fonds (OPC)', conformite: 'Conformité', vie: 'Vie des structures', marche: 'Marché BVMAC', change: 'Changes' };
const COULEURS = ['#e0703a', '#2f6f86', '#dfa93b', '#d4563a', '#3d6a80', '#8a5aa8'];
const rng = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const PLANTE = '<svg viewBox="0 0 60 80" width="64"><path d="M30 50 C30 30 18 22 8 20 C10 34 18 46 30 50Z" fill="#3fae6a" stroke="#1b1410" stroke-width="2.5" stroke-linejoin="round"/><path d="M30 50 C30 26 40 14 54 12 C54 30 44 44 30 50Z" fill="#57c97f" stroke="#1b1410" stroke-width="2.5" stroke-linejoin="round"/><path d="M30 50 C28 36 30 24 30 10 C36 20 36 38 30 50Z" fill="#2f8f55" stroke="#1b1410" stroke-width="2.5" stroke-linejoin="round"/><path d="M14 52 H46 L42 78 H18Z" fill="#e0703a" stroke="#1b1410" stroke-width="2.8" stroke-linejoin="round"/><path d="M12 52 H48" stroke="#1b1410" stroke-width="5" stroke-linecap="round"/></svg>';
const TASSE = '<svg viewBox="0 0 60 60" width="54"><path d="M16 6 q-4 6 0 11 M26 4 q-4 6 0 12 M36 6 q-4 6 0 11" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".85"/><path d="M10 22 H44 V44 a8 8 0 0 1 -8 8 H18 a8 8 0 0 1 -8 -8Z" fill="#fff" stroke="#1b1410" stroke-width="2.8" stroke-linejoin="round"/><path d="M44 28 h5 a6 6 0 0 1 0 14 h-5" fill="none" stroke="#1b1410" stroke-width="2.8"/><path d="M10 30 H44" stroke="#e0312b" stroke-width="6"/></svg>';
function dessinerEtagere(box, cours) {
  const largeur = box.clientWidth - 24, rand = rng(7), lignes = [[], []];
  cours.forEach((r, i) => lignes[i % 2].push({ r, i }));
  const html = lignes.map((cs, n) => {
    const nb = Math.max(5, Math.floor((largeur - cs.length * 56 - 200) / 31)), total = nb + cs.length, items = [];
    for (let k = 0; k < total; k++) items.push({ h: 100 + Math.floor(rand() * 46), w: 18 + Math.floor(rand() * 18), c: COULEURS[Math.floor(rand() * COULEURS.length)], tilt: rand() < .06 });
    cs.forEach((c, j) => { items[Math.floor(total * (j + 1) / (cs.length + 1))] = { cours: c }; });
    if (n === 1) items.splice(Math.floor(total / 2), 0, { pile: [0, 1, 2].map(() => COULEURS[Math.floor(rand() * COULEURS.length)]) });
    items.splice(n === 0 ? 1 : total - 1, 0, { objet: n === 0 ? PLANTE : TASSE });
    const livres = items.map(it => {
      if (it.objet) return `<div class="prop">${it.objet}</div>`;
      if (it.pile) return `<div class="flatstack">${it.pile.map(c => `<i style="background-color:${c}"></i>`).join('')}</div>`;
      if (it.cours) { const { r } = it.cours; const c = COULEUR_COURS[r.couleur] || COULEURS[0]; return `<a class="book course" data-c="${r.couleur === 'mustard' ? 'mustard' : ''}" href="#/cours/${r.id}" style="width:54px;height:156px;background-color:${c}" title="${esc(r.titre)}" aria-label="${esc(r.titre)}"><span class="spine">${esc(r.court)}</span></a>`; }
      return `<div class="book${it.tilt ? ' tilt' : ''}" style="width:${it.w}px;height:${it.h}px;background-color:${it.c}"></div>`;
    }).join('');
    return `<div class="shelf"><div class="books">${livres}</div><div class="plank"></div></div>`;
  }).join('');
  box.innerHTML = html + `<nav class="shelflegend" aria-label="Tous les cours">${cours.map(r => `<a href="#/cours/${r.id}"><i style="background-color:${COULEUR_COURS[r.couleur] || COULEURS[0]}"></i>${esc(r.court)}<small>${mastCours(r)}%</small></a>`).join('')}</nav>`;
}

views.bibliotheque = async (_a, q) => {
  const cours = await chargerCoursIdx(); const CPa = await chargerCoursParcours();
  const st = { q: q.q || '', statut: q.statut || 'en_vigueur', org: q.org || '', tout: q.tout === '1' };
  const filtrer = () => { const ts = termes(st.q);
    return D.textes.filter(t => (!st.org || t.organisme === st.org) && (st.statut === 'tous' || t.statut === st.statut) && tous(fold(shortName(t) + ' ' + t.titre + ' ' + t.numero + ' ' + (t.date_texte || '')), ts))
      .sort((a, b) => (b.date_adoption || '').localeCompare(a.date_adoption || '') || a.ordre - b.ordre); };
  const carte = t => `<li><a class="card item" href="#/texte/${t.id}"><span class="t">${esc(shortName(t))}</span><span class="sub">${esc(t.titre)}</span><span class="meta">${badgeStatut(t)}<span>${ORG[t.organisme]}</span>${t.date_texte ? `<span>${esc(t.date_texte)}</span>` : ''}${t.pdf ? `<span>${ic('download')} PDF</span>` : ''}</span></a></li>`;
  return { title: 'Bibliothèque', html: `
    <h1 class="h1">${lbls('Bibliothèque')}</h1>
    <form class="sbar shelfsearch" id="bf" role="search"><span class="sico">${ic('search')}</span><input id="bq" type="search" value="${esc(st.q)}" placeholder="Chercher un cours ou un texte : visa, règlement 01/22…" autocomplete="off" aria-label="Chercher"></form>
    <section class="shelves" id="shelves" aria-label="Les cours"></section>
    <section id="liste" class="liste"></section>`,
    after() {
      fond(MAT.bibliotheque); const box = $('#shelves');
      const maj = defiler => {
        dessinerEtagere(box, cours);
        const montre = st.q || st.tout, l = montre ? filtrer() : [], cs = st.q ? cours.filter(c => fold(c.titre + ' ' + c.court + ' ' + c.description).includes(fold(st.q))) : [];
        $('#liste').innerHTML = !montre
          ? `<a class="suite" href="#/textes" style="margin-top:44px"><small>Les textes officiels</small><b>${D.textes.length} textes, du traité fondateur à la lettre circulaire</b><i>Comprendre leur hiérarchie, savoir lesquels sont en vigueur, télécharger les PDF.</i><span>${ic('arrow-right')}</span></a>${parcoursLecture(cours, CPa)}<div class="hint"><p>Ou consultez directement les textes officiels.</p><a class="btn" id="all" href="#/bibliotheque?tout=1">${ic('library')} Voir les ${D.textes.length} textes</a></div>`
          : `${cs.length ? `<h2 class="sec"><span class="lbl l6">Cours</span></h2><ul class="list" style="margin-bottom:34px">${cs.map(c => `<li><a class="card item" href="#/cours/${c.id}"><span class="t">${esc(c.titre)}</span><span class="sub">${esc(c.description || '')}</span><span class="meta"><span>${c.n.fiches} fiches</span><span>${c.n.cartes} cartes</span><span>${c.n.questions} questions</span></span></a></li>`).join('')}</ul>` : ''}
            <div class="listhead"><h2 class="sec"><span class="lbl l2">Les textes</span></h2>
              <div class="mini"><label>Statut<select id="fs"><option value="en_vigueur" ${st.statut === 'en_vigueur' ? 'selected' : ''}>En vigueur</option><option value="abroge" ${st.statut === 'abroge' ? 'selected' : ''}>Abrogés</option><option value="tous" ${st.statut === 'tous' ? 'selected' : ''}>Tous</option></select></label>
              <label>Organisme<select id="fo">${options(ORG, st.org, 'Tous')}</select></label></div></div>
              <p class="count" aria-live="polite">${l.length} texte${l.length > 1 ? 's' : ''}</p><ul class="list">${l.length ? l.map(carte).join('') : '<li class="empty">Aucun texte ne correspond.</li>'}</ul>`;
        history.replaceState(null, '', '#/bibliotheque' + qs({ q: st.q, statut: st.statut === 'en_vigueur' ? '' : st.statut, org: st.org, tout: st.tout && !st.q }));
        $('#all')?.addEventListener('click', e => { e.preventDefault(); st.tout = true; maj(true); });
        $('#fs')?.addEventListener('change', e => { st.statut = e.target.value; maj(); });
        $('#fo')?.addEventListener('change', e => { st.org = e.target.value; maj(); });
        if (defiler && montre) $('#liste').scrollIntoView({ behavior: 'smooth', block: 'start' });
      };
      $('#bq').addEventListener('input', e => { st.q = e.target.value; maj(); });
      $('#bf').addEventListener('submit', e => e.preventDefault());
      let t; window.onresize = () => { clearTimeout(t); t = setTimeout(() => $('#shelves') && dessinerEtagere($('#shelves'), cours), 150); };
      maj(false);
    } };
};

/* ---------- Cours (repris d'Excellence COSUMAF) ---------- */
let coursIdx = null, tousCours = null; const coursCache = new Map();
const chargerCoursIdx = async () => coursIdx ||= await fetch('/data/cours.json').then(r => r.json());
const chargerCours = async id => { if (!coursCache.has(id)) coursCache.set(id, await fetch(`/data/cours/${id}.json`).then(r => r.json())); return coursCache.get(id); };
const chargerTousCours = async () => tousCours ||= await Promise.all((await chargerCoursIdx()).map(c => chargerCours(c.id)));
const nomChap = t => String(t).replace(/^[^·]*·\s*(\d+\s*·\s*)?/, '');
const COULEUR_COURS = { orange: '#e0703a', teal: '#2f6f86', mustard: '#dfa93b', red: '#d4563a', navy: '#3d6a80', plum: '#8a5aa8' };
const MAT_COURS = { orange: '#d9692f', teal: '#2c7a8f', mustard: '#c99a2e', red: '#c2392f', navy: '#35569e', plum: '#6b4fb0' };
const mdBloc = t => String(t).split(/\n\n+/).map(b => {
  const inline = x => esc(x).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>'), lines = b.split('\n');
  if (lines.every(l => l.startsWith('|'))) {
    const rows = lines.filter(l => !/^\|[\s:|-]+\|?$/.test(l)).map(l => l.replace(/^\||\|$/g, '').split('|').map(c => inline(c.trim())));
    return '<div class="mdtbl"><table><thead><tr>' + rows[0].map(c => `<th>${c}</th>`).join('') + '</tr></thead><tbody>' + rows.slice(1).map(r => '<tr>' + r.map((c, i) => i ? `<td>${c}</td>` : `<th scope="row">${c}</th>`).join('') + '</tr>').join('') + '</tbody></table></div>';
  }
  if (lines.every(l => l.startsWith('- '))) return '<ul>' + lines.map(l => `<li>${inline(l.slice(2))}</li>`).join('') + '</ul>';
  if (lines.every(l => /^\d+\.\s/.test(l))) return '<ol>' + lines.map(l => `<li>${inline(l.replace(/^\d+\.\s/, ''))}</li>`).join('') + '</ol>';
  return '<p>' + lines.map(inline).join('<br>') + '</p>';
}).join('');
const mastCours = c => {
  const pre = c.id + ':'; let ok = 0, total = c.n.cartes + c.n.questions;
  for (const [k, v] of Object.entries(ET.cards)) if (k.startsWith(pre) && (v.ivl || 0) >= 3) ok++;
  for (const [k, v] of Object.entries(ET.quiz)) if (k.startsWith(pre) && v === 1) ok++;
  return total ? Math.round(ok / total * 100) : 0;
};
const PTYPE = { explication: ['compass', 'Explication'], exemple: ['lightbulb', 'Exemple du coach'], examen: ['star', 'Insiste : à l\'examen'], conseil: ['target', 'Conseil'], piege: ['triangle-alert', 'Piège'], consigne: ['clipboard-list', 'Consigne'], anecdote: ['message-circle', 'Anecdote'] };

/* ---------- Page « Textes » : la hiérarchie des textes, avec l'entreprise comme fil conducteur ---------- */
let textesParcoursCache = null;
const chargerTextesParcours = async () => textesParcoursCache ||= await fetch('/data/textes-parcours.json').then(r => r.json());
const carteTexte = t => `<li><a class="card item" href="#/texte/${t.id}"><span class="t">${esc(shortName(t))}</span><span class="sub">${esc(t.titre)}</span><span class="meta">${badgeStatut(t)}<span>${ORG[t.organisme]}</span>${t.date_texte ? `<span>${esc(t.date_texte)}</span>` : ''}${t.pdf ? `<span>${ic('download')} PDF</span>` : ''}</span></a></li>`;
views.textes = async () => {
  const TP = await chargerTextesParcours();
  const tri = l => l.slice().sort((a, b) => (b.date_adoption || '').localeCompare(a.date_adoption || '') || a.ordre - b.ordre);
  const abroges = D.textes.filter(t => t.statut === 'abroge' && t.abroge_par.length);
  const frise = TP.frise.map(id => T(id)).filter(Boolean).sort((a, b) => (a.date_adoption || '').localeCompare(b.date_adoption || ''));
  return { title: 'Les textes officiels du marché financier de la CEMAC', html: `
    <h1 class="h1">${lbls('Les textes')}</h1><span class="hand">${D.textes.length} textes officiels, rangés du plus fondamental au plus pratique</span>
    <div class="sheet presentation"><div><p>${md(TP.presentation)}</p><p class="small muted" style="margin-top:8px"><a href="#/recherche">Chercher un mot dans tous les textes</a> · <a href="#/bibliotheque?tout=1">Liste filtrable de tous les textes</a> · <a href="#/bibliotheque">Les cours</a></p></div></div>
    <div class="pyramide" role="img" aria-label="Hiérarchie des textes : fondations, règlements, instructions, lettres et guides">${TP.parties.map((pt, k) => `<div class="pyr p${k + 1}"><b>${esc(pt.titre.replace(/ :.*/, ''))}</b><small>${D.textes.filter(t => pt.types.includes(t.type)).length} textes</small></div>`).join('')}</div>
    ${TP.parties.map((pt, k) => { const l = tri(D.textes.filter(t => pt.types.includes(t.type))), visibles = l.slice(0, 6), reste = l.slice(6);
      return `<section class="partie"><h2 class="sec"><span class="lbl l${k % 6 + 1}">Partie ${k + 1} · ${esc(pt.titre)}</span></h2>
        ${encartKamga(pt.histoire)}
        <div class="sheet texte">${pt.intro.map(x => `<p>${md(x)}</p>`).join('')}</div>
        <ul class="list">${visibles.map(carteTexte).join('')}</ul>
        ${reste.length ? `<details class="repli"><summary><span class="sous" style="margin:0"><span class="lbl l3">Voir les ${reste.length} autres textes</span></span><span class="voir">Afficher la liste</span></summary><ul class="list" style="margin:10px 0 14px">${reste.map(carteTexte).join('')}</ul></details>` : ''}
      </section>`; }).join('')}
    <section class="partie"><h2 class="sec"><span class="lbl l5">Comment lire une fiche de texte</span></h2>
      <div class="sheet texte"><p>Chaque texte est résumé dans une fiche, avec le lien vers le <strong>PDF officiel</strong> pour lire le texte complet. Les fiches sont organisées en rubriques, toujours dans le même ordre :</p></div>
      <ol class="etapes">${TP.lire.map(([t, d], i) => `<li><span class="n">${i + 1}</span><div><strong>${esc(t)}.</strong> ${esc(d)}</div></li>`).join('')}</ol></section>
    <section class="partie"><h2 class="sec"><span class="lbl l4">En vigueur ou abrogé ?</span></h2>
      ${encartKamga("Attention : un texte peut avoir été remplacé. Avant de le citer, regardez son statut.")}
      <div class="sheet texte"><p>Quand un texte nouveau en remplace un ancien, l'ancien est <strong>abrogé</strong> : on ne le cite plus comme droit en vigueur. La fiche d'un texte abrogé le signale et renvoie vers son remplaçant. La base compte ${abroges.length} remplacements :</p></div>
      <ul class="list abro">${abroges.map(t => `<li><div class="card remp"><a href="#/texte/${t.id}">${esc(shortName(t))}</a><span class="fl">${ic('arrow-right')}</span>${t.abroge_par.map(id => `<a href="#/texte/${id}"><b>${esc(shortName(T(id)))}</b></a>`).join(', ')}</div></li>`).join('')}</ul></section>
    <section class="partie"><h2 class="sec"><span class="lbl l6">La frise des textes</span></h2>
      <div class="sheet texte"><p>Quelques textes clés, dans l'ordre où ils ont été adoptés : on voit le marché se construire, puis s'unifier en 2018, puis se moderniser.</p></div>
      <ol class="chrono frise">${frise.map(t => `<li><b>${esc((t.date_adoption || '').slice(0, 4))}</b><span><a href="#/texte/${t.id}">${esc(shortName(t))}</a> : ${esc(t.titre.length > 120 ? t.titre.slice(0, 117) + '…' : t.titre)}${t.statut === 'abroge' ? ' <em>(abrogé)</em>' : ''}</span></li>`).join('')}</ol></section>
    <a class="suite" href="#/bibliotheque"><small>Pour aller plus loin</small><b>Apprendre le contenu des textes dans les cours</b><i>Les onze cours expliquent ces textes, avec schémas, flashcards et quiz.</i><span>${ic('arrow-right')}</span></a>`,
    after() { fond(MAT.bibliotheque); } };
};

/* ---------- Parcours des cours : fil conducteur « l'entreprise » ---------- */
let coursParcoursCache = null;
const chargerCoursParcours = async () => coursParcoursCache ||= await fetch('/data/cours-parcours.json').then(r => r.json());
const NIVEAU = { E: 'Essentiel', C: 'À connaître', A: 'Pour aller plus loin' };
const encartKamga = (txt, cls = '') => `<div class="amina kamga ${cls}"><p>${md(txt)}</p></div>`;
const rangCours = (CP, id) => { const ordre = CP.parties.flatMap(pt => pt.cours); const k = ordre.indexOf(id); const part = CP.parties.findIndex(pt => pt.cours.includes(id)); return { k, total: ordre.length, ordre, part, partie: CP.parties[part] }; };
function parcoursLecture(cours, CP) {
  const par = id => cours.find(c => c.id === id);
  let n = 0;
  return `<section class="parcours-cours"><h2 class="sec"><span class="lbl l2">Par où commencer ?</span></h2>
    <div class="sheet presentation"><div><p>${md(CP.heroine.presentation)}</p></div></div>
    ${CP.parties.map((pt, k) => `<div class="partie"><h3 class="sous"><span class="lbl l${k % 6 + 1}">Partie ${k + 1} · ${esc(pt.titre)}</span></h3><p class="onmat intro">${esc(pt.intro)}</p>
      <ol class="list guides">${pt.cours.map(id => { const c = par(id), info = CP.cours[id]; n++; return c ? `<li><a class="card item" href="#/cours/${id}"><span class="num">${n}</span><span class="t">${esc(c.titre)}</span><span class="sub">${esc(info.cle)}</span><span class="histoire-min">${esc(info.histoire)}</span><span class="meta"><span>${c.n.fiches} fiches</span><span>${c.n.cartes} cartes</span><span>${c.n.questions} questions</span><span>${c.chapitres.length} chapitres</span></span></a></li>` : ''; }).join('')}</ol></div>`).join('')}
  </section>`;
}

views.cours = async ([id], q) => {
  const idx = await chargerCoursIdx(), meta = idx.find(c => c.id === id); if (!meta) return views.introuvable();
  const p = await chargerCours(id); const CP = await chargerCoursParcours(), info = CP.cours[id] || {}, rg = rangCours(CP, id), suivant = rg.ordre[rg.k + 1] ? idx.find(c => c.id === rg.ordre[rg.k + 1]) : null;
  const TABS = [['resume', 'Résumé'], ['fiches', 'Fiches'], ['schemas', 'Schémas'], ...(p.chapitres.some(c => (c.prof || []).length) ? [['prof', 'Le coach insiste']] : []), ...(p.chapitres.some(c => (c.exemples || []).length) ? [['exemples', 'Exemples']] : []), ['gloss', 'Glossaire'], ['textes', `Textes${meta.textes.length ? ' (' + meta.textes.length + ')' : ''}`]];
  const tab = TABS.some(([k]) => k === q.t) ? q.t : 'resume', chFiltre = p.chapitres.some(c => c.id === q.ch) ? q.ch : '';
  const chs = chFiltre ? p.chapitres.filter(c => c.id === chFiltre) : p.chapitres, base = `#/cours/${id}`, chq = chFiltre ? `&ch=${chFiltre}` : '';
  const due = chs.flatMap(c => (c.cartes || []).map((_, i) => `${id}:${c.id}:${i}`)).filter(k => !ET.cards[k] || ET.cards[k].due <= Date.now()).length;
  const m = mastCours(meta); let corps = '', schemas = [];
  if (tab === 'fiches') {
    corps = chs.map(c => `<h2><span class="lbl l2">${esc(nomChap(c.titre))}</span></h2>` + (c.fiches || []).map((f, i) => `<div class="fiche s${i % 5 + 1}"><h3>${esc(f.titre)}</h3>${mdBloc(f.contenu)}</div>`).join('') + (c.mnemos || []).map(t => `<div class="fiche mnemo"><small>Astuce mnémotechnique</small>${mdBloc(t)}</div>`).join('')).join('');
  } else if (tab === 'schemas') {
    const liste = chs.flatMap(c => (c.schemas || []).map(v => ({ ...v, ch: c.titre }))); schemas = liste;
    corps = liste.length ? `<div class="vzbar" style="grid-column:1/-1"><span class="vzhint">Touche un élément : il s'anime et se détaille.</span><button class="chip" id="vzt" type="button">${ic('brain-circuit')} Mode test : cacher les légendes</button></div>` + chs.filter(c => (c.schemas || []).length).map(c => `<h2 class="vzchap"><span class="lbl l6">${esc(nomChap(c.titre))}</span></h2><div class="vzgrid">${c.schemas.map(v => B.viz.card(v, liste.findIndex(x => x.titre === v.titre && x.ch === c.titre))).join('')}</div>`).join('') : '<p class="muted">Pas encore de schéma pour ce cours.</p>';
  } else if (tab === 'exemples') {
    const IC = { exemple: `${ic('lightbulb')} Exemple`, explication: `${ic('compass')} Explication`, piege: `${ic('triangle-alert')} Piège à éviter`, astuce: `${ic('target')} Astuce` };
    corps = chs.map(c => `<h2><span class="lbl l4">${esc(nomChap(c.titre))}</span></h2>` + ((c.exemples || []).length ? c.exemples.map(x => `<div class="fiche ex ${esc(x.type || 'exemple')}"><small>${IC[x.type] || IC.exemple}</small><h3>${esc(x.titre)}</h3>${mdBloc(x.texte)}</div>`).join('') : '<p class="muted">Pas encore d\'exemple pour ce chapitre.</p>')).join('');
  } else if (tab === 'prof') {
    corps = `<p class="vzhint" style="grid-column:1/-1">Ce que le coach te demande de retenir : les pièges et les points qui tombent.</p>` + chs.filter(c => (c.prof || []).length).map(c => `<h2 class="vzchap" style="grid-column:1/-1"><span class="lbl l1">${esc(nomChap(c.titre))}</span></h2><div class="profgrid" style="grid-column:1/-1">${c.prof.map((x, i) => { const [i2, lb] = PTYPE[x.type] || PTYPE.explication; return `<article class="profnote pn${i % 4 + 1} ${esc(x.type || 'explication')}"><small>${ic(i2)} ${lb}${x.date ? ` · ${esc(x.date)}` : ''}</small><h3>${esc(x.titre)}</h3>${mdBloc(x.texte)}</article>`; }).join('')}</div>`).join('');
  } else if (tab === 'gloss') {
    corps = `<input class="search" id="gs" style="grid-column:1/-1" placeholder="Rechercher un terme…" autocomplete="off"><dl class="gloss" id="gl" style="grid-column:1/-1"></dl>`;
  } else if (tab === 'textes') {
    const ts = meta.textes.map(T).filter(Boolean);
    corps = ts.length ? `<p style="grid-column:1/-1" class="onmat">Les textes officiels sur lesquels s'appuie ce cours.</p><ul class="list" style="grid-column:1/-1">${ts.map(t => `<li><a class="card item" href="#/texte/${t.id}"><span class="t">${esc(shortName(t))}</span><span class="sub">${esc(t.titre)}</span><span class="meta">${badgeStatut(t)}<span>${ORG[t.organisme]}</span>${t.date_texte ? `<span>${esc(t.date_texte)}</span>` : ''}${t.pdf ? `<span>${ic('download')} PDF</span>` : ''}</span></a></li>`).join('')}</ul>` : `<p style="grid-column:1/-1" class="onmat">Ce cours rassemble des repères de tous les textes. <a href="#/bibliotheque?tout=1" style="color:var(--y)">Voir tous les textes</a>.</p>`;
  } else {
    const nivs = ['court', 'moyen']; if (p.chapitres.some(c => c.resume.long && c.resume.long !== c.resume.moyen)) nivs.push('long');
    const lbl = { court: 'En 1 phrase', moyen: 'En 1 paragraphe', long: 'En 1 page' }, niv = nivs.includes(q.n) ? q.n : 'moyen';
    corps = `<div class="chip-row" style="grid-column:1/-1">${nivs.map(k => `<a class="chip ${k === niv ? 'on' : ''}" href="${base}?t=resume&n=${k}${chq}">${lbl[k]}</a>`).join('')}</div>` + chs.map(c => `<h2><span class="lbl l1">${esc(nomChap(c.titre))}</span></h2>${mdBloc(c.resume[niv])}`).join('');
  }
  const stat = ['chapitre' + (p.chapitres.length > 1 ? 's' : ''), 'fiches', 'cartes', 'questions', 'schémas'];
  return { title: `${p.titre} : cours`, html: `
    <a class="back" href="#/bibliotheque">← Retour à la bibliothèque</a>
    <div class="cover"><div class="bk" style="background-color:${COULEUR_COURS[p.couleur] || '#e0703a'}"></div>
      <div><h1>${esc(p.titre)}</h1>
        <p class="meta">${p.chapitres.length} chapitres · ${meta.n.fiches} fiches · ${meta.n.cartes} cartes · ${meta.n.questions} questions · ${meta.n.schemas} schémas</p>
        <div class="bar" title="Maîtrise ${m}%"><i style="width:${m}%"></i></div><p class="meta" style="font-size:.9rem">Maîtrise : ${m} %</p></div></div>
    <p class="onmat" style="max-width:760px">${esc(p.description || '')}</p>
    <div class="cbtns"><a class="btn" href="#/flashcards/run${qs({ cours: id })}">${ic('layers')} Flashcards${due ? ` · ${due} à revoir` : ''}</a><a class="btn ghost" href="#/quiz/run${qs({ cours: id })}">${ic('circle-check')} Quiz</a><a class="btn ghost sm" href="#/exercices/run${qs({ c: id })}">${ic('puzzle')} Exercices</a><a class="btn ghost sm" href="#/examen/run${qs({ c: id, n: 20 })}">${ic('clipboard-check')} Examen blanc</a><a class="btn ghost sm" href="#/carte/${id}${chFiltre ? '?ch=' + chFiltre : ''}">${ic('network')} Carte mentale</a><a class="btn ghost sm" href="#/jeux">${ic('gamepad-2')} Jeux</a></div>
    ${p.chapitres.length > 1 ? (p.chapitres.length > 6 ? `<div class="chip-row"><select class="chsel" id="chsel" aria-label="Chapitre"><option value="">Tous les chapitres (${p.chapitres.length})</option>${p.chapitres.map(c => `<option value="${esc(c.id)}" ${chFiltre === c.id ? 'selected' : ''}>${esc(c.titre)}</option>`).join('')}</select></div>` : `<div class="chip-row"><a class="chip ${chFiltre ? '' : 'on'}" href="${base}?t=${tab}">Tous les chapitres</a>${p.chapitres.map(c => `<a class="chip ${chFiltre === c.id ? 'on' : ''}" href="${base}?t=${tab}&ch=${c.id}">${esc(nomChap(c.titre))}</a>`).join('')}</div>`) : ''}
    <nav class="tabsrow" aria-label="Rubriques du cours">${TABS.map(([k, l]) => `<a class="chip" aria-pressed="${tab === k}" href="${base}?t=${k}${chq}">${l}</a>`).join('')}</nav>
    ${tab === 'resume' && info.histoire ? `<section class="intro-cours"><small class="partie-n">Partie ${rg.part + 1} · ${esc(rg.partie?.titre || '')} · cours ${rg.k + 1} sur ${rg.total}</small>
      ${encartKamga(info.histoire, 'grand')}
      <div class="sheet pourquoi">${(info.pourquoi || []).map(t => `<p>${md(t)}</p>`).join('')}<h3>Dans ce cours, vous saurez…</h3><ul class="objectifs">${(info.objectifs || []).map(o => `<li>${esc(o)}</li>`).join('')}</ul></div>
      <details class="plan" open><summary>Le plan du cours : ${p.chapitres.length} chapitre${p.chapitres.length > 1 ? 's' : ''}</summary><ol>${p.chapitres.map(c => `<li><a href="${base}?t=fiches&ch=${c.id}"><span class="niv niv-${c.niveauCode ? String(c.niveauCode)[0] : 'x'}">${esc(NIVEAU[c.niveau] || c.niveau || NIVEAU[String(c.niveauCode || '')[0]] || 'Chapitre')}</span><b>${esc(nomChap(c.titre))}</b><small>${esc((c.resume?.court || '').slice(0, 170))}${(c.resume?.court || '').length > 170 ? '…' : ''}</small></a></li>`).join('')}</ol></details></section>` : ''}
    <div class="panel ${tab === 'resume' ? 'resume' : ''}" id="panel">${corps}</div>
    ${info.cle ? `<div class="banner info retenir">${ic('lightbulb')}<div><strong>L'essentiel du cours.</strong> ${esc(info.cle)}</div></div>` : ''}
    ${suivant ? `<a class="suite" href="#/cours/${suivant.id}"><small>Suite du parcours : cours ${rg.k + 2} sur ${rg.total}</small><b>${esc(suivant.titre)}</b><i>${esc((CP.cours[suivant.id] || {}).histoire || '')}</i><span>${ic('arrow-right')}</span></a>` : `<a class="suite" href="#/bibliotheque"><small>Fin du parcours</small><b>Retour à la bibliothèque</b><span>${ic('arrow-right')}</span></a>`}`,
    after() {
      fond(MAT_COURS[p.couleur] || MAT.bibliotheque);
      if (q.hl && tab !== 'gloss') B.highlight($('#panel'), q.hl);
      const sel = $('#chsel'); if (sel) sel.onchange = () => { location.hash = `${base}?t=${tab}${sel.value ? '&ch=' + sel.value : ''}`; };
      if (tab === 'schemas' && schemas.length) {
        B.viz.mount($('#app'), schemas); const pn = $('#panel'), tb = $('#vzt');
        if (tb) tb.onclick = () => { const on = pn.classList.toggle('testmode'); tb.classList.toggle('on', on); pn.querySelectorAll('.rev').forEach(x => x.classList.remove('rev')); tb.lastChild.textContent = on ? ' Mode test actif : touche pour révéler' : ' Mode test : cacher les légendes'; E.sfx.pop(); };
        pn.addEventListener('click', e => { if (!pn.classList.contains('testmode')) return; const el = e.target.closest('.vz-step,.vz-tn,.vz-term,.vz-stat,.vz-col,.bx,.vnode,.blk,.vz-ev button,.mk,.vz-tbl td,.vz-tbl tbody th,.vslice'); if (el) el.classList.toggle('rev'); }, true);
      }
      if (tab === 'gloss') {
        const termes = chs.flatMap(c => (c.definitions || []).map(d => ({ ...d, ch: c.titre }))).sort((a, b) => a.terme.localeCompare(b.terme, 'fr'));
        const dessiner = txt => { const f = termes.filter(t => fold(t.terme + ' ' + t.definition).includes(fold(txt))); $('#gl').innerHTML = f.length ? f.map(t => `<div class="gcard"><dt>${esc(t.terme)}</dt><dd>${esc(t.definition)}<span class="ch">${esc(nomChap(t.ch))}</span></dd></div>`).join('') : '<dd>Aucun terme trouvé.</dd>'; };
        dessiner(''); $('#gs').oninput = e => dessiner(e.target.value);
      }
    } };
};

const CONTACT = 'impacttech237@gmail.com';
const signaler = (t, f) => `mailto:${CONTACT}?subject=${encodeURIComponent('Erreur signalée : ' + (f ? f.id : t.id))}&body=${encodeURIComponent(['Texte : ' + shortName(t), f ? 'Repère : ' + f.id + ' (' + f.q + ')' : '', 'Version de la base : ' + D.version, '', 'Ce qui est faux, et la source (article, page du texte officiel) :', ''].join(String.fromCharCode(10)))}`;
const statutFait = f => f.r ? '<span class="badge ok" title="Relu contre la page du PDF scanné (lecture assistée par IA, pas encore par un second lecteur humain)">Relu sur le scan</span>' : f.e ? '<span class="badge bad" title="La valeur n’a pas été retrouvée dans le texte du PDF : à vérifier sur le document officiel">À vérifier sur le PDF</span>' : f.s && !f.k ? '<span class="badge bad" title="Chiffre lu sur un scan : à vérifier sur le PDF">À vérifier sur le PDF</span>' : f.k ? '<span class="badge ok" title="Valeur retrouvée dans le texte du PDF par contrôle automatique (pas une relecture humaine)">Contrôlé sur le PDF</span>' : '';
const factHtml = (f, avecSource) => {
  const t = T(f.t);
  const cite = citation(t, f.a);
  const act = `<span class="act">${statutFait(f)}<a class="btn sm sig" href="${signaler(t, f)}" title="Signaler une erreur sur ce repère" aria-label="Signaler une erreur sur ce repère">${ic('flag')}</a>${avecSource ? `<a class="srcl" href="#/texte/${f.t}${qs({ f: f.id })}">${esc(shortName(t))}</a>` : ''}${f.a ? `<span class="art">${esc(f.a)}</span>` : ''}<button class="btn sm" data-copy="${esc(cite)}" title="Copier la citation" aria-label="Copier la citation">${ic('quote')}</button></span>`;
  if (f.y === 'piege') return `<li id="f-${f.id}">${md(f.v)}</li>`;
  if (f.y === 'liste') return `<div class="fact" id="f-${f.id}"><div class="q">${esc(f.q)}</div><div class="v"><ul style="margin:0;padding-left:18px;font-weight:400">${(f.i || []).map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>${act}</div>`;
  if (f.y === 'role' || f.y === 'definition') return `<div class="fact" id="f-${f.id}"><div class="q">${esc(f.q)}</div><div class="v" style="font-weight:400">${esc(f.v)}</div>${act}</div>`;
  return `<div class="fact" id="f-${f.id}"><div class="q">${esc(f.q)}</div><div class="v">${esc(f.v)}${f.n ? `<small>${esc(f.n)}</small>` : ''}</div>${act}</div>`;
};

views.texte = async ([id], q) => {
  const t = T(id); if (!t) return views.introuvable();
  const TPx = await chargerTextesParcours(), idxC_ = await chargerCoursIdx(), coursLies = idxC_.filter(c => c.textes.includes(t.id));
  const c = await chargerContenu(id);
  const faits = D.parTexte.get(id) || [];
  const par = y => faits.filter(f => f.y === y);
  const lien = i => { const x = T(i); return x ? `<a href="#/texte/${i}">${esc(shortName(x))}</a>` : esc(i); };
  const rel = [];
  if (t.abroge_par.length) rel.push(`<div class="row"><span class="badge bad">Abrogé par</span> ${t.abroge_par.map(lien).join(', ')}</div>`);
  if (t.abroge.length) rel.push(`<div class="row"><span class="badge">Abroge</span> ${t.abroge.map(lien).join(', ')}</div>`);
  if (t.abroge_externes.length) rel.push(`<div class="row"><span class="badge">Abroge (hors base)</span> ${t.abroge_externes.map(esc).join(' ; ')}</div>`);
  if (t.modifie.length) rel.push(`<div class="row"><span class="badge brand">Modifie</span> ${t.modifie.map(m => `${lien(m.texte)} (${esc(m.articles)})`).join(', ')}</div>`);
  if (t.modifie_par.length) rel.push(`<div class="row"><span class="badge brand">Modifié par</span> ${t.modifie_par.map(m => `${lien(m.texte)} (${esc(m.articles)})`).join(', ')}</div>`);
  const COULEUR_BLOC = { essentiel: ['l2', 'note'], retenir: ['l1', ''], delai: ['l6', ''], montant: ['l4', ''], role: ['l5', ''], definition: ['l1', ''], liste: ['l6', ''], piege: ['l4', 'rose'], qr: ['l1', 'sky'] };
  const sec = (cle, titre, icone, corps) => { const [l, v] = COULEUR_BLOC[cle] || ['l1', '']; return corps ? `<section class="blk" id="${cle}"><h2 class="sec"><span class="lbl ${l}">${titre}</span></h2><div class="sheet ${v}">${corps}</div></section>` : ''; };
  const sommaire = [];
  const bloc = (cle, titre, icone, corps) => { const h = sec(cle, titre, icone, corps); if (h) sommaire.push([cle, titre]); return h; };
  const corps =
    bloc('essentiel', 'L\'essentiel', 'lightbulb', c.essentiel ? `<p>${md(c.essentiel)}</p>` : '') +
    bloc('retenir', 'À retenir', 'list-checks', c.retenir.length ? `<ul class="points">${c.retenir.map(x => { const m = x.match(/^(.*?)\s+((?:Art\.|Annexe|Titre|Lettre|Chapeau|Préambule|Ligne|Rubrique|Diligence|Instruction|Dernier|Table|Introduction|Partie|Plan|I{1,3}V?|V)[^.]{0,40}\.?)$/); return `<li>${md(m && m[2].length < 46 ? m[1] : x)}${m && m[2].length < 46 ? `<span class="art">${esc(m[2].replace(/\.$/, ''))}</span>` : ''}</li>`; }).join('')}</ul>` : '') +
    bloc('delai', 'Délais', 'clock', par('delai').length ? `<div class="facts">${par('delai').map(factHtml).join('')}</div>` : '') +
    bloc('montant', 'Montants et seuils', 'scale', par('montant').length ? `<div class="facts">${par('montant').map(factHtml).join('')}</div>` : '') +
    bloc('role', 'Rôles des acteurs', 'users', par('role').length ? `<div class="facts">${par('role').map(factHtml).join('')}</div>` : '') +
    bloc('definition', 'Définitions', 'book-open', par('definition').length ? `<div class="facts">${par('definition').map(factHtml).join('')}</div>` : '') +
    bloc('liste', 'Listes à retenir', 'list-checks', par('liste').length ? `<div class="facts">${par('liste').map(factHtml).join('')}</div>` : '') +
    bloc('piege', 'Pièges', 'triangle-alert', par('piege').length ? `<ul class="points">${par('piege').map(factHtml).join('')}</ul>` : '') +
    bloc('qr', 'Questions et réponses', 'compass', c.qr.length ? c.qr.map(x => `<details class="qa"><summary>${esc(x.q)}</summary><div>${esc(x.r)}</div></details>`).join('') : '');
  const sous = fold(t.titre).startsWith(fold(shortName(t))) ? t.titre.slice(shortName(t).length).replace(/^[\s,:–-]+/, '') : t.titre;
  const actif = (() => { if (sommaire.some(([k]) => k === q.s)) return q.s; if (q.f) { const f = faits.find(x => x.id === q.f); if (f && sommaire.some(([k]) => k === f.y)) return f.y; } return sommaire[0]?.[0]; })();
  return { title: `${shortName(t)} : ${t.titre}`, html: `
    <div class="crumbs"><a href="#/bibliotheque">Bibliothèque</a> ${ic('chevron-right')} <span>${esc(shortName(t))}</span></div>
    <header class="doc-head"><h1 class="h1">${lbls(shortName(t))}</h1>${sous ? `<p class="full">${esc(sous)}</p>` : ''}
      <div class="meta">${badgeStatut(t)}<span class="badge">${esc(ORG[t.organisme])}</span>${t.date_texte ? `<span class="muted">${esc(t.date_texte)}</span>` : ''}</div>
      ${t.pdf ? `<p class="copie">Copie du PDF hébergée ici, état du ${esc(dateFr(D.genere_le))}. Le texte officiel fait foi : <a href="#/methode">comment nous le vérifions</a>.</p>` : ''}
      <div class="actions">
        ${t.pdf ? `<a class="btn" href="/pdf/${t.id}.pdf" download="${esc(shortName(t).replace(/[\/:*?"<>|]+/g, '-'))}.pdf">${ic('download')} Télécharger le PDF <small>(${t.pdf > 1e6 ? (t.pdf / 1e6).toFixed(1) + ' Mo' : Math.max(1, Math.round(t.pdf / 1e3)) + ' Ko'})</small></a>` : ''}
        ${t.url ? `<a class="btn ${t.pdf ? 'ghost' : ''}" href="${esc(t.url)}" target="_blank" rel="noopener">${ic('external-link')} Site officiel</a>` : ''}
        <button class="btn ghost" data-copy="${esc(citation(t))}">${ic('quote')} Copier la référence</button>
        <details class="more"><summary class="btn ghost">Plus</summary><div class="menu">
          <button class="btn sm" data-copy="${esc(location.origin + '/#/texte/' + id)}">${ic('link')} Copier le lien</button>
          <button class="btn sm" id="csvt" ${faits.some(f => f.y === 'delai' || f.y === 'montant') ? '' : 'disabled'}>${ic('download')} Délais et montants (CSV)</button>
          <button class="btn sm" onclick="print()">${ic('printer')} Imprimer</button>
          <a class="btn sm" href="${signaler(t)}">${ic('flag')} Signaler une erreur</a>
        </div></details>
      </div></header>
    ${t.statut === 'abroge' ? `<div class="banner bad">${ic('triangle-alert')}<div><strong>Ce texte est abrogé.</strong> Ne le citez pas comme droit en vigueur.</div></div>` : ''}
    ${t.couverture !== 'complete' ? `<div class="banner info">${ic('info')}<div><strong>${COUV[t.couverture]}.</strong> ${t.couverture === 'partielle' ? 'Cette fiche reprend les points clés, pas tous les articles.' : 'Cette fiche situe le texte sans détailler ses dispositions.'}</div></div>` : ''}
    ${rel.length ? `<div class="rel">${rel.join('')}</div>` : ''}
    ${TPx.textes_type[t.type] ? `<div class="sheet ou"><p><strong>Où se situe ce texte ?</strong> ${esc(TPx.textes_type[t.type])}</p>${coursLies.length ? `<p class="chips" style="margin-top:10px">${coursLies.map(c => `<a class="btn ghost sm" href="#/cours/${c.id}">${ic('graduation-cap')} Cours : ${esc(c.court)}</a>`).join('')}<a class="btn ghost sm" href="#/textes">${ic('library')} Tous les textes</a></p>` : `<p style="margin-top:10px"><a class="btn ghost sm" href="#/textes">${ic('library')} Tous les textes</a></p>`}</div>` : ''}
    <nav class="tabsrow" aria-label="Rubriques du texte">${sommaire.map(([k, n]) => `<button class="chip" data-sec="${k}" aria-pressed="${k === actif}">${esc(n)}</button>`).join('')}</nav>
    <div class="secs">${corps || '<p class="empty">Cette fiche ne contient pas encore de contenu détaillé.</p>'}</div>`,
    after() {
      fond(MAT_ORG[t.organisme] || MAT.accueil);
      const montrer = k => { $$('.secs .blk').forEach(b => { b.hidden = b.id !== k; }); $$('[data-sec]').forEach(b => b.setAttribute('aria-pressed', b.dataset.sec === k)); };
      montrer(actif);
      $$('[data-sec]').forEach(b => b.addEventListener('click', () => { montrer(b.dataset.sec); history.replaceState(null, '', `#/texte/${id}${qs({ s: b.dataset.sec })}`); }));
      $('#csvt')?.addEventListener('click', () => telecharger(`${id}-delais-montants.csv`, csv([['Type', 'Énoncé', 'Valeur', 'Article', 'Texte', 'Statut'], ...faits.filter(f => f.y === 'delai' || f.y === 'montant').map(f => [SECTIONS[f.y], f.q, f.v, f.a, citation(t), STATUT[t.statut]])]), 'text/csv;charset=utf-8'));
      const cible = q.f ? $('#f-' + CSS.escape(q.f)) : null;
      if (cible) { cible.scrollIntoView({ block: 'center' }); cible.style.outline = '3px solid var(--red)'; cible.style.outlineOffset = '3px'; cible.style.borderRadius = '8px'; }
    } };
};

const ONGLETS = { delai: 'Délais', montant: 'Montants', role: 'Rôles', definition: 'Définitions', piege: 'Pièges', liste: 'Listes' };
views.pratiquer = async (_a, q) => {
  const st = { tab: ONGLETS[q.tab] ? q.tab : 'delai', theme: q.theme || '', org: q.org || '', abroges: q.abroges === '1', q: q.q || '' };
  let limite = 100;
  const themes = Object.fromEntries(D.themes.entries().toArray?.() ? [...D.themes.entries()].map(([k, v]) => [k, v.nom]) : []);
  const filtrer = () => {
    const ts = termes(st.q);
    return D.faits.filter(f => { const t = T(f.t); return f.y === st.tab && (st.abroges || t.statut !== 'abroge') && (!st.theme || f.h === st.theme) && (!st.org || t.organisme === st.org) && tous(fold(f.q + ' ' + f.v + ' ' + (f.a || '') + ' ' + shortName(t)), ts); });
  };
  const ligne = f => { const t = T(f.t); const lien = `<a href="#/texte/${f.t}${qs({ f: f.id })}">${esc(shortName(t))}</a>${t.statut === 'abroge' ? ' <span class="badge bad">abrogé</span>' : ''}`;
    if (f.y === 'piege') return `<tr><td data-l="Piège" colspan="3">${md(f.v)}</td><td data-l="Texte">${lien}</td></tr>`;
    const val = f.y === 'liste' ? `<ul style="margin:0;padding-left:18px;font-weight:400">${(f.i || []).map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : esc(f.v);
    return `<tr><td data-l="Énoncé">${esc(f.q)}</td><td data-l="Valeur" class="${f.y === 'delai' || f.y === 'montant' ? 'v' : ''}" style="${f.y === 'role' || f.y === 'definition' ? 'font-weight:400' : ''}">${val}${f.n ? `<div class="muted small" style="font-weight:400">${esc(f.n)}</div>` : ''}</td><td data-l="Article" class="nowrap">${f.a ? `<span class="art" style="margin:0">${esc(f.a)}</span>` : ''}</td><td data-l="Texte">${lien} <button class="btn sm" data-copy="${esc(citation(t, f.a))}" aria-label="Copier la citation" title="Copier la citation">${ic('quote')}</button></td></tr>`; };
  return { title: 'Pratiquer : délais, montants, rôles', html: `
    <h1 class="h1">${lbls('Pratiquer')}</h1><span class="hand">Un délai, un montant, un rôle : avec l'article et le texte d'origine</span>
    <div class="tabs" role="tablist" id="tabs">${Object.entries(ONGLETS).map(([k, v]) => `<button class="chip" role="tab" data-tab="${k}" aria-pressed="${k === st.tab}">${v}</button>`).join('')}</div>
    <form class="filters" id="flt" role="search"><label class="field">Mot-clé<input type="search" name="q" value="${esc(st.q)}" placeholder="Ex. : visa, 30 jours, capital" autocomplete="off"></label>
      <label class="field">Thème<select name="theme">${options(themes, st.theme, 'Tous')}</select></label>
      <label class="field">Organisme<select name="org">${options(ORG, st.org, 'Tous')}</select></label>
      <label class="check"><input type="checkbox" name="abroges" ${st.abroges ? 'checked' : ''}> Inclure les textes abrogés</label></form>
    <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><p class="count" id="cnt" aria-live="polite" style="margin:6px 0"></p><button class="btn sm" id="csv">${ic('download')} Exporter en CSV</button></div>
    <div class="tablewrap"><table class="t"><thead><tr><th>Énoncé</th><th>Valeur</th><th>Article</th><th>Texte</th></tr></thead><tbody id="res"></tbody></table></div>
    <p style="margin-top:12px"><button class="btn" id="more" hidden>Afficher plus</button></p>`,
    after() {
      const maj = () => {
        const l = filtrer(); $('#cnt').textContent = `${l.length} résultat${l.length > 1 ? 's' : ''}`;
        $('#res').innerHTML = l.length ? l.slice(0, limite).map(ligne).join('') : '<tr><td colspan="4" class="empty">Aucun résultat. Essayez un autre mot-clé ou incluez les textes abrogés.</td></tr>';
        $('#more').hidden = l.length <= limite; $('#more').textContent = `Afficher plus (${Math.min(100, l.length - limite)} sur ${l.length - limite} restants)`;
        $$('#tabs [data-tab]').forEach(b => b.setAttribute('aria-pressed', b.dataset.tab === st.tab));
        history.replaceState(null, '', '#/pratiquer' + qs({ tab: st.tab === 'delai' ? '' : st.tab, theme: st.theme, org: st.org, abroges: st.abroges, q: st.q }));
      };
      $('#flt').addEventListener('input', () => { const f = new FormData($('#flt')); st.q = f.get('q') || ''; st.theme = f.get('theme') || ''; st.org = f.get('org') || ''; st.abroges = f.has('abroges'); limite = 100; maj(); });
      $('#flt').addEventListener('submit', e => e.preventDefault());
      $('#tabs').addEventListener('click', e => { const b = e.target.closest('[data-tab]'); if (b) { st.tab = b.dataset.tab; limite = 100; maj(); } });
      $('#more').addEventListener('click', () => { limite += 100; maj(); });
      $('#csv').addEventListener('click', () => { const l = filtrer(); telecharger(`pratiquer-${st.tab}.csv`, csv([['Type', 'Énoncé', 'Valeur', 'Article', 'Texte', 'Statut du texte'], ...l.map(f => { const t = T(f.t); return [ONGLETS[f.y], f.y === 'piege' ? '' : f.q, f.v, f.a, citation(t), STATUT[t.statut]]; })]), 'text/csv;charset=utf-8'); });
      maj();
    } };
};

/* ---------- Recherche : page reprise à l'identique d'Excellence (olympiades/js/recherche.js), avec en plus les textes, les repères et les acteurs ---------- */
B.rechSig = () => (D?.faits?.length || 0) + ':' + (annuaireCache?.length || 0);
B.rechExtra = () => {
  const out = [];
  for (const t of D.textes) out.push({ p: { id: '' }, c: { id: '' }, course: 'Textes officiels', chap: `${ORG[t.organisme]} · ${TYPE[t.type] || t.type}${t.statut === 'abroge' ? ' · abrogé' : ''}`, abroge: t.statut === 'abroge', org: t.organisme, yr: +(t.date_adoption || '').slice(0, 4) || 0, statut: t.statut, tid: t.id, th: t.theme, type: 'texte', title: shortName(t), text: `${t.titre} ${t.numero || ''} ${t.date_texte || ''} ${themeNom(t.theme)}`, href: `#/texte/${t.id}` });
  for (const f of D.faits) { const t = T(f.t); out.push({ p: { id: '' }, c: { id: '' }, course: shortName(t), chap: `${ONGLETS[f.y] || f.y}${f.a ? ' · ' + f.a : ''}${t.statut === 'abroge' ? ' · texte abrogé' : ''}`, abroge: t.statut === 'abroge', type: 'repere', kw: f.y === 'delai' ? 'delai' : f.y === 'montant' ? 'montant' : '', org: t.organisme, yr: +(t.date_adoption || '').slice(0, 4) || 0, statut: t.statut, th: f.h, x: f.x, u: f.u, y: f.y, v: f.v, art: f.a || '', n: f.n || '', r: f.r, s: f.s, e: f.e, k: f.k, tid: f.t, title: f.y === 'piege' ? f.v.replace(/\*\*/g, '').slice(0, 90) : f.q, text: f.y === 'piege' ? f.v.replace(/\*\*/g, '') : `${f.v} ${f.n || ''} ${f.a || ''}`, href: `#/texte/${f.t}${qs({ f: f.id })}` }); }
  for (const a of annuaireCache || []) out.push({ p: { id: '' }, c: { id: '' }, course: 'Acteurs', chap: `${TYPE_ACTEUR[a.type] || ''}${a.pays ? ' · ' + a.pays : ''}`, acteurId: a.id, atype: a.type, short: a.nomCourt || '', dir: (a.dirigeants || []).slice(0, 2).map(d => `${d.titre} : ${d.nom}`).join(' ; '), type: 'acteur', title: a.nom, text: `${a.description || ''} ${(a.dirigeants || []).map(d => d.nom + ' ' + d.titre).join(' ')} ${a.ville || ''} ${a.pays || ''}`, href: `#/acteurs/${a.id}` });
  return out;
};
const RS = { q: '', type: '', course: '', more: 1 };
views.recherche = async (_a, qs_) => {
  await chargerTousCours(); await chargerAnnuaire(); const idx = await chargerCoursIdx();
  RS.q = qs_.q || ''; RS.type = B.rech.TYPES[qs_.type] ? qs_.type : ''; RS.course = idx.some(c => c.id === qs_.c) ? qs_.c : ''; RS.more = 1;
  return { title: RS.q ? `Recherche : ${RS.q}` : 'Recherche', html: `<div class="searchpage">
    <h1 class="h1">${lbls('Recherche')}</h1>
    <p class="onmat" style="max-width:660px;margin:6px 0 20px">Un terme, une définition, un délai, un montant, un sigle, le nom d'un texte ou d'un acteur… la recherche balaie les cours, les textes officiels, les repères et l'annuaire (accents et petites fautes tolérés).</p>
    <div class="sbar"><span class="sico">${ic('search')}</span><input id="sq" type="search" placeholder="Ex. : délai visa, capital minimum, fixing, valeur liquidative…" autocomplete="off" spellcheck="false" value="${esc(RS.q)}"><button id="sx" aria-label="Effacer" ${RS.q ? '' : 'hidden'}>${ic('x')}</button></div>
    <details class="aide-rech"><summary>${ic('lightbulb')} Poser une question ou affiner : exemples et syntaxe</summary>
      <div class="aide-grille">
        <div><h4>En langage naturel</h4><ul>${["combien de temps pour obtenir l'agrément d'une société de bourse", 'qui dirige la BVMAC', 'quelle est la différence entre une SDB et une SGO', 'peut-on placer plus de 20 milliards en placement privé', "que risque-t-on en cas de délit d'initié", 'comment créer un FCP', 'délai de plus de 30 jours', 'montant au moins 100 millions'].map(x => `<li><a href="#/recherche?q=${encodeURIComponent(x)}">${esc(x)}</a></li>`).join('')}</ul></div>
        <div><h4>Syntaxe avancée</h4><ul class="syn">
          <li><code>"valeur liquidative"</code> expression exacte</li><li><code>visa -ape</code> exclure un mot</li><li><code>+visa agrément</code> mot obligatoire</li><li><code>agre*</code> début de mot</li><li><code>visa OR agrément</code> l'un ou l'autre</li>
          <li><code>type:repere</code> texte, acteur, definition, fiche, delai, montant, role, piege, liste</li><li><code>org:cosumaf</code> bvmac, cemac, umac, ueac, ohada</li><li><code>statut:abroge</code> ou <code>statut:vigueur</code></li><li><code>texte:rg-23</code> un texte précis</li><li><code>annee:2023</code> <code>annee:2020..2024</code> <code>annee:&gt;2022</code></li><li><code>art:242</code> un article</li>
          <li><code>valeur:&gt;30 unite:jours</code> ou <code>&gt;=60 jours</code>, <code>10..30 mois</code></li><li><code>titre:agrément</code> mot dans le titre</li></ul></div>
      </div></details>
    <div class="sfilters" id="sf"></div><div id="sres"></div></div>`,
    after() {
      fond(MAT.recherche);
      const inp = $('#sq'); inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length);
      const sg = document.createElement('ul'); sg.className = 'sugg'; sg.hidden = true; inp.closest('.sbar').appendChild(sg);
      const majSug = () => { const l = RS.q.trim().length >= 2 ? B.rech.suggere(RS.q) : []; sg.innerHTML = l.map(it => `<li><a href="${B.rech.link(it, RS.q)}"><span>${esc(it.title.length > 90 ? it.title.slice(0, 88) + '…' : it.title)}</span><small>${esc(B.rech.TYPES[it.type].sing || B.rech.TYPES[it.type].nom)}</small></a></li>`).join(''); sg.hidden = !l.length; };
      inp.addEventListener('blur', () => setTimeout(() => { sg.hidden = true; }, 180)); inp.addEventListener('focus', majSug);
      let t; inp.oninput = () => { RS.q = inp.value; majSug(); RS.more = 1; $('#sx').hidden = !RS.q; clearTimeout(t); t = setTimeout(() => { history.replaceState(null, '', `#/recherche?q=${encodeURIComponent(RS.q)}${RS.type ? '&type=' + RS.type : ''}${RS.course ? '&c=' + RS.course : ''}`); resultats(idx); }, 140); };
      $('#sx').onclick = () => { inp.value = ''; inp.oninput(); inp.focus(); };
      inp.onkeydown = e => { if (e.key === 'Escape') { inp.value = ''; inp.oninput(); } };
      resultats(idx);
    } };
};
let logT, dernierLog = '';
const reponseDirecte = (hits, q, A) => { const h = hits[0]; if (!h || h.it.abroge) return ''; if (hits[1] && h.sc < hits[1].sc * 1.2) return ''; const it = h.it;
  if (it.type === 'acteur' && A?.dirige && it.dir) return `<a class="answer" href="${it.href}"><span class="stag">${ic('users')} Réponse directe</span><div class="aq">${esc(it.title)}</div><div class="av avd">${esc(it.dir)}</div><small>Annuaire des acteurs</small></a>`;
  if (it.type !== 'repere' || !['delai', 'montant', 'role', 'definition'].includes(it.y)) return '';
  return `<a class="answer" href="${it.href}"><span class="stag">${ic('scale')} Réponse directe</span><div class="aq">${esc(it.title)}</div><div class="av${['definition', 'role'].includes(it.y) ? ' avd' : ''}">${esc(it.v)}</div><small>${esc(it.course)}${it.art ? ' · ' + esc(it.art) : ''}${it.e || (it.s && !it.k) ? ' · <b>à vérifier sur le PDF</b>' : it.k ? ' · contrôlé sur le PDF' : ''}</small></a>`; };
function resultats(idx) {
  const { q, type, course } = RS, box = $('#sres'), fb = $('#sf'); if (!box) return;
  const TY = B.rech.TYPES;
  const base = q.trim() ? B.rech.search(q, { course }) : { hits: [], toks: [] };
  const counts = {}; base.hits.forEach(h => { counts[h.it.type] = (counts[h.it.type] || 0) + 1; });
  fb.innerHTML = `<select class="chsel" id="sc" aria-label="Cours"><option value="">Tout le site</option>${idx.map(c => `<option value="${esc(c.id)}" ${course === c.id ? 'selected' : ''}>Cours : ${esc(c.court)}</option>`).join('')}</select>
    <div class="chip-row"><button class="chip ${type ? '' : 'on'}" data-t="">Tout${q.trim() ? ` · ${base.hits.length}` : ''}</button>${Object.entries(TY).filter(([k]) => !course || !['texte', 'repere', 'acteur'].includes(k)).map(([k, v]) => `<button class="chip ${type === k ? 'on' : ''}" data-t="${k}">${ic(v.ic)} ${v.nom}${q.trim() ? ` · ${counts[k] || 0}` : ''}</button>`).join('')}</div>`;
  $('#sc').onchange = e => { RS.course = e.target.value; RS.more = 1; resultats(idx); };
  $$('#sf .chip').forEach(b => b.onclick = () => { RS.type = b.dataset.t; RS.more = 1; resultats(idx); });
  if (!q.trim()) {
    const sug = ['visa APE', 'capital minimum', 'société de bourse', 'dépositaire central', "délit d'initié", 'placement privé', 'fixing', 'OPCVM', 'valeur liquidative', 'franchissement de seuil', 'qui dirige la BVMAC', 'délai agrément SDB', 'type:delai valeur:>30', 'statut:abroge org:cosumaf'];
    box.innerHTML = `<div class="sempty"><div><h3>Cherche n'importe quoi</h3><p>Par exemple :</p><div class="sug">${sug.map(x => `<a href="#/recherche?q=${encodeURIComponent(x)}">${esc(x)}</a>`).join('')}</div></div></div>`; return;
  }
  const { hits, toks, fuzzy, relaxed, interp, proches, filtreRelache, A } = type ? B.rech.search(q, { type, course }) : base;
  clearTimeout(logT); logT = setTimeout(() => { const k = q.trim().toLowerCase(); if (k.length >= 3 && k !== dernierLog) { dernierLog = k; window.MF?.ev('search', { a: k, n: hits.length }); } }, 1600);
  if (!hits.length) { box.innerHTML = `<div class="sempty"><div><h3>Rien trouvé pour « ${esc(q)} »</h3>${(proches || []).length ? `<p>Vouliez-vous dire :</p><div class="sug">${proches.map(it => `<a href="${B.rech.link(it, q)}">${esc(it.title.length > 70 ? it.title.slice(0, 68) + '…' : it.title)}</a>`).join('')}</div>` : ''}${(interp || []).length ? `<p class="interp">Compris : ${interp.map(x => `<span>${esc(x)}</span>`).join('')}</p>` : ''}<p>Essaie un mot plus court, un synonyme, ou retire un filtre. Tu peux aussi <a href="mailto:${CONTACT}?subject=${encodeURIComponent('Recherche sans résultat : ' + q)}">nous signaler cette recherche</a>.</p></div></div>`; return; }
  const shown = hits.slice(0, 20 * RS.more);
  box.innerHTML = (fuzzy ? `<p class="didyou">${ic('lightbulb')} Résultats pour <b>${esc(fuzzy.join(' '))}</b> (petite faute de frappe ?)</p>` : '') +
    (relaxed ? `<p class="didyou">${ic('lightbulb')} Aucun contenu ne contient tous vos mots : voici les résultats les plus proches.</p>` : '') + (interp?.length ? `<p class="interp">${ic('search')} Compris : ${interp.map(x => `<span>${esc(x)}</span>`).join('')}${filtreRelache ? ' <em>(aucun repère ne respecte le filtre de valeur : filtre ignoré)</em>' : ''}</p>` : '') + reponseDirecte(hits, q, A) +
    `<p class="scount">${hits.length} résultat${hits.length > 1 ? 's' : ''}</p>
    <div class="slist">${shown.map(({ it }) => { const Ty = TY[it.type], isDef = it.type === 'definition' || it.type === 'repere' || it.type === 'acteur';
      return `<a class="sres" href="${B.rech.link(it, q)}" style="--tc:${Ty.col}"><span class="stag">${ic(Ty.ic)} ${Ty.sing || Ty.nom.replace(/s$/, '')}</span>
        <h4>${B.rech.hlAccent(it.title, toks)}</h4><p>${B.rech.hlAccent(isDef ? B.rech.snippet(it.text, toks, 220) : B.rech.snippet(it.text, toks), toks)}</p>
        <small>${esc(it.course)} · ${esc(it.chap)}</small></a>`; }).join('')}</div>
    ${hits.length > shown.length ? `<div class="btns"><button class="btn" id="smore">Voir plus (${hits.length - shown.length})</button></div>` : ''}`;
  $('#smore')?.addEventListener('click', () => { RS.more++; resultats(idx); });
}

/* ---------- Entraînement : flashcards et quiz, mécanique reprise de la plateforme Excellence ---------- */
const DAY = 864e5;
const ET = Object.assign({ cards: {}, quiz: {}, errors: {}, days: {}, history: [], xp: 0, scores: {}, exams: [], olymp: [], examDates: {}, planDone: {} }, store.get('etude', {}));
const log = (type, d = {}) => { window.MF?.ev('act', { a: type === 'game' ? 'jeu:' + d.game : type, n: d.score ?? d.n ?? null }); ET.history.push({ t: Date.now(), type, ...d }); if (ET.history.length > 600) ET.history.shift(); ET.xp = (ET.xp || 0) + (d.xp || 0); sauver(); };
const sauver = () => { store.set('etude', ET); planifierSync(); };
const touchDay = n => { const d = new Date().toLocaleDateString('sv'); ET.days[d] = (ET.days[d] || 0) + n; };
const SUJETS = { delai: 'Délais', montant: 'Montants', role: 'Rôles', definition: 'Définitions' };
const nomTheme = id => SHORT[id] || themeNom(id);
const themesOpts = () => Object.fromEntries([...D.themes.entries()].map(([k, v]) => [k, v.nom]));
const poolCartes = (sujet, theme) => D.faits.filter(f => SUJETS[f.y] && T(f.t).statut !== 'abroge' && f.v.length <= 240 && f.q.length <= 200 && (!sujet || f.y === sujet) && (!theme || f.h === theme));
const estDue = k => { const st = ET.cards[k.id]; return !st || st.due <= Date.now(); };

/* répétition espacée (SM-2 simplifié), identique à Excellence */
function planifier(st, r) {
  st = Object.assign({ ease: 2.5, ivl: 0, reps: 0, lapses: 0 }, st);
  if (r === 0) { st.reps = 0; st.ivl = 0; st.lapses++; st.ease = Math.max(1.3, st.ease - .2); st.due = Date.now() + 10 * 60000; return st; }
  if (r === 1) { st.ivl = Math.max(1, st.ivl * 1.2); st.ease = Math.max(1.3, st.ease - .15); }
  if (r === 2) { st.ivl = st.reps === 0 ? 1 : st.reps === 1 ? 3 : st.ivl * st.ease; }
  if (r === 3) { st.ivl = st.reps === 0 ? 3 : Math.max(4, st.ivl * st.ease * 1.3); st.ease += .15; }
  st.reps++; st.due = Date.now() + Math.round(st.ivl) * DAY;
  return st;
}
const ivlText = (st, r) => { const n = planifier(st, r); if (r === 0) return '10 min'; const d = Math.round(n.ivl); return d >= 30 ? `${Math.round(d / 30)} mois` : `${d} j`; };
const serieJours = () => { let n = 0; const d = new Date(); if (!ET.days[d.toLocaleDateString('sv')]) d.setDate(d.getDate() - 1); while (ET.days[d.toLocaleDateString('sv')]) { n++; d.setDate(d.getDate() - 1); } return n; };

const poolQuiz = () => D.faits.filter(f => (f.y === 'delai' || f.y === 'montant') && T(f.t).statut !== 'abroge' && f.v.length <= 70 && f.q.length <= 170 && f.v.length >= 2);
const SOURCES = async () => ({ ...Object.fromEntries((await chargerCoursIdx()).map(c => [c.id, c.court + ' : ' + c.titre])), textes: 'Repères des textes (délais, montants, rôles)' });
const SUJETS_T = { delai: 'Délais', montant: 'Montants', role: 'Rôles', definition: 'Définitions' };

/* cartes : { id, q, v, small, voir } */
const cartesDeCours = (packs, src) => packs.filter(p => !src || p.id === src).flatMap(p => p.chapitres.flatMap(c => (c.cartes || []).map((k, i) => ({ id: `${p.id}:${c.id}:${i}`, q: k.recto, v: k.verso, small: `${p.court} · ${nomChap(c.titre)}`, voir: `#/cours/${p.id}?t=fiches&ch=${c.id}` }))));
const cartesDeTextes = sujet => poolCartes(sujet, '').map(f => ({ id: f.id, q: f.q, v: f.v, a: f.a, small: `${nomTheme(f.h)} · ${shortName(T(f.t))}`, voir: `#/texte/${f.t}${qs({ f: f.id })}` }));
const cartes = async src => src === 'textes' ? cartesDeTextes('') : cartesDeCours(await chargerTousCours(), src);

views.flashcards = async (a, q) => {
  const st = { src: q.cours === 'textes' || (coursIdx && coursIdx.some(c => c.id === q.cours)) ? q.cours : '', sujet: SUJETS_T[q.sujet] ? q.sujet : '' };
  if (!st.src && q.cours) { await chargerCoursIdx(); st.src = coursIdx.some(c => c.id === q.cours) ? q.cours : ''; }
  if (a[0] === 'run') return { title: 'Flashcards', html: '<div id="fl"></div>', async after() { E.coach.show(); const l = st.src === 'textes' ? cartesDeTextes(st.sujet) : await cartes(st.src); flash(l, q.cram === '1', st); } };
  const serie = serieJours(), sources = await SOURCES();
  return { title: 'Flashcards', html: `
    <h1 class="h1">${lbls('Flashcards')}</h1><span class="hand">Retourne la carte, puis dis-toi si tu savais.</span>
    <div class="card hub"><div class="filters"><label class="field" style="color:var(--ink);text-shadow:none">Cours<select id="fs">${options(sources, st.src, 'Tous les cours')}</select></label>
      <label class="field" id="fsj" style="color:var(--ink);text-shadow:none" hidden>Sujet<select id="fsu">${options(SUJETS_T, st.sujet, 'Tout')}</select></label></div>
      <p class="stat" id="fi"></p>
      <div class="btns" style="justify-content:flex-start"><a class="btn" id="go" href="#/flashcards/run">${ic('layers')} Flashcards</a><a class="btn ghost" id="cram" href="#/flashcards/run?cram=1">Tout réviser quand même</a></div></div>
    <p class="small onmat" style="margin-top:22px">${serie ? `${ic('flame')} ${serie} jour${serie > 1 ? 's' : ''} de suite` : 'Révise un peu chaque jour pour lancer ta série.'}</p>`,
    async after() {
      const maj = async () => { const l = st.src === 'textes' ? cartesDeTextes(st.sujet) : await cartes(st.src), due = l.filter(estDue).length;
        $('#fsj').hidden = st.src !== 'textes';
        $('#fi').innerHTML = `<b>${l.length}</b> cartes · ` + (due ? `<b>${due}</b> à réviser aujourd'hui` : 'rien à réviser pour le moment');
        $('#go').innerHTML = `${ic('layers')} Flashcards${due ? ` · ${due} à revoir` : ''}`;
        const args = { cours: st.src, sujet: st.sujet }; $('#go').href = '#/flashcards/run' + qs(args); $('#cram').href = '#/flashcards/run' + qs({ ...args, cram: 1 }); $('#cram').hidden = due > 0; };
      $('#fs').addEventListener('change', e => { st.src = e.target.value; maj(); });
      $('#fsu').addEventListener('change', e => { st.sujet = e.target.value; maj(); });
      maj();
    } };
};

function flash(toutes, cram, f) {
  const app = $('#app'), back = '#/flashcards';
  let list = cram ? shuffle(toutes) : shuffle(toutes.filter(estDue)); list = list.slice(0, 30);
  const total = list.length; let i = 0, flipped = false, done = 0, combo = 0;
  const RATE = [['À revoir', 'rotate-ccw'], ['Difficile', 'meh'], ['Bien', 'smile'], ['Facile', 'zap']];
  const finish = () => {
    if (done) log('flash', { course: f.src || '', n: done, xp: done * 2 });
    app.innerHTML = `<div class="done">${E.cheer(.9)}
      <h1>${total ? 'Session terminée' : 'Tout est à jour'}</h1>
      <p>${total ? `${done} carte${done > 1 ? 's' : ''} révisée${done > 1 ? 's' : ''}. Les prochaines reviendront au bon moment.` : 'Aucune carte n\'est à revoir pour le moment.'}</p>
      <div class="btns"><a class="btn" href="${back}">Retour</a>${!total ? `<a class="btn ghost" href="#/flashcards/run${qs({ cours: f.src, sujet: f.sujet, cram: 1 })}">Tout réviser quand même</a>` : ''}</div></div>`;
    E.touches = null; if (done) { E.coach.show(); E.coach.win('Session bouclée !'); E.confetti(); } else E.coach.hide();
  };
  const show = () => {
    if (i >= total) return finish();
    const k = list[i], st = ET.cards[k.id]; flipped = false;
    const long = k.v.length > 70 ? ' style="font-size:clamp(20px,4vw,28px)"' : '';
    app.innerHTML = `<div class="flashpage">
      <div class="ex-head"><a href="${back}">← Quitter</a><span>${ic('layers')} ${i + 1} / ${total}${combo >= 3 ? ` <b class="combo">${ic('flame')} ×${combo}</b>` : ''}</span></div>
      <div class="chain">${list.map((_, n) => `<i class="${n < i ? 'ok' : n === i ? 'cur' : ''}"></i>`).join('')}</div>
      <div class="fcard" id="fc"><div class="in">
        <div class="face front"><small>${esc(k.small)}</small><div class="q">${esc(k.q)}</div><em class="hint">${ic('hand-heart')} touche pour retourner</em></div>
        <div class="face back-face"><small>Réponse${k.a ? ' · ' + esc(k.a) : ''}</small><div class="q"${long}>${esc(k.v)}</div><em class="hint">${ic('hand-heart')} touche pour revoir la question</em></div></div></div>
      <div class="rates" id="rates" hidden>
        ${RATE.map(([l, icone], r) => `<button class="r${r}" data-r="${r}">${ic(icone)}<b>${l}</b><small>${ivlText(st, r)}</small></button>`).join('')}
      </div></div>`;
    const flip = () => { flipped = true; E.sfx.flip(); $('#fc').classList.toggle('flip'); $('#rates').hidden = false; };
    $('#fc').onclick = flip;
    const rate = r => {
      ET.cards[k.id] = planifier(st, r); touchDay(1); sauver(); done++;
      combo = r >= 2 ? combo + 1 : 0; E.coach.react(r >= 2, combo);
      if (done % 10 === 0) { E.confetti(70); E.sfx.win(); }
      i++; show();
    };
    $$('#rates button').forEach(b => b.onclick = () => rate(+b.dataset.r));
    E.touches = e => {
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); flip(); }
      else if (flipped && '1234'.includes(e.key) && e.key) rate(+e.key - 1);
    };
  };
  show();
}

/* ---------- Quiz ("Quiz Time!") ---------- */
const REACTIONS = () => [ic('thumbs-up'), ic('heart', 'fill'), E.face('angry'), E.face('think'), E.face('wow'), E.face('laugh')];
const FLECHE = `<svg class="arrow" viewBox="0 0 64 64"><path d="M10 6 L10 50 L22 39 L31 58 L40 54 L31 36 L48 36 Z" fill="#ffc43a" stroke="#1e1b16" stroke-width="3" stroke-linejoin="round"/></svg>`;
/* questions : { id, enonce, choix, bonne, explication, meta, voir } ; les choix sont mélangés à la création */
const melanger = o => { const ordre = shuffle(o.choix.map((_, i) => i)); return { ...o, choix: ordre.map(i => o.choix[i]), bonne: ordre.indexOf(o.bonne) }; };
const questionsDeCours = (packs, src) => packs.filter(p => !src || p.id === src).flatMap(p => p.chapitres.flatMap(c => (c.questions || []).map((x, i) => ({ id: `${p.id}:${c.id}:q${i}`, enonce: x.q, choix: x.choix, bonne: x.bonne, explication: x.explication || ('Réponse : ' + x.choix[x.bonne]), meta: `${p.court} · ${nomChap(c.titre)}`, voir: `#/cours/${p.id}?t=fiches&ch=${c.id}` }))));
function itemFait(x, base) {
  const memeType = base.filter(g => g.y === x.y && fold(g.v) !== fold(x.v)), memeUnite = x.u ? memeType.filter(g => g.u === x.u) : [];
  const dis = [], vus = new Set([fold(x.v)]);
  for (const g of shuffle(memeUnite.length >= 3 ? memeUnite : memeType)) { if (!vus.has(fold(g.v))) { vus.add(fold(g.v)); dis.push(g.v); } if (dis.length === 3) break; }
  if (dis.length < 3) return null;
  return melanger({ id: x.id, enonce: x.q, choix: [x.v, ...dis], bonne: 0, explication: `${x.a ? x.a + ' · ' : ''}${citation(T(x.t))}`, meta: `${nomTheme(x.h)} · ${shortName(T(x.t))}`, voir: `#/texte/${x.t}${qs({ f: x.id })}` });
}
const questionsDeTextes = (sujet, max) => { const base = poolQuiz(), out = []; for (const x of shuffle(base.filter(x => !sujet || x.y === sujet))) { const it = itemFait(x, base); if (it) out.push(it); if (out.length >= max) break; } return out; };
async function questionsDe(f, max = 10) {
  const packs = await chargerTousCours();
  if (f.faibles) {
    const ids = Object.keys(ET.errors), tous_ = new Map(questionsDeCours(packs, '').map(x => [x.id, x]));
    const base = poolQuiz(), parId = new Map(base.map(x => [x.id, x]));
    return shuffle(ids.map(id => tous_.has(id) ? melanger(tous_.get(id)) : parId.has(id) ? itemFait(parId.get(id), base) : null).filter(Boolean)).slice(0, max);
  }
  if (f.src === 'textes') return questionsDeTextes(f.sujet, max);
  return shuffle(questionsDeCours(packs, f.src).map(melanger)).slice(0, max);
}
views.quiz = async (a, q) => {
  await chargerCoursIdx();
  const st = { src: q.cours === 'textes' || coursIdx.some(c => c.id === q.cours) ? q.cours : '', sujet: q.sujet === 'delai' || q.sujet === 'montant' ? q.sujet : '' };
  if (a[0] === 'run') return { title: 'Quiz', html: '<div id="qz"></div>', async after() { quiz({ ...st, faibles: q.faibles === '1' }, await questionsDe({ ...st, faibles: q.faibles === '1' })); } };
  const sources = await SOURCES(); const nf = Object.keys(ET.errors).length;
  const rep = Object.keys(ET.quiz).length, ok = Object.values(ET.quiz).filter(v => v === 1).length;
  return { title: 'Quiz', html: `
    <h1 class="h1">${lbls('Quiz')}</h1><span class="hand">Dix questions, quatre choix. Chaque réponse est expliquée.</span>
    <div class="card hub"><div class="filters"><label class="field" style="color:var(--ink);text-shadow:none">Cours<select id="qs">${options(sources, st.src, 'Tous les cours')}</select></label>
      <label class="field" id="qsj" style="color:var(--ink);text-shadow:none" hidden>Sujet<select id="qsu">${options({ delai: 'Délais', montant: 'Montants' }, st.sujet, 'Délais et montants')}</select></label></div>
      <div class="btns" style="justify-content:flex-start"><a class="btn" id="go" href="#/quiz/run">${ic('circle-check')} Quiz</a>${nf ? `<a class="btn ghost" href="#/quiz/run?faibles=1">Mes points faibles (${nf})</a>` : ''}</div></div>
    <p class="small onmat" style="margin-top:22px">${rep ? `${rep} question${rep > 1 ? 's' : ''} répondue${rep > 1 ? 's' : ''} · ${Math.round(ok / rep * 100)} % de réussite.` : 'Chaque réponse renvoie au cours ou à l\'article.'} Ta progression reste sur cet appareil.</p>`,
    after() {
      const maj = () => { $('#qsj').hidden = st.src !== 'textes'; $('#go').href = '#/quiz/run' + qs({ cours: st.src, sujet: st.sujet }); };
      $('#qs').addEventListener('change', e => { st.src = e.target.value; maj(); });
      $('#qsu').addEventListener('change', e => { st.sujet = e.target.value; maj(); });
      maj();
    } };
};
views.maitriser = views.quiz;

function quiz(f, picked) {
  const app = $('#app'), back = '#/quiz'; const n = picked.length; let i = 0; const res = [];
  const shell = inner => {
    document.body.classList.add('quiz-mode');
    app.innerHTML = `<div class="qdeco"><div class="pill-s p1"></div><div class="pill-s p2"></div><div class="pill-s p3"></div><div class="star s1"></div><div class="star s2"></div></div>
    <a class="qquit" href="${back}">← Quitter</a>${inner}`;
  };
  const ask = () => {
    if (i >= n) return end();
    const q = picked[i];
    shell(`<div class="qwrap"><div class="qstack"><div class="qcard">
      <div class="reactions">${REACTIONS().map((e, k) => `<span class="r r${k}">${e}</span>`).join('')}</div>
      <h1 class="qtitle">Quiz Time!${FLECHE}</h1>
      <p class="qmeta">${esc(q.meta)} · Question ${i + 1}/${n}</p>
      <p class="qtext">${esc(q.enonce)}</p>
      <div class="opts">${q.choix.map((c, k) => `<button class="opt" data-k="${k}"><span class="l">${'ABCD'[k]}</span><span class="t">${esc(c)}</span></button>`).join('')}</div>
      <div id="fb"></div>
    </div></div></div>
    <div class="qprog">${picked.map((_, k) => `<i class="${k < i ? (res[k] ? 'ok' : 'ko') : k === i ? 'cur' : ''}"></i>`).join('')}</div>
    <div class="qfoot" id="qf">Choisis ta réponse ${ic('message-circle')}</div>`);
    let answered = false;
    const pick = k => {
      if (answered) return; answered = true;
      const ok = k === q.bonne; res[i] = ok; ET.quiz[q.id] = ok ? 1 : 0;
      if (ok) { if (ET.errors[q.id] > 1) ET.errors[q.id]--; else delete ET.errors[q.id]; } else ET.errors[q.id] = (ET.errors[q.id] || 0) + 1;
      touchDay(1); sauver();
      let serie = 0; for (let z = i; z >= 0 && res[z]; z--) serie++;
      E.coach.react(ok, ok ? serie : 0);
      $('.qcard').insertAdjacentHTML('beforeend', `<div class="stamp ${ok ? 'ok' : 'ko'}">${ok ? 'JUSTE !' : 'OUPS'}</div>`);
      $$('.opt').forEach((b, idx) => { b.disabled = true; if (idx === q.bonne) b.classList.add('ok'); else if (idx === k) b.classList.add('ko'); else b.classList.add('dim'); });
      $$('.reactions .r')[ok ? (Math.random() < .5 ? 0 : 1) : 3].classList.add('on');
      $('#fb').innerHTML = `<div class="expl"><b>${ok ? 'Bonne réponse !' : 'Pas tout à fait…'}</b>${esc(q.explication)}${q.voir ? `<br><a href="${q.voir}" target="_blank">Voir dans le cours</a>` : ''}</div>
        <button class="qnext" id="nx">${i + 1 < n ? 'Question suivante →' : 'Voir mon score →'}</button>`;
      $('#qf').textContent = ok ? 'Bien joué !' : 'Pas grave, on retient.';
      const next = () => { i++; ask(); };
      $('#nx').onclick = next; $('#nx').focus();
      E.touches = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); next(); } };
    };
    $$('.opt').forEach(b => b.onclick = () => pick(+b.dataset.k));
    E.touches = e => { const k = 'abcd1234'.indexOf(e.key.toLowerCase()); if (k >= 0 && k % 4 < q.choix.length) pick(k % 4); };
  };
  const end = () => {
    const good = res.filter(Boolean).length, wrong = picked.filter((_, k) => !res[k]), pct = Math.round(good / n * 100);
    log('quiz', { course: f.src || '', faibles: !!f.faibles, score: good, max: n, xp: good * 5 + (n - good) });
    shell(`<div class="qwrap"><div class="qstack"><div class="qcard">
      <div class="reactions">${REACTIONS().map((e, k) => `<span class="r r${k} ${k === (pct >= 70 ? 0 : 3) ? 'on' : ''}">${e}</span>`).join('')}</div>
      <h1 class="qtitle">Terminé !</h1>
      <p class="score">${good}/${n}</p>
      <p class="qtext" style="margin:6px 0 10px">${pct === 100 ? 'Sans faute, bravo !' : pct >= 70 ? 'Très bien, tu maîtrises !' : pct >= 40 ? 'Tu progresses, encore un effort.' : 'Relis le cours puis réessaie.'}</p>
      ${wrong.length ? `<div class="review"><p style="font-weight:600;margin-bottom:8px">À retenir :</p>${wrong.map(q => `<div class="it"><b>${esc(q.enonce)}</b><em>${esc(q.choix[q.bonne])}</em><br>${esc(q.explication)}</div>`).join('')}</div>` : ''}
      <div class="btns"><a class="qnext" id="again" href="#/quiz/run${qs({ cours: f.src, sujet: f.sujet, faibles: f.faibles ? 1 : '', r: Date.now() })}">Rejouer</a><a class="qnext" style="background:transparent;color:#1e1b16;border:2px solid #1e1b16" href="${back}">Retour</a></div>
    </div></div></div>`);
    E.touches = null;
    if (pct >= 70) { E.confetti(130); E.coach.win(pct === 100 ? 'Sans faute !' : 'Quel score !'); } else { E.sfx.lose(); E.coach.say('sad', 'On y retourne ?', 4000); }
  };
  if (!n) {
    shell(`<div class="qwrap"><div class="qstack"><div class="qcard">
      <div class="reactions">${REACTIONS().map((e, k) => `<span class="r r${k}">${e}</span>`).join('')}</div>
      <h1 class="qtitle">Quiz Time!</h1>
      <p class="qtext">${f.faibles ? 'Aucun point faible pour le moment. Continue comme ça !' : 'Pas assez de questions pour cette sélection.'}</p>
      <a class="qnext" href="${back}">Retour</a></div></div></div>`);
    return;
  }
  E.coach.show(); ask();
}

/* ---------- Passerelle vers les moteurs d'Excellence : exercices, examen blanc, carte mentale, recherche ---------- */
Object.assign(B, {
  $, $$, esc, md: mdBloc, shuffle, ic, save: sauver, touchDay, log, sfx: E.sfx, coach: E.coach, confetti: E.confetti, cheer: E.cheer,
  pick: E.choisir, perso: (qui, o = {}) => E.perso(qui, o.mood || 'joy', o.size || 160, { fixe: o.anim === false }),
  S: { get packs() { return tousCours || []; }, get store() { return ET; } },
  questions: (f = {}) => (tousCours || []).filter(p => !f.pack || p.id === f.pack).flatMap(p => p.chapitres.filter(c => !f.ch || c.id === f.ch).flatMap(c => (c.questions || []).map((q, i) => ({ id: `${p.id}:${c.id}:q${i}`, pack: p, chap: c, ...q })))),
});
window.EXO(B); window.MINDMAP(B); window.RECH(B);

const selectCours = async (cur, id) => `<select class="chsel" id="${id}" aria-label="Cours"><option value="">Tous les cours</option>${(await chargerCoursIdx()).map(c => `<option value="${esc(c.id)}" ${cur === c.id ? 'selected' : ''}>${esc(c.court)}</option>`).join('')}</select>`;
const EXO_TYPES = {
  trous: { ico: 'puzzle', nom: 'Compléter les trous', desc: 'Phrases et définitions à compléter avec les bons mots.' },
  qro: { ico: 'notebook-pen', nom: 'Réponses ouvertes (QRO)', desc: 'Réponds avec tes mots, comme à l\'écrit : les éléments clés sont vérifiés.' },
  calcul: { ico: 'calculator', nom: 'Calculs', desc: 'Chiffres tirés au hasard, corrigé pas à pas.' },
  classer: { ico: 'list-checks', nom: 'Classer', desc: 'Range chaque élément dans la bonne catégorie.' },
  ordre: { ico: 'list-ordered', nom: 'Remettre dans l\'ordre', desc: 'Étapes, phases et chronologies à reconstituer.' },
  vf: { ico: 'scale', nom: 'Vrai ou faux', desc: 'Définitions justes… ou piégées.' },
  mix: { ico: 'dices', nom: 'Mélange surprise', desc: 'Un peu de tout, pour s\'entraîner en conditions variées.' },
};
const exoDispo = (type, f) => type === 'mix' ? ['trous', 'calcul', 'classer', 'ordre', 'vf', 'qro', 'qcm'].reduce((n, t) => n + B.gen[t](f, 99).length, 0) : B.gen[type](f, 99).length;

views.exercices = async (a, q) => {
  await chargerTousCours(); const idx = await chargerCoursIdx();
  const c = idx.some(x => x.id === q.c) ? q.c : '', f = c ? { pack: c } : {};
  if (a[0] === 'run') return { title: 'Exercices', html: '<div id="ex"></div>', after() { exoRun(q, f, c); } };
  return { title: 'Exercices', html: `
    <h1 class="h1">${lbls('Exercices')}</h1><span class="hand">Pour apprendre en faisant : complète, calcule, classe, ordonne.</span>
    <div class="chip-row" style="margin:22px 0 10px">${await selectCours(c, 'csel')}</div>
    <div class="tiles">${Object.entries(EXO_TYPES).map(([k, t]) => { const n = exoDispo(k, f); return `<a class="tile ${n ? '' : 'off'}" ${n ? `href="#/exercices/run${qs({ c, type: k })}"` : ''}><span class="ico">${ic(t.ico)}</span><h3>${t.nom}</h3><p>${t.desc}</p><small>${n ? (k === 'calcul' ? 'Illimité' : n + ' exercices') : 'Pas disponible pour ce cours'}</small></a>`; }).join('')}</div>`,
    after() { $('#csel').onchange = e => { location.hash = '#/exercices' + qs({ c: e.target.value }); }; } };
};

function exoRun(q, f, c) {
  const app = $('#app'), type = EXO_TYPES[q.type] ? q.type : 'mix', N = +q.n || 8, back = '#/exercices' + qs({ c });
  const { gen, items: X } = B;
  let items = type === 'mix' ? shuffle(['trous', 'calcul', 'classer', 'ordre', 'vf', 'qro', 'qcm'].flatMap(t => gen[t](f, 3))) : gen[type](f, N);
  items = items.slice(0, N);
  if (!items.length) { app.innerHTML = habiller('<p class="onmat">Pas d\'exercice disponible pour cette sélection.</p>', back, 'Exercices'); return; }
  let i = 0, total = 0; const results = []; E.coach.show();
  const show = () => {
    if (i >= items.length) return end();
    const it = items[i];
    app.innerHTML = habiller(`<div class="bar" style="margin:0 0 10px;background:rgba(255,255,255,.25)"><i style="width:${i / items.length * 100}%;background:var(--y)"></i></div>
      <small class="onmat src">${esc(it.src || '')} · ${i + 1} / ${items.length}</small>
      <div class="ex-card" id="host"></div><div id="fb"></div>
      <div class="btns" style="justify-content:flex-start"><button class="btn" id="go" style="margin-top:6px" disabled>Valider</button></div>`, back, `${EXO_TYPES[type] ? ic(EXO_TYPES[type].ico) : ''} ${EXO_TYPES[type].nom}`);
    const host = $('#host'), go = $('#go'); let validated = false;
    const validate = () => {
      if (validated) return; const r = X.grade(it); if (!r.answered) return;
      validated = true; X.reveal(it, host); total += r.score; results.push(r.ok);
      { let sk = 0; for (let z = results.length - 1; z >= 0 && results[z]; z--) sk++; E.coach.react(r.ok, r.ok ? sk : 0);
        host.insertAdjacentHTML('beforeend', `<div class="stamp ${r.ok ? 'ok' : r.score > 0 ? 'mid' : 'ko'}">${r.ok ? 'BRAVO !' : r.score > 0 ? 'PRESQUE' : 'OUPS'}</div>`); }
      touchDay(1); X.recordQcm(it, r.ok); sauver();
      $('#fb').innerHTML = `<div class="feedback ${r.ok ? 'good' : r.score > 0 ? 'mid' : 'bad'}"><b>${r.ok ? `${ic('circle-check')} Bravo !` : r.score > 0 ? `${ic('circle-dot')} Presque…` : `${ic('circle-x')} Pas tout à fait`}</b> <span>${r.good}</span>${r.html ? `<div class="why">${r.html}</div>` : ''}</div>`;
      go.textContent = i + 1 < items.length ? 'Suivant →' : 'Voir mon score'; go.disabled = false; go.onclick = () => { i++; show(); };
      E.touches = e => { if (e.key === 'Enter') { e.preventDefault(); i++; show(); } };
    };
    X.mount(it, host, { onChange: () => { go.disabled = !X.grade(it).answered; }, onEnter: validate });
    go.onclick = validate;
  };
  const end = () => {
    const pct = Math.round(total / items.length * 100);
    log('exo', { course: c, kind: type, score: Math.round(total * 10) / 10, max: items.length, xp: Math.round(total * 8) });
    app.innerHTML = habiller(`<div class="done">${E.cheer(pct / 100)}<h1>${pct >= 80 ? 'Excellent' : pct >= 50 ? 'Bien joué' : 'On s\'accroche'}</h1>
      <p style="font-size:1.6rem;font-family:var(--display);font-weight:800">${Math.round(total * 10) / 10} / ${items.length}</p><p>${pct} % de réussite.</p>
      <div class="btns"><a class="btn" href="#/exercices/run${qs({ c, type, r: Date.now() })}">Recommencer</a><a class="btn ghost" href="${back}">Autres exercices</a></div></div>`, back, 'Exercices');
    E.touches = null; if (pct >= 60) { E.confetti(110); E.coach.win(pct >= 90 ? 'Quel score !' : 'Bien joué !'); } else { E.sfx.lose(); E.coach.say('sad', 'On réessaie ?', 4000); }
  };
  show();
}

/* ---------- Examen blanc ---------- */
const fmtT = t => `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
const TYPE_EXAM = { qcm: 'QCM', trous: 'Texte à trous', vf: 'Vrai/Faux', calcul: 'Calcul', qro: 'Réponse ouverte', classer: 'Classement', ordre: 'Ordre' };
function composerExamen(f, n) {
  const want = { qcm: Math.round(n * 0.4), qro: Math.round(n * 0.2), trous: Math.round(n * 0.12), vf: Math.round(n * 0.08), calcul: Math.round(n * 0.12), classer: Math.round(n * 0.08) };
  let items = []; for (const [k, v] of Object.entries(want)) items.push(...B.gen[k](f, v));
  if (items.length < n) { const have = new Set(items.map(x => x.qid || x.q)); items.push(...B.gen.qcm(f, n * 2).filter(x => !have.has(x.qid)).slice(0, n - items.length)); }
  return shuffle(items).slice(0, n);
}
views.examen = async (a, q) => {
  await chargerTousCours(); const idx = await chargerCoursIdx(); const c = idx.some(x => x.id === q.c) ? q.c : '';
  if (a[0] === 'run') return { title: 'Examen blanc', html: '<div id="exm"></div>', after() { examRun(q, c); } };
  const hist = [...ET.exams].reverse().slice(0, 8);
  return { title: 'Examen blanc', html: `
    <h1 class="h1">${lbls('Examen blanc')}</h1><span class="hand">Conditions réelles : chrono, pas de correction avant la fin, note sur 20.</span>
    <div class="card exam-cfg" style="margin-top:22px"><label>Cours<br>${await selectCours(c, 'csel')}</label>
      <label>Nombre de questions<br><select class="chsel" id="nq"><option value="10">10 (≈ 13 min)</option><option value="20" selected>20 (≈ 26 min)</option><option value="30">30 (≈ 40 min)</option></select></label>
      <button class="btn" id="go" style="margin-top:6px">Commencer l'examen</button></div>
    ${hist.length ? `<h2 class="sec"><span class="lbl l1">Mes derniers examens</span></h2><div class="card hist">${hist.map(h => `<div class="hrow"><span>${jourCourt(h.date)}</span><span class="nm">${esc(h.titre)}</span><b>${h.note.toFixed(1)} / 20</b><small class="muted">${h.n} questions</small></div>`).join('')}</div>` : ''}`,
    after() { $('#go').onclick = () => { location.hash = '#/examen/run' + qs({ c: $('#csel').value, n: $('#nq').value, r: Date.now() }); }; } };
};
function examRun(q, c) {
  const app = $('#app'), f = c ? { pack: c } : {}, n = Math.min(40, +q.n || 20), X = B.items;
  const items = composerExamen(f, n), titre = c ? ((coursIdx.find(x => x.id === c) || {}).court || 'Cours') : 'Tous les cours', back = '#/examen';
  if (items.length < 3) { app.innerHTML = habiller('<p class="onmat">Pas assez de contenu pour composer un examen.</p>', back, 'Examen blanc'); return; }
  const dur = Math.round(items.length * 1.3) * 60; let left = dur, i = 0, finished = false;
  items.forEach(it => { it.state = undefined; it.locked = false; });
  const draw = () => {
    const it = items[i], rep = items.filter(x => X.grade(x).answered).length;
    app.innerHTML = habiller(`<div class="exam-bar"><span class="timer" id="tm">${fmtT(left)}</span><span>Question ${i + 1} / ${items.length}</span><span>${rep} répondue${rep > 1 ? 's' : ''}</span></div>
      <div class="edots">${items.map((x, k) => `<button class="edot ${k === i ? 'cur' : ''} ${X.grade(x).answered ? 'on' : ''}" data-k="${k}" aria-label="Question ${k + 1}">${k + 1}</button>`).join('')}</div>
      <small class="onmat src">${TYPE_EXAM[it.kind] || ''}${(it.kind === 'calcul' || it.kind === 'qro') ? ' · compte double' : ''}</small>
      <div class="ex-card examsheet" id="host"></div>
      <div class="btns" style="justify-content:space-between"><button class="btn ghost" id="pv" ${i === 0 ? 'disabled' : ''}>← Précédente</button>
        ${i + 1 < items.length ? '<button class="btn" id="nx">Suivante →</button>' : '<button class="btn" id="sub">Terminer l\'examen</button>'}</div>
      ${i + 1 < items.length ? '<div class="btns" style="justify-content:center;margin-top:8px"><button class="btn ghost sm" id="sub">Terminer maintenant</button></div>' : ''}`, back, 'Examen blanc');
    X.mount(it, $('#host'), { onChange: () => { const d = $$('.edot')[i]; if (d) d.classList.toggle('on', X.grade(it).answered); } });
    $$('.edot').forEach(d => d.onclick = () => { i = +d.dataset.k; draw(); });
    $('#pv')?.addEventListener('click', () => { i--; draw(); }); $('#nx')?.addEventListener('click', () => { i++; draw(); });
    $('#sub')?.addEventListener('click', () => { const blank = items.filter(x => !X.grade(x).answered).length; if (!blank || confirm(`${blank} question(s) sans réponse. Terminer l'examen ?`)) finish(); });
  };
  const finish = () => {
    if (finished) return; finished = true; clearInterval(timer); E.touches = null;
    let got = 0, tot = 0; const byType = {}, bySrc = {};
    const detail = items.map(it => { const r = X.grade(it), pts = r.score * r.w; got += pts; tot += r.w; touchDay(1); X.recordQcm(it, r.ok);
      (byType[it.kind] ||= { g: 0, t: 0 }); byType[it.kind].g += pts; byType[it.kind].t += r.w; const sr = (it.src || '').split(' · ').pop() || '—'; (bySrc[sr] ||= { g: 0, t: 0 }); bySrc[sr].g += pts; bySrc[sr].t += r.w; return { it, r }; });
    const note = Math.round(got / tot * 200) / 10; if (note >= 10) E.sfx.win(); else E.sfx.lose();
    ET.exams.push({ date: Date.now(), titre, note, n: items.length, c }); log('exam', { course: c, score: note, max: 20, xp: 40 + Math.round(note * 3) });
    const weak = Object.entries(bySrc).filter(([, v]) => v.t > 0 && v.g / v.t < 0.6).sort((x, y) => x[1].g / x[1].t - y[1].g / y[1].t).slice(0, 4);
    app.innerHTML = habiller(`<div class="done">${E.cheer(note / 20)}<h1>${note >= 16 ? 'Excellent' : note >= 12 ? 'Bien' : note >= 10 ? 'Passable' : 'À retravailler'}</h1>
      <p class="stampbig big ${note >= 10 ? 'ok' : 'ko'}" style="font-size:clamp(40px,9vw,64px);display:inline-block;font-family:var(--display);font-weight:800">${note.toFixed(1)} / 20</p><p>Temps utilisé : ${fmtT(dur - left)} sur ${fmtT(dur)}.</p></div>
      <div class="kgrid">${Object.entries(byType).map(([k, v]) => `<div class="kpi"><b>${Math.round(v.g / v.t * 100)}%</b><span>${TYPE_EXAM[k]}</span></div>`).join('')}</div>
      ${weak.length ? `<div class="card" style="margin-bottom:24px"><h3 style="margin:0 0 8px">À revoir en priorité</h3>${weak.map(([sr, v]) => `<p style="margin:4px 0">• ${esc(sr)} <small class="muted">(${Math.round(v.g / v.t * 100)}%)</small></p>`).join('')}</div>` : '<div class="card" style="margin-bottom:24px"><h3 style="margin:0">Aucun point faible majeur</h3></div>'}
      <h2 class="sec"><span class="lbl l2">Correction détaillée</span></h2>
      ${detail.map(({ it, r }, k) => `<div class="card corr ${r.ok ? 'good' : r.score > 0 ? 'mid' : 'bad'}" style="margin-bottom:16px"><small>${k + 1}. ${TYPE_EXAM[it.kind]} — ${r.ok ? ic('circle-check', 'good') : r.score > 0 ? ic('circle-dot', 'mid') : ic('circle-x', 'bad')} ${r.answered ? '' : '(sans réponse)'}</small><div class="host" id="c${k}"></div><div class="feedback ${r.ok ? 'good' : 'bad'}" style="margin-top:10px"><span>${r.good}</span>${r.html ? `<div class="why">${r.html}</div>` : ''}</div></div>`).join('')}
      <div class="btns"><a class="btn" href="#/examen/run${qs({ c, n, r: Date.now() })}">Refaire un examen</a><a class="btn ghost" href="${back}">Retour</a></div>`, back, 'Examen blanc');
    detail.forEach(({ it }, k) => { X.mount(it, $('#c' + k), {}); X.reveal(it, $('#c' + k)); });
  };
  const timer = setInterval(() => { if (!$('#tm')) { clearInterval(timer); return; } left--; $('#tm').textContent = fmtT(left); if (left <= 60) $('#tm').classList.add('warn'); if (left <= 0) { alert('Temps écoulé !'); finish(); } }, 1000);
  draw();
}

/* ---------- Carte mentale ---------- */
views.carte = async ([id], q) => {
  const packs = await chargerTousCours(), p = packs.find(x => x.id === id); if (!p) return views.introuvable();
  const c = p.chapitres.find(x => x.id === q.ch);
  return { title: `Carte mentale : ${p.court}`, html: `
    <a class="back" href="#/cours/${p.id}${c ? '?ch=' + c.id : ''}">← ${esc(p.titre)}</a>
    <h1 class="h1">${lbls('Carte mentale')}</h1><p class="mmhint">Touche un post-it pour lire son détail · glisse pour te déplacer · molette pour zoomer</p>
    <div class="chip-row" style="margin:10px 0 14px"><select class="chsel" id="msel"><option value="">Vue d'ensemble du cours</option>${p.chapitres.map(x => `<option value="${esc(x.id)}" ${c && c.id === x.id ? 'selected' : ''}>${esc(nomChap(x.titre))}</option>`).join('')}</select></div>
    <div class="mmap" id="mmap"></div><div id="mpanel"></div>`,
    after() { $('#msel').onchange = e => { location.hash = `#/carte/${p.id}${e.target.value ? '?ch=' + e.target.value : ''}`; }; B.mm.drawMap(c ? B.mm.chapterTree(p, c) : B.mm.courseTree(p), $('#mmap'), $('#mpanel')); } };
};

/* ---------- Olympiade blanche (reprise d'Excellence) ---------- */
const MANCHES = [
  { id: 'rapid', nom: 'Manche 1 · Rapidité', desc: 'QCM éclair : 15 secondes par question.', gen: 'qcm', n: 12, sec: 15 },
  { id: 'vf', nom: 'Manche 2 · Vrai ou faux', desc: 'Une définition, vrai ou faux : 10 secondes.', gen: 'vf', n: 10, sec: 10 },
  { id: 'chiffres', nom: 'Manche 3 · Les trous', desc: 'Complète le texte : 35 secondes par phrase.', gen: 'trous', n: 6, sec: 35 },
  { id: 'qro', nom: 'Manche 4 · Réponses ouvertes', desc: 'Réponds par écrit, avec les termes et chiffres exacts : 60 secondes par question.', gen: 'qro', n: 5, sec: 60 },
];
views.olympiade = async (a, q) => {
  await chargerTousCours(); const idx = await chargerCoursIdx(); const c = idx.some(x => x.id === q.c) ? q.c : '';
  if (a[0] === 'run') return { title: 'Olympiade blanche', html: '<div id="ol"></div>', after() { olympRun(q, c); } };
  const hist = [...ET.olymp].reverse().slice(0, 8), best = ET.olymp.reduce((m, h) => Math.max(m, h.score), 0);
  return { title: 'Olympiade blanche', html: `
    <h1 class="h1">${lbls('Olympiade blanche')}</h1><span class="hand">Quatre manches chronométrées, comme en concours.</span>
    <p class="onmat" style="max-width:720px;margin-top:14px">QCM, vrai/faux, trous, réponses ouvertes : on gagne des points à chaque bonne réponse, plus un bonus de vitesse. Pas de retour en arrière.</p>
    <div class="olp-manches" style="margin:22px 0">${MANCHES.map(m => `<div class="card olp-m"><h3>${m.nom}</h3><p>${m.desc}</p><small class="muted">${m.n} questions</small></div>`).join('')}</div>
    <div class="card exam-cfg"><label>Cours<br>${await selectCours(c, 'csel')}</label><button class="btn" id="go" style="margin-top:6px">Lancer l'Olympiade blanche</button>
      <p class="muted" style="margin-top:10px">${best ? `Meilleur score : <b>${best}</b> points.` : 'Aucun score pour le moment.'}</p></div>
    <div class="btns" style="justify-content:flex-start;margin-top:20px"><a class="btn ghost" href="#/examen">Examen blanc classique (note sur 20)</a></div>
    ${hist.length ? `<h2 class="sec"><span class="lbl l1">Mes dernières Olympiades</span></h2><div class="card hist">${hist.map(h => `<div class="hrow"><span>${jourCourt(h.date)}</span><span class="nm">${esc(h.titre)}</span><b>${h.score} / ${h.max}</b></div>`).join('')}</div>` : ''}`,
    after() { $('#go').onclick = () => { location.hash = '#/olympiade/run' + qs({ c: $('#csel').value, r: Date.now() }); }; } };
};
function olympRun(q, c) {
  const app = $('#app'), f = c ? { pack: c } : {}, X = B.items, back = '#/olympiade', titre = c ? ((coursIdx.find(x => x.id === c) || {}).court || 'Cours') : 'Tous les cours';
  const rounds = MANCHES.map(m => ({ ...m, items: B.gen[m.gen](f, m.n * 2).slice(0, m.n), pts: 0, ok: 0 })).filter(r => r.items.length >= 3);
  if (!rounds.length) { app.innerHTML = habiller('<p class="onmat">Pas assez de contenu pour composer une Olympiade.</p>', back, 'Olympiade blanche'); return; }
  let ri = 0, qi = 0, left = 0, total = 0, closed = false, timer = null; const wrong = []; E.coach.show();
  const intro = () => {
    const r = rounds[ri]; clearInterval(timer);
    app.innerHTML = habiller(`<div class="done olp-intro">${E.cheer(.8)}<h1>${r.nom}</h1><p>${r.desc}</p><p>${r.items.length} questions · score actuel : <b>${total}</b></p><div class="btns"><button class="btn" id="st">C'est parti</button></div></div>`, back, 'Olympiade blanche');
    $('#st').onclick = () => { qi = 0; ask(); };
  };
  const ask = () => {
    const r = rounds[ri], it = r.items[qi]; it.state = undefined; it.locked = false; left = r.sec; closed = false;
    app.innerHTML = habiller(`<div class="exam-bar"><span class="timer" id="tm">${fmtT(left)}</span><span>${r.nom.replace(' · ', ' — ')}</span><span>Question ${qi + 1} / ${r.items.length}</span><span>Score : <b id="sc">${total}</b></span></div>
      <div class="olp-track"><i id="tk" style="width:100%"></i></div>
      <div class="ex-card examsheet" id="host"></div><p class="flash-fb" id="fb"></p><div class="btns" id="vb" style="justify-content:center"></div>`, back, 'Olympiade blanche');
    const host = $('#host');
    const nxt = () => { if (!$('#nx')) return; qi++; if (qi < r.items.length) ask(); else { ri++; if (ri < rounds.length) intro(); else finish(); } };
    const settle = timedOut => {
      if (closed) return; closed = true; clearInterval(timer);
      const g = X.grade(it), ok = g.answered && g.ok; let gain = 0;
      if (ok) { gain = 10 + Math.min(5, Math.floor(left / 3)); r.pts += gain; r.ok++; total += gain; } else wrong.push({ it, round: r.nom });
      touchDay(1); X.recordQcm(it, ok); X.reveal(it, host);
      const fb = $('#fb'); fb.textContent = ok ? `+${gain}` : (timedOut ? 'Temps écoulé' : 'Raté'); fb.className = 'flash-fb ' + (ok ? 'good' : 'bad'); $('#sc').textContent = total;
      if (ok) E.sfx.win(); else E.sfx.lose();
      $('#vb').innerHTML = '<button class="btn" id="nx">Suivant →</button>'; $('#nx').onclick = nxt; setTimeout(() => { if ($('#nx') && closed) nxt(); }, ok ? 1100 : 2600);
    };
    X.mount(it, host, { onChange: () => { if (it.kind !== 'trous' && it.kind !== 'qro' && X.grade(it).answered) settle(false); }, onEnter: () => { if (X.grade(it).answered) settle(false); } });
    if (it.kind === 'trous' || it.kind === 'qro') { $('#vb').innerHTML = '<button class="btn" id="vl">Valider</button>'; $('#vl').onclick = () => { if (X.grade(it).answered) settle(false); }; }
    timer = setInterval(() => { if (!$('#tm')) { clearInterval(timer); return; } left--; $('#tm').textContent = fmtT(left); $('#tk').style.width = (left / r.sec * 100) + '%'; if (left <= 5) $('#tm').classList.add('warn'); if (left <= 0) settle(true); }, 1000);
  };
  const finish = () => {
    const max = rounds.reduce((n, r) => n + r.items.length * 15, 0);
    ET.olymp.push({ date: Date.now(), titre, score: total, max, c }); log('olympiade', { course: c, score: total, max, xp: 30 + Math.round(total / 4) });
    const ratio = total / max; if (ratio >= .5) E.confetti(ratio >= .75 ? 160 : 70);
    const verdict = ratio >= .75 ? 'Niveau podium' : ratio >= .5 ? 'Solide' : ratio >= .3 ? 'En progression' : 'À retravailler';
    const srcs = {}; wrong.forEach(w => { const sr = (w.it.src || '').split(' · ').pop() || '—'; srcs[sr] = (srcs[sr] || 0) + 1; });
    const weak = Object.entries(srcs).sort((x, y) => y[1] - x[1]).slice(0, 5);
    app.innerHTML = habiller(`<div class="done">${E.cheer(ratio)}<h1>${verdict}</h1><p class="stampbig big ${ratio >= .5 ? 'ok' : 'ko'}" style="font-size:clamp(40px,9vw,64px);display:inline-block;font-family:var(--display);font-weight:800">${total} points</p><p>sur ${max} possibles</p></div>
      <div class="kgrid">${rounds.map(r => `<div class="kpi"><b>${r.ok} / ${r.items.length}</b><span>${r.nom.split(' · ')[1]} · ${r.pts} pts</span></div>`).join('')}</div>
      ${weak.length ? `<div class="card" style="margin-bottom:24px"><h3 style="margin:0 0 8px">Le coach te conseille de revoir</h3>${weak.map(([sr, n]) => `<p style="margin:4px 0">• ${esc(sr)} <small class="muted">(${n} erreur${n > 1 ? 's' : ''})</small></p>`).join('')}</div>` : '<div class="card" style="margin-bottom:24px"><h3 style="margin:0">Sans faute : bravo</h3></div>'}
      <h2 class="sec"><span class="lbl l2">Les erreurs, corrigées</span></h2>
      ${wrong.length ? wrong.map((w, k) => `<div class="card corr bad" style="margin-bottom:16px"><small>${esc(w.round)} · ${esc(w.it.src || '')}</small><div id="w${k}"></div></div>`).join('') : '<p class="onmat">Aucune erreur.</p>'}
      <div class="btns"><a class="btn" href="#/olympiade/run${qs({ c, r: Date.now() })}">Rejouer</a><a class="btn ghost" href="${back}">Retour</a></div>`, back, 'Olympiade blanche');
    wrong.forEach((w, k) => { X.mount(w.it, $('#w' + k), {}); X.reveal(w.it, $('#w' + k)); });
  };
  intro();
}

/* ---------- Plan de révision ---------- */
const DJ = 86400000;
const minuit = d => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const parseJ = t => { const [y, m, d] = t.split('-').map(Number); return new Date(y, m - 1, d); };
const isoJ = d => d.toLocaleDateString('sv');
const ecartJ = (a, b) => Math.round((minuit(b) - minuit(a)) / DJ);
function planCours(pk, dateStr) {
  const exam = parseJ(dateStr), now = minuit(new Date()), D_ = ecartJ(now, exam); if (D_ < 0 || !pk.chapitres.length) return {};
  const out = {}, add = (k, t) => { const d = isoJ(new Date(now.getTime() + k * DJ)); (out[d] ||= []).push({ ...t, course: pk.id, ctitle: pk.court || pk.titre }); };
  const chs = pk.chapitres, N = chs.length, base = `#/cours/${pk.id}`;
  add(D_, { kind: 'jourj', label: 'Jour J : relis les résumés en une phrase, une dernière passe de flashcards.', href: `${base}?t=resume&n=court` });
  if (D_ >= 1) add(D_ - 1, { kind: 'veille', label: 'Veille : points faibles + flashcards à revoir. Couche-toi tôt.', href: '#/quiz/run?faibles=1' });
  if (D_ >= 2) add(D_ - 2, { kind: 'blanc', label: 'Examen blanc complet (20 questions), puis corrige-le à fond.', href: `#/examen/run?c=${pk.id}&n=20` });
  const R = Math.max(0, D_ - 2); if (!R) return out;
  const L = Math.max(1, Math.min(N, Math.round(R * 0.55))), perDay = Math.ceil(N / L);
  for (let j = 0; j < L; j++) {
    const grp = chs.slice(j * perDay, (j + 1) * perDay); if (!grp.length) continue;
    add(j, { kind: 'apprendre', label: `Apprendre : ${grp.map(c => nomChap(c.titre)).join(' ; ')}`, href: `${base}?t=fiches&ch=${grp[0].id}` });
    add(j, { kind: 'cartes', label: `Flashcards : ${grp.length > 1 ? 'ces chapitres' : 'ce chapitre'}`, href: `#/flashcards/run?cours=${pk.id}` });
  }
  for (let k = 0; k < R - L; k++) {
    const a = chs[(k * 2) % N], b = chs[(k * 2 + 1) % N];
    add(L + k, { kind: 'quiz', label: `Quiz et exercices : ${nomChap(a.titre)}${b && b !== a ? ' + ' + nomChap(b.titre) : ''}`, href: `#/quiz/run?cours=${pk.id}` });
    add(L + k, { kind: 'jeu', label: ['Un jeu pour fixer le vocabulaire (Memory, Mot mystère)', 'Des exercices à trous et de calcul', 'Vrai/Faux éclair + Défi 60 s'][k % 3], href: ['#/jeux', `#/exercices?c=${pk.id}`, '#/jeux/vf'][k % 3] });
  }
  return out;
}
const agendaComplet = () => { const ag = {}; Object.entries(ET.examDates).forEach(([id, ds]) => { const pk = (tousCours || []).find(x => x.id === id); if (!pk || !ds) return; Object.entries(planCours(pk, ds)).forEach(([d, ts]) => (ag[d] ||= []).push(...ts)); }); return ag; };
const cleTache = (d, t, i) => `${d}|${t.course}|${t.kind}|${i}`;
const libJour = d => { const n = ecartJ(new Date(), parseJ(d)), nm = parseJ(d).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }); return n === 0 ? `Aujourd'hui · ${nm}` : n === 1 ? `Demain · ${nm}` : nm; };
const ICONE_PLAN = { jourj: 'flag', veille: 'moon', blanc: 'clipboard-check', apprendre: 'book-open', cartes: 'layers', quiz: 'circle-check', jeu: 'gamepad-2' };
views.planning = async () => {
  const packs = await chargerTousCours(); const ag = agendaComplet(), jours = Object.keys(ag).sort(), auj = isoJ(new Date());
  const proches = packs.filter(pk => ET.examDates[pk.id] && ecartJ(new Date(), parseJ(ET.examDates[pk.id])) >= 0);
  const toutes = jours.flatMap(d => ag[d].map((t, i) => cleTache(d, t, i))), faites = toutes.filter(k => ET.planDone[k]).length;
  return { title: 'Plan de révision', html: `
    <h1 class="h1">${lbls('Plan de révision')}</h1><span class="hand">Donne la date de ton examen : le plan répartit les jours.</span>
    <div class="card" style="margin-top:22px"><h3 style="margin:0 0 8px">Mes échéances</h3>${packs.map(pk => { const ds = ET.examDates[pk.id] || '', n = ds ? ecartJ(new Date(), parseJ(ds)) : null;
      return `<div class="exrow"><span class="nm">${esc(pk.court || pk.titre)}</span><input type="date" data-id="${esc(pk.id)}" value="${ds}" min="${auj}">${n != null ? `<b class="${n <= 7 ? 'ko' : ''}">${n < 0 ? 'passé' : n === 0 ? 'aujourd\'hui' : 'J−' + n}</b>` : '<span class="muted">date ?</span>'}</div>`; }).join('')}</div>
    ${proches.length ? `<div class="bar" style="max-width:none;margin-top:22px;background:rgba(255,255,255,.25)"><i style="width:${toutes.length ? faites / toutes.length * 100 : 0}%;background:var(--y)"></i></div><p class="onmat" style="margin:6px 0 20px">${faites} / ${toutes.length} tâches faites</p>` : ''}
    <div style="display:grid;gap:22px;margin-top:22px">${jours.length ? jours.slice(0, 21).map(d => `<div class="card day ${d === auj ? 'istoday' : ''}"><h3>${esc(libJour(d))}</h3>${ag[d].map((t, i) => { const k = cleTache(d, t, i); return `<label class="task ${ET.planDone[k] ? 'done' : ''}"><input type="checkbox" data-k="${esc(k)}" ${ET.planDone[k] ? 'checked' : ''}><span class="ico">${ic(ICONE_PLAN[t.kind])}</span><span class="tx"><b>${esc(t.ctitle)}</b> — ${esc(t.label)} <a href="${t.href}">Ouvrir →</a></span></label>`; }).join('')}</div>`).join('') + (jours.length > 21 ? '<p class="onmat">… la suite du plan apparaîtra au fil des jours.</p>' : '') : '<p class="onmat">Aucune date enregistrée (ou elles sont passées). Choisis une date ci-dessus pour générer ton plan.</p>'}</div>`,
    after() {
      $$('input[type=date]').forEach(i => i.onchange = () => { if (i.value) ET.examDates[i.dataset.id] = i.value; else delete ET.examDates[i.dataset.id]; sauver(); render(); });
      $$('.task input').forEach(c => c.onchange = () => { if (c.checked) ET.planDone[c.dataset.k] = 1; else delete ET.planDone[c.dataset.k]; sauver(); c.closest('.task').classList.toggle('done', c.checked); });
    } };
};

/* ---------- Guide de prise en main ---------- */
const GUIDE = [
  { ic: 'graduation-cap', t: 'Bienvenue', href: '#/', p: ['Cette plateforme est gratuite et sans compte. Elle réunit <b>10 cours</b> sur le marché financier de la CEMAC, les <b>textes officiels</b> avec leurs PDF, des exercices, des jeux et des examens blancs.', 'Ce guide prend deux minutes. Tu peux le revoir à tout moment depuis le pied de page.'] },
  { ic: 'library', t: 'La bibliothèque : tes 11 livres', href: '#/bibliotheque', p: ['L\'étagère montre les cours : <b>Le cadre</b>, Entrer en bourse, Appel public, Placement privé, Vie du titre, Ordre et dénouement, Intermédiaires, Fonds, Conformité, Repères, Épreuves.', 'Commence par <b>Le cadre</b>. La barre de recherche trouve aussi bien un cours qu\'un texte.'] },
  { ic: 'lightbulb', t: 'Apprendre un cours', href: '#/cours/p0-cadre', p: ['Les onglets se lisent dans cet ordre : <b>Résumé</b> (l\'essentiel) → <b>Fiches</b> (le détail, avec les articles) → <b>Schémas</b> animés → <b>Le coach insiste</b> (les pièges) → <b>Glossaire</b>.', 'L\'onglet <b>Textes</b> donne les textes officiels du thème, avec leur statut et leur PDF. Termine par le <b>Quiz</b> du cours : on retient mieux en répondant.'] },
  { ic: 'clipboard-list', t: 'Retrouver un délai, un montant', href: '#/pratiquer', p: ['<b>Pratiquer</b> liste les délais, montants, rôles et définitions de tous les textes, avec l\'article. <b>Chercher</b> balaie les textes ET les cours, avec tolérance aux accents et aux fautes.', 'Chaque texte indique s\'il est <b>en vigueur</b> ou <b>abrogé</b>, et propose le PDF officiel.'] },
  { ic: 'layers', t: 'Réviser avec les flashcards', href: '#/flashcards', p: ['Tu lis la question, tu réponds dans ta tête, tu retournes la carte et tu notes : À revoir, Difficile, Bien, Facile.', 'Les cartes ratées reviennent vite, les cartes sues de plus en plus tard. <b>10 minutes par jour</b> valent mieux que 2 heures la veille.'] },
  { ic: 'pencil-line', t: 'Exercices, jeux et quiz', href: '#/exercices', p: ['<b>Exercices</b> : textes à trous, réponses ouvertes (QRO), calculs, classements, remises dans l\'ordre. <b>Jeux</b> : Memory, vrai/faux éclair, mot mystère, défi de 60 secondes.', 'Le quiz « points faibles » refait les questions que tu rates.'] },
  { ic: 'trophy', t: 'Olympiade blanche et examen blanc', href: '#/olympiade', p: ['<b>Olympiade blanche</b> : quatre manches chronométrées avec des points et un bonus de vitesse.', '<b>Examen blanc</b> : une note sur 20 et une correction détaillée. Fais-en un par semaine, puis relis tes erreurs.'] },
  { ic: 'calendar-days', t: 'Plan et progrès', href: '#/planning', p: ['Dans <b>Plan de révision</b>, indique la date de ton examen : la plateforme répartit chapitres, quiz et examen blanc jusqu\'au jour J.', '<b>Progrès</b> montre ton niveau, ta série de jours, tes badges et ta maîtrise par cours.'] },
  { ic: 'cloud', t: 'Compte facultatif', href: '#/compte', p: ['Ta progression reste sur ton appareil. Pour la retrouver ailleurs, crée un <b>compte</b> (e-mail et mot de passe) : tout est sauvegardé et synchronisé.'] },
  { ic: 'flag', t: 'Ta routine conseillée', href: '#/cours/p0-cadre', p: ['<b>Chaque jour</b> : 1) les flashcards à réviser, 2) un chapitre (résumé, fiches, quiz), 3) une série d\'exercices.', '<b>Chaque semaine</b> : une Olympiade blanche et un examen blanc, puis relire les erreurs.'] },
];
function tourGuide(from = 0) {
  if ($('#gdtour')) return; let i = from;
  const el = document.createElement('div'); el.id = 'gdtour'; el.className = 'gd-back'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', 'Guide de prise en main');
  document.body.appendChild(el);
  const onKey = e => { if (e.key === 'Escape') close(); }; const close = () => { document.removeEventListener('keydown', onKey); el.remove(); };
  document.addEventListener('keydown', onKey);
  const draw = () => { const st = GUIDE[i], last = i === GUIDE.length - 1;
    el.innerHTML = `<div class="gd-card"><button class="gd-x" id="gdx" aria-label="Fermer le guide">${ic('x')}</button>
      <div class="gd-head"><div class="gd-hi">${i === 0 ? 'Salut !' : 'Le coach t\'explique'}</div></div>
      <div class="gd-body"><div class="gd-ico">${ic(st.ic)}</div><small class="gd-n">Étape ${i + 1} sur ${GUIDE.length}</small><h2>${st.t}</h2>${st.p.map(x => `<p>${x}</p>`).join('')}</div>
      <div class="gd-dots">${GUIDE.map((_, k) => `<button class="${k === i ? 'on' : ''}" data-k="${k}" aria-label="Étape ${k + 1}"></button>`).join('')}</div>
      <div class="gd-btns">${i > 0 ? '<button class="btn ghost" id="gdp">← Précédent</button>' : '<button class="btn ghost" id="gdskip">Passer</button>'}${last ? '<button class="btn" id="gdgo">Commencer</button>' : '<button class="btn" id="gdn">Suivant →</button>'}</div></div>`;
    $('#gdx', el).onclick = close; $$('.gd-dots button', el).forEach(b => b.onclick = () => { i = +b.dataset.k; draw(); });
    $('#gdp', el)?.addEventListener('click', () => { i--; draw(); }); $('#gdn', el)?.addEventListener('click', () => { i++; draw(); }); $('#gdskip', el)?.addEventListener('click', close);
    $('#gdgo', el)?.addEventListener('click', () => { close(); location.hash = st.href; }); $('.gd-btns .btn:last-child', el).focus(); };
  draw();
}
views.guide = async () => ({ title: 'Guide', html: `
  <h1 class="h1">${lbls('Guide de prise en main')}</h1><span class="hand">Comment utiliser la plateforme, pas à pas.</span>
  <div class="btns" style="justify-content:flex-start;margin:22px 0"><button class="btn" id="gdstart">${ic('play')} Lancer le tutoriel</button></div>
  <div class="gd-grid">${GUIDE.map((st, i) => `<article class="gd-step"><div class="gd-ico">${ic(st.ic)}</div><small class="gd-n">Étape ${i + 1}</small><h3>${st.t}</h3>${st.p.map(x => `<p>${x}</p>`).join('')}${st.href ? `<a class="btn ghost sm" href="${st.href}">Y aller →</a>` : ''}</article>`).join('')}</div>`,
  after() { $('#gdstart').onclick = () => tourGuide(0); } });

/* ---------- Mon espace : mission du jour, défis du jour, mot du jour (accueil d'Excellence) ---------- */
const hashJ = t => { let h = 7; for (const c of String(t)) h = (h * 33 + c.charCodeAt(0)) >>> 0; return h; };
const auj_ = () => new Date().toLocaleDateString('sv');
const sommeJ = a => a.reduce((x, y) => x + y, 0);
const DEFIS = [
  { id: 'flash', ic: 'layers', txt: 'Réviser 10 flashcards', xp: 30, max: 10, href: '#/flashcards/run', prog: h => Math.min(10, sommeJ(h.filter(x => x.type === 'flash').map(x => x.n))) },
  { id: 'quiz', ic: 'circle-check', txt: 'Réussir un quiz à 70 %', xp: 40, max: 1, href: '#/quiz/run', prog: h => h.some(x => x.type === 'quiz' && x.max && x.score / x.max >= .7) ? 1 : 0 },
  { id: 'game', ic: 'gamepad-2', txt: 'Jouer à un jeu', xp: 25, max: 1, href: '#/jeux', prog: h => h.some(x => x.type === 'game') ? 1 : 0 },
  { id: 'exo', ic: 'pencil-line', txt: 'Finir une série d\'exercices', xp: 30, max: 1, href: '#/exercices', prog: h => h.some(x => x.type === 'exo') ? 1 : 0 },
  { id: 'weak', ic: 'target', txt: 'Refaire un quiz « points faibles »', xp: 40, max: 1, href: '#/quiz/run?faibles=1', prog: h => h.some(x => x.type === 'quiz' && x.faibles) ? 1 : 0 },
  { id: 'defi', ic: 'rocket', txt: 'Marquer 60 points au Défi 60 s', xp: 40, max: 1, href: '#/jeux/defi', prog: h => h.some(x => x.type === 'game' && x.game === 'defi' && x.score >= 60) ? 1 : 0 },
];
function defisDuJour(weak) {
  const d = auj_(), H = ET.history.filter(h => new Date(h.t).toLocaleDateString('sv') === d);
  return DEFIS.filter(x => x.id !== 'weak' || weak).sort((a, b) => hashJ(d + a.id) - hashJ(d + b.id)).slice(0, 3).map(x => { const p = x.prog(H); return { ...x, p, done: p >= x.max }; });
}
const carteMot = d => d ? `<div class="wotd-in"><span class="lbl l2 wl">Mot du jour</span><h3 class="wterm"><span class="lbl l1">${esc(d.terme)}</span></h3><p>${esc(d.definition)}</p><small class="wsrc">${esc(d.pk.court || d.pk.titre)}</small></div>` : '';
async function monEspace() {
  const packs = await chargerTousCours(), toutes = cartesDeCours(packs, ''), due = toutes.filter(estDue).length, weak = Object.keys(ET.errors).length, serie = serieJours();
  const defs = packs.flatMap(pk => pk.chapitres.flatMap(c => (c.definitions || []).map(d => ({ ...d, pk })))), defis = defisDuJour(weak > 0);
  const prochain = packs.filter(pk => ET.examDates[pk.id]).map(pk => ({ pk, n: ecartJ(new Date(), parseJ(ET.examDates[pk.id])) })).filter(x => x.n >= 0).sort((a, b) => a.n - b.n)[0];
  const html = `<section class="mission"><h2 class="sec"><span class="lbl l2">Ta mission du jour</span></h2>
      <div class="notes"><a class="mnote n1" href="#/flashcards/run"><b>${due}</b><span>carte${due > 1 ? 's' : ''} à réviser</span><small>${due ? 'c\'est parti !' : 'tout est à jour'}</small></a>
        <a class="mnote n2" href="#/progres">${ic('flame')}<b>${serie}</b><span>jour${serie > 1 ? 's' : ''} de suite</span><small>${serie ? 'ne casse pas la série' : 'lance ta série !'}</small></a>
        <a class="mnote n3" href="#/planning">${ic('calendar-days')}<b>${prochain ? 'J−' + prochain.n : '?'}</b><span>${prochain ? esc(prochain.pk.court || prochain.pk.titre) : 'prochain examen'}</span><small>${prochain ? 'ouvre ton plan' : 'ajoute une date'}</small></a></div>
      <div class="cta"><div class="coachbox"></div>
        <div class="ctabtns"><a class="btn" href="#/flashcards/run">Lancer la session du jour</a>${weak ? `<a class="btn ghost" href="#/quiz/run?faibles=1">Mes points faibles (${weak})</a>` : ''}<a class="btn ghost" href="#/examen">Examen blanc</a><a class="btn ghost" href="#/olympiade">Olympiade blanche</a></div></div></section>
    <section class="quests"><h2 class="sec"><span class="lbl l6">Défis du jour</span></h2><div class="qlist">${defis.map(x => `<a class="quest ${x.done ? 'done' : ''}" href="${x.href}"><span class="qi">${ic(x.done ? 'check' : x.ic)}</span><span class="qt"><b>${esc(x.txt)}</b><small>${x.max > 1 ? `${x.p} / ${x.max}` : (x.done ? 'fait !' : 'à faire')} · +${x.xp} pts</small></span>${x.done ? '<em class="qstamp">FAIT</em>' : ''}</a>`).join('')}</div></section>
    <section class="duo"><div class="wotd" id="wotd">${carteMot(defs[hashJ(auj_()) % (defs.length || 1)])}<button class="btn ghost sm" id="nw">${ic('refresh-cw')} Un autre mot</button></div></section>`;
  const bonus = (ET.bonus ||= {});
  if (defis.length === 3 && defis.every(x => x.done) && !bonus[auj_()]) { bonus[auj_()] = 1; log('bonus', { xp: 50 }); setTimeout(() => { E.confetti(160); E.sfx.win(); }, 500); }
  return { html, defs };
}

/* ---------- Annuaire des acteurs : institutions, organismes centraux, intermédiaires, intervenants, émetteurs ---------- */
let annuaireCache = null;
const chargerAnnuaire = async () => annuaireCache ||= await fetch('/data/annuaire.json').then(r => r.json());
const GROUPES = [
  ['institutions', 'Institutions', ['regulateur', 'organisme-central', 'cooperation'], 'Le régulateur, la bourse, le dépositaire central, la banque de règlement et les institutions partenaires.'],
  ['societes-de-bourse', 'Sociétés de bourse', ['societe-de-bourse'], 'Les seules sociétés habilitées à négocier à la BVMAC : elles reçoivent vos ordres d\'achat et de vente. Chaque société est agréée par la COSUMAF.'],
  ['gestion', 'Sociétés de gestion', ['sgo'], 'Elles créent et gèrent les fonds (OPC), choisissent les placements et publient les informations périodiques. Les actifs sont gardés par un dépositaire indépendant.'],
  ['conseil', 'Conseil et autres intermédiaires', ['cif', 'psan', 'financement-participatif', 'etablissement-credit', 'intermediaire'], 'Conseillers en investissements financiers, établissements de crédit teneurs de comptes, prestataires sur actifs numériques et financement participatif.'],
  ['intervenants', 'Intervenants', ['cac', 'analyste', 'agence-notation', 'organisme-garantie', 'listing-sponsor', 'intervenant'], 'Commissaires aux comptes, analystes, agences de notation, organismes de garantie : ils apportent expertise indépendante et contrôle de qualité.'],
  ['emetteurs', 'Émetteurs', ['emetteur'], 'Les États, collectivités et sociétés qui lèvent des fonds sur le marché.'],
];
const TYPE_ACTEUR = { regulateur: 'Régulateur', 'organisme-central': 'Organisme central', cooperation: 'Institution partenaire', 'societe-de-bourse': 'Société de bourse', sgo: 'Société de gestion d\'OPC', cif: 'Conseiller en investissements financiers', psan: 'Prestataire sur actifs numériques', 'financement-participatif': 'Conseiller en financement participatif', 'etablissement-credit': 'Établissement de crédit agréé', intermediaire: 'Intermédiaire', cac: 'Commissaire aux comptes', analyste: 'Analyste financier', 'agence-notation': 'Agence de notation', 'organisme-garantie': 'Organisme de garantie', 'listing-sponsor': 'Listing sponsor', intervenant: 'Intervenant', emetteur: 'Émetteur' };
const COURS_TYPE = { 'societe-de-bourse': ['p6-intermediaires', 'p5-ordre-denouement'], sgo: ['p7-fonds', 'p6-intermediaires'], cif: ['p6-intermediaires'], 'etablissement-credit': ['p5-ordre-denouement'], cac: ['p2-appel-public'], 'agence-notation': ['p2-appel-public'], 'organisme-garantie': ['p2-appel-public'], emetteur: ['p2-appel-public', 'p1-entrer-en-bourse'], regulateur: ['p0-cadre'], cooperation: ['p0-cadre'] };
const initiales = n => String(n).replace(/[^A-Za-zÀ-ÿ ]/g, ' ').split(/\s+/).filter(w => w.length > 1 && !/^(de|du|des|la|le|les|et|sa|sarl|sas)$/i.test(w)).slice(0, 2).map(w => w[0].toUpperCase()).join('') || '?';
const teinte = n => ['#ffe14a', '#ffb8d1', '#a9f0d0', '#bcd7ff', '#ffd3a3', '#d9c8ff'][hashJ(n) % 6];
const SANS_LOGO = ['cosumaf', 'bvmac'];
const logoActeur = (a, cls = '') => a.logo && !SANS_LOGO.includes(a.id) ? `<img class="alogo ${cls}" src="${esc(a.logo)}" alt="Logo ${esc(a.nomCourt || a.nom)}" width="${cls === 'grand' ? 104 : 68}" height="${cls === 'grand' ? 104 : 68}" loading="lazy" decoding="async" fetchpriority="low">` : `<span class="alogo ini ${cls}" style="background:${teinte(a.nom)}" aria-hidden="true">${esc(initiales(a.nomCourt || a.nom))}</span>`;
const photoDir = d => d.photo ? `<img class="aphoto" src="${esc(d.photo)}" alt="${esc(d.nom)}" loading="lazy" decoding="async" fetchpriority="low">` : `<span class="aphoto ini" style="background:${teinte(d.nom)}" aria-hidden="true">${esc(initiales(d.nom))}</span>`;
const dateFr = d => d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
const carteActeur = a => `<li><a class="card acteur" href="#/acteurs/${a.id}">${logoActeur(a)}<span class="an"><b>${esc(a.nomCourt || a.nom)}</b>${a.nomCourt ? `<small>${esc(a.nom.replace(/^[^:]*:\s*/, ''))}</small>` : ''}<small>${esc([a.ville, a.pays].filter(Boolean).join(', '))}</small>${a.dirigeants?.[0] ? `<small class="dg">${esc(a.dirigeants[0].titre)} : ${esc(a.dirigeants[0].nom)}</small>` : ''}</span></a></li>`;

/* ---------- Les acteurs : un parcours en 9 étapes, avec l'épargnante comme fil conducteur ---------- */
let parcoursCache = null, guidesMeta = null;
const chargerParcours = async () => parcoursCache ||= await fetch('/data/parcours-acteurs.json').then(r => r.json());
const chargerGuidesMeta = async () => guidesMeta ||= await fetch('/data/guides-meta.json').then(r => r.json());
const encartAmina = (txt, cls = '') => `<div class="amina ${cls}"><p>${md(txt)}</p></div>`;
const blocActeurs = (A, spec) => {
  if (!spec) return '';
  const liste = (spec.ids ? spec.ids.map(id => A.find(a => a.id === id)) : A.filter(a => spec.types.includes(a.type))).filter(Boolean);
  if (!liste.length) return '';
  const cartes = l => `<ul class="list acteurs">${l.map(carteActeur).join('')}</ul>`;
  let corps;
  if (spec.groupePar === 'pays') {
    const groupes = {}; liste.forEach(a => (groupes[a.pays || 'Autre'] ||= []).push(a));
    corps = Object.entries(groupes).sort((x, y) => y[1].length - x[1].length).map(([pays, l], i) => `<details class="gp" ${i === 0 && !spec.repli ? 'open' : ''}><summary><b>${esc(pays)}</b> <span class="badge">${l.length}</span></summary>${cartes(l)}</details>`).join('');
  } else corps = cartes(liste);
  const entete = `<h3 class="sous"><span class="lbl l3">${esc(spec.titre || '')}</span> <small>${liste.length}</small></h3>${spec.intro ? `<p class="onmat intro">${esc(spec.intro)}</p>` : ''}`;
  return spec.repli ? `<details class="repli">${`<summary>${entete}<span class="voir">Afficher la liste</span></summary>`}${corps}</details>` : `${entete}${corps}`;
};
const CHAINE = `<div class="chaine" role="img" aria-label="Le parcours d'un ordre de bourse : l'épargnant, la société de bourse, la BVMAC, le dépositaire central et la BEAC, sous le contrôle de la COSUMAF">
  <div class="ch-top"><b>COSUMAF</b><span>régule, agrée, sanctionne</span></div>
  <div class="ch-row"><div class="ch-n"><b>L'épargnante</b><span>donne son ordre</span></div><i>→</i><div class="ch-n"><b>Société de bourse</b><span>reçoit et transmet</span></div><i>→</i><div class="ch-n"><b>BVMAC</b><span>rapproche acheteurs et vendeurs</span></div><i>→</i><div class="ch-n"><b>Dépositaire central</b><span>livre les titres</span></div><i>+</i><div class="ch-n"><b>BEAC</b><span>règle les espèces</span></div></div>
  <div class="ch-bas"><span>Sociétés de gestion</span><span>Conseillers</span><span>Commissaires aux comptes</span><span>Émetteurs</span></div></div>`;
async function parcoursActeurs(A, q) {
  const PA = await chargerParcours(), E_ = PA.etapes;
  const total = A.length;
  return { title: 'Les acteurs du marché financier de la CEMAC : le parcours d\'une épargnante', html: `
    <h1 class="h1">${lbls('Les acteurs')}</h1><span class="hand">Suivez l'argent d'une épargnante, de l'idée au titre inscrit en compte</span>
    <div class="sheet presentation"><div><p>${md(PA.heroine.presentation)}</p><p class="small muted" style="margin-top:8px"><a href="#/acteurs/annuaire">Chercher un acteur précis dans l'annuaire complet</a> · <a href="#/decouvrir">Suivre le parcours d'une épargnante dans les chapitres Découvrir</a></p></div></div>
    <nav class="rail" aria-label="Les étapes du parcours">${E_.map(e => `<a href="#/acteurs?e=${e.n}" data-etape="${e.n}"><span>${e.n}</span><small>${esc(e.court)}</small></a>`).join('')}</nav>
    ${E_.map((e, i) => `<section class="etape" id="etape-${e.n}">
      <header class="eh"><span class="nn">${e.n}</span><div><small>Étape ${e.n} sur ${E_.length}</small><h2>${esc(e.titre)}</h2><p>${esc(e.accroche)}</p></div></header>
      ${encartAmina(e.histoire)}
      <div class="sheet texte">${e.texte.map(t => `<p>${md(t)}</p>`).join('')}</div>
      ${e.chiffres ? `<div class="chiffres">${e.chiffres.map(x => `<div class="card chf"><b>${esc(String(x.v).replace('{{total}}', total))}</b><span>${esc(x.l)}</span></div>`).join('')}</div>` : ''}
      ${e.chaine ? CHAINE : ''}
      ${e.pour_amina ? `<div class="pouramina"><b>En pratique</b><p>${esc(e.pour_amina)}</p></div>` : ''}
      ${blocActeurs(A, e.acteurs)}${blocActeurs(A, e.acteurs2)}
      ${e.faits ? `<details class="textes"><summary>${ic('file-text')} Ce que disent les textes</summary><div class="facts">${e.faits.map(id => D.parId.get(id)).filter(Boolean).map(f => factHtml(f, true)).join('')}</div></details>` : ''}
      <div class="banner info retenir">${ic('lightbulb')}<div><strong>À retenir.</strong> ${esc(e.retenir)}</div></div>
      <p class="etape-actions">${e.cta ? `<a class="btn ghost" href="${esc(e.cta.href)}">${ic('arrow-right')} ${esc(e.cta.label)}</a>` : ''}${e.cta2 ? `<a class="btn" href="${esc(e.cta2.href)}" target="_blank" rel="noopener">${ic('external-link')} ${esc(e.cta2.label)}</a>` : ''}</p>
      ${E_[i + 1] ? `<a class="suite" href="#/acteurs?e=${E_[i + 1].n}"><small>Étape suivante</small><b>${esc(E_[i + 1].titre)}</b><span>${ic('arrow-right')}</span></a>` : `<a class="suite" href="#/acteurs/annuaire"><small>Pour aller plus loin</small><b>Rechercher un acteur dans l'annuaire complet</b><span>${ic('arrow-right')}</span></a>`}
    </section>`).join('')}`,
    after() {
      fond(MAT.acteurs);
      const aller = n => $('#etape-' + n)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      $$('.rail a, .suite').forEach(a => a.addEventListener('click', e => { const m = /e=(\d+)/.exec(a.getAttribute('href')); if (m) { e.preventDefault(); history.replaceState(null, '', '#/acteurs?e=' + m[1]); aller(m[1]); } }));
      if (q.e) setTimeout(() => aller(q.e), 350);
      const obs = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { const n = en.target.id.replace('etape-', ''); $$('.rail a').forEach(a => a.classList.toggle('on', a.dataset.etape === n)); } }), { rootMargin: '-30% 0px -60% 0px' });
      $$('.etape').forEach(x => obs.observe(x));
    } };
}

views.acteurs = async ([id], q) => {
  const A = await chargerAnnuaire();
  if (id && id !== 'annuaire') {
    const a = A.find(x => x.id === id); if (!a) return views.introuvable();
    const PA_ = await chargerParcours(); const idxC = await chargerCoursIdx(), liens = a.liens || { cours: COURS_TYPE[a.type] || [], textes: [] };
    const cours = (liens.cours || []).map(cid => idxC.find(c => c.id === cid)).filter(Boolean), textes = (liens.textes || []).map(T).filter(Boolean);
    const ligne = (ic_, t, v) => v ? `<div class="ligne">${ic(ic_)}<span><small>${t}</small>${v}</span></div>` : '';
    const groupe = GROUPES.find(g => g[2].includes(a.type));
    return { title: `${a.nomCourt || a.nom} : ${TYPE_ACTEUR[a.type]}`, html: `
      <div class="crumbs"><a href="#/acteurs">Acteurs</a> ${ic('chevron-right')} ${groupe ? `<a href="#/acteurs${qs({ g: groupe[0] })}">${groupe[1]}</a> ${ic('chevron-right')} ` : ''}<span>${esc(a.nomCourt || a.nom)}</span></div>
      <header class="doc-head afiche"><div class="aentete">${logoActeur(a, 'grand')}<div><span class="badge">${TYPE_ACTEUR[a.type]}${a.categorie && a.categorie !== TYPE_ACTEUR[a.type] ? ' · ' + esc(a.categorie) : ''}</span><h1 class="h1" style="margin:10px 0 6px">${lbls(a.nomCourt || a.nom)}</h1>${a.nomCourt ? `<p class="full">${esc(a.nom.replace(/^[^:]*:\s*/, ''))}</p>` : ''}</div></div></header>
      ${a.description ? `<div class="sheet"><p>${esc(a.description)}</p></div>` : (PA_.textes_type[a.type] ? `<div class="sheet"><p>${esc(PA_.textes_type[a.type])}</p></div>` : '')}
      ${PA_.etape_type[a.type] ? `<a class="suite place" href="#/acteurs?e=${PA_.etape_type[a.type]}"><small>Sa place dans le parcours d'une épargnante</small><b>Étape ${PA_.etape_type[a.type]} : ${esc(PA_.etapes[PA_.etape_type[a.type] - 1].titre)}</b><span>${ic('arrow-right')}</span></a>` : ''}
      ${a.dirigeants?.length ? `<h2 class="sec"><span class="lbl l2">Direction</span></h2><div class="dirigeants">${a.dirigeants.map(d => `<div class="card dir">${photoDir(d)}<div><b>${esc(d.nom)}</b><small>${esc(d.titre)}${d.depuis ? ' · depuis ' + esc(d.depuis) : ''}</small>${d.note ? `<small class="note">${esc(d.note)}</small>` : ''}</div></div>`).join('')}</div>` : ''}
      <h2 class="sec"><span class="lbl l6">Informations</span></h2>
      <div class="sheet infos">${ligne('scale', 'Numéro d\'agrément', a.agrement ? `${esc(a.agrement.numero)}${a.agrement.date ? ' · ' + dateFr(a.agrement.date) : ''}` : '')}${ligne('library', 'Siège', esc([a.ville, a.pays].filter(Boolean).join(', ')))}${ligne('book-open', 'Adresse', esc(a.adresse || ''))}${ligne('message-circle', 'Téléphone', esc(a.tel || ''))}${ligne('link', 'E-mail', a.email ? `<a href="mailto:${esc(a.email)}">${esc(a.email)}</a>` : '')}${ligne('external-link', 'Site web', a.site ? `<a href="${esc(a.site)}" target="_blank" rel="noopener">${esc(a.site.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, ''))}</a>` : '')}${a.secteur ? ligne('activity', 'Secteur', esc(a.secteur)) : ''}${a.faits ? a.faits.map(f => `<div class="ligne">${ic('lightbulb')}<span>${esc(f)}</span></div>`).join('') : ''}</div>
      ${cours.length || textes.length ? `<h2 class="sec"><span class="lbl l1">Pour comprendre</span></h2><div class="chips">${cours.map(c => `<a class="btn ghost sm" href="#/cours/${c.id}">${ic('graduation-cap')} Cours : ${esc(c.court)}</a>`).join('')}${textes.map(t => `<a class="btn ghost sm" href="#/texte/${t.id}">${ic('file-text')} ${esc(shortName(t))}</a>`).join('')}</div>` : ''}
      ${a.agrement ? `<div class="banner info" style="margin-top:28px">${ic('shield-check')}<div>Avant de confier de l'argent, vérifiez l'agrément sur le site de la COSUMAF : <a href="https://cosumaf.org/verifier-un-agrement" target="_blank" rel="noopener">vérifier un agrément</a>.</div></div>` : ''}
      <p class="small onmat" style="margin-top:26px">Source : <a href="${esc(a.source.url)}" target="_blank" rel="noopener" style="color:var(--y)">${esc(a.source.nom)}</a>. Logo${a.dirigeants?.some(d => d.photo) ? ' et photo' : ''} reproduits depuis les sites officiels, à des fins d'identification ; ils restent la propriété de leurs titulaires. Données relevées le 25 novembre 2026 : <button class="linkbtn" data-copy="${esc(`Erreur signalée sur l'acteur « ${a.nom} » : `)}">signaler une erreur</button>.</p>`,
      after() { fond(MAT.acteurs); } };
  }
  if (id !== 'annuaire' && !q.g && !q.p && !q.q) return parcoursActeurs(A, q);
  const g = GROUPES.find(x => x[0] === q.g) ? q.g : '', pays_ = q.p || '', mot = q.q || '';
  const filtre = mot => A.filter(a => (!g || GROUPES.find(x => x[0] === g)[2].includes(a.type)) && (!pays_ || a.pays === pays_) && (!mot || fold(a.nom + ' ' + (a.dirigeants || []).map(d => d.nom).join(' ') + ' ' + (a.ville || '')).includes(fold(mot))));
  const paysListe = [...new Set(A.map(a => a.pays).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'fr'));
  const grp = GROUPES.find(x => x[0] === g);
  const vedettes = A.filter(a => ['cosumaf', 'bvmac'].includes(a.id));
  return { title: 'Les acteurs du marché financier de la CEMAC', html: `
    <h1 class="h1">${lbls('Les acteurs')}</h1><span class="hand">Qui fait quoi sur le marché : institutions, intermédiaires, émetteurs</span>
    <div class="vedettes">${vedettes.map(a => `<a class="card vedette" href="#/acteurs/${a.id}">${logoActeur(a, 'grand')}<div><small>${TYPE_ACTEUR[a.type]}</small><b>${esc(a.nomCourt)}</b>${a.dirigeants?.[0] ? `<span class="vdir">${photoDir(a.dirigeants[0])}<span>${esc(a.dirigeants[0].nom)}<small>${esc(a.dirigeants[0].titre)}</small></span></span>` : ''}</div></a>`).join('')}</div>
    <form class="sbar shelfsearch" id="af" role="search" style="margin-bottom:26px"><span class="sico">${ic('search')}</span><input id="aq" type="search" value="${esc(mot)}" placeholder="Chercher un acteur, un dirigeant, une ville…" autocomplete="off" aria-label="Chercher un acteur"></form>
    <nav class="tabsrow" aria-label="Catégories"><a class="chip" aria-pressed="${!g}" href="#/acteurs">Tous (${A.length})</a>${GROUPES.map(([k, n, ts]) => `<a class="chip" aria-pressed="${g === k}" href="#/acteurs${qs({ g: k, p: pays_ })}">${n} (${A.filter(a => ts.includes(a.type)).length})</a>`).join('')}</nav>
    ${grp ? `<p class="onmat" style="max-width:760px;margin:-8px 0 18px">${esc(grp[3])}</p>` : ''}
    <div class="mini" style="margin-bottom:20px"><label>Pays<select id="ap"><option value="">Tous</option>${paysListe.map(x => `<option ${x === pays_ ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select></label></div>
    <p class="count" id="ac" aria-live="polite"></p><ul class="list acteurs" id="al"></ul>
    <div class="banner info" style="margin-top:34px">${ic('shield-check')}<div>Listes officielles de la COSUMAF et de la BVMAC, relevées le 25 novembre 2026. Pour vérifier l'agrément d'un acteur, utilisez le service de la COSUMAF : <a href="https://cosumaf.org/verifier-un-agrement" target="_blank" rel="noopener">vérifier un agrément</a>.</div></div>`,
    after() {
      fond(MAT.acteurs);
      const maj = () => { const l = filtre($('#aq').value); $('#ac').textContent = `${l.length} acteur${l.length > 1 ? 's' : ''}`; $('#al').innerHTML = l.length ? l.map(carteActeur).join('') : '<li class="empty">Aucun acteur ne correspond.</li>'; };
      $('#aq').addEventListener('input', e => { history.replaceState(null, '', '#/acteurs' + qs({ g, p: pays_, q: e.target.value })); maj(); });
      $('#af').addEventListener('submit', e => e.preventDefault());
      $('#ap').addEventListener('change', e => { location.hash = '#/acteurs' + qs({ g, p: e.target.value, q: $('#aq').value }); });
      maj();
    } };
};

/* ---------- Jeux (repris de la plateforme Excellence) ---------- */
const GAMES = {
  memory: { ico: 'layers', nom: 'Memory', desc: 'Retrouve les paires terme ↔ définition le plus vite possible.', unit: 'coups', low: true },
  vf: { ico: 'zap', nom: 'Vrai/Faux éclair', desc: '60 secondes, 3 vies. Vrai ou piège ?', unit: 'pts' },
  pendu: { ico: 'spell-check', nom: 'Mot mystère', desc: 'Devine le terme à partir de sa définition (comme au pendu).', unit: 'pts' },
  defi: { ico: 'rocket', nom: 'Défi 60 secondes', desc: 'QCM en rafale : combos, points… bats ton record.', unit: 'pts' },
  ordre: { ico: 'list-ordered', nom: 'Dans l\'ordre !', desc: 'Classe les délais ou les montants du plus petit au plus grand.', unit: 'pts' },
};
const coeur = (n, total) => Array.from({ length: total }, (_, i) => i < n ? ic('heart', 'fill heartOn') : ic('heart', 'heartOff')).join('');
const meilleur = (k, v, bas = false) => { const [game, c] = k.split(':'); log('game', { game, course: c === 'all' ? '' : c, score: v, xp: 20 }); const cur = ET.scores[k]; if (cur == null || (bas ? v < cur : v > cur)) { ET.scores[k] = v; sauver(); return true; } return false; };
const court = (t, n = 90) => t.length <= n ? t : t.slice(0, n - 1).replace(/\s+\S*$/, '') + '…';
const defsDe = th => D.faits.filter(f => f.y === 'definition' && T(f.t).statut !== 'abroge' && (!th || f.h === th)).map(f => ({ terme: f.q, definition: f.v, f }));
const habiller = (inner, back, titre) => `<div class="gamewrap"><div class="ex-head"><a href="${back}">← Quitter</a><span>${titre}</span></div>${inner}</div>`;
const pasAssez = (app, back, titre) => { app.innerHTML = habiller('<p class="onmat">Pas assez de contenu pour ce choix. Essaie « Tous les thèmes ».</p>', back, titre); };

views.jeux = async (a, q) => {
  await chargerTousCours();
  const th = D.themes.has(q.theme) ? q.theme : '';
  const jeu = { memory, vf: vfGame, pendu, defi, ordre: ordreGame }[a[0]];
  if (jeu) return { title: GAMES[a[0]].nom, html: '<div id="gm"></div>', after() { jeu(th, $('#app')); } };
  return { title: 'Jeux', html: `
    <h1 class="h1">${lbls('Jeux')}</h1><span class="hand">Apprendre sans s'en rendre compte. Choisis un thème puis un jeu.</span>
    <div class="filters" style="margin-top:22px;max-width:420px"><label class="field">Thème<select id="gt">${options(themesOpts(), th, 'Tous les thèmes')}</select></label></div>
    <div class="tiles">${Object.entries(GAMES).map(([k, g]) => { const sc = ET.scores[k + ':' + (th || 'all')];
      return `<a class="tile" href="#/jeux/${k}${qs({ theme: th })}"><span class="ico">${ic(g.ico)}</span><h3>${g.nom}</h3><p>${g.desc}</p><small>${sc != null ? `Record : <b>${sc} ${g.unit}</b>` : 'Pas encore joué'}</small></a>`; }).join('')}
      <a class="tile" href="#/exercices"><span class="ico">${ic('pencil-line')}</span><h3>Exercices</h3><p>Trous, calculs, classements : on s'entraîne pour de vrai.</p><small>Voir les exercices →</small></a>
      <a class="tile" href="#/olympiade"><span class="ico">${ic('trophy')}</span><h3>Olympiade blanche</h3><p>Quatre manches chronométrées, points et bonus de vitesse.</p><small>${ET.olymp.length ? ET.olymp.length + ' jouée' + (ET.olymp.length > 1 ? 's' : '') : 'Pas encore jouée'}</small></a>
      <a class="tile" href="#/examen"><span class="ico">${ic('clipboard-check')}</span><h3>Examen blanc</h3><p>Chrono, note sur 20 et correction détaillée.</p><small>${ET.exams.length ? ET.exams.length + ' passé' + (ET.exams.length > 1 ? 's' : '') : 'Pas encore passé'}</small></a></div>`,
    after() { $('#gt').addEventListener('change', e => { location.hash = '#/jeux' + qs({ theme: e.target.value }); }); } };
};

function memory(th, app) {
  const back = '#/jeux' + qs({ theme: th });
  let defs = defsDe(th).filter(d => d.definition.length <= 120); if (defs.length < 6) defs = defsDe(th);
  const pairs = shuffle(defs).slice(0, 6);
  if (pairs.length < 4) return pasAssez(app, back, 'Memory');
  const cartes = shuffle(pairs.flatMap((d, i) => [{ id: i, t: d.terme, kind: 'terme' }, { id: i, t: court(d.definition), kind: 'def' }]));
  let open = [], moves = 0, found = 0, lock = false; const t0 = Date.now(); E.coach.show();
  app.innerHTML = habiller(`<p class="onmat">Trouve les 6 paires terme ↔ définition.</p><div class="stats-row"><span>Coups : <b id="mv">0</b></span><span>Temps : <b id="tm">0</b> s</span></div>
    <div class="memgrid">${cartes.map((c, i) => `<button class="memcard" data-i="${i}"><span class="face front">?</span><span class="face back ${c.kind}">${esc(c.t)}</span></button>`).join('')}</div><div id="end"></div>`, back, 'Memory');
  const tick = setInterval(() => { if (!$('#tm')) return clearInterval(tick); $('#tm').textContent = Math.round((Date.now() - t0) / 1000); }, 500);
  $$('.memcard').forEach(b => b.onclick = () => {
    if (lock || b.classList.contains('flip') || b.classList.contains('done')) return;
    b.classList.add('flip'); open.push(b); E.sfx.flip();
    if (open.length === 2) {
      moves++; $('#mv').textContent = moves; const [x, y] = open.map(o => cartes[+o.dataset.i]);
      if (x.id === y.id && x.kind !== y.kind) { open.forEach(o => o.classList.add('done')); open = []; found++; touchDay(1); E.coach.react(true, found >= 3 ? found : 0);
        if (found === pairs.length) { clearInterval(tick); const sec = Math.round((Date.now() - t0) / 1000); const rec = meilleur('memory:' + (th || 'all'), moves, true); E.confetti(); E.coach.win('Toutes les paires !');
          $('#end').innerHTML = `<div class="done">${E.cheer(.9)}<h1>Bravo !</h1><p>${moves} coups en ${sec} s ${rec ? '— <b>nouveau record</b> !' : ''}</p><div class="btns"><a class="btn" href="#/jeux/memory${qs({ theme: th, r: Date.now() })}">Rejouer</a><a class="btn ghost" href="${back}">Autres jeux</a></div></div>`; } }
      else { lock = true; E.sfx.tick(); setTimeout(() => { open.forEach(o => o.classList.remove('flip')); open = []; lock = false; }, 900); }
    }
  });
}

function genVF(th, n) {
  const base = poolQuiz(); const pool = base.filter(x => !th || x.h === th); const out = [];
  for (const x of shuffle(pool).slice(0, n)) {
    const vrai = Math.random() < .5; let val = x.v;
    if (!vrai) { const autres = base.filter(g => g.y === x.y && fold(g.v) !== fold(x.v) && (!x.u || g.u === x.u)); if (!autres.length) continue; val = shuffle(autres)[0].v; }
    out.push({ enonce: `${esc(x.q)} <b>${esc(val)}</b>`, vrai, explication: `${esc(x.q)} <b>${esc(x.v)}</b> (${esc(x.a || '')} ${esc(citation(T(x.t)))})` });
  }
  return out;
}
function vfGame(th, app) {
  const back = '#/jeux' + qs({ theme: th });
  const pool = genVF(th, 80); if (pool.length < 5) return pasAssez(app, back, 'Vrai/Faux');
  let i = 0, score = 0, lives = 3, left = 60, over = false, serie = 0; const wrongs = []; E.coach.show();
  app.innerHTML = habiller(`<div class="stats-row"><span>${ic('timer')} <b id="tl">60</b> s</span><span id="lv" class="hearts">${coeur(3, 3)}</span><span>Score : <b id="sc">0</b></span></div>
    <div class="ex-card"><div class="ex-stmt big" id="st"></div><div class="ex-vf"><button class="ex-opt" id="bv">${ic('check')} Vrai <small>(V)</small></button><button class="ex-opt" id="bf">${ic('x')} Faux <small>(F)</small></button></div><p id="fbk" class="flash-fb"></p></div><div id="end"></div>`, back, 'Vrai/Faux éclair');
  const next = () => { $('#st').innerHTML = pool[i % pool.length].enonce; };
  const finish = () => { if (over) return; over = true; clearInterval(timer); E.touches = null; const rec = meilleur('vf:' + (th || 'all'), score); E.confetti(score >= 8 ? 130 : 50); E.coach.win(score + ' point' + (score > 1 ? 's' : '') + ' !');
    $('#end').innerHTML = `<div class="done">${E.cheer(.9)}<h1>${score} point${score > 1 ? 's' : ''}</h1><p>${rec ? ic('medal') + ' Nouveau record !' : 'Continue, tu progresses.'}</p>${wrongs.length ? `<div class="review">${wrongs.slice(0, 5).map(w => `<div class="it">${w}</div>`).join('')}</div>` : ''}<div class="btns"><a class="btn" href="#/jeux/vf${qs({ theme: th, r: Date.now() })}">Rejouer</a><a class="btn ghost" href="${back}">Autres jeux</a></div></div>`; $('#bv').disabled = $('#bf').disabled = true; };
  const answer = v => { if (over) return; const it = pool[i % pool.length]; const ok = v === it.vrai; touchDay(1); serie = ok ? serie + 1 : 0; E.coach.react(ok, serie);
    { const card = $('.ex-card'); card.classList.remove('slideL', 'slideR', 'shake'); void card.offsetWidth; card.classList.add(ok ? (v ? 'slideL' : 'slideR') : 'shake'); }
    if (ok) { score++; $('#fbk').textContent = 'Bien vu !'; $('#fbk').className = 'flash-fb good'; } else { lives--; wrongs.push(it.enonce + '<br><i>' + it.explication + '</i>'); $('#fbk').textContent = 'Raté'; $('#fbk').className = 'flash-fb bad'; }
    $('#sc').textContent = score; $('#lv').innerHTML = coeur(Math.max(0, lives), 3); i++; if (lives <= 0) return finish(); next(); };
  $('#bv').onclick = () => answer(true); $('#bf').onclick = () => answer(false);
  E.touches = e => { const k = e.key.toLowerCase(); if (k === 'v' || k === 'arrowleft') answer(true); else if (k === 'f' || k === 'arrowright') answer(false); };
  const timer = setInterval(() => { if (!$('#tl')) return clearInterval(timer); left--; $('#tl').textContent = left; if (left <= 0) finish(); }, 1000);
  next();
}

function pendu(th, app) {
  const back = '#/jeux' + qs({ theme: th });
  const pool = shuffle(defsDe(th).filter(d => d.terme.length <= 28 && d.terme.length >= 4)).slice(0, 5);
  if (pool.length < 3) return pasAssez(app, back, 'Mot mystère');
  let r = 0, total = 0; E.coach.show();
  const round = () => {
    if (r >= pool.length) { const rec = meilleur('pendu:' + (th || 'all'), total); app.innerHTML = habiller(`<div class="done">${E.cheer(.9)}<h1>${total} points</h1><p>${rec ? ic('medal') + ' Nouveau record !' : 'Pas mal du tout !'}</p><div class="btns"><a class="btn" href="#/jeux/pendu${qs({ theme: th, r: Date.now() })}">Rejouer</a><a class="btn ghost" href="${back}">Autres jeux</a></div></div>`, back, 'Mot mystère'); E.touches = null; return; }
    const d = pool[r]; const word = d.terme; const target = [...fold(word)]; let lives = 7; const guessed = new Set(); let finished = false;
    const isLetter = ch => /[a-z0-9]/.test(fold(ch));
    const won = () => target.every(t => !isLetter(t) || guessed.has(t));
    const draw = () => {
      const shown = [...word].map(ch => { if (!isLetter(ch)) return `<span class="pl sep">${ch === ' ' ? '&nbsp;' : esc(ch)}</span>`; const ok = guessed.has(fold(ch)) || finished; return `<span class="pl ${ok ? 'ok' : ''}">${ok ? esc(ch.toUpperCase()) : ''}</span>`; }).join('');
      const kb = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(l => { const n = l.toLowerCase(); const used = guessed.has(n); const hit = used && target.includes(n); return `<button class="key ${used ? (hit ? 'hit' : 'miss') : ''}" data-l="${n}" ${used || finished ? 'disabled' : ''}>${l}</button>`; }).join('');
      app.innerHTML = habiller(`<div class="stats-row"><span>Mot ${r + 1} / ${pool.length}</span><span class="hearts">${coeur(lives, 7)}</span><span>Score : <b>${total}</b></span></div>
        <div class="ex-card"><p class="muted">Indice — définition :</p><div class="ex-stmt">${esc(d.definition)}</div><div class="word">${shown}</div><div class="kb">${kb}</div>
        <div class="btns" style="justify-content:flex-start"><button class="btn ghost sm" id="hint" ${finished || lives <= 1 ? 'disabled' : ''}>${ic('lightbulb')} Révéler une lettre (−1 vie)</button>${finished ? `<button class="btn sm" id="nx">${r + 1 < pool.length ? 'Mot suivant →' : 'Résultat'}</button>` : ''}</div>
        ${finished ? `<p class="flash-fb ${lives > 0 && won() ? 'good' : 'bad'}">${lives > 0 && won() ? 'Trouvé !' : 'La réponse était : <b>' + esc(word) + '</b>'}</p>` : ''}</div>`, back, 'Mot mystère');
      $$('.key').forEach(b => b.onclick = () => guess(b.dataset.l));
      $('#hint')?.addEventListener('click', hint); $('#nx')?.addEventListener('click', () => { r++; round(); });
    };
    const guess = l => { if (finished || guessed.has(l)) return; guessed.add(l); touchDay(1); if (!target.includes(l)) { lives--; E.sfx.ko(); E.coach.say(lives <= 2 ? 'sad' : 'wow', lives <= 2 ? 'Attention, plus que ' + lives + ' !' : 'Oups, pas celle-là'); } else { E.sfx.ok(); E.coach.say('joy', 'Bonne lettre !'); } check(); };
    const hint = () => { const rest = [...new Set(target.filter(t => isLetter(t) && !guessed.has(t)))]; if (!rest.length || lives <= 1) return; guessed.add(rest[0]); lives--; check(); };
    const check = () => { if (won()) { finished = true; total += Math.max(1, lives); E.confetti(60); E.coach.win('Trouvé !'); } else if (lives <= 0) { finished = true; E.sfx.lose(); E.coach.say('sad', 'C’était : ' + word, 4000); } draw(); };
    E.touches = e => { if (/^[a-z]$/i.test(e.key)) guess(e.key.toLowerCase()); else if (e.key === 'Enter' && finished) { r++; round(); } };
    draw();
  };
  round();
}

function defi(th, app) {
  const back = '#/jeux' + qs({ theme: th });
  const pool = shuffle([...questionsDeCours(tousCours || [], ''), ...questionsDeTextes('', 60)].map(x => x.choix && x.bonne !== undefined ? melanger(x) : x)).slice(0, 150); if (pool.length < 5) return pasAssez(app, back, 'Défi 60 secondes');
  let i = 0, score = 0, combo = 0, left = 60, over = false, good = 0, bad = 0; E.coach.show();
  const pts = (txt, cls) => { const r = $('#host').getBoundingClientRect(), p = document.createElement('span'); p.className = 'pts ' + cls; p.textContent = txt; p.style.cssText = `position:fixed;left:${Math.max(10, r.right - 110)}px;top:${r.top - 6}px`; document.body.appendChild(p); setTimeout(() => p.remove(), 900); };
  app.innerHTML = habiller(`<div class="stats-row"><span class="ringwrap"><svg class="ring" viewBox="0 0 44 44"><circle cx="22" cy="22" r="19" class="bg"/><circle id="rg" cx="22" cy="22" r="19" class="fg"/></svg><b id="tl">60</b></span><span>${ic('flame')} Combo ×<b id="cb">1</b></span><span>Score : <b id="sc">0</b></span></div><div class="ex-card" id="host"></div><p id="fbk" class="flash-fb"></p><div id="end"></div>`, back, 'Défi 60 secondes');
  const show = () => { const it = pool[i % pool.length];
    $('#host').innerHTML = `<p class="ex-q">${esc(it.enonce)}</p><div class="ex-opts">${it.choix.map((c, k) => `<button class="ex-opt" data-i="${k}"><span>${'ABCD'[k]}</span>${esc(c)}</button>`).join('')}</div>`;
    $$('.ex-opt').forEach(b => b.onclick = () => pick(+b.dataset.i)); };
  const pick = k => { if (over) return; const it = pool[i % pool.length]; const ok = k === it.bonne; touchDay(1);
    E.coach.react(ok, ok ? combo + 1 : 0); { const h = $('#host'); h.classList.remove('shake'); if (!ok) { void h.offsetWidth; h.classList.add('shake'); } }
    if (ok) { good++; combo++; const g = 10 * Math.min(4, 1 + Math.floor(combo / 3)); score += g; pts('+' + g, 'good'); $('#fbk').textContent = '+' + g; $('#fbk').className = 'flash-fb good'; ET.quiz[it.id] = 1; }
    else { bad++; combo = 0; score = Math.max(0, score - 5); pts('−5', 'bad'); $('#fbk').textContent = '−5 · ' + it.choix[it.bonne]; $('#fbk').className = 'flash-fb bad'; ET.quiz[it.id] = 0; ET.errors[it.id] = (ET.errors[it.id] || 0) + 1; }
    $('#sc').textContent = score; $('#cb').textContent = Math.min(4, 1 + Math.floor(combo / 3)); i++; show(); };
  const finish = () => { over = true; clearInterval(timer); E.touches = null; sauver(); const rec = meilleur('defi:' + (th || 'all'), score); E.confetti(score >= 100 ? 140 : 60); E.coach.win(score + ' points !');
    $('#host').innerHTML = ''; $('#end').innerHTML = `<div class="done">${E.cheer(.9)}<h1>${score} points</h1><p>${good} bonnes réponses, ${bad} erreurs. ${rec ? ic('medal') + ' <b>Nouveau record !</b>' : ''}</p><div class="btns"><a class="btn" href="#/jeux/defi${qs({ theme: th, r: Date.now() })}">Rejouer</a><a class="btn ghost" href="${back}">Autres jeux</a></div></div>`; };
  E.touches = e => { const k = '1234abcd'.indexOf(e.key.toLowerCase()); if (k >= 0) pick(k % 4); };
  const timer = setInterval(() => { if (!$('#tl')) return clearInterval(timer); left--; $('#tl').textContent = left; const rg = $('#rg'); if (rg) rg.style.strokeDashoffset = (119.4 * (1 - left / 60)).toFixed(1); if (left <= 10) { $('#tl').classList.add('hot'); E.sfx.tick(); } if (left <= 0) finish(); }, 1000);
  show();
}

/* « Dans l'ordre ! » : classer 4 délais (ou montants) de même unité du plus petit au plus grand */
function genOrdre(th, n) {
  const groupes = new Map();
  for (const f of poolQuiz().filter(x => (!th || x.h === th) && x.x != null && x.u)) { const k = f.y + '|' + fold(f.u); if (!groupes.has(k)) groupes.set(k, []); groupes.get(k).push(f); }
  const out = [];
  for (const g of shuffle([...groupes.values()].filter(l => new Set(l.map(f => f.x)).size >= 4))) {
    const vus = new Set(), pris = []; for (const f of shuffle(g)) { if (!vus.has(f.x)) { vus.add(f.x); pris.push(f); } if (pris.length === 4) break; }
    if (pris.length === 4) out.push({ unite: pris[0].u, type: pris[0].y, items: shuffle(pris), bon: [...pris].sort((a, b) => a.x - b.x) });
    if (out.length === n) break;
  }
  return out;
}
function ordreGame(th, app) {
  const back = '#/jeux' + qs({ theme: th });
  const series = genOrdre(th, 5); if (!series.length) return pasAssez(app, back, 'Dans l\'ordre !');
  let i = 0, score = 0; E.coach.show();
  const round = () => {
    if (i >= series.length) { const rec = meilleur('ordre:' + (th || 'all'), score); app.innerHTML = habiller(`<div class="done">${E.cheer(.9)}<h1>${score} / ${series.length * 10}</h1><p>${rec ? ic('medal') + ' Nouveau record !' : 'Bravo !'}</p><div class="btns"><a class="btn" href="#/jeux/ordre${qs({ theme: th, r: Date.now() })}">Rejouer</a><a class="btn ghost" href="${back}">Autres jeux</a></div></div>`, back, 'Dans l\'ordre !'); E.touches = null; return; }
    const it = series[i]; const choix = [];
    app.innerHTML = habiller(`<div class="stats-row"><span>Série ${i + 1} / ${series.length}</span><span>Score : <b>${score}</b></span></div>
      <div class="ex-card"><p class="ex-q">Classe ces ${it.type === 'delai' ? 'délais' : 'montants'} (en ${esc(it.unite)}) du plus petit au plus grand : touche-les dans l'ordre.</p>
      <div class="ex-opts" id="ol">${it.items.map((f, k) => `<button class="ex-opt" data-k="${k}"><span id="n${k}">·</span>${esc(court(f.q, 120))}</button>`).join('')}</div></div><div id="fb"></div>
      <div class="btns" style="justify-content:flex-start"><button class="btn" id="go" disabled>Valider</button></div>`, back, 'Dans l\'ordre !');
    let valide = false; const go = $('#go');
    const maj = () => { it.items.forEach((_, k) => { const p = choix.indexOf(k); $('#n' + k).textContent = p >= 0 ? p + 1 : '·'; $$('.ex-opt')[k].classList.toggle('sel', p >= 0); }); go.disabled = choix.length < it.items.length; };
    $$('#ol .ex-opt').forEach(b => b.onclick = () => { if (valide) return; const k = +b.dataset.k, p = choix.indexOf(k); if (p >= 0) choix.splice(p, 1); else choix.push(k); E.sfx.pop(); maj(); });
    go.onclick = () => {
      if (valide) { i++; return round(); }
      valide = true; const rang = f => it.bon.findIndex(g => g.x === f.x); let bons = 0; choix.forEach((k, pos) => { if (rang(it.items[k]) === pos) bons++; });
      const ok = bons === it.items.length; touchDay(1); E.coach.react(ok, 0); score += Math.round(bons / it.items.length * 10);
      $$('#ol .ex-opt').forEach((b, k) => { b.disabled = true; b.classList.remove('sel'); b.classList.add(rang(it.items[k]) === choix.indexOf(k) ? 'ok' : 'ko'); });
      $('#fb').innerHTML = `<div class="feedback ${ok ? 'good' : 'bad'}"><b>${ok ? ic('circle-check') + ' Parfait !' : ic('circle-x') + ' Pas tout à fait'}</b> ${bons} / ${it.items.length} bien placés<div class="why"><ol>${it.bon.map(f => `<li>${esc(court(f.q, 100))} : <b>${esc(f.v)}</b> <small class="muted">${esc(f.a || '')}</small></li>`).join('')}</ol></div></div>`;
      go.textContent = i + 1 < series.length ? 'Suivant →' : 'Résultat'; go.disabled = false; sauver();
    };
  };
  round();
}

/* ---------- Page Progrès ---------- */
const NIVEAUX = [[0, 'Curieux'], [100, 'Apprenti'], [300, 'Studieux'], [600, 'Assidu'], [1000, 'Confirmé'], [1600, 'Expert'], [2400, 'Maître'], [3500, 'Major de promo']];
const niveau = xp => { let i = 0; NIVEAUX.forEach(([t], k) => { if (xp >= t) i = k; }); const cur = NIVEAUX[i][0], nxt = NIVEAUX[i + 1]?.[0]; return { n: i + 1, name: NIVEAUX[i][1], cur, nxt, pct: nxt ? (xp - cur) / (nxt - cur) * 100 : 100 }; };
const jourCourt = t => new Date(t).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
const ICONE_H = { quiz: 'circle-check', game: 'gamepad-2', flash: 'layers', exo: 'pencil-line', exam: 'clipboard-check', olympiade: 'trophy', bonus: 'award' };
const titreH = h => h.type === 'game' ? (GAMES[h.game]?.nom || 'Jeu') : h.type === 'quiz' ? 'Quiz' : h.type === 'exo' ? 'Exercices' : h.type === 'exam' ? 'Examen blanc' : h.type === 'olympiade' ? 'Olympiade blanche' : h.type === 'bonus' ? 'Défis du jour réussis' : 'Flashcards';
const scoreH = h => h.type === 'bonus' ? '+50 pts' : h.type === 'olympiade' ? `${h.score} pts` : h.type === 'exam' ? `${h.score.toFixed(1)} / 20` : h.type === 'flash' ? `${h.n} cartes` : h.type === 'game' ? (h.game === 'memory' ? `${h.score} coups` : `${h.score} pts`) : `${h.score} / ${h.max}`;
const coursH = id => id ? ((coursIdx || []).find(c => c.id === id)?.court || (id === 'textes' ? 'Repères des textes' : nomTheme(id))) : 'Tous les cours';
const connue = k => (ET.cards[k.id]?.ivl || 0) >= 3;
function graphBarres(pts) {
  if (!pts.length) return '<p class="muted">Aucun quiz pour l\'instant.</p>';
  const W = 640, H = 200, L = 34, T = 12, Bt = 26, bw = Math.min(34, (W - L - 10) / pts.length - 4), y = v => T + (H - T - Bt) * (1 - v / 100);
  return `<svg viewBox="0 0 ${W} ${H}" class="chart" role="img">${[0, 50, 100].map(v => `<line x1="${L}" x2="${W - 8}" y1="${y(v)}" y2="${y(v)}" stroke="rgba(74,47,29,.12)"/><text x="${L - 6}" y="${y(v) + 4}" text-anchor="end" font-size="11" fill="#7a5c44">${v}%</text>`).join('')}
    ${pts.map((p, i) => { const x = L + 8 + i * (bw + 4); const c = p.v >= 70 ? '#4a8a3a' : p.v >= 40 ? '#dfa93b' : '#d4563a'; return `<rect x="${x}" y="${y(p.v)}" width="${bw}" height="${y(0) - y(p.v)}" rx="5" fill="${c}"><title>${esc(p.label)} : ${p.v}%</title></rect>`; }).join('')}</svg>`;
}
function graphLigne(pts) {
  if (pts.length < 2) return `<p class="muted">Pas encore assez de données : passe au moins deux examens blancs pour voir ta courbe.</p>`;
  const W = 640, H = 220, L = 34, R = 14, T = 14, Bt = 30, max = 20, x = i => L + (W - L - R) * i / (pts.length - 1), y = v => T + (H - T - Bt) * (1 - v / max);
  const path = pts.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(p.v).toFixed(1)}`).join(' ');
  return `<svg viewBox="0 0 ${W} ${H}" class="chart" role="img">${[0, .25, .5, .75, 1].map(f => `<line x1="${L}" x2="${W - R}" y1="${y(max * f)}" y2="${y(max * f)}" stroke="rgba(74,47,29,.12)"/><text x="${L - 6}" y="${y(max * f) + 4}" text-anchor="end" font-size="11" fill="#7a5c44">${Math.round(max * f)}</text>`).join('')}
    <line x1="${L}" x2="${W - R}" y1="${y(10)}" y2="${y(10)}" stroke="#4a8a3a" stroke-dasharray="5 5"/><text x="${W - R}" y="${y(10) - 5}" text-anchor="end" font-size="11" fill="#4a8a3a">moyenne</text>
    <path d="${path} L${x(pts.length - 1)} ${y(0)} L${x(0)} ${y(0)}Z" fill="rgba(47,111,134,.12)"/><path d="${path}" fill="none" stroke="#2f6f86" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>
    ${pts.map((p, i) => `<circle cx="${x(i)}" cy="${y(p.v)}" r="5" fill="#fff" stroke="#2f6f86" stroke-width="3"><title>${esc(p.label)} : ${p.v}</title></circle>`).join('')}
    ${pts.map((p, i) => (pts.length <= 8 || i % Math.ceil(pts.length / 8) === 0) ? `<text x="${x(i)}" y="${H - 8}" text-anchor="middle" font-size="11" fill="#7a5c44">${esc(p.d)}</text>` : '').join('')}</svg>`;
}
function calendrier() {
  const cells = [], t0 = new Date(); t0.setHours(0, 0, 0, 0); const start = new Date(t0.getTime() - 83 * DAY), offset = (start.getDay() + 6) % 7;
  for (let i = -offset; i < 84; i++) { if (i < 0) { cells.push(null); continue; } const d = new Date(start.getTime() + i * DAY); cells.push({ n: ET.days[d.toLocaleDateString('sv')] || 0, d }); }
  const lv = n => n === 0 ? 0 : n < 5 ? 1 : n < 15 ? 2 : n < 30 ? 3 : 4;
  return `<div class="heat">${cells.map(c => c ? `<i class="h${lv(c.n)}" title="${c.d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} : ${c.n} activité${c.n > 1 ? 's' : ''}"></i>` : '<i class="hx"></i>').join('')}</div>
    <div class="heatleg">Moins <i class="h0"></i><i class="h1"></i><i class="h2"></i><i class="h3"></i><i class="h4"></i> Plus</div>`;
}
function trophees() {
  const H = ET.history, jeux = new Set(H.filter(h => h.type === 'game').map(h => h.game)), vues = Object.keys(ET.cards).length, jours = Object.keys(ET.days).length;
  const serie = serieJours(), tm = (coursIdx || []).some(c => mastCours(c) >= 50);
  return [
    ['footprints', 'Premier pas', 'Faire une première activité', H.length > 0],
    ['flame', 'Série de 3 jours', 'Réviser 3 jours de suite', serie >= 3],
    ['flame', 'Série de 7 jours', 'Réviser 7 jours de suite', serie >= 7],
    ['layers', 'Cent cartes', 'Réviser 100 flashcards différentes', vues >= 100],
    ['layers', 'Cinq cents cartes', 'Réviser 500 flashcards différentes', vues >= 500],
    ['clipboard-check', 'Premier examen', 'Passer un examen blanc', ET.exams.length >= 1],
    ['badge-check', 'Note de passage', 'Obtenir 10/20 ou plus à un examen blanc', ET.exams.some(e => e.note >= 10)],
    ['trophy', 'Excellence', 'Obtenir 14/20 ou plus à un examen blanc', ET.exams.some(e => e.note >= 14)],
    ['target', 'Quiz parfait', 'Réussir un quiz sans aucune erreur', H.some(h => h.type === 'quiz' && h.score === h.max && h.max >= 5)],
    ['gamepad-2', 'Touche-à-tout', 'Essayer 4 jeux différents', jeux.size >= 4],
    ['calendar-check', 'Régulier', 'Réviser pendant 10 jours différents', jours >= 10],
    ['sprout', 'Thème maîtrisé à 50 %', 'Atteindre 50 % de maîtrise dans un thème', tm],
    ['gem', 'Niveau 5', 'Atteindre le niveau Confirmé', niveau(ET.xp || 0).n >= 5],
  ];
}
views.progres = async () => {
  const H = ET.history, xp = ET.xp || 0, lv = niveau(xp), serie = serieJours();
  const sess = H.filter(h => (h.type === 'quiz' || h.type === 'exo') && h.max).slice(-20).map(h => ({ v: Math.round(h.score / h.max * 100), label: `${titreH(h)} · ${coursH(h.course)} · ${jourCourt(h.t)}` }));
  const rep = Object.keys(ET.quiz).length, ok = Object.values(ET.quiz).filter(v => v === 1).length;
  const esp = await monEspace(); await chargerCoursIdx(); const totalCartes = coursIdx.reduce((n, c) => n + c.n.cartes, 0), sues = Object.entries(ET.cards).filter(([k, v]) => k.startsWith('p') && k.includes(':') && (v.ivl || 0) >= 3).length, semaine = H.filter(h => h.t > Date.now() - 7 * DAY).length;
  const records = Object.entries(ET.scores).map(([k, v]) => { const [g, c] = k.split(':'); return { g, c, v }; }).filter(r => GAMES[r.g]).sort((a, b) => a.g.localeCompare(b.g));
  const tr = trophees(), obtenus = tr.filter(b => b[3]).length;
  return { title: 'Progrès', html: `
    <h1 class="h1">${lbls('Progrès')}</h1>
    <div class="levelcard"><div class="who">${perso('kofi', lv.n >= 3 ? 'lol' : 'joy', 130)}</div>
      <div class="lv"><small>Niveau ${lv.n}</small><h2>${lv.name}</h2><div class="bar" style="max-width:none"><i style="width:${lv.pct}%"></i></div>
      <p class="muted">${xp} points d'expérience${lv.nxt ? ` · encore ${lv.nxt - xp} pour le niveau ${lv.n + 1}` : ' · niveau maximum atteint'}</p></div></div>
    ${esp.html}
    ${compte() ? '' : `<div class="banner info">${ic('cloud')}<div><strong>Garde ta progression.</strong> Un compte facultatif la sauvegarde et la synchronise entre tes appareils. <a href="#/compte">Créer un compte</a></div></div>`}
    <div class="kgrid">
      <div class="kpi">${ic('flame')}<b>${serie}</b><span>jour${serie > 1 ? 's' : ''} de suite</span></div>
      <div class="kpi">${ic('layers')}<b>${sues}<small>/${totalCartes}</small></b><span>cartes bien retenues</span></div>
      <div class="kpi">${ic('circle-check')}<b>${rep ? Math.round(ok / rep * 100) + '%' : '–'}</b><span>réussite aux quiz</span></div>
      <div class="kpi">${ic('clipboard-check')}<b>${ET.exams.length ? (ET.exams.reduce((a, e) => a + e.note, 0) / ET.exams.length).toFixed(1) : '–'}</b><span>moyenne /20 (${ET.exams.length} examen${ET.exams.length > 1 ? 's' : ''})</span></div>
      <div class="kpi">${ic('activity')}<b>${semaine}</b><span>activités cette semaine</span></div>
      <div class="kpi">${ic('award')}<b>${obtenus}<small>/${tr.length}</small></b><span>badges obtenus</span></div></div>
    <h2 class="sec"><span class="lbl l2">Réussite aux derniers quiz</span></h2><div class="card chartcard">${graphBarres(sess)}</div>
    <h2 class="sec"><span class="lbl l4">Tes notes d'examen blanc</span></h2><div class="card chartcard">${graphLigne(ET.exams.map(e => ({ v: e.note, d: jourCourt(e.date), label: e.titre })))}</div>
    <h2 class="sec"><span class="lbl l6">Régularité, 12 semaines</span></h2><div class="card">${calendrier()}</div>
    <h2 class="sec"><span class="lbl l1">Maîtrise par cours</span></h2><div class="card">${coursIdx.map(c => `<div class="crow"><a class="nm" href="#/cours/${c.id}">${esc(c.court)}</a><div class="bar"><i style="width:${mastCours(c)}%"></i></div><span class="pc">${mastCours(c)}%</span></div>`).join('')}</div>
    <h2 class="sec"><span class="lbl l4">Records des jeux</span></h2>${records.length ? `<div class="kgrid recs">${records.map(r => `<div class="kpi">${ic(GAMES[r.g].ico)}<b>${r.v}</b><span>${GAMES[r.g].nom} · ${esc(coursH(r.c === 'all' ? '' : r.c))} (${GAMES[r.g].unit})</span></div>`).join('')}</div>` : '<p class="onmat">Aucun record pour l\'instant : lance un jeu !</p>'}
    <h2 class="sec"><span class="lbl l5">Badges</span></h2><div class="trophies">${tr.map(([i, n, d, o]) => `<div class="trophy ${o ? 'on' : ''}">${ic(i)}<b>${n}</b><small>${d}</small></div>`).join('')}</div>
    <h2 class="sec"><span class="lbl l2">Historique récent</span></h2>${H.length ? `<div class="card hist2">${[...H].reverse().slice(0, 25).map(h => `<div class="hrow">${ic(ICONE_H[h.type] || 'activity')}<span class="nm"><b>${esc(titreH(h))}</b> <small class="muted">${esc(coursH(h.course))}</small></span><b class="sc">${scoreH(h)}</b><small class="muted">${jourCourt(h.t)}</small></div>`).join('')}</div>` : '<p class="onmat">Ton historique apparaîtra ici.</p>'}
    <div style="margin-top:34px"><button class="btn ghost" id="reset">Réinitialiser ma progression</button></div>`,
    after() { $('#nw')?.addEventListener('click', () => { const d = esp.defs[Math.floor(Math.random() * esp.defs.length)]; $('#wotd .wotd-in').outerHTML = carteMot(d); E.sfx.pop(); $('#wotd .wotd-in')?.classList.add('flipin'); });
      $('#reset').onclick = () => { if (confirm('Effacer toute ta progression (scores, historique, niveau) ?')) { for (const k of Object.keys(ET)) delete ET[k]; Object.assign(ET, { cards: {}, quiz: {}, errors: {}, days: {}, history: [], xp: 0, scores: {}, exams: [], olymp: [], examDates: {}, planDone: {} }); sauver(); render(); } }; } };
};

/* ---------- Découvrir et Comprendre : guides rédigés, chaque fait renvoie à son article ---------- */
let guidesCache = null;
const chargerGuides = async () => guidesCache ||= await fetch('/data/guides.json').then(r => r.json());
const PORTES = {
  decouvrir: { nom: 'Découvrir', sous: 'La bourse expliquée simplement', mat: '#2f7d4e', perso: ['amina', 'joy'] },
};
const guideView = porte => async ([id]) => {
  const P = PORTES[porte], gs = (await chargerGuides()).filter(g => g.porte === porte);
  const nbRepères = g => g.blocs.reduce((n, b) => n + (b.faits?.length || 0), 0);
  const GM = await chargerGuidesMeta();
  if (!id) { const parties = [...new Set(gs.map(g => g.partie))]; return { title: P.nom, html: `
    <h1 class="h1">${lbls(P.nom)}</h1><span class="hand">${P.sous}</span>
    <div class="sheet presentation"><div><p>${md("Prenons une épargnante : elle a 500 000 FCFA d'économies et se demande si la bourse peut l'aider à les faire travailler. Chaque chapitre répond à une de ses questions, dans l'ordre où elle se les pose. Vous pouvez tout lire d'une traite, ou aller directement au chapitre qui vous intéresse.")}</p><p class="small muted" style="margin-top:8px"><a href="#/acteurs">Rencontrer les acteurs du marché, étape par étape</a></p></div></div>
    ${parties.map((pt, k) => `<section class="partie"><h2 class="sec"><span class="lbl l${k % 6 + 1}">Partie ${k + 1} · ${esc(pt)}</span></h2><p class="onmat" style="max-width:720px;margin:-6px 0 18px">${esc(GM.parties[pt] || '')}</p>
      <ol class="list guides">${gs.filter(g => g.partie === pt).map(g => `<li><a class="card item" href="#/${porte}/${g.id}"><span class="num">${g.ordre}</span><span class="t">${esc(g.titre)}</span><span class="sub">${esc(g.accroche)}</span><span class="histoire-min">${esc(g.histoire || '')}</span><span class="meta"><span>${nbRepères(g)} repères sourcés</span></span></a></li>`).join('')}</ol></section>`).join('')}`,
    after() { fond(P.mat); } }; }
  const i = gs.findIndex(g => g.id === id); if (i < 0) return views.introuvable();
  const g = gs[i], prec = gs[i - 1], suiv = gs[i + 1];
  const A = await chargerAnnuaire(); const titreB = b => b.titre ? `<h2 class="sec"><span class="lbl l2">${esc(b.titre)}</span></h2>` : '';
  const corps = g.blocs.map(b => {
    if (b.p) return `<div class="sheet"><p>${md(b.p)}</p></div>`;
    if (b.note) return `<div class="banner info">${ic('lightbulb')}<div>${md(b.note)}</div></div>`;
    if (b.faits) return `<h2 class="sec"><span class="lbl l2">${esc(b.titre || 'Dans les textes')}</span></h2><div class="sheet"><div class="facts">${b.faits.map(x => D.parId.get(x)).filter(Boolean).map(x => factHtml(x, true)).join('')}</div></div>`;
    if (b.liste) return `${titreB(b)}<div class="sheet"><ul class="gl">${b.liste.map(x => `<li>${md(x)}</li>`).join('')}</ul></div>`;
    if (b.puces) return `${titreB(b)}<div class="sheet"><ul class="gl puces">${b.puces.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>`;
    if (b.etapes) return `${titreB(b)}<ol class="etapes">${b.etapes.map((x, i) => `<li><span class="n">${i + 1}</span><div>${md(x)}</div></li>`).join('')}</ol>`;
    if (b.chiffres) return `${titreB(b)}<div class="chiffres">${b.chiffres.map(x => `<div class="card chf"><b>${esc(x.v)}</b><span>${esc(x.l)}</span></div>`).join('')}</div>`;
    if (b.chrono) return `${titreB(b)}<ol class="chrono">${b.chrono.map(x => `<li><b>${esc(x.an)}</b><span>${esc(x.t)}</span></li>`).join('')}</ol>`;
    if (b.acteurs) return `${titreB(b)}<ul class="list acteurs">${b.acteurs.map(id => A.find(a => a.id === id)).filter(Boolean).map(carteActeur).join('')}</ul>`;
    if (b.cta) return `<p style="margin:26px 0"><a class="btn" href="${esc(b.cta.href)}"${b.cta.externe ? ' target="_blank" rel="noopener"' : ''}>${ic(b.cta.externe ? 'external-link' : 'arrow-right')} ${esc(b.cta.label)}</a></p>`;
    if (b.source) return `<p class="small onmat">Source : <a href="${esc(b.source.url)}" target="_blank" rel="noopener" style="color:var(--y)">${esc(b.source.nom)}</a></p>`;
    return '';
  }).join('');
  return { title: `${g.titre} : ${P.nom}`, html: `
    <div class="crumbs"><a href="#/${porte}">${P.nom}</a> ${ic('chevron-right')} <span>${esc(g.titre)}</span></div>
    <header class="doc-head"><small class="partie-n">Partie : ${esc(g.partie || '')} · chapitre ${g.ordre} sur ${gs.length}</small><h1 class="h1">${lbls(g.titre)}</h1><p class="full">${esc(g.accroche)}</p></header>
    ${g.histoire ? encartAmina(g.histoire, 'grand') : ''}
    ${corps}
    <div class="actions" style="margin-top:34px">
      <a class="btn" href="#/flashcards/run${qs({ theme: g.theme })}">${ic('layers')} Réviser ce thème</a>
      <a class="btn ghost" href="#/quiz/run${qs({ theme: g.theme })}">${ic('circle-check')} Quiz sur ce thème</a>
      <a class="btn ghost" href="#/bibliotheque${qs({ theme: g.theme })}">${ic('library')} Voir les textes</a></div>
    ${suiv?.histoire ? `<a class="suite" href="#/${porte}/${suiv.id}" style="margin-top:34px"><small>Dans le chapitre suivant</small><b>${esc(suiv.titre)}</b><i>${esc(suiv.histoire)}</i><span>${ic('arrow-right')}</span></a>` : ''}
    <nav class="pager">${prec ? `<a class="btn ghost" href="#/${porte}/${prec.id}">← ${esc(prec.titre)}</a>` : '<span></span>'}${suiv ? `<a class="btn" href="#/${porte}/${suiv.id}">${esc(suiv.titre)} →</a>` : '<span></span>'}</nav>`,
    after() { fond(P.mat); } };
};
views.decouvrir = guideView('decouvrir');

/* ---------- Compte facultatif et synchronisation de la progression ---------- */
const api = async (chemin, o = {}) => {
  try {
    const r = await fetch('/api' + chemin, { method: o.method || 'GET', credentials: 'same-origin', headers: { 'content-type': 'application/json', 'x-mf': '1' }, body: o.body ? JSON.stringify(o.body) : undefined });
    return { ok: r.ok, status: r.status, d: await r.json().catch(() => ({})) };
  } catch { return { ok: false, status: 0, d: { erreur: 'Réseau indisponible.' } }; }
};
const compte = () => store.get('compte', null);
function majIconeCompte() { const a = $('.acct'); if (!a) return; const c = compte(); a.classList.toggle('on', !!c); a.title = c ? 'Compte : ' + c.email : 'Compte (facultatif)'; }
function fusionner(dist) {
  const d = Object.assign({ cards: {}, quiz: {}, errors: {}, days: {}, history: [], xp: 0, scores: {}, exams: [], olymp: [], examDates: {}, planDone: {} }, dist || {});
  for (const [id, c] of Object.entries(d.cards || {})) { const l = ET.cards[id]; if (!l || (c.reps || 0) > (l.reps || 0) || ((c.reps || 0) === (l.reps || 0) && (c.due || 0) > (l.due || 0))) ET.cards[id] = c; }
  for (const [id, v] of Object.entries(d.quiz || {})) ET.quiz[id] = Math.max(ET.quiz[id] ?? 0, v);
  for (const [id, v] of Object.entries(d.errors || {})) ET.errors[id] = Math.max(ET.errors[id] || 0, v);
  for (const [j, v] of Object.entries(d.days || {})) ET.days[j] = Math.max(ET.days[j] || 0, v);
  const vus = new Set(ET.history.map(h => h.t + '|' + h.type));
  for (const h of d.history || []) if (!vus.has(h.t + '|' + h.type)) ET.history.push(h);
  ET.history.sort((a, b) => a.t - b.t); ET.history = ET.history.slice(-600);
  ET.xp = Math.max(ET.xp || 0, d.xp || 0);
  { const vo = new Set((ET.olymp || []).map(e => e.date)); ET.olymp = [...(ET.olymp || []), ...(d.olymp || []).filter(e => !vo.has(e.date))].sort((a, b) => a.date - b.date).slice(-60); }
  ET.examDates = { ...(d.examDates || {}), ...(ET.examDates || {}) }; ET.planDone = { ...(d.planDone || {}), ...(ET.planDone || {}) };
  { const vd = new Set((ET.exams || []).map(e => e.date)); ET.exams = [...(ET.exams || []), ...(d.exams || []).filter(e => !vd.has(e.date))].sort((a, b) => a.date - b.date).slice(-60); }
  for (const [k, v] of Object.entries(d.scores || {})) { const bas = GAMES[k.split(':')[0]]?.low; const l = ET.scores[k]; if (l == null || (bas ? v < l : v > l)) ET.scores[k] = v; }
}
let timerSync = 0;
function planifierSync() { if (!compte()) return; clearTimeout(timerSync); timerSync = setTimeout(() => synchroniser(), 15000); }
async function synchroniser() {
  if (!compte()) return { ok: false };
  const r = await api('/sync');
  if (r.status === 401) { store.set('compte', null); majIconeCompte(); return { ok: false, expire: true }; }
  if (!r.ok) return { ok: false };
  if (r.d.data) fusionner(r.d.data);
  store.set('etude', ET);
  const p = await api('/sync', { method: 'PUT', body: { data: ET } });
  if (p.ok) store.set('sync', Date.now());
  return { ok: p.ok };
}

views.compte = async () => {
  const cfg = await api('/auth/config'); const google = cfg.ok ? cfg.d.google : null; const c = compte();
  const entete = `<h1 class="h1">${lbls('Compte')}</h1><span class="hand">Facultatif : tout marche sans compte.</span>`;
  if (c) {
    const t = store.get('sync', 0);
    return { title: 'Compte', html: `${entete}
      <div class="card hub"><p style="margin:0 0 6px"><b>${esc(c.email)}</b></p><p class="muted" id="ds" style="margin:0 0 22px">${t ? 'Dernière synchronisation : ' + new Date(t).toLocaleString('fr-FR') : 'Pas encore synchronisé.'}</p>
        <div class="btns" style="justify-content:flex-start"><button class="btn" id="sy">${ic('refresh-cw')} Synchroniser maintenant</button><button class="btn ghost" id="out">${ic('log-out')} Se déconnecter</button></div>
        <p id="msg" class="flash-fb" style="text-align:left"></p>
        <p style="margin:18px 0 0"><button class="btn ghost sm" id="del">${ic('trash-2')} Supprimer mon compte et mes données</button></p></div>
      <p class="small onmat" style="margin-top:22px">Ta progression (cartes, quiz, jeux, points) est sauvegardée sur nos serveurs et synchronisée entre tes appareils. Rien d'autre n'est enregistré.</p>`,
      after() {
        $('#sy').onclick = async () => { $('#msg').textContent = 'Synchronisation…'; const r = await synchroniser(); $('#msg').className = 'flash-fb ' + (r.ok ? 'good' : 'bad'); $('#msg').textContent = r.ok ? 'Progression à jour.' : r.expire ? 'Session expirée : reconnecte-toi.' : 'Échec de la synchronisation.'; if (r.expire) render(); else $('#ds').textContent = 'Dernière synchronisation : ' + new Date().toLocaleString('fr-FR'); };
        $('#out').onclick = async () => { await api('/auth/logout', { method: 'POST' }); store.set('compte', null); majIconeCompte(); render(); };
        $('#del').onclick = async () => { if (!confirm('Supprimer définitivement ton compte et ta progression sauvegardée ? (Ta progression sur cet appareil reste.)')) return; const r = await api('/auth/account', { method: 'DELETE' }); if (r.ok) { store.set('compte', null); majIconeCompte(); render(); } };
      } };
  }
  return { title: 'Compte', html: `${entete}
    <div class="card hub"><div class="tabsrow" id="modes" style="margin-bottom:22px"><button class="chip" data-m="login">Se connecter</button><button class="chip" data-m="register">Créer un compte</button><button class="chip" data-m="reset">Mot de passe oublié</button></div>
      <div id="cpt"></div>${google ? '<div style="margin-top:22px"><div id="gbtn"></div></div>' : ''}</div>
    <p class="small onmat" style="margin-top:22px">Un compte sert à sauvegarder ta progression et à la retrouver sur un autre appareil. Il faut seulement une adresse e-mail et un mot de passe. Aucune publicité, aucune revente de données.</p>`,
    after() {
      const champ = (id, lib, type = 'text', extra = '') => `<label class="field" style="color:var(--ink);text-shadow:none;margin-bottom:14px">${lib}<input id="${id}" type="${type}" ${extra} required></label>`;
      const FORMS = {
        login: () => champ('em', 'Adresse e-mail', 'email', 'autocomplete="email"') + champ('pw', 'Mot de passe', 'password', 'autocomplete="current-password"') + `<button class="btn" type="submit">${ic('log-in')} Se connecter</button>`,
        register: () => champ('em', 'Adresse e-mail', 'email', 'autocomplete="email"') + champ('pw', 'Mot de passe (8 caractères minimum)', 'password', 'autocomplete="new-password" minlength="8"') + champ('pw2', 'Répéter le mot de passe', 'password', 'autocomplete="new-password"') + `<button class="btn" type="submit">${ic('user')} Créer mon compte</button>`,
        reset: () => `<p class="small" style="margin:0 0 14px;color:var(--ink)">Utilise le code de récupération donné à la création du compte.</p>` + champ('em', 'Adresse e-mail', 'email', 'autocomplete="email"') + champ('cd', 'Code de récupération', 'text', 'autocomplete="off" placeholder="XXXX-XXXX-XXXX-XXXX"') + champ('pw', 'Nouveau mot de passe', 'password', 'autocomplete="new-password" minlength="8"') + `<button class="btn" type="submit">${ic('key-round')} Changer le mot de passe</button>`,
      };
      const montrerCode = (email, code) => {
        $('#modes').hidden = true; if ($('#gbtn')) $('#gbtn').hidden = true;
        $('#cpt').innerHTML = `<h2 style="margin:0 0 8px;color:var(--ink)">Note ton code de récupération</h2>
          <p style="color:var(--ink);margin:0 0 14px">Il te permettra de changer ton mot de passe si tu l'oublies. <b>Il ne sera plus affiché.</b></p>
          <div class="sheet" style="text-align:center;padding:18px;margin-bottom:14px"><span style="font-family:var(--display);font-weight:800;font-size:clamp(22px,5vw,32px);letter-spacing:.06em;color:var(--ink)">${esc(code)}</span></div>
          <div class="btns" style="justify-content:flex-start;margin-bottom:16px"><button class="btn ghost sm" id="cp">${ic('copy')} Copier</button><button class="btn ghost sm" id="dl">${ic('download')} Télécharger</button></div>
          <label class="check" style="color:var(--ink);text-shadow:none"><input type="checkbox" id="ok"> Je l'ai noté en lieu sûr</label>
          <p style="margin-top:16px"><button class="btn" id="go" disabled>Continuer</button></p>`;
        $('#cp').onclick = () => copier(code, 'Code copié');
        $('#dl').onclick = () => telecharger('code-de-recuperation-marche-cemac.txt', `Code de récupération (${email}) : ${code}\n`, 'text/plain;charset=utf-8');
        $('#ok').onchange = e => { $('#go').disabled = !e.target.checked; };
        $('#go').onclick = async () => { await synchroniser(); render(); };
      };
      const apres = async (email, d) => { store.set('compte', { email }); majIconeCompte(); if (d.code_recuperation) { montrerCode(email, d.code_recuperation); await synchroniser(); } else { await synchroniser(); render(); } };
      const afficher = m => {
        $$('#modes [data-m]').forEach(b => b.setAttribute('aria-pressed', b.dataset.m === m));
        $('#cpt').innerHTML = `<form id="f" novalidate>${FORMS[m]()}<p id="msg" class="flash-fb" style="text-align:left;margin-top:12px"></p></form>`;
        $('#f').onsubmit = async e => {
          e.preventDefault(); const v = id => ($('#' + id)?.value || '').trim(); const msg = t => { $('#msg').className = 'flash-fb bad'; $('#msg').textContent = t; };
          if (m === 'register' && $('#pw').value !== $('#pw2').value) return msg('Les deux mots de passe sont différents.');
          const corps = { email: v('em'), motdepasse: $('#pw').value, code: v('cd') };
          $('#msg').className = 'flash-fb'; $('#msg').textContent = 'Un instant…';
          const r = await api(m === 'login' ? '/auth/login' : m === 'register' ? '/auth/register' : '/auth/reset', { method: 'POST', body: corps });
          if (!r.ok) return msg(r.d.erreur || 'Une erreur est survenue.');
          apres(r.d.email, r.d);
        };
      };
      $$('#modes [data-m]').forEach(b => b.addEventListener('click', () => afficher(b.dataset.m)));
      afficher('login');
      if (google) { const sc = document.createElement('script'); sc.src = 'https://accounts.google.com/gsi/client'; sc.async = true; sc.onload = () => { window.google.accounts.id.initialize({ client_id: google, callback: async r => { const g = await api('/auth/google', { method: 'POST', body: { credential: r.credential } }); if (g.ok) apres(g.d.email, g.d); else { $('#msg') && ($('#msg').textContent = g.d.erreur || 'Connexion Google refusée.'); } } }); window.google.accounts.id.renderButton($('#gbtn'), { theme: 'outline', size: 'large', text: 'continue_with', locale: 'fr' }); }; document.head.appendChild(sc); }
    } };
};

views.apropos = async () => ({ title: 'À propos', html: `
  <h1 class="h1">${lbls('À propos')}</h1>
  <div class="banner">${ic('triangle-alert')}<div><strong>Outil d'aide, non officiel.</strong> Cette plateforme n'est ni la COSUMAF, ni la BVMAC. Elle ne remplace pas les textes officiels : citez toujours le texte publié.</div></div>
  <div class="sheet about"><h2>Qui publie</h2><p>Boussole CEMAC est éditée par Impact Tech. Contact et signalement d'erreur : <a href="mailto:${CONTACT}">${CONTACT}</a>. Voir aussi la <a href="#/methode">méthode de vérification</a> et les <a href="#/mentions">mentions légales et la confidentialité</a>.</p>
  <h2>À quoi ça sert</h2><p>Les professionnels du marché financier relisent sans cesse les mêmes textes. Ici, on retrouve en quelques secondes un délai, un montant, un rôle ou un piège, avec l'article et le texte d'origine. C'est gratuit et sans compte.</p>
  <h2>Ce que contient la base</h2><p>${D.stats.textes} textes (49 instructions de la COSUMAF, règlements CEMAC et UMAC, règlement général de la COSUMAF, règlement général et instructions de la BVMAC, lettres circulaires, lignes directrices, actes additionnels) et ${D.stats.faits} faits : délais, montants, rôles, définitions, listes et pièges.</p>
  <h2>D'où viennent les textes</h2><p>Tous les textes ont été téléchargés sur les sites officiels de la COSUMAF et de la BVMAC. Chaque fiche renvoie vers le site officiel.</p>
  <h2>Couverture</h2><ul><li><strong>${COUV.complete}</strong> : les dispositions sont reprises.</li><li><strong>${COUV.partielle}</strong> : points clés seulement (délais, montants, rôles, pièges).</li><li><strong>${COUV.contexte}</strong> : situe le texte sans détailler ses dispositions.</li></ul>
  <h2>Statut des textes</h2><p>Un texte « abrogé » est remplacé par un autre : la fiche indique par quel texte.</p>
  <h2>Sources officielles</h2><ul><li><a href="https://cosumaf.org/nos-documents" target="_blank" rel="noopener">COSUMAF : médiathèque</a></li><li><a href="https://www.bvm-ac.org/textes-reglementaires/" target="_blank" rel="noopener">BVMAC : textes réglementaires</a></li></ul>
  <h2>Compte facultatif</h2><p>Tout fonctionne sans compte. Si vous en créez un (e-mail et mot de passe), votre progression est sauvegardée et synchronisée entre vos appareils. Aucune autre donnée personnelle n'est demandée, et vous pouvez supprimer votre compte à tout moment.</p>
  <h2>Hors connexion</h2><p>Après une première visite, le site fonctionne sans réseau.</p>
  <h2>Données</h2><p>Version ${esc(D.version)}, générée le ${esc(D.genere_le)}.</p></div>` });

views.methode = async () => { const s = D.stats; const relus = s.faits_relus || 0, scan = s.faits_scan || 0; return { title: 'Méthode et vérification', html: `
  <h1 class="h1">${lbls('Méthode')}</h1>
  <div class="sheet about"><h2>D'où viennent les repères</h2>
  <p>Les ${D.stats.textes} textes viennent des sites officiels de la COSUMAF et de la BVMAC. Les ${s.faits} repères (délais, montants, rôles, définitions, listes, pièges) ont été extraits de ces textes. Chacun cite l'article d'origine et renvoie à la fiche du texte, puis au PDF officiel.</p>
  <h2>Ce qui est contrôlé</h2>
  <p>Des contrôles automatiques vérifient la cohérence de la base à chaque mise en ligne : identifiants uniques, texte et thème existants, article cité pour chaque délai ou montant, remplacements entre textes (un texte abrogé doit avoir un texte remplaçant). Ces contrôles détectent les oublis de saisie. Ils ne remplacent pas la relecture d'un chiffre contre le texte.</p>
  <h2>Où en est la relecture</h2>
  <p>Chaque repère a un statut visible à côté de lui :</p>
  <ul><li><strong>${s.faits_controles || 0}</strong> repères portent « Contrôlé sur le PDF » : un contrôle automatique a retrouvé leur valeur dans le texte du PDF, près des mots de l'énoncé. Les PDF sont des scans lus par reconnaissance de caractères : le contrôle confirme qu'une valeur est bien présente dans le document, pas que le repère est juste en tout point${s.controle_le ? ' (contrôle du ' + esc(dateFr(s.controle_le)) + ')' : ''}.</li>
  <li><strong>${s.faits_ecart || 0}</strong> repères portent « À vérifier sur le PDF » parce que leur valeur n'a pas été retrouvée dans le texte lu, ou vient d'un scan dégradé. Cela signale en général une lecture difficile du scan, parfois une erreur de notre côté : vérifiez dans le document officiel avant de citer.</li>
  <li><strong>${relus}</strong> repère${relus > 1 ? 's ont' : ' a'} été relu${relus > 1 ? 's' : ''} un par un contre la page du PDF scanné (mention « Relu sur le scan »). Cette relecture est faite avec l'aide d'une IA qui lit l'image de la page ; elle n'a pas encore été doublée par un second lecteur humain. Elle couvre pour l'instant les tarifs (Communiqué COSUMAF 03/20, Instructions BVMAC n° 1 et n° 3), les critères d'admission du Règlement général BVMAC (art. 74 et 77) et quelques délais.</li>
  <li>Les autres repères sont extraits des textes mais le contrôle automatique n'a pas pu conclure (mots de l'énoncé mal lus, valeur sans chiffre). <strong>Avant de citer un chiffre, ouvrez l'article indiqué dans le texte officiel.</strong></li></ul>
  <h2>Résumés et repères</h2>
  <p>Les résumés (« L'essentiel ») condensent un texte. En cas d'écart entre un résumé et la rubrique détaillée d'un repère, ou entre un résumé et le texte officiel, le texte officiel fait foi. Signalez-nous l'écart : il sera corrigé.</p>
  <h2>Fraîcheur des copies</h2>
  <p>Les PDF proposés sont des copies hébergées sur ce site, à la date de la version de la base (${esc(dateFr(D.genere_le))}). Un texte peut être modifié ou abrogé après cette date. La fiche de chaque texte renvoie vers le site officiel, qui reste la référence.</p>
  <h2>Signaler une erreur</h2>
  <p>Chaque repère et chaque texte a un bouton ${ic('flag')} « Signaler une erreur » : il ouvre un e-mail prérempli avec la référence du repère et la version de la base. Indiquez ce qui est faux et l'article du texte officiel qui le montre. Écrivez aussi directement à <a href="mailto:${CONTACT}">${CONTACT}</a>.</p></div>` }; };

views.mentions = async () => ({ title: 'Mentions légales et confidentialité', html: `
  <h1 class="h1">${lbls('Mentions légales')}</h1>
  <div class="banner">${ic('triangle-alert')}<div><strong>Outil d'aide à la lecture, non officiel.</strong> Boussole CEMAC n'est ni la COSUMAF ni la BVMAC. Elle ne donne ni conseil juridique, ni conseil en investissement. Citez toujours le texte officiel.</div></div>
  <div class="sheet about"><h2>Éditeur</h2>
  <p>Boussole CEMAC est éditée par <strong>Impact Tech</strong> (<a href="https://impacttech237.com" target="_blank" rel="noopener">impacttech237.com</a>). Contact et signalement d'erreur : <a href="mailto:${CONTACT}">${CONTACT}</a>.</p>
  <h2>Hébergement</h2><p>Le site est hébergé par Cloudflare, Inc. (réseau mondial, avec stockage des données de compte et de fréquentation sur la plateforme Cloudflare).</p>
  <h2>Textes et marques</h2><p>Les textes réglementaires appartiennent à leurs auteurs (COSUMAF, BVMAC, institutions de la CEMAC et de l'UMAC). Ils sont reproduits à titre d'information, avec renvoi vers les sites officiels. Les noms COSUMAF et BVMAC sont cités pour désigner ces institutions : ce site n'a aucun lien officiel avec elles.</p>
  <h2>Responsabilité</h2><p>Malgré le soin apporté, une erreur ou un retard de mise à jour reste possible (voir la <a href="#/methode">méthode de vérification</a>). L'éditeur ne peut être tenu responsable d'une décision prise à partir des informations du site. Vérifiez toujours dans le texte officiel en vigueur.</p>
  <h1 class="h2" style="margin-top:28px">Confidentialité et conditions d'utilisation</h1>
  <h2>Sans compte</h2><p>Le site fonctionne sans compte. Votre progression (flashcards, quiz, scores) reste dans votre navigateur.</p>
  <h2>Compte facultatif</h2><p>Si vous créez un compte, nous enregistrons votre adresse e-mail, votre mot de passe (conservé sous forme chiffrée, jamais en clair) et votre progression, pour la synchroniser entre vos appareils. Ces données ne sont ni vendues ni cédées. Une session est conservée par un cookie strictement nécessaire au fonctionnement du compte.</p>
  <h2>Mesure d'audience</h2><p>Nous mesurons la fréquentation de façon anonyme : pages vues, durée, recherches, téléchargements. Aucun identifiant publicitaire, aucun traceur de tiers, aucun profil individuel, et aucune donnée personnelle liée à ces mesures.</p>
  <h2>Vos droits</h2><p>Vous pouvez demander l'accès, la correction ou la suppression de vos données à <a href="mailto:${CONTACT}">${CONTACT}</a>. Vous pouvez aussi supprimer votre compte depuis la page Compte.</p>
  <h2>Utilisation</h2><p>Le site est gratuit et fourni tel quel, sans garantie d'exhaustivité ni d'exactitude. Vous pouvez citer les textes et les repères en mentionnant le texte officiel d'origine. Toute utilisation qui nuirait au fonctionnement du site (collecte automatisée massive, attaque) est interdite.</p></div>` });

views.introuvable = async () => ({ title: 'Page introuvable', html: `<div class="empty">${perso('samir', 'sad', 160)}<h1 class="h1">${lbls('Page introuvable')}</h1><p>Cette page n'existe pas ou a été déplacée.</p><a class="btn primary" href="#/">${ic('compass')} Retour à l'accueil</a></div>` });

/* ---------- routeur ---------- */
const ROUTES = { '': 'accueil', bibliotheque: 'bibliotheque', texte: 'texte', pratiquer: 'pratiquer', recherche: 'recherche', maitriser: 'quiz', quiz: 'quiz', flashcards: 'flashcards', jeux: 'jeux', progres: 'progres', compte: 'compte', textes: 'textes', acteurs: 'acteurs', exercices: 'exercices', examen: 'examen', olympiade: 'olympiade', planning: 'planning', guide: 'guide', carte: 'carte', decouvrir: 'decouvrir', comprendre: 'bibliotheque', cours: 'cours', 'a-propos': 'apropos', methode: 'methode', mentions: 'mentions' };
async function render() {
  if (!D) return;
  const [chemin, qstr] = (location.hash.slice(1) || '/').split('?');
  const segs = chemin.split('/').filter(Boolean); const nom = ROUTES[segs[0] || ''] || 'introuvable';
  marquerNav('/' + (segs[0] || ''));
  const app = $('#app');
  try {
    document.body.classList.remove('quiz-mode'); E.touches = null; E.coach.hide(); fond(MAT[nom] || MAT.accueil);
    if (nom !== 'accueil') await D.pret;
    const v = await views[nom](segs.slice(1), params(qstr));
    document.title = v.title; app.innerHTML = v.html; v.after?.(); window.MF?.pv(location.hash);
    if (!(nom === 'texte' && params(qstr).f) && !(nom === 'texte' && params(qstr).s)) window.scrollTo(0, 0);
    app.focus({ preventScroll: true });
  } catch (e) { console.error(e); app.innerHTML = `<div class="empty"><h1>Une erreur est survenue</h1><p>${esc(e.message)}</p><a class="btn" href="#/">Retour à l'accueil</a></div>`; }
}
document.addEventListener('click', e => {
  const c = e.target.closest('[data-copy]'); if (c) { e.preventDefault(); window.MF?.ev('cite', { a: (c.dataset.copy || '').slice(0, 60) }); copier(c.dataset.copy, c.dataset.copy.startsWith('http') ? 'Lien copié' : 'Copié'); }
});
document.addEventListener('keydown', e => {
  const saisie = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName);
  if (((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') || (!saisie && e.key === '/')) { e.preventDefault(); location.hash = '#/recherche'; }
});
window.addEventListener('hashchange', render);
(async () => {
  try { await charger(); } catch (e) { $('#app').innerHTML = `<div class="empty"><h1>Données indisponibles</h1><p>Impossible de charger les données. Vérifiez votre connexion puis rechargez la page.</p></div>`; return; }
  { const m = location.pathname.match(/^\/(textes|decouvrir|cours|comprendre|acteurs)\/?([a-z0-9-]*)\/?$/); if (m) { const cible = m[1] === 'acteurs' ? '/#/acteurs' + (m[2] ? '/' + m[2] : '') : m[1] === 'textes' ? (m[2] && D.T.has(m[2]) ? '/#/texte/' + m[2] : '/#/textes') : m[1] === 'cours' ? (m[2] ? '/#/cours/' + m[2] : '/#/bibliotheque') : m[1] === 'comprendre' ? '/#/bibliotheque' : '/#/' + m[1] + (m[2] ? '/' + m[2] : ''); history.replaceState(null, '', cible + location.search); } }
  cadre(); await render();
  if (compte()) synchroniser().then(r => { if (r.ok && /^#\/progres/.test(location.hash)) render(); });
  if ('serviceWorker' in navigator && /nosw/.test(location.search)) { // mode développement : pas de cache hors ligne
    navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => r.unregister())); caches?.keys().then(ks => ks.forEach(k => caches.delete(k)));
  } else if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) navigator.serviceWorker.register('/sw.js').catch(() => {});
})();
})();
