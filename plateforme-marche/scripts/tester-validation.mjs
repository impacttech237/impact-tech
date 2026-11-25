import { charger, valider } from './valider.mjs';
const base = () => structuredClone(charger());
const cas = [
  ['abrogé sans abrogeant', d => { d.textes.find(t => t.id==='i30-24').abroge_par = []; }],
  ['abrogation à sens unique', d => { d.textes.find(t => t.id==='i44-25').abroge = []; }],
  ['thème inconnu', d => { d.textes[3].theme = 'xyz'; }],
  ['fait sans article', d => { d.faits.find(f => f.type==='delai').article = ''; }],
  ['fait vers texte inconnu', d => { d.faits[0].texte = 'i99-99'; }],
  ['« verifie » sans relecteur', d => { d.textes[0].confiance = 'verifie'; }],
  ['fait « verifie » sur texte non vérifié', d => { d.faits[0].confiance = 'verifie'; }],
  ['valeur numérique sans unité', d => { const f=d.faits.find(f=>f.type_valeur==='nombre'); f.unite=null; }],
  ['id de fait en double', d => { d.faits[1].id = d.faits[0].id; }],
  ['modification sans réciproque', d => { d.textes.find(t => t.id==='r01-22').modifie_par = []; }],
  ['acteur inconnu', d => { d.faits.find(f=>f.type==='role').acteurs=['inconnu']; }],
];
let ok = 0;
for (const [nom, f] of cas) { const d = base(); f(d); const { erreurs } = valider(d); const bon = erreurs.length > 0; ok += bon; console.log((bon ? 'OK   ' : 'RATÉ ') + nom + '  -> ' + (erreurs[0]?.code || 'aucune erreur')); }
console.log(`${ok}/${cas.length} cas attrapés`);
const d0 = base(); console.log('Données réelles :', valider(d0).erreurs.length, 'erreur(s)');
