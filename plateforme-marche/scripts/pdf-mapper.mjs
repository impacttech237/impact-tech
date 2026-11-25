// Associe chaque texte à son PDF local (dossiers Téléchargements de l'équipe) -> data/pdf-map.json (chemins relatifs au dossier personnel).
// Usage : node scripts/pdf-mapper.mjs   (à relancer quand de nouveaux PDF sont téléchargés)
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { racine } from './valider.mjs';
const H = os.homedir();
const dossiers = ['Downloads/cosumaf', 'Downloads/cosumaf-manquants', 'Downloads/Preparation COSUMAF'];
const fichiers = dossiers.flatMap(d => fs.existsSync(path.join(H, d)) ? fs.readdirSync(path.join(H, d)).filter(f => /\.pdf$/i.test(f)).map(f => `${d}/${f}`) : []);
const textes = fs.readdirSync(path.join(racine, 'data', 'textes')).map(f => JSON.parse(fs.readFileSync(path.join(racine, 'data', 'textes', f), 'utf8')));
const carte = {}, sans = [];
const cherche = re => fichiers.find(f => re.test(f.split('/').pop()) && !/DOC à modifier/i.test(f));
for (const t of textes) {
  let f = null; const m = t.id.match(/^i(\d\d)-(\d\d)$/);
  if (t.source?.fichier_local) { const rel = t.source.fichier_local.split(String.fromCharCode(92)).join('/'); if (fs.existsSync(path.join(H, rel))) f = rel; }
  if (!f && m) f = cherche(new RegExp(`^${m[1]}_.*n°${m[1]}-${m[2]}|^${m[1]}_`, 'i'));
  const l = t.id.match(/^lc-(\d{3})-(\d\d)$/); if (!f && l) f = cherche(new RegExp(`Lettre-circulaire-${l[1]}-${l[2]}`, 'i'));
  const regles = { 'ld-dos': /Lignes-directrices-declarations/i, 'ld-vigilance': /Lignes-directrices-vigilance/i, 'r19-intro': /introduction-en-bourse-participations/i, 'cc-03-20': /Communique-COSUMAF-03-20/i, 'cc-01-08': /communique-cosumaf-o1-08/i, 'tr-cemac-09': /Traite-revise-CEMAC/i, 'conv-umac-08': /Convention-UMAC/i, 'au-ohada-14': /Acte-uniforme-OHADA/i, 'guide-ovsd-26': /Guide-obligations-vertes/i,
    'rbv-08': /^Reglement-BVMAC|^LE-REGLEMENT-GENERAL-DE-LA-BVMAC/i, 'rfi-07': /^Reglement-UEAC-Regime-fiscal-BVMAC/i, 'rg-23': /^Reglement-COSUMAF-du-23-mai-2023/i, 'r04-25': /^REGLEMENT N°04-25/i, 'r01-14': /reglement-n01-14/i, 'r02-18': /reglement-n02-18/i, 'ibv-01': /instruction-n1-/i, 'ibv-02': /instruction-n2-/i, 'ibv-03': /instruction-n3-/i, 'r06-03': /reglement-portant-organisation-fonctionnement/i, 'r01-22': /^Reglment-n°01-Portant-Organisation/i, 'r03-26': /^Règlement N° 03/i };
  if (!f && regles[t.id]) f = cherche(regles[t.id]);
  if (f) carte[t.id] = f; else sans.push(`${t.id} (${t.numero})`);
}
fs.writeFileSync(path.join(racine, 'data', 'pdf-map.json'), JSON.stringify(carte, null, 1));
console.log(`${Object.keys(carte).length} / ${textes.length} textes associés à un PDF.`);
if (sans.length) console.log('Sans PDF :', sans.join(', '));
