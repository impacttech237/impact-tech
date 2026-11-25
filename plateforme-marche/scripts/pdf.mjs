// Met les PDF officiels à disposition : dist/pdf/<id>.pdf (lien dur vers le fichier local, sinon copie). Les PDF ne sont pas dans git : seul data/pdf-map.json l'est.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

export function preparerPdf({ dist, racine }) {
  const carteF = path.join(racine, 'data', 'pdf-map.json'); const taille = {}; const manquants = [];
  if (!fs.existsSync(carteF)) return { taille, manquants };
  const carte = JSON.parse(fs.readFileSync(carteF, 'utf8')); fs.mkdirSync(path.join(dist, 'pdf'), { recursive: true });
  // PDF_MAX=N : ne met que les N plus petits (déploiement par étapes quand la connexion est fragile)
  const entrees = Object.entries(carte).map(([id, rel]) => [id, rel, fs.existsSync(path.join(os.homedir(), rel)) ? fs.statSync(path.join(os.homedir(), rel)).size : 0]).sort((a, b) => a[2] - b[2]);
  const max = Number(process.env.PDF_MAX) || entrees.length;
  for (const [id, rel] of entrees.slice(0, max)) {
    const src = path.join(os.homedir(), rel), dest = path.join(dist, 'pdf', `${id}.pdf`);
    if (!fs.existsSync(src)) { manquants.push(id); continue; }
    try { fs.linkSync(src, dest); } catch { fs.copyFileSync(src, dest); }
    taille[id] = fs.statSync(src).size;
  }
  return { taille, manquants };
}
