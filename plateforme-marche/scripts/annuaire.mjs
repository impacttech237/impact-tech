// Construit l'annuaire des acteurs du marché (data/annuaire.json) à partir des listes officielles de la COSUMAF et de la BVMAC
// (sources/annuaire/*.json, relevées sur cosumaf.org et bvm-ac.org le 25/11/2026), puis télécharge les logos et photos
// dans site/img/acteurs/. Usage : node scripts/annuaire.mjs [--sans-images]
import fs from 'node:fs';
import path from 'node:path';
import { racine } from './valider.mjs';

const src = f => JSON.parse(fs.readFileSync(path.join(racine, 'sources', 'annuaire', f), 'utf8'));
const interm = src('intermediaires-brut.json'), autres = src('autres-brut.json'), curated = JSON.parse(fs.readFileSync(path.join(racine, 'data', 'annuaire-institutions.json'), 'utf8'));
const propre = s => String(s ?? '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;|&#160;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim() || null;
const slug = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const nom = s => propre(s);
const catSdb = { 'Sociétés de Bourse': 'societe-de-bourse', "Sociétés de Gestion d'OPC": 'sgo', 'CIF': 'cif', 'Prestataire de Service sur Actifs Numériques (PSAN)': 'psan', 'Conseillers en Financement Participatif': 'financement-participatif', 'Etablissement de crédit agréés': 'etablissement-credit' };
const pays = Object.fromEntries(interm.pays.map(p => [p.id, p.name]));
const catIv = Object.fromEntries(autres.cats.map(c => [c.id, c.name]));
const URL_COSUMAF = 'https://cosumaf.org';
const acteurs = [], images = [];

const ajoute = (a, logoUrl, photoUrl) => {
  if (acteurs.some(x => x.id === a.id)) a.id += '-' + (acteurs.filter(x => x.id.startsWith(a.id)).length + 1);
  if (logoUrl) { const ext = (logoUrl.split('?')[0].match(/\.(png|jpe?g|webp|gif|svg)$/i) || ['', 'png'])[1].toLowerCase(); a.logo = `/img/acteurs/${a.id}.${ext}`; images.push([logoUrl, a.logo]); } else a.logo = null;
  if (photoUrl && a.dirigeants?.[0]) { const ext = (photoUrl.match(/\.(png|jpe?g|webp)$/i) || ['', 'jpg'])[1].toLowerCase(); a.dirigeants[0].photo = `/img/acteurs/${a.id}-dirigeant.${ext}`; images.push([photoUrl, a.dirigeants[0].photo]); }
  acteurs.push(a);
};

// 1. Institutions et organismes centraux (relevés à la main sur les sites officiels)
for (const c of curated) ajoute({ ...c, logoUrl: undefined, photoUrl: undefined }, c.logoUrl, c.photoUrl);

// 2. Intermédiaires agréés par la COSUMAF (liste officielle)
for (const x of interm.all) {
  if (/Bourse des Valeurs Mobili/i.test(x.name)) continue; // la BVMAC figure dans les institutions
  const type = catSdb[x.category?.name] || 'intermediaire';
  ajoute({
    id: slug(x.name), type, nom: nom(x.name), pays: x.country?.name || pays[x.country_id] || null, ville: propre(x.city), adresse: propre([x.location, x.po_box ? 'BP ' + x.po_box : ''].filter(Boolean).join(', ')),
    tel: propre([x.phone, x.phone2].filter(Boolean).join(' / ')), email: propre(x.email), site: x.website || null,
    agrement: x.approval_number ? { numero: propre(x.approval_number), date: x.approval_date } : null,
    dirigeants: x.manager_name ? [{ nom: propre(x.manager_name), titre: propre(x.manager_title) || 'Dirigeant' }] : [],
    source: { nom: 'COSUMAF : liste des intermédiaires', url: `${URL_COSUMAF}/liste-intermediaires` },
  }, x.logo_url);
}

// 3. Intervenants : commissaires aux comptes, analystes, agences de notation, etc.
const typeIv = n => /commissaire/i.test(n) ? 'cac' : /analyste/i.test(n) ? 'analyste' : /notation/i.test(n) ? 'agence-notation' : /garantie/i.test(n) ? 'organisme-garantie' : /sponsor/i.test(n) ? 'listing-sponsor' : 'intervenant';
for (const x of autres.iv) {
  const cat = catIv[x.contributor_category_id] || 'Intervenant';
  ajoute({
    id: slug(x.name), type: typeIv(cat), nom: nom(x.name), categorie: cat, pays: pays[x.country_id] || null, ville: propre(x.city), adresse: propre([x.location, x.po_box ? 'BP ' + x.po_box : ''].filter(Boolean).join(', ')),
    tel: propre([x.phone, x.phone2].filter(Boolean).join(' / ')), email: propre(x.email), site: x.website || null,
    agrement: x.approval_number ? { numero: propre(x.approval_number), date: x.approval_date } : null,
    dirigeants: x.manager_name ? [{ nom: propre(x.manager_name), titre: 'Dirigeant' }] : [],
    source: { nom: 'COSUMAF : liste des intervenants', url: `${URL_COSUMAF}/liste-intervenants` },
  }, x.logo_url);
}

// 4. Émetteurs enregistrés à la COSUMAF
for (const x of autres.em) {
  ajoute({ id: slug(x.name), type: 'emetteur', nom: nom(x.name), pays: pays[x.country_id] || null, ville: propre(x.city), secteur: propre(x.activity_sector), forme: propre(x.legal_form_label || x.legal_form),
    description: propre(x.description), site: x.website || null, dirigeants: x.manager_name ? [{ nom: propre(x.manager_name), titre: 'Dirigeant' }] : [],
    source: { nom: 'COSUMAF : liste des émetteurs', url: `${URL_COSUMAF}/liste-emetteurs` } }, x.photo_url);
}

// 5. Coopérations (partenaires institutionnels)
for (const x of autres.co) {
  ajoute({ id: slug(x.name), type: 'cooperation', nom: nom(x.name), description: propre(x.description), site: x.website || null, depuis: x.start_date || null,
    source: { nom: 'COSUMAF : coopérations', url: `${URL_COSUMAF}/cooperations` } }, x.logo_url);
}

fs.writeFileSync(path.join(racine, 'data', 'annuaire.json'), JSON.stringify(acteurs, null, 1));
const par = acteurs.reduce((o, a) => (o[a.type] = (o[a.type] || 0) + 1, o), {});
console.log(`${acteurs.length} acteurs :`, par, `| ${images.length} images à télécharger`);

// 6. Téléchargement des images
if (!process.argv.includes('--sans-images')) {
  const dest = path.join(racine, 'site', 'img', 'acteurs'); fs.mkdirSync(dest, { recursive: true });
  const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120 Safari/537.36';
  let ok = 0, absent = 0; const echecs = [];
  const un = async ([u, rel]) => {
    const f = path.join(racine, 'site', rel); if (fs.existsSync(f) && fs.statSync(f).size > 200) { ok++; return; }
    try { const r = await fetch(u, { headers: { 'user-agent': UA } }); if (!r.ok) throw new Error(r.status); const b = Buffer.from(await r.arrayBuffer()); fs.writeFileSync(f, b); ok++; } catch (e) { absent++; echecs.push(`${u} (${e.message})`); }
  };
  const file = [...images]; await Promise.all(Array.from({ length: 6 }, async () => { while (file.length) await un(file.shift()); }));
  console.log(`Images : ${ok} ok, ${absent} échecs`); if (echecs.length) console.log(echecs.slice(0, 8).join('\n'));
  // une entrée sans image téléchargée perd son chemin
  for (const a of acteurs) { if (a.logo && !fs.existsSync(path.join(racine, 'site', a.logo))) a.logo = null; for (const d of a.dirigeants || []) if (d.photo && !fs.existsSync(path.join(racine, 'site', d.photo))) delete d.photo; }
  fs.writeFileSync(path.join(racine, 'data', 'annuaire.json'), JSON.stringify(acteurs, null, 1));
}
