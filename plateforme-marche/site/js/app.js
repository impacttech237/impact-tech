/* Marché financier CEMAC — application (sans dépendance). Routage par # : accueil, bibliothèque, texte, pratiquer, recherche, maîtriser, à propos. */
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
const perso = (qui = 'kofi', humeur = 'joy', taille = 160, o = {}) => `<div class="pz ${o.fixe ? '' : 'bob'}" style="width:${taille}px;height:${taille}px;--pc:${PERSO_COULEUR[qui] || '#8fa9ff'}"><span class="blob"></span><img src="/img/persos/${qui}-${humeur}.svg" alt="" width="${taille}" height="${taille}" ${o.flip ? 'style="transform:scaleX(-1)"' : ''} draggable="false"></div>`;
const lbls = txt => String(txt).split(/\s+/).filter(Boolean).map((m, i) => `<span class="lbl l${i % 6 + 1}" style="--r:${[-1.6, 1.1, -.6, 1.5, -1.1, .8][i % 6]}deg">${esc(m)}</span>`).join(' ');
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

/* ---------- libellés ---------- */
const TYPE = { instruction: 'Instruction', reglement: 'Règlement', reglement_general: 'Règlement général', reglement_ueac: 'Règlement UEAC', reglement_bvmac: 'Règlement général BVMAC', instruction_bvmac: 'Instruction BVMAC', acte_additionnel: 'Acte additionnel', circulaire: 'Lettre circulaire', lignes_directrices: 'Lignes directrices', communique: 'Communiqué', traite: 'Traité', convention: 'Convention', acte_uniforme: 'Acte uniforme', guide: 'Guide' };
const TYPE_PLURIEL = { instruction: 'Instructions COSUMAF', reglement: 'Règlements', reglement_general: 'Règlements généraux', reglement_ueac: 'Règlement UEAC', reglement_bvmac: 'Règlement général BVMAC', instruction_bvmac: 'Instructions BVMAC', acte_additionnel: 'Actes additionnels', circulaire: 'Lettres circulaires', lignes_directrices: 'Lignes directrices', communique: 'Communiqués', traite: 'Traité', convention: 'Convention', acte_uniforme: 'Acte uniforme', guide: 'Guide' };
const ORG = { cosumaf: 'COSUMAF', bvmac: 'BVMAC', cemac: 'CEMAC', umac: 'UMAC', ueac: 'UEAC', ohada: 'OHADA' };
const STATUT = { en_vigueur: 'En vigueur', abroge: 'Abrogé', modifie: 'Modifié', projet: 'Projet' };
const COUV = { complete: 'Texte couvert en entier', partielle: 'Couverture partielle', contexte: 'Fiche de contexte' };
const SECTIONS = { delai: 'Délais', montant: 'Montants et seuils', role: 'Rôles des acteurs', definition: 'Définitions', liste: 'Listes à retenir', piege: 'Pièges' };
const SPECIAL = { 'r19-intro': 'Règlement CEMAC/UMAC de 2019 (introduction en bourse des États)', 'rg-23': 'Règlement général de la COSUMAF (2023)', 'rbv-08': 'Règlement général de la BVMAC (2008)', 'rbv-25': 'Règlement général de la BVMAC (2025)', 'rfi-07': 'Règlement UEAC 14/07 (régime fiscal BVMAC)', 'r06-03': 'Règlement 06/03 (organisation du marché, ancien)' };

let D = null;
const T = id => D.T.get(id);
const shortName = t => {
  if (SPECIAL[t.id]) return SPECIAL[t.id];
  const base = TYPE[t.type] || ''; const n = t.numero || '';
  return fold(n).startsWith(fold(base)) ? n : `${base} ${n}`.trim();
};
const dateCourte = t => { const d = (t.date_texte || '').split(',')[0]; return /^\d/.test(d) ? ' du ' + d : d ? ` (${d})` : ''; };
const citation = (t, article) => `${shortName(t)}${dateCourte(t)}${article ? ', ' + article : ''}`;
const themeNom = id => D.themes.get(id)?.nom || id;

/* ---------- données ---------- */
async function charger() {
  const [idx, faits] = await Promise.all([fetch('/data/index.json').then(r => r.json()), fetch('/data/faits.json').then(r => r.json())]);
  D = { ...idx, faits, T: new Map(idx.textes.map(t => [t.id, t])), themes: new Map(idx.themes.map(t => [t.id, t])), parTexte: new Map() };
  D.parId = new Map(faits.map(f => [f.id, f]));
  for (const f of faits) { if (!D.parTexte.has(f.t)) D.parTexte.set(f.t, []); D.parTexte.get(f.t).push(f); }
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
const NAV = [['/', 'Accueil'], ['/decouvrir', 'Découvrir'], ['/bibliotheque', 'Bibliothèque'], ['/flashcards', 'Flashcards'], ['/quiz', 'Quiz'], ['/jeux', 'Jeux'], ['/pratiquer', 'Pratiquer'], ['/recherche', 'Chercher'], ['/progres', 'Progrès'], ['/a-propos', 'À propos']];
function cadre() {
  $('#top').innerHTML = `<nav class="nav" aria-label="Navigation principale">${NAV.map(([h, l]) => `<a href="#${h}" data-nav="${h}">${l}</a>`).join('')}<a href="#/compte" data-nav="/compte" class="acct" aria-label="Compte">${ic('user')}<i class="dot"></i></a></nav>`;
  majIconeCompte();
  $('#foot').innerHTML = `<div class="foot-in"><div><strong>Outil d'aide à la lecture, non officiel.</strong> Il ne remplace pas les textes publiés par la COSUMAF et la BVMAC. Les textes viennent des sites officiels de la COSUMAF et de la BVMAC : citez toujours le texte publié.</div>
    <div>Gratuit, sans compte. Données du ${esc(D.genere_le)} · version ${esc(D.version)} · ${D.stats.textes} textes, ${D.stats.faits} faits. <a href="#/a-propos">En savoir plus</a> · <a href="/textes/">Liste des textes</a></div></div>`;
}
const marquerNav = path => { $$('[data-nav]').forEach(a => { const h = a.dataset.nav; const on = h === '/' ? path === '/' : path.startsWith(h) || (h === '/bibliotheque' && (path.startsWith('/texte') || path.startsWith('/cours'))); if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); }); };

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
const MAT = { accueil: '#2f7d4e', decouvrir: '#2f7d4e', comprendre: '#35569e', bibliotheque: '#2f7d4e', flashcards: '#2c7a8f', quiz: '#3a5fb8', jeux: '#3a5fb8', progres: '#2f7d4e', compte: '#2c7a8f', cours: '#2c7a8f', pratiquer: '#35569e', recherche: '#2f7d4e', maitriser: '#3a5fb8', apropos: '#2f7d4e', introuvable: '#c2392f' };
const MAT_ORG = { cosumaf: '#35569e', bvmac: '#d9692f', cemac: '#2c7a8f', umac: '#c99a2e', ueac: '#c2392f', ohada: '#6b4fb0' };
const fond = c => document.documentElement.style.setProperty('--mat', c);
const views = {};

views.accueil = async () => {
  const gs = await chargerGuides().catch(() => []); await chargerCoursIdx();
  const nbPdf = D.textes.filter(t => t.pdf).length, nbEnVigueur = D.textes.filter(t => t.statut === 'en_vigueur').length;
  const exemples = ['délai visa APE', 'capital minimum société de bourse', 'placement privé', 'agrément dirigeant'];
  const vedettes = ['rbv-25.delai.19', 'r01-22.delai.03', 'rbv-25.montant.01', 'aa06-17.montant.01'].map(id => D.parId.get(id)).filter(Boolean);
  const public_ = [
    ['#/decouvrir', 'lightbulb', 'Grand public', 'Je veux comprendre la bourse', 'Épargner, acheter, vendre, se protéger : les bases expliquées simplement, chaque affirmation renvoyant à son article.', 'Découvrir'],
    ['#/bibliotheque', 'graduation-cap', 'Étudiants', 'J\'étudie le marché financier', 'Dix cours complets : résumés, fiches, schémas animés et glossaire, puis flashcards et quiz pour retenir.', 'Ouvrir les cours'],
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
  return { title: 'Marché financier CEMAC : textes, délais, montants', html: `
    <section class="hero">
      <h1 class="h1"><span class="lbl l6" style="--r:-2deg">Marché financier</span><br><span class="lbl l1" style="--r:1.2deg">CEMAC</span></h1>
      <span class="hand">Les textes, délais et montants du marché, en un clic</span>
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
  const cours = await chargerCoursIdx();
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
          ? `<div class="hint"><p>Ouvrez un cours sur l'étagère, ou cherchez.</p><a class="btn" id="all" href="#/bibliotheque?tout=1">${ic('library')} Voir les ${D.textes.length} textes</a></div>`
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

views.cours = async ([id], q) => {
  const idx = await chargerCoursIdx(), meta = idx.find(c => c.id === id); if (!meta) return views.introuvable();
  const p = await chargerCours(id);
  const TABS = [['resume', 'Résumé'], ['fiches', 'Fiches'], ['schemas', 'Schémas'], ...(p.chapitres.some(c => (c.prof || []).length) ? [['prof', 'Le coach insiste']] : []), ['gloss', 'Glossaire'], ['textes', `Textes${meta.textes.length ? ' (' + meta.textes.length + ')' : ''}`]];
  const tab = TABS.some(([k]) => k === q.t) ? q.t : 'resume', chFiltre = p.chapitres.some(c => c.id === q.ch) ? q.ch : '';
  const chs = chFiltre ? p.chapitres.filter(c => c.id === chFiltre) : p.chapitres, base = `#/cours/${id}`, chq = chFiltre ? `&ch=${chFiltre}` : '';
  const due = chs.flatMap(c => (c.cartes || []).map((_, i) => `${id}:${c.id}:${i}`)).filter(k => !ET.cards[k] || ET.cards[k].due <= Date.now()).length;
  const m = mastCours(meta); let corps = '', schemas = [];
  if (tab === 'fiches') {
    corps = chs.map(c => `<h2><span class="lbl l2">${esc(nomChap(c.titre))}</span></h2>` + (c.fiches || []).map((f, i) => `<div class="fiche s${i % 5 + 1}"><h3>${esc(f.titre)}</h3>${mdBloc(f.contenu)}</div>`).join('') + (c.mnemos || []).map(t => `<div class="fiche mnemo"><small>Astuce mnémotechnique</small>${mdBloc(t)}</div>`).join('')).join('');
  } else if (tab === 'schemas') {
    const liste = chs.flatMap(c => (c.schemas || []).map(v => ({ ...v, ch: c.titre }))); schemas = liste;
    corps = liste.length ? `<div class="vzbar" style="grid-column:1/-1"><span class="vzhint">Touche un élément : il s'anime et se détaille.</span><button class="chip" id="vzt" type="button">${ic('brain-circuit')} Mode test : cacher les légendes</button></div>` + chs.filter(c => (c.schemas || []).length).map(c => `<h2 class="vzchap"><span class="lbl l6">${esc(nomChap(c.titre))}</span></h2><div class="vzgrid">${c.schemas.map(v => B.viz.card(v, liste.findIndex(x => x.titre === v.titre && x.ch === c.titre))).join('')}</div>`).join('') : '<p class="muted">Pas encore de schéma pour ce cours.</p>';
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
    <div class="cbtns"><a class="btn" href="#/flashcards/run${qs({ cours: id })}">${ic('layers')} Flashcards${due ? ` · ${due} à revoir` : ''}</a><a class="btn ghost" href="#/quiz/run${qs({ cours: id })}">${ic('circle-check')} Quiz</a><a class="btn ghost sm" href="#/jeux">${ic('gamepad-2')} Jeux</a></div>
    ${p.chapitres.length > 1 ? (p.chapitres.length > 6 ? `<div class="chip-row"><select class="chsel" id="chsel" aria-label="Chapitre"><option value="">Tous les chapitres (${p.chapitres.length})</option>${p.chapitres.map(c => `<option value="${esc(c.id)}" ${chFiltre === c.id ? 'selected' : ''}>${esc(c.titre)}</option>`).join('')}</select></div>` : `<div class="chip-row"><a class="chip ${chFiltre ? '' : 'on'}" href="${base}?t=${tab}">Tous les chapitres</a>${p.chapitres.map(c => `<a class="chip ${chFiltre === c.id ? 'on' : ''}" href="${base}?t=${tab}&ch=${c.id}">${esc(nomChap(c.titre))}</a>`).join('')}</div>`) : ''}
    <nav class="tabsrow" aria-label="Rubriques du cours">${TABS.map(([k, l]) => `<a class="chip" aria-pressed="${tab === k}" href="${base}?t=${k}${chq}">${l}</a>`).join('')}</nav>
    <div class="panel ${tab === 'resume' ? 'resume' : ''}" id="panel">${corps}</div>`,
    after() {
      fond(MAT_COURS[p.couleur] || MAT.bibliotheque);
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

const factHtml = (f, avecSource) => {
  const t = T(f.t);
  const cite = citation(t, f.a);
  const act = `<span class="act">${avecSource ? `<a class="srcl" href="#/texte/${f.t}${qs({ f: f.id })}">${esc(shortName(t))}</a>` : ''}${f.a ? `<span class="art">${esc(f.a)}</span>` : ''}<button class="btn sm" data-copy="${esc(cite)}" title="Copier la citation" aria-label="Copier la citation">${ic('quote')}</button></span>`;
  if (f.y === 'piege') return `<li id="f-${f.id}">${md(f.v)}</li>`;
  if (f.y === 'liste') return `<div class="fact" id="f-${f.id}"><div class="q">${esc(f.q)}</div><div class="v"><ul style="margin:0;padding-left:18px;font-weight:400">${(f.i || []).map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>${act}</div>`;
  if (f.y === 'role' || f.y === 'definition') return `<div class="fact" id="f-${f.id}"><div class="q">${esc(f.q)}</div><div class="v" style="font-weight:400">${esc(f.v)}</div>${act}</div>`;
  return `<div class="fact" id="f-${f.id}"><div class="q">${esc(f.q)}</div><div class="v">${esc(f.v)}${f.n ? `<small>${esc(f.n)}</small>` : ''}</div>${act}</div>`;
};

views.texte = async ([id], q) => {
  const t = T(id); if (!t) return views.introuvable();
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
      <div class="actions">
        ${t.pdf ? `<a class="btn" href="/pdf/${t.id}.pdf" download="${esc(shortName(t).replace(/[\/:*?"<>|]+/g, '-'))}.pdf">${ic('download')} Télécharger le PDF <small>(${t.pdf > 1e6 ? (t.pdf / 1e6).toFixed(1) + ' Mo' : Math.max(1, Math.round(t.pdf / 1e3)) + ' Ko'})</small></a>` : ''}
        ${t.url ? `<a class="btn ${t.pdf ? 'ghost' : ''}" href="${esc(t.url)}" target="_blank" rel="noopener">${ic('external-link')} Site officiel</a>` : ''}
        <button class="btn ghost" data-copy="${esc(citation(t))}">${ic('quote')} Copier la référence</button>
        <details class="more"><summary class="btn ghost">Plus</summary><div class="menu">
          <button class="btn sm" data-copy="${esc(location.origin + '/#/texte/' + id)}">${ic('link')} Copier le lien</button>
          <button class="btn sm" id="csvt" ${faits.some(f => f.y === 'delai' || f.y === 'montant') ? '' : 'disabled'}>${ic('download')} Délais et montants (CSV)</button>
          <button class="btn sm" onclick="print()">${ic('printer')} Imprimer</button>
          <button class="btn sm" data-copy="${esc(`Erreur signalée sur « ${shortName(t)} » (${id}), version ${D.version} : `)}">${ic('flag')} Signaler une erreur</button>
        </div></details>
      </div></header>
    ${t.statut === 'abroge' ? `<div class="banner bad">${ic('triangle-alert')}<div><strong>Ce texte est abrogé.</strong> Ne le citez pas comme droit en vigueur.</div></div>` : ''}
    ${t.couverture !== 'complete' ? `<div class="banner info">${ic('info')}<div><strong>${COUV[t.couverture]}.</strong> ${t.couverture === 'partielle' ? 'Cette fiche reprend les points clés, pas tous les articles.' : 'Cette fiche situe le texte sans détailler ses dispositions.'}</div></div>` : ''}
    ${rel.length ? `<div class="rel">${rel.join('')}</div>` : ''}
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

views.recherche = async (_a, q) => {
  const terme = (q.q || '').trim(); const ts = termes(terme);
  const retenir = ts.length ? await chargerRetenir() : [];
  const rt = ts.length ? classer(D.textes, noteTexte, ts) : { liste: [] }, rf = ts.length ? classer(D.faits, noteFait, ts) : { liste: [] }, rp = ts.length ? classer(retenir, notePoint, ts) : { liste: [] };
  const textes = rt.liste, faits = rf.liste, points = rp.liste, approx = rt.relaxe || rf.relaxe || rp.relaxe;
  const hitFait = f => { const t = T(f.t); return `<a class="hit" href="#/texte/${f.t}${qs({ f: f.id })}"><span class="h">${f.y === 'piege' ? hlFold(f.v.replace(/\*\*/g, ''), ts) : hlFold(f.q, ts)}</span><span class="s">${f.y === 'piege' ? '' : `<strong>${hlFold(f.v.length > 160 ? f.v.slice(0, 160) + '…' : f.v, ts)}</strong> · `}${f.a ? esc(f.a) + ' · ' : ''}${esc(shortName(t))}${t.statut === 'abroge' ? ' <span class="badge bad">abrogé</span>' : ''} <span class="badge">${ONGLETS[f.y]}</span></span></a>`; };
  let limFaits = 30;
  const html = !ts.length ? `<div class="empty">${perso('lina', 'think', 140)}<p>Saisissez un mot ou une expression : un délai, un montant, un acteur, un numéro de texte.</p></div>` : `
    <p class="count" aria-live="polite">${textes.length} texte${textes.length > 1 ? 's' : ''}, ${faits.length} fait${faits.length > 1 ? 's' : ''}, ${points.length} point${points.length > 1 ? 's' : ''} à retenir pour « ${esc(terme)} »</p>
    ${approx ? `<div class="banner info">${ic('info')}<div>Aucun résultat ne contient tous les mots : voici les plus proches. Essayez moins de mots pour affiner.</div></div>` : ''}
    ${textes.length ? `<h2 class="sec"><span class="lbl l1">Textes</span></h2><div class="hits">${textes.slice(0, 8).map(t => `<a class="hit" href="#/texte/${t.id}"><span class="h">${hlFold(shortName(t), ts)}</span><span class="s">${hlFold(t.titre, ts)} ${badgeStatut(t)}</span></a>`).join('')}</div>${textes.length > 8 ? `<p class="small muted">… et ${textes.length - 8} autres : <a href="#/bibliotheque${qs({ q: terme, statut: 'tous' })}">voir dans la bibliothèque</a>.</p>` : ''}` : ''}
    ${faits.length ? `<h2 class="sec"><span class="lbl l6">Délais, montants, rôles</span></h2><div class="hits" id="hf">${faits.slice(0, limFaits).map(hitFait).join('')}</div><p><button class="btn" id="mf" ${faits.length > limFaits ? '' : 'hidden'}>Afficher plus</button></p>` : ''}
    ${points.length ? `<h2 class="sec"><span class="lbl l2">Points à retenir</span></h2><div class="hits">${points.slice(0, 15).map(r => { const t = T(r.t); return `<a class="hit" href="#/texte/${r.t}${qs({ s: 'retenir' })}"><span class="h">${hlFold(r.x.replace(/\*\*/g, ''), ts)}</span><span class="s">${esc(shortName(t))}${t.statut === 'abroge' ? ' <span class="badge bad">abrogé</span>' : ''}</span></a>`; }).join('')}</div>` : ''}
    ${!textes.length && !faits.length && !points.length ? `<div class="empty">${perso('samir', 'sad', 130)}<p>Aucun résultat pour « ${esc(terme)} ».</p><p class="small">Essayez un mot plus court, sans accent, ou un seul mot-clé (par exemple « visa » plutôt que « délai du visa APE »).</p></div>` : ''}`;
  if (terme) window.MF?.ev('search', { a: terme, n: textes.length + faits.length + points.length });
  return { title: terme ? `Recherche : ${terme}` : 'Recherche', html: `<h1 class="h1">${lbls('Chercher')}</h1><form class="bigsearch" id="rs" role="search"><label for="rq" class="sr">Rechercher</label><input id="rq" type="search" value="${esc(terme)}" placeholder="Délai, montant, acteur, numéro…" autocomplete="off"><button class="btn" type="submit">${ic('search')} Rechercher</button></form><div class="results">${html}</div>`,
    after() {
      $('#rs').addEventListener('submit', e => { e.preventDefault(); location.hash = '#/recherche' + qs({ q: $('#rq').value.trim() }); });
      $('#mf')?.addEventListener('click', () => { limFaits += 30; $('#hf').innerHTML = faits.slice(0, limFaits).map(hitFait).join(''); if (faits.length <= limFaits) $('#mf').hidden = true; });
      if (!terme) $('#rq').focus();
    } };
};

/* ---------- Entraînement : flashcards et quiz, mécanique reprise de la plateforme Excellence ---------- */
const DAY = 864e5;
const ET = Object.assign({ cards: {}, quiz: {}, errors: {}, days: {}, history: [], xp: 0, scores: {} }, store.get('etude', {}));
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
const REACTIONS = () => [ic('thumbs-up'), ic('heart', 'fill'), E.face('angry', 38), E.face('think', 38), E.face('wow', 38), E.face('laugh', 38)];
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
      return `<a class="tile" href="#/jeux/${k}${qs({ theme: th })}"><span class="ico">${ic(g.ico)}</span><h3>${g.nom}</h3><p>${g.desc}</p><small>${sc != null ? `Record : <b>${sc} ${g.unit}</b>` : 'Pas encore joué'}</small></a>`; }).join('')}</div>`,
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
const ICONE_H = { quiz: 'circle-check', game: 'gamepad-2', flash: 'layers' };
const titreH = h => h.type === 'game' ? (GAMES[h.game]?.nom || 'Jeu') : h.type === 'quiz' ? 'Quiz' : 'Flashcards';
const scoreH = h => h.type === 'flash' ? `${h.n} cartes` : h.type === 'game' ? (h.game === 'memory' ? `${h.score} coups` : `${h.score} pts`) : `${h.score} / ${h.max}`;
const coursH = id => id ? ((coursIdx || []).find(c => c.id === id)?.court || (id === 'textes' ? 'Repères des textes' : nomTheme(id))) : 'Tous les cours';
const connue = k => (ET.cards[k.id]?.ivl || 0) >= 3;
function graphBarres(pts) {
  if (!pts.length) return '<p class="muted">Aucun quiz pour l\'instant.</p>';
  const W = 640, H = 200, L = 34, T = 12, Bt = 26, bw = Math.min(34, (W - L - 10) / pts.length - 4), y = v => T + (H - T - Bt) * (1 - v / 100);
  return `<svg viewBox="0 0 ${W} ${H}" class="chart" role="img">${[0, 50, 100].map(v => `<line x1="${L}" x2="${W - 8}" y1="${y(v)}" y2="${y(v)}" stroke="rgba(74,47,29,.12)"/><text x="${L - 6}" y="${y(v) + 4}" text-anchor="end" font-size="11" fill="#7a5c44">${v}%</text>`).join('')}
    ${pts.map((p, i) => { const x = L + 8 + i * (bw + 4); const c = p.v >= 70 ? '#4a8a3a' : p.v >= 40 ? '#dfa93b' : '#d4563a'; return `<rect x="${x}" y="${y(p.v)}" width="${bw}" height="${y(0) - y(p.v)}" rx="5" fill="${c}"><title>${esc(p.label)} : ${p.v}%</title></rect>`; }).join('')}</svg>`;
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
    ['target', 'Quiz parfait', 'Réussir un quiz sans aucune erreur', H.some(h => h.type === 'quiz' && h.score === h.max && h.max >= 5)],
    ['gamepad-2', 'Touche-à-tout', 'Essayer 4 jeux différents', jeux.size >= 4],
    ['calendar-check', 'Régulier', 'Réviser pendant 10 jours différents', jours >= 10],
    ['sprout', 'Thème maîtrisé à 50 %', 'Atteindre 50 % de maîtrise dans un thème', tm],
    ['gem', 'Niveau 5', 'Atteindre le niveau Confirmé', niveau(ET.xp || 0).n >= 5],
  ];
}
views.progres = async () => {
  const H = ET.history, xp = ET.xp || 0, lv = niveau(xp), serie = serieJours();
  const sess = H.filter(h => h.type === 'quiz' && h.max).slice(-20).map(h => ({ v: Math.round(h.score / h.max * 100), label: `${titreH(h)} · ${coursH(h.course)} · ${jourCourt(h.t)}` }));
  const rep = Object.keys(ET.quiz).length, ok = Object.values(ET.quiz).filter(v => v === 1).length;
  await chargerCoursIdx(); const totalCartes = coursIdx.reduce((n, c) => n + c.n.cartes, 0), sues = Object.entries(ET.cards).filter(([k, v]) => k.startsWith('p') && k.includes(':') && (v.ivl || 0) >= 3).length, semaine = H.filter(h => h.t > Date.now() - 7 * DAY).length;
  const records = Object.entries(ET.scores).map(([k, v]) => { const [g, c] = k.split(':'); return { g, c, v }; }).filter(r => GAMES[r.g]).sort((a, b) => a.g.localeCompare(b.g));
  const tr = trophees(), obtenus = tr.filter(b => b[3]).length;
  return { title: 'Progrès', html: `
    <h1 class="h1">${lbls('Progrès')}</h1>
    <div class="levelcard"><div class="who">${perso('kofi', lv.n >= 3 ? 'lol' : 'joy', 130)}</div>
      <div class="lv"><small>Niveau ${lv.n}</small><h2>${lv.name}</h2><div class="bar" style="max-width:none"><i style="width:${lv.pct}%"></i></div>
      <p class="muted">${xp} points d'expérience${lv.nxt ? ` · encore ${lv.nxt - xp} pour le niveau ${lv.n + 1}` : ' · niveau maximum atteint'}</p></div></div>
    ${compte() ? '' : `<div class="banner info">${ic('cloud')}<div><strong>Garde ta progression.</strong> Un compte facultatif la sauvegarde et la synchronise entre tes appareils. <a href="#/compte">Créer un compte</a></div></div>`}
    <div class="kgrid">
      <div class="kpi">${ic('flame')}<b>${serie}</b><span>jour${serie > 1 ? 's' : ''} de suite</span></div>
      <div class="kpi">${ic('layers')}<b>${sues}<small>/${totalCartes}</small></b><span>cartes bien retenues</span></div>
      <div class="kpi">${ic('circle-check')}<b>${rep ? Math.round(ok / rep * 100) + '%' : '–'}</b><span>réussite aux quiz</span></div>
      <div class="kpi">${ic('activity')}<b>${semaine}</b><span>activités cette semaine</span></div>
      <div class="kpi">${ic('award')}<b>${obtenus}<small>/${tr.length}</small></b><span>badges obtenus</span></div></div>
    <h2 class="sec"><span class="lbl l2">Réussite aux derniers quiz</span></h2><div class="card chartcard">${graphBarres(sess)}</div>
    <h2 class="sec"><span class="lbl l6">Régularité, 12 semaines</span></h2><div class="card">${calendrier()}</div>
    <h2 class="sec"><span class="lbl l1">Maîtrise par cours</span></h2><div class="card">${coursIdx.map(c => `<div class="crow"><a class="nm" href="#/cours/${c.id}">${esc(c.court)}</a><div class="bar"><i style="width:${mastCours(c)}%"></i></div><span class="pc">${mastCours(c)}%</span></div>`).join('')}</div>
    <h2 class="sec"><span class="lbl l4">Records des jeux</span></h2>${records.length ? `<div class="kgrid recs">${records.map(r => `<div class="kpi">${ic(GAMES[r.g].ico)}<b>${r.v}</b><span>${GAMES[r.g].nom} · ${esc(coursH(r.c === 'all' ? '' : r.c))} (${GAMES[r.g].unit})</span></div>`).join('')}</div>` : '<p class="onmat">Aucun record pour l\'instant : lance un jeu !</p>'}
    <h2 class="sec"><span class="lbl l5">Badges</span></h2><div class="trophies">${tr.map(([i, n, d, o]) => `<div class="trophy ${o ? 'on' : ''}">${ic(i)}<b>${n}</b><small>${d}</small></div>`).join('')}</div>
    <h2 class="sec"><span class="lbl l2">Historique récent</span></h2>${H.length ? `<div class="card hist2">${[...H].reverse().slice(0, 25).map(h => `<div class="hrow">${ic(ICONE_H[h.type] || 'activity')}<span class="nm"><b>${esc(titreH(h))}</b> <small class="muted">${esc(coursH(h.course))}</small></span><b class="sc">${scoreH(h)}</b><small class="muted">${jourCourt(h.t)}</small></div>`).join('')}</div>` : '<p class="onmat">Ton historique apparaîtra ici.</p>'}
    <div style="margin-top:34px"><button class="btn ghost" id="reset">Réinitialiser ma progression</button></div>`,
    after() { $('#reset').onclick = () => { if (confirm('Effacer toute ta progression (scores, historique, niveau) ?')) { for (const k of Object.keys(ET)) delete ET[k]; Object.assign(ET, { cards: {}, quiz: {}, errors: {}, days: {}, history: [], xp: 0, scores: {} }); sauver(); render(); } }; } };
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
  if (!id) return { title: P.nom, html: `
    <h1 class="h1">${lbls(P.nom)}</h1><span class="hand">${P.sous}</span>
    <div class="persoline">${perso(P.perso[0], P.perso[1], 130)}</div>
    <ol class="list guides">${gs.map((g, i) => `<li><a class="card item" href="#/${porte}/${g.id}"><span class="num">${i + 1}</span><span class="t">${esc(g.titre)}</span><span class="sub">${esc(g.accroche)}</span><span class="meta"><span>${nbRepères(g)} repères sourcés</span></span></a></li>`).join('')}</ol>`,
    after() { fond(P.mat); } };
  const i = gs.findIndex(g => g.id === id); if (i < 0) return views.introuvable();
  const g = gs[i], prec = gs[i - 1], suiv = gs[i + 1];
  const corps = g.blocs.map(b => {
    if (b.p) return `<div class="sheet"><p>${md(b.p)}</p></div>`;
    if (b.note) return `<div class="banner info">${ic('lightbulb')}<div>${md(b.note)}</div></div>`;
    if (b.faits) return `<h2 class="sec"><span class="lbl l2">${esc(b.titre || 'Dans les textes')}</span></h2><div class="sheet"><div class="facts">${b.faits.map(x => D.parId.get(x)).filter(Boolean).map(x => factHtml(x, true)).join('')}</div></div>`;
    return '';
  }).join('');
  return { title: `${g.titre} : ${P.nom}`, html: `
    <div class="crumbs"><a href="#/${porte}">${P.nom}</a> ${ic('chevron-right')} <span>${esc(g.titre)}</span></div>
    <header class="doc-head"><h1 class="h1">${lbls(g.titre)}</h1><p class="full">${esc(g.accroche)}</p></header>
    ${corps}
    <div class="actions" style="margin-top:34px">
      <a class="btn" href="#/flashcards/run${qs({ theme: g.theme })}">${ic('layers')} Réviser ce thème</a>
      <a class="btn ghost" href="#/quiz/run${qs({ theme: g.theme })}">${ic('circle-check')} Quiz sur ce thème</a>
      <a class="btn ghost" href="#/bibliotheque${qs({ theme: g.theme })}">${ic('library')} Voir les textes</a></div>
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
  const d = Object.assign({ cards: {}, quiz: {}, errors: {}, days: {}, history: [], xp: 0, scores: {} }, dist || {});
  for (const [id, c] of Object.entries(d.cards || {})) { const l = ET.cards[id]; if (!l || (c.reps || 0) > (l.reps || 0) || ((c.reps || 0) === (l.reps || 0) && (c.due || 0) > (l.due || 0))) ET.cards[id] = c; }
  for (const [id, v] of Object.entries(d.quiz || {})) ET.quiz[id] = Math.max(ET.quiz[id] ?? 0, v);
  for (const [id, v] of Object.entries(d.errors || {})) ET.errors[id] = Math.max(ET.errors[id] || 0, v);
  for (const [j, v] of Object.entries(d.days || {})) ET.days[j] = Math.max(ET.days[j] || 0, v);
  const vus = new Set(ET.history.map(h => h.t + '|' + h.type));
  for (const h of d.history || []) if (!vus.has(h.t + '|' + h.type)) ET.history.push(h);
  ET.history.sort((a, b) => a.t - b.t); ET.history = ET.history.slice(-600);
  ET.xp = Math.max(ET.xp || 0, d.xp || 0);
  for (const [k, v] of Object.entries(d.scores || {})) { const bas = GAMES[k.split(':')[0]]?.low; const l = ET.scores[k]; if (l == null || (bas ? v < l : v > l)) ET.scores[k] = v; }
}
let timerSync = 0;
function planifierSync() { if (!compte()) return; clearTimeout(timerSync); timerSync = setTimeout(() => synchroniser(), 2500); }
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
  <div class="sheet about"><h2>À quoi ça sert</h2><p>Les professionnels du marché financier relisent sans cesse les mêmes textes. Ici, on retrouve en quelques secondes un délai, un montant, un rôle ou un piège, avec l'article et le texte d'origine. C'est gratuit et sans compte.</p>
  <h2>Ce que contient la base</h2><p>${D.stats.textes} textes (49 instructions de la COSUMAF, règlements CEMAC et UMAC, règlement général de la COSUMAF, règlement général et instructions de la BVMAC, lettres circulaires, lignes directrices, actes additionnels) et ${D.stats.faits} faits : délais, montants, rôles, définitions, listes et pièges.</p>
  <h2>D'où viennent les textes</h2><p>Tous les textes ont été téléchargés sur les sites officiels de la COSUMAF et de la BVMAC. Chaque fiche renvoie vers le site officiel.</p>
  <h2>Couverture</h2><ul><li><strong>${COUV.complete}</strong> : les dispositions sont reprises.</li><li><strong>${COUV.partielle}</strong> : points clés seulement (délais, montants, rôles, pièges).</li><li><strong>${COUV.contexte}</strong> : situe le texte sans détailler ses dispositions.</li></ul>
  <h2>Statut des textes</h2><p>Un texte « abrogé » est remplacé par un autre : la fiche indique par quel texte.</p>
  <h2>Sources officielles</h2><ul><li><a href="https://cosumaf.org/nos-documents" target="_blank" rel="noopener">COSUMAF : médiathèque</a></li><li><a href="https://www.bvm-ac.org/textes-reglementaires/" target="_blank" rel="noopener">BVMAC : textes réglementaires</a></li></ul>
  <h2>Compte facultatif</h2><p>Tout fonctionne sans compte. Si vous en créez un (e-mail et mot de passe), votre progression est sauvegardée et synchronisée entre vos appareils. Aucune autre donnée personnelle n'est demandée, et vous pouvez supprimer votre compte à tout moment.</p>
  <h2>Hors connexion</h2><p>Après une première visite, le site fonctionne sans réseau.</p>
  <h2>Données</h2><p>Version ${esc(D.version)}, générée le ${esc(D.genere_le)}.</p></div>` });

views.introuvable = async () => ({ title: 'Page introuvable', html: `<div class="empty">${perso('samir', 'sad', 160)}<h1 class="h1">${lbls('Page introuvable')}</h1><p>Cette page n'existe pas ou a été déplacée.</p><a class="btn primary" href="#/">${ic('compass')} Retour à l'accueil</a></div>` });

/* ---------- routeur ---------- */
const ROUTES = { '': 'accueil', bibliotheque: 'bibliotheque', texte: 'texte', pratiquer: 'pratiquer', recherche: 'recherche', maitriser: 'quiz', quiz: 'quiz', flashcards: 'flashcards', jeux: 'jeux', progres: 'progres', compte: 'compte', decouvrir: 'decouvrir', comprendre: 'bibliotheque', cours: 'cours', 'a-propos': 'apropos' };
async function render() {
  if (!D) return;
  const [chemin, qstr] = (location.hash.slice(1) || '/').split('?');
  const segs = chemin.split('/').filter(Boolean); const nom = ROUTES[segs[0] || ''] || 'introuvable';
  marquerNav('/' + (segs[0] || ''));
  const app = $('#app');
  try {
    document.body.classList.remove('quiz-mode'); E.touches = null; E.coach.hide(); fond(MAT[nom] || MAT.accueil);
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
  { const m = location.pathname.match(/^\/(textes|decouvrir|cours|comprendre)\/?([a-z0-9-]*)\/?$/); if (m) { const cible = m[1] === 'textes' ? (m[2] && D.T.has(m[2]) ? '/#/texte/' + m[2] : '/#/bibliotheque') : m[1] === 'cours' ? (m[2] ? '/#/cours/' + m[2] : '/#/bibliotheque') : m[1] === 'comprendre' ? '/#/bibliotheque' : '/#/' + m[1] + (m[2] ? '/' + m[2] : ''); history.replaceState(null, '', cible + location.search); } }
  cadre(); await render();
  if (compte()) synchroniser().then(r => { if (r.ok && /^#\/progres/.test(location.hash)) render(); });
  if ('serviceWorker' in navigator && /nosw/.test(location.search)) { // mode développement : pas de cache hors ligne
    navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => r.unregister())); caches?.keys().then(ks => ks.forEach(k => caches.delete(k)));
  } else if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) navigator.serviceWorker.register('/sw.js').catch(() => {});
})();
})();
