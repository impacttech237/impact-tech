// Pages statiques par texte (référencement) : dist/textes/<id>/index.html, dist/textes/index.html, sitemap.xml, robots.txt.
// Chaque page contient le texte de la fiche déjà écrit dans le HTML ; l'application prend ensuite la main (voir app.js).
import fs from 'node:fs';
import path from 'node:path';

const TYPE = { instruction: 'Instruction', reglement: 'Règlement', reglement_general: 'Règlement général', reglement_ueac: 'Règlement UEAC', reglement_bvmac: 'Règlement général BVMAC', instruction_bvmac: 'Instruction BVMAC', acte_additionnel: 'Acte additionnel', circulaire: 'Lettre circulaire', lignes_directrices: 'Lignes directrices', communique: 'Communiqué', traite: 'Traité', convention: 'Convention', acte_uniforme: 'Acte uniforme', guide: 'Guide' };
const ORG = { cosumaf: 'COSUMAF', bvmac: 'BVMAC', cemac: 'CEMAC', umac: 'UMAC', ueac: 'UEAC', ohada: 'OHADA' };
const STATUT = { en_vigueur: 'En vigueur', abroge: 'Abrogé', modifie: 'Modifié', projet: 'Projet' };
const SPECIAL = { 'r19-intro': 'Règlement CEMAC/UMAC de 2019 (introduction en bourse des États)', 'rg-23': 'Règlement général de la COSUMAF (2023)', 'rbv-08': 'Règlement général de la BVMAC (2008)', 'rbv-25': 'Règlement général de la BVMAC (2025)', 'rfi-07': 'Règlement UEAC 14/07 (régime fiscal BVMAC)', 'r06-03': 'Règlement 06/03 (organisation du marché, ancien)' };
const SECTIONS = { delai: 'Délais', montant: 'Montants et seuils', role: 'Rôles des acteurs', definition: 'Définitions', liste: 'Listes à retenir', piege: 'Pièges' };

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const md = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
const fold = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const nom = t => { if (SPECIAL[t.id]) return SPECIAL[t.id]; const base = TYPE[t.type] || ''; const n = t.numero || ''; return fold(n).startsWith(fold(base)) ? n : `${base} ${n}`.trim(); };
const coupe = (s, n) => { s = String(s || '').replace(/\*\*/g, '').replace(/\s+/g, ' ').trim(); return s.length <= n ? s : s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…'; };

export function genererPages({ dist, racine, textes, faits, siteUrl, lancement, pdf = {}, guides = [] }) {
  const gabarit = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
  const ecrire = (rel, contenu) => { const f = path.join(dist, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, contenu); };
  const page = ({ titre, description, canon, corps, json }) => gabarit
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(titre)}</title>`)
    .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(description)}">\n<link rel="canonical" href="${canon}">\n<meta property="og:title" content="${esc(titre)}">\n<meta property="og:description" content="${esc(description)}">\n<meta property="og:type" content="article">\n<meta property="og:url" content="${canon}">\n<meta property="og:locale" content="fr_FR">\n<script type="application/ld+json">${JSON.stringify(json).replace(/</g, '\\u003c')}</script>`)
    .replace(/<main id="app"[^>]*>[\s\S]*?<\/main>/, `<main id="app" tabindex="-1" aria-live="polite">${corps}</main>`);

  const parTexte = new Map();
  for (const f of faits) { if (!parTexte.has(f.texte)) parTexte.set(f.texte, []); parTexte.get(f.texte).push(f); }
  const par = new Map(textes.map(t => [t.id, t]));
  const lien = id => par.has(id) ? `<a href="/textes/${id}/">${esc(nom(par.get(id)))}</a>` : esc(id);
  const urls = [`${siteUrl}/`, `${siteUrl}/textes/`];

  for (const t of textes) {
    const c = t.contenu || {}, fs_ = parTexte.get(t.id) || [], canon = `${siteUrl}/textes/${t.id}/`;
    const sous = fold(t.titre).startsWith(fold(nom(t))) ? t.titre.slice(nom(t).length).replace(/^[\s,:–-]+/, '') : t.titre;
    const blocs = [];
    if (c.essentiel) blocs.push(`<section><h2>L'essentiel</h2><p>${md(c.essentiel)}</p></section>`);
    if ((c.retenir || []).length) blocs.push(`<section><h2>À retenir</h2><ul>${c.retenir.map(x => `<li>${md(x)}</li>`).join('')}</ul></section>`);
    for (const [type, titre] of Object.entries(SECTIONS)) {
      const l = fs_.filter(f => f.type === type); if (!l.length) continue;
      blocs.push(`<section><h2>${titre}</h2>${type === 'piege' ? `<ul>${l.map(f => `<li>${md(f.valeur_texte)}</li>`).join('')}</ul>` : `<dl>${l.map(f => `<dt>${esc(f.enonce)}</dt><dd>${type === 'liste' ? esc((f.items || []).join(' ; ')) : esc(f.valeur_texte)}${f.article ? ` <small>(${esc(f.article)})</small>` : ''}</dd>`).join('')}</dl>`}</section>`);
    }
    const rel = [];
    if (t.abroge_par?.length) rel.push(`<p>Abrogé par : ${t.abroge_par.map(lien).join(', ')}</p>`);
    if (t.abroge?.length) rel.push(`<p>Abroge : ${t.abroge.map(lien).join(', ')}</p>`);
    const corps = `<article class="seo"><nav><a href="/">Accueil</a> › <a href="/textes/">Textes</a></nav>
      <h1>${esc(nom(t))}</h1>${sous ? `<p><strong>${esc(sous)}</strong></p>` : ''}
      <p>${esc(STATUT[t.statut] || t.statut)} · ${esc(ORG[t.organisme] || '')}${t.date_texte ? ` · ${esc(t.date_texte)}` : ''}</p>
      ${t.statut === 'abroge' ? '<p><strong>Ce texte est abrogé.</strong></p>' : ''}${rel.join('')}
      ${blocs.join('')}${pdf[t.id] ? `<p><a href="/pdf/${t.id}.pdf">Télécharger le PDF (${(pdf[t.id] / 1e6).toFixed(1)} Mo)</a></p>` : ''}${t.source?.url_officielle ? `<p><a href="${esc(t.source.url_officielle)}" rel="noopener">Lire le texte officiel</a></p>` : ''}
      <p><a href="/#/texte/${t.id}">Ouvrir la fiche interactive</a></p>
      <p><small>Outil d'aide à la lecture, non officiel : il ne remplace pas les textes publiés par la COSUMAF et la BVMAC.</small></p></article>`;
    const titre = SPECIAL[t.id] ? nom(t) : `${nom(t)} : ${coupe(sous || t.titre, 70)}`;
    const description = coupe(c.essentiel || c.objet || t.titre, 155);
    ecrire(`textes/${t.id}/index.html`, page({ titre, description, canon, corps, json: {
      '@context': 'https://schema.org', '@type': 'WebPage', name: titre, description, inLanguage: 'fr', url: canon,
      about: { '@type': 'Thing', name: nom(t), description: t.titre },
      isPartOf: { '@type': 'WebSite', name: 'Marché financier CEMAC', url: siteUrl + '/' },
      breadcrumb: { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Accueil', item: siteUrl + '/' }, { '@type': 'ListItem', position: 2, name: 'Textes', item: siteUrl + '/textes/' }, { '@type': 'ListItem', position: 3, name: nom(t), item: canon }] } } }));
    urls.push(canon);
  }

  // Guides « Découvrir » et « Comprendre » : une page par chapitre + une page par porte
  const PORTES = { decouvrir: { nom: 'Découvrir', sous: 'La bourse expliquée simplement : épargner, acheter, vendre, se protéger.' } };
  const parId = new Map(faits.map(f => [f.id, f]));
  const valeur = f => f.type === 'liste' ? (f.items || []).join(' ; ') : f.valeur_texte;
  for (const [porte, P] of Object.entries(PORTES)) {
    const gs = guides.filter(g => g.porte === porte);
    for (const g of gs) {
      const canon = `${siteUrl}/${porte}/${g.id}/`;
      const corps = `<article class="seo"><nav><a href="/">Accueil</a> › <a href="/${porte}/">${P.nom}</a></nav><h1>${esc(g.titre)}</h1><p><strong>${esc(g.accroche)}</strong></p>
        ${g.blocs.map(b => b.p ? `<p>${md(b.p)}</p>` : b.note ? `<p><em>${md(b.note)}</em></p>` : b.liste || b.puces ? `${b.titre ? `<h2>${esc(b.titre)}</h2>` : ''}<ul>${(b.liste || b.puces).map(x => `<li>${md(x)}</li>`).join('')}</ul>` : b.etapes ? `${b.titre ? `<h2>${esc(b.titre)}</h2>` : ''}<ol>${b.etapes.map(x => `<li>${md(x)}</li>`).join('')}</ol>` : b.chiffres ? `<ul>${b.chiffres.map(x => `<li><strong>${esc(x.v)}</strong> ${esc(x.l)}</li>`).join('')}</ul>` : b.chrono ? `<h2>${esc(b.titre || 'Les grandes dates')}</h2><ul>${b.chrono.map(x => `<li><strong>${esc(x.an)}</strong> : ${esc(x.t)}</li>`).join('')}</ul>` : b.acteurs ? `<h2>${esc(b.titre || 'Acteurs')}</h2><ul>${b.acteurs.map(id => `<li><a href="/acteurs/${id}/">${esc(id)}</a></li>`).join('')}</ul>` : b.faits ? `<section><h2>${esc(b.titre || 'Dans les textes')}</h2><dl>${b.faits.map(id => parId.get(id)).filter(Boolean).map(f => { const t = par.get(f.texte); return `<dt>${esc(f.enonce)}</dt><dd>${esc(valeur(f))}${f.article ? ` <small>(${esc(f.article)}, ${t ? lien(t.id) : ''})</small>` : ''}</dd>`; }).join('')}</dl></section>` : '').join('')}
        <p><a href="/#/${porte}/${g.id}">Ouvrir la version interactive</a></p></article>`;
      const description = coupe(g.accroche + ' ' + (g.blocs.find(b => b.p)?.p || ''), 155), titre = `${g.titre} | ${P.nom}`;
      ecrire(`${porte}/${g.id}/index.html`, page({ titre, description, canon, corps, json: { '@context': 'https://schema.org', '@type': 'Article', headline: g.titre, description, inLanguage: 'fr', url: canon, isPartOf: { '@type': 'WebSite', name: 'Marché financier CEMAC', url: siteUrl + '/' } } }));
      urls.push(canon);
    }
    const corpsPorte = `<article class="seo"><nav><a href="/">Accueil</a></nav><h1>${P.nom}</h1><p>${esc(P.sous)}</p><ol>${gs.map(g => `<li><a href="/${porte}/${g.id}/">${esc(g.titre)}</a> : ${esc(g.accroche)}</li>`).join('')}</ol></article>`;
    ecrire(`${porte}/index.html`, page({ titre: `${P.nom} : marché financier de la CEMAC`, description: P.sous, canon: `${siteUrl}/${porte}/`, corps: corpsPorte, json: { '@context': 'https://schema.org', '@type': 'CollectionPage', name: P.nom, description: P.sous, inLanguage: 'fr', url: `${siteUrl}/${porte}/` } }));
    urls.push(`${siteUrl}/${porte}/`);
  }

  // Cours : une page par cours (résumé, fiches, définitions) + index
  const mdBloc = x => String(x).split(/\n\n+/).map(b => {
    const lines = b.split('\n');
    if (lines.every(l => l.startsWith('|'))) { const rows = lines.filter(l => !/^\|[\s:|-]+\|?$/.test(l)).map(l => l.replace(/^\||\|$/g, '').split('|').map(c => md(c.trim()))); return '<table><thead><tr>' + rows[0].map(c => `<th>${c}</th>`).join('') + '</tr></thead><tbody>' + rows.slice(1).map(r => '<tr>' + r.map(c => `<td>${c}</td>`).join('') + '</tr>').join('') + '</tbody></table>'; }
    if (lines.every(l => l.startsWith('- '))) return '<ul>' + lines.map(l => `<li>${md(l.slice(2))}</li>`).join('') + '</ul>';
    if (lines.every(l => /^\d+\.\s/.test(l))) return '<ol>' + lines.map(l => `<li>${md(l.replace(/^\d+\.\s/, ''))}</li>`).join('') + '</ol>';
    return '<p>' + lines.map(md).join('<br>') + '</p>';
  }).join('');
  const nomChap = x => String(x).replace(/^[^·]*·\s*(\d+\s*·\s*)?/, '');
  const dossierCours = path.join(racine, 'data', 'cours'), listeCours = [];
  const ordreCours = ['p0-cadre', 'p1-entrer-en-bourse', 'p2-appel-public', 'p3-placement-prive', 'p4-vie-du-titre', 'p5-ordre-denouement', 'p6-intermediaires', 'p7-fonds', 'p8-conformite-sanctions', 'p9-reperes', 'epreuves'];
  const liensCours = JSON.parse(fs.readFileSync(path.join(racine, 'data', 'cours-textes.json'), 'utf8'));
  for (const id of ordreCours) {
    const pk = JSON.parse(fs.readFileSync(path.join(dossierCours, id + '.json'), 'utf8')); listeCours.push(pk);
    const canon = `${siteUrl}/cours/${id}/`, ts = textes.filter(x => (liensCours[id] || []).includes(x.theme));
    const corps = `<article class="seo"><nav><a href="/">Accueil</a> › <a href="/cours/">Cours</a></nav><h1>${esc(pk.titre)}</h1><p><strong>${esc(pk.description || '')}</strong></p>
      ${pk.chapitres.map(c => `<section><h2>${esc(nomChap(c.titre))}</h2>${mdBloc(c.resume?.moyen || '')}
        ${(c.fiches || []).map(f => `<h3>${esc(f.titre)}</h3>${mdBloc(f.contenu)}`).join('')}
        ${(c.mnemos || []).length ? `<h3>À retenir</h3>${c.mnemos.map(m => mdBloc(m)).join('')}` : ''}
        ${(c.definitions || []).length ? `<h3>Définitions</h3><dl>${c.definitions.map(d => `<dt>${esc(d.terme)}</dt><dd>${esc(d.definition)}</dd>`).join('')}</dl>` : ''}</section>`).join('')}
      ${ts.length ? `<section><h2>Textes officiels</h2><ul>${ts.map(x => `<li>${lien(x.id)}</li>`).join('')}</ul></section>` : ''}
      <p><a href="/#/cours/${id}">Ouvrir le cours interactif (schémas, flashcards, quiz)</a></p></article>`;
    const description = coupe(pk.description || pk.chapitres[0]?.resume?.court || pk.titre, 155), titre = `${pk.titre} : cours`;
    ecrire(`cours/${id}/index.html`, page({ titre, description, canon, corps, json: { '@context': 'https://schema.org', '@type': 'Course', name: pk.titre, description, inLanguage: 'fr', url: canon, provider: { '@type': 'Organization', name: 'Marché financier CEMAC', url: siteUrl + '/' } } }));
    urls.push(canon);
  }
  ecrire('cours/index.html', page({ titre: 'Cours sur le marché financier de la CEMAC', description: 'Onze cours gratuits : cadre institutionnel, entrée en bourse, appel public à l\'épargne, placement privé, intermédiaires, fonds, conformité.', canon: `${siteUrl}/cours/`, corps: `<article class="seo"><nav><a href="/">Accueil</a></nav><h1>Cours sur le marché financier de la CEMAC</h1><ol>${listeCours.map(pk => `<li><a href="/cours/${pk.id}/">${esc(pk.titre)}</a> : ${esc(coupe(pk.description || '', 140))}</li>`).join('')}</ol></article>`, json: { '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Cours', inLanguage: 'fr', url: `${siteUrl}/cours/` } }));
  urls.push(`${siteUrl}/cours/`);

  // Annuaire des acteurs : une page par acteur + index
  const TYPE_A = { regulateur: 'Régulateur', 'organisme-central': 'Organisme central', cooperation: 'Institution partenaire', 'societe-de-bourse': 'Société de bourse', sgo: "Société de gestion d'OPC", cif: 'Conseiller en investissements financiers', psan: 'Prestataire sur actifs numériques', 'financement-participatif': 'Conseiller en financement participatif', 'etablissement-credit': 'Établissement de crédit agréé', intermediaire: 'Intermédiaire', cac: 'Commissaire aux comptes', analyste: 'Analyste financier', 'agence-notation': 'Agence de notation', 'organisme-garantie': 'Organisme de garantie', 'listing-sponsor': 'Listing sponsor', intervenant: 'Intervenant', emetteur: 'Émetteur' };
  const annuaire = JSON.parse(fs.readFileSync(path.join(racine, 'data', 'annuaire.json'), 'utf8'));
  const parcours = JSON.parse(fs.readFileSync(path.join(racine, 'data', 'parcours-acteurs.json'), 'utf8'));
  for (const a of annuaire) {
    const canon = `${siteUrl}/acteurs/${a.id}/`, nomA = a.nomCourt || a.nom, lieu = [a.ville, a.pays].filter(Boolean).join(', ');
    const corps = `<article class="seo"><nav><a href="/">Accueil</a> › <a href="/acteurs/">Acteurs</a></nav><h1>${esc(a.nom)}</h1>
      <p><strong>${esc(TYPE_A[a.type] || '')}</strong>${lieu ? ' · ' + esc(lieu) : ''}</p>${a.description ? `<p>${esc(a.description)}</p>` : ''}
      ${(a.dirigeants || []).length ? `<h2>Direction</h2><ul>${a.dirigeants.map(d => `<li>${esc(d.nom)} : ${esc(d.titre)}${d.depuis ? ' (depuis ' + esc(d.depuis) + ')' : ''}</li>`).join('')}</ul>` : ''}
      <h2>Informations</h2><ul>${a.agrement ? `<li>Agrément : ${esc(a.agrement.numero)}${a.agrement.date ? ' (' + esc(a.agrement.date) + ')' : ''}</li>` : ''}${a.adresse ? `<li>Adresse : ${esc(a.adresse)}</li>` : ''}${a.tel ? `<li>Téléphone : ${esc(a.tel)}</li>` : ''}${a.email ? `<li>E-mail : ${esc(a.email)}</li>` : ''}${a.site ? `<li>Site : <a href="${esc(a.site)}" rel="noopener">${esc(a.site)}</a></li>` : ''}</ul>
      <p><small>Source : <a href="${esc(a.source.url)}" rel="noopener">${esc(a.source.nom)}</a>. Outil d'aide à la lecture, non officiel.</small></p>
      <p><a href="/#/acteurs/${a.id}">Ouvrir la fiche interactive</a></p></article>`;
    const titre = `${nomA} : ${TYPE_A[a.type] || 'acteur du marché'}${lieu ? ', ' + lieu : ''}`;
    const description = coupe(`${a.nom}, ${TYPE_A[a.type] || 'acteur du marché financier'}${lieu ? ' (' + lieu + ')' : ''}. ${a.description || ''}`, 155);
    ecrire(`acteurs/${a.id}/index.html`, page({ titre, description, canon, corps, json: { '@context': 'https://schema.org', '@type': 'Organization', name: a.nom, url: a.site || canon, address: lieu ? { '@type': 'PostalAddress', addressLocality: a.ville || undefined, addressCountry: a.pays || undefined } : undefined, description } }));
    urls.push(canon);
  }
  const parType = {}; for (const a of annuaire) (parType[TYPE_A[a.type] || 'Autres'] ||= []).push(a);
  ecrire('acteurs/index.html', page({ titre: 'Les acteurs du marché financier de la CEMAC : COSUMAF, BVMAC, sociétés de bourse', description: `${annuaire.length} acteurs : institutions, sociétés de bourse agréées, sociétés de gestion, commissaires aux comptes, émetteurs.`, canon: `${siteUrl}/acteurs/`, corps: `<article class="seo"><nav><a href="/">Accueil</a></nav><h1>Les acteurs du marché financier de la CEMAC</h1><p>${esc(parcours.heroine.presentation)}</p>${parcours.etapes.map(e => `<section><h2>Étape ${e.n} : ${esc(e.titre)}</h2><p><em>${esc(e.histoire)}</em></p>${e.texte.map(x => `<p>${md(x)}</p>`).join('')}<p><strong>À retenir :</strong> ${esc(e.retenir)}</p></section>`).join('')}<h2>Annuaire complet</h2>${Object.entries(parType).map(([n, l]) => `<section><h2>${esc(n)} (${l.length})</h2><ul>${l.map(a => `<li><a href="/acteurs/${a.id}/">${esc(a.nomCourt || a.nom)}</a>${a.ville || a.pays ? ' : ' + esc([a.ville, a.pays].filter(Boolean).join(', ')) : ''}</li>`).join('')}</ul></section>`).join('')}</article>`, json: { '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Acteurs du marché financier CEMAC', inLanguage: 'fr', url: `${siteUrl}/acteurs/` } }));
  urls.push(`${siteUrl}/acteurs/`);

  // Index des textes (point d'entrée pour les moteurs de recherche)
  const groupes = {};
  for (const t of textes.slice().sort((a, b) => (b.date_adoption || '').localeCompare(a.date_adoption || ''))) (groupes[ORG[t.organisme] || 'Autres'] ||= []).push(t);
  const corpsIndex = `<article class="seo"><nav><a href="/">Accueil</a></nav><h1>Tous les textes du marché financier de la CEMAC</h1>
    <p>${textes.length} textes de la COSUMAF, de la BVMAC et de la CEMAC, avec leur statut, leurs délais, montants et rôles.</p>
    ${Object.entries(groupes).map(([o, l]) => `<section><h2>${esc(o)}</h2><ul>${l.map(t => `<li><a href="/textes/${t.id}/">${esc(nom(t))}</a> : ${esc(coupe(t.titre, 110))}${t.statut === 'abroge' ? ' (abrogé)' : ''}</li>`).join('')}</ul></section>`).join('')}</article>`;
  const descIndex = `Liste des ${textes.length} textes du marché financier de l'Afrique centrale (COSUMAF, BVMAC, CEMAC) avec leur statut.`;
  ecrire('textes/index.html', page({ titre: 'Tous les textes du marché financier de la CEMAC', description: descIndex, canon: `${siteUrl}/textes/`, corps: corpsIndex, json: { '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Textes du marché financier CEMAC', description: descIndex, inLanguage: 'fr', url: `${siteUrl}/textes/` } }));

  // Plan du site, consignes aux robots
  const jour = new Date().toISOString().slice(0, 10);
  ecrire('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `<url><loc>${u}</loc><lastmod>${jour}</lastmod></url>`).join('\n')}\n</urlset>\n`);
  ecrire('robots.txt', lancement ? `User-agent: *\nAllow: /\nSitemap: ${siteUrl}/sitemap.xml\n` : '# Préversion : ne pas indexer. Lancer le build avec LANCEMENT=1 pour ouvrir aux moteurs de recherche.\nUser-agent: *\nDisallow: /\n');
  const h = fs.readFileSync(path.join(dist, '_headers'), 'utf8');
  ecrire('_headers', lancement ? h.replace(/\n  X-Robots-Tag: noindex, nofollow/, '') : h);
  return urls.length;
}
