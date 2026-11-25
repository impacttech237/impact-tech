/* Exercices de calcul : chiffres tirés au hasard à chaque fois, corrigé détaillé.
   Chaque générateur renvoie { kind:'calcul', enonce, reponse, tol, unite, corrige }.
   - « p9-reperes » (ex-coach) : calculs réglementaires (seuils, commissions, pénalités…) tirés des textes COSUMAF.
   - « p5-ordre-denouement » (ex-culture financière) : calculs de marché (VL, rendement, DPS, fixing…).                          */
(() => {
'use strict';
const ri = (a, b, step = 1) => a + step * Math.floor(Math.random() * ((b - a) / step + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const f = (n, d = 0) => Number(n).toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d });
const r2 = n => Math.round(n * 100) / 100;
const li = a => '<ul>' + a.map(x => `<li>${x}</li>`).join('') + '</ul>';
const calc = (enonce, reponse, corrige, unite = '', tol = 0) => ({ kind: 'calcul', enonce, reponse, unite, tol, corrige });

/* ---------- Calculs réglementaires (textes COSUMAF) ---------- */
const coach = [
  () => { const m = ri(5, 80); return calc(`Un émetteur mobilise <b>${f(m)} milliards FCFA</b> par appel public à l'épargne. La commission de <b>visa</b> est de <b>0,3 %</b> du montant levé (Instruction 23-24). Quel est son montant, en <b>millions de FCFA</b> ?`,
      m * 3, `0,3 % de ${f(m)} Md = ${f(m)} × 0,003 = ${f(m * 0.003, 3)} Md = <b>${f(m * 3)} millions FCFA</b>.`, 'millions FCFA'); },
  () => { const tab = [[250000, 'transmission d\'une information à la COSUMAF'], [500000, 'diffusion tardive d\'une information au public'], [750000, 'communication tardive du rapport de clôture à l\'émetteur et à la COSUMAF'], [5000000, 'publication tardive du rapport de clôture d\'un APE'], [10000000, 'remise tardive des fonds collectés à l\'émetteur']]; const [t, lib] = pick(tab), n = ri(3, 21);
    return calc(`Retard de <b>${n} jours</b> : ${lib}. La pénalité de retard est de <b>${f(t)} FCFA par jour</b> (RG art. 31 s.). Quel est son montant total, en FCFA ?`, t * n, `${f(t)} × ${n} = <b>${f(t * n)} FCFA</b>.`, 'FCFA'); },
  () => { const p = pick([1000000, 2000000, 5000000, 8000000]); return calc(`Les pénalités de retard encaissées s'élèvent à <b>${f(p)} FCFA</b>. Elles sont réparties : 30 % au FOGAMAF, 30 % au développement du marché, 40 % à la COSUMAF. Quelle est la part de la <b>COSUMAF</b> ?`,
      p * 0.4, `40 % de ${f(p)} = <b>${f(p * 0.4)} FCFA</b> (FOGAMAF : ${f(p * 0.3)} ; développement du marché : ${f(p * 0.3)}).`, 'FCFA'); },
  () => { const a = ri(2, 40) * 500; return calc(`Un OPCVM a un actif de <b>${f(a)} millions FCFA</b>. Il ne peut pas employer plus de <b>20 %</b> de ses actifs en valeurs d'un même émetteur (RG art. 411). Quel est le <b>plafond</b>, en millions FCFA ?`,
      a * 0.2, `20 % de ${f(a)} = <b>${f(a * 0.2)} millions FCFA</b>.`, 'millions FCFA'); },
  () => { const a = ri(4, 40) * 500, y = Math.round(a * ri(24, 34) / 100); const plaf = a * 0.2; return calc(`Un OPCVM de <b>${f(a)} M FCFA</b> a placé <b>${f(y)} M FCFA</b> dans les titres d'un même émetteur. Plafond de 20 %. De combien de millions faut-il <b>ramener</b> la position pour respecter la limite ?`,
      Math.max(0, y - plaf), `Plafond = 20 % × ${f(a)} = ${f(plaf)} M. Excédent = ${f(y)} − ${f(plaf)} = <b>${f(Math.max(0, y - plaf))} M FCFA</b>.`, 'millions FCFA', 0.01); },
  () => { const a = ri(2, 30) * 500; return calc(`Un OPCVM de <b>${f(a)} M FCFA</b> peut investir au plus <b>40 %</b> en titres d'un ou plusieurs États de la CEMAC (RG art. 412). Quel est ce plafond, en M FCFA ?`, a * 0.4, `40 % × ${f(a)} = <b>${f(a * 0.4)} M FCFA</b> (60 % pour l'ensemble des États).`, 'millions FCFA'); },
  () => { const d = ri(2, 90) * 10; return calc(`Un actionnaire résident touche <b>${f(d)} millions FCFA</b> de dividendes d'une société cotée à la BVMAC (valeur privée, échéance inférieure à 5 ans). La retenue à la source est de <b>10 %</b>, libératoire (Règlement UEAC 2007). Quel montant <b>net</b> perçoit-il, en millions FCFA ?`,
      d * 0.9, `Retenue = 10 % × ${f(d)} = ${f(d * 0.1)} M. Net = ${f(d)} − ${f(d * 0.1)} = <b>${f(d * 0.9)} M FCFA</b>.`, 'millions FCFA'); },
  () => { const i = ri(2, 60) * 10; return calc(`Un investisseur reçoit <b>${f(i)} millions FCFA</b> d'intérêts sur une obligation d'une société privée à <b>5 ans ou plus</b>. Retenue à la source : <b>5 %</b>. Quelle est la retenue, en millions FCFA ?`,
      i * 0.05, `5 % × ${f(i)} = <b>${f(i * 0.05, 1)} M FCFA</b>.`, 'millions FCFA', 0.01); },
  () => { const n = ri(3, 50) * 100000; return calc(`Le capital d'une société cotée est composé de <b>${f(n)} actions</b>. Au-dessus de quel nombre d'actions détenues (le <b>tiers</b> du capital) une offre publique devient-elle obligatoire ?`,
      n / 3, `1/3 × ${f(n)} = <b>${f(n / 3, 0)} actions</b>. Au-delà (plus du tiers), l'actionnaire doit informer la COSUMAF et déposer un projet d'offre sur la totalité du capital.`, 'actions', 1); },
  () => { const n = ri(2, 40) * 100000; return calc(`Société cotée : <b>${f(n)} actions</b>. Un initiateur détient 94 % puis monte à <b>95 %</b> : combien d'actions représentent les <b>5 %</b> restants qu'il pourra acquérir par OPR ?`, n * 0.05, `5 % × ${f(n)} = <b>${f(n * 0.05)} actions</b>.`, 'actions', 1); },
  () => { const m = ri(5, 90) * 10; return calc(`Une SDB exécute une transaction de <b>${f(m)} millions FCFA</b> (montant brut). Le courtage est plafonné à <b>0,5 %</b> du montant brut (Instruction 23-24). Quel est le courtage maximum, en <b>millions FCFA</b> ?`,
      m * 0.005, `0,5 % × ${f(m)} = <b>${f(m * 0.005, 2)} M FCFA</b>.`, 'millions FCFA', 0.005); },
  () => { const c = ri(10, 120); return calc(`Un émetteur introduit en bourse <b>des actions</b> pour une capitalisation de <b>${f(c)} milliards FCFA</b>. La commission d'introduction de la BVMAC est de <b>0,08 %</b> de la capitalisation (Instruction n° 3). Quel montant, en millions FCFA ?`,
      c * 80, `0,08 % × ${f(c)} Md = ${f(c)} × 0,0008 = ${f(c * 0.0008, 4)} Md = <b>${f(c * 80)} M FCFA</b>.`, 'millions FCFA', 0.5); },
  () => { const a = ri(2, 40) * 500; const t = pick([[2, 'un OPC « Actions »'], [1.5, 'un autre OPC']]); return calc(`Actif net : <b>${f(a)} M FCFA</b>. Les frais de gestion maximum d'une SGO sont de <b>${String(t[0]).replace('.', ',')} % HT</b> de l'actif net pour ${t[1]} (Instruction 23-24). Montant annuel maximum, en M FCFA ?`,
      a * t[0] / 100, `${String(t[0]).replace('.', ',')} % × ${f(a)} = <b>${f(a * t[0] / 100, 2)} M FCFA</b>.`, 'millions FCFA', 0.01); },
  () => { const c = ri(20, 400) * 10, p = ri(8, 25), b = ri(2, 7); const gain = Math.max(0, p - b); return calc(`Gestion sous mandat : portefeuille de <b>${f(c)} M FCFA</b>. Performance nette de l'année : <b>${p} %</b> ; indicateur de référence : <b>${b} %</b>. Commission de surperformance de <b>20 %</b> (plafond légal) sur la performance nette excédentaire. Montant, en M FCFA ?`,
      c * gain / 100 * 0.2, `Surperformance = ${p} − ${b} = ${gain} points → ${f(c * gain / 100, 2)} M. Commission = 20 % × ${f(c * gain / 100, 2)} = <b>${f(c * gain / 100 * 0.2, 3)} M FCFA</b>.`, 'millions FCFA', 0.01); },
  () => { const cap = pick([12, 20, 35, 45, 60, 75, 90, 120, 150]); const pct = cap < 50 ? 20 : cap < 100 ? 15 : 10; return calc(`Une société vise le compartiment <b>Premium</b> avec une capitalisation à l'introduction de <b>${cap} milliards FCFA</b>. Quelle part minimale du capital doit-elle diffuser dans le public (RG BVMAC art. 74), en <b>%</b> ?`,
      pct, `Capitalisation de ${cap} Md : ${cap < 50 ? 'inférieure à 50 Md → <b>20 %</b>' : cap < 100 ? 'entre 50 et 100 Md → <b>15 %</b>' : 'supérieure à 100 Md → <b>10 %</b>'}.`, '%'); },
  () => { const min = pick([150, 300]), kind = min === 150 ? 'un FCP (actif minimum 150 M FCFA)' : 'une SICAV (capital minimum 300 M FCFA)'; return calc(`Pour ${kind}, quel est le niveau d'actif ou de capital (en M FCFA) qui déclenche la <b>dissolution immédiate</b> (25 % du minimum) ?`,
      min * 0.25, `25 % × ${min} = <b>${f(min * 0.25, 1)} M FCFA</b>. La <b>suspension</b> des rachats intervient dès la moitié du minimum (${f(min / 2)} M).`, 'millions FCFA', 0.01); },
  () => { const c = pick([[500, '800 FCFA'], [1000, '15 000 FCFA'], [3000, '35 000 FCFA'], [4000, '80 000 FCFA'], [5000, '150 000 FCFA']]); return calc(`Un <b>acheté-vendu</b> porte sur un titre qui cote <b>${c[1]}</b>. Quel est le montant minimal (RG BVMAC art. 222) pour qu'il soit autorisé, en <b>millions de FCFA</b> ? (1-1 000 FCFA : 500 M ; 1 005-20 000 : 1 000 M ; 20 005-50 000 : 3 000 M ; 50 005-100 000 : 4 000 M ; > 100 000 : 5 000 M.)`,
      c[0], `Cours ${c[1]} → seuil de <b>${f(c[0])} millions FCFA</b>.`, 'millions FCFA'); },
  () => { const x = ri(5, 60); return calc(`CEVM : un contribuable verse <b>${f(x)} millions FCFA</b> sur son Compte Épargne en Valeurs Mobilières dans l'année. La déduction d'IRPP est plafonnée à <b>15 millions FCFA</b> par an. Quelle somme est <b>déductible</b>, en M FCFA ?`,
      Math.min(x, 15), `Plafond 15 M ; versement ${f(x)} M → déduction = <b>${f(Math.min(x, 15))} M FCFA</b>.`, 'millions FCFA'); },
  () => { const n = ri(5, 90); return calc(`Nouveau placement privé (Règlement du 7 octobre 2026) : la souscription minimale est de <b>10 M FCFA</b> par investisseur. Avec <b>${n} investisseurs</b> souscrivant chacun le minimum, quel est le montant minimal levé, en M FCFA ?`,
      n * 10, `${n} × 10 = <b>${f(n * 10)} M FCFA</b> (le nombre d'investisseurs doit rester inférieur à 100).`, 'millions FCFA'); },
  () => { const b = ri(2, 40) * 100, t = pick([[20, 'augmentation de capital ≥ 20 %'], [25, 'cession d\'actions ≥ 20 %'], [28, 'moins de 20 % du capital introduit']]); return calc(`Société cotée avec un bénéfice de <b>${f(b)} M FCFA</b>. Cas : <b>${t[1]}</b> (IS réduit pendant 3 ans, Règlement UEAC 2007). Quel est l'impôt sur les sociétés, en M FCFA ?`,
      b * t[0] / 100, `Taux applicable : <b>${t[0]} %</b> → ${f(b)} × ${t[0]} % = <b>${f(b * t[0] / 100)} M FCFA</b>.`, 'millions FCFA', 0.01); },
  () => { const m = ri(2, 90) * 100000; return calc(`Une OPV porte sur au moins <b>10 %</b> des titres de capital de même nature. Société de <b>${f(m)} titres</b> : quel est le <b>nombre minimal de titres</b> à offrir ?`, m * 0.1, `10 % × ${f(m)} = <b>${f(m * 0.1)} titres</b>.`, 'titres', 1); },
].filter(Boolean);

/* ---------- Culture financière : calculs de marché ---------- */
const equilibre = () => {
  for (let essai = 0; essai < 200; essai++) {
    const base = ri(8, 25) * 1000, step = 100, ref = base;
    const buys = [0, 1, 2].map(() => ({ p: base + ri(-3, 4) * step, q: ri(2, 12) * 100 }));
    const sells = [0, 1, 2].map(() => ({ p: base + ri(-4, 3) * step, q: ri(2, 12) * 100 }));
    const prices = [...new Set([...buys, ...sells].map(o => o.p))].sort((a, b) => a - b);
    const rows = prices.map(p => { const D = buys.filter(o => o.p >= p).reduce((s, o) => s + o.q, 0), S = sells.filter(o => o.p <= p).reduce((s, o) => s + o.q, 0); return { p, D, S, V: Math.min(D, S) }; });
    const mx = Math.max(...rows.map(r => r.V)); const cand = rows.filter(r => r.V === mx);
    if (mx > 0 && cand.length === 1) return { buys, sells, rows, win: cand[0], ref };
  }
  return { buys: [{ p: 10200, q: 400 }, { p: 10000, q: 600 }, { p: 9800, q: 300 }], sells: [{ p: 9800, q: 300 }, { p: 10000, q: 500 }, { p: 10200, q: 700 }], rows: [{ p: 9800, D: 1300, S: 300, V: 300 }, { p: 10000, D: 1000, S: 800, V: 800 }, { p: 10200, D: 400, S: 1500, V: 400 }], win: { p: 10000, D: 1000, S: 800, V: 800 }, ref: 10000 };
};

const culture = [
  () => { const an = ri(20, 900) * 10, n = ri(10, 90) * 1000; return calc(`Un OPCVM a un <b>actif net de ${f(an * 1000000)} FCFA</b> et <b>${f(n)} parts</b> en circulation. Quelle est sa <b>valeur liquidative</b> par part, en FCFA ?`,
      an * 1000000 / n, `<b>VL = actif net ÷ nombre de parts</b> = ${f(an * 1000000)} ÷ ${f(n)} = <b>${f(an * 1000000 / n, 2)} FCFA</b>.`, 'FCFA', 0.01); },
  () => { const v0 = ri(9000, 14000, 50), v1 = v0 + ri(-800, 1800, 10); return calc(`La VL d'un OPCVM passe de <b>${f(v0)} FCFA</b> à <b>${f(v1)} FCFA</b>. Quelle est la <b>performance</b> sur la période, en % (2 décimales) ?`,
      r2((v1 - v0) / v0 * 100), `<b>Performance = (VL₁ − VL₀) ÷ VL₀</b> = (${f(v1)} − ${f(v0)}) ÷ ${f(v0)} = <b>${f((v1 - v0) / v0 * 100, 2)} %</b>.`, '%', 0.01); },
  () => { const c = ri(5, 90) * 100, n = ri(2, 60) * 100000; return calc(`Une action cote <b>${f(c)} FCFA</b> et la société compte <b>${f(n)} actions</b>. Quelle est sa <b>capitalisation boursière</b>, en <b>millions de FCFA</b> ?`,
      c * n / 1000000, `<b>Capitalisation = cours × nombre d'actions</b> = ${f(c)} × ${f(n)} = ${f(c * n)} FCFA = <b>${f(c * n / 1000000)} M FCFA</b>.`, 'millions FCFA', 0.01); },
  () => { const p = ri(10, 90) * 100, d = Math.round(p * ri(3, 9) / 100 / 5) * 5; return calc(`Une action cote <b>${f(p)} FCFA</b> et verse un dividende de <b>${f(d)} FCFA</b> par action. Quel est le <b>rendement du dividende</b>, en % (2 décimales) ?`,
      r2(d / p * 100), `<b>Rendement = dividende ÷ cours</b> = ${f(d)} ÷ ${f(p)} = <b>${f(d / p * 100, 2)} %</b>.`, '%', 0.01); },
  () => { const p = ri(10, 80) * 100, b = ri(2, 12) * 50; return calc(`Une action cote <b>${f(p)} FCFA</b> ; le bénéfice par action (BPA) est de <b>${f(b)} FCFA</b>. Calcule le <b>PER</b> (price earning ratio), arrondi à 2 décimales.`,
      r2(p / b), `<b>PER = cours ÷ BPA</b> = ${f(p)} ÷ ${f(b)} = <b>${f(p / b, 2)}</b> (le marché paie l'action ${f(p / b, 2)} fois son bénéfice annuel).`, 'fois', 0.01); },
  () => { const nom = pick([10000, 100000]), t = pick([5, 5.5, 6, 6.25, 7]); return calc(`Une obligation a une valeur nominale de <b>${f(nom)} FCFA</b> et un taux nominal de <b>${String(t).replace('.', ',')} %</b>. Quel est le <b>coupon annuel</b>, en FCFA ?`,
      nom * t / 100, `Coupon = nominal × taux = ${f(nom)} × ${String(t).replace('.', ',')} % = <b>${f(nom * t / 100, 2)} FCFA</b>.`, 'FCFA', 0.01); },
  () => { const nom = pick([10000, 100000]), t = pick([5, 5.5, 6, 7]), j = ri(15, 330, 15); return calc(`Une obligation de <b>${f(nom)} FCFA</b> de nominal, taux <b>${String(t).replace('.', ',')} %</b>. Il s'est écoulé <b>${j} jours</b> entre la date de jouissance et la date de dénouement. Quel est le <b>coupon couru</b> (base exacte/365), en FCFA ?`,
      r2(nom * t / 100 * j / 365), `Coupon couru = nominal × taux × jours/365 = ${f(nom)} × ${String(t).replace('.', ',')} % × ${j}/365 = <b>${f(nom * t / 100 * j / 365, 2)} FCFA</b>. Les obligations sont cotées <b>au pied de coupon</b> : le coupon couru s'ajoute au prix.`, 'FCFA', 0.02); },
  () => { const nom = pick([10000, 100000]), c = pick([98.5, 99.25, 100.5, 101.75, 102.25]), n = ri(10, 500); return calc(`Une obligation de nominal <b>${f(nom)} FCFA</b> cote <b>${String(c).replace('.', ',')} %</b> du nominal (pied de coupon). Quel est le prix de <b>${n} obligations</b>, hors coupon couru, en FCFA ?`,
      nom * c / 100 * n, `Prix unitaire = ${f(nom)} × ${String(c).replace('.', ',')} % = ${f(nom * c / 100, 2)} FCFA ; × ${n} = <b>${f(nom * c / 100 * n, 2)} FCFA</b>.`, 'FCFA', 0.05); },
  () => { const pa = ri(40, 120) * 100, pe = Math.round(pa * 0.8 / 100) * 100; const na = ri(2, 6) * 100000, nn = ri(1, 3) * 100000; const dps = (pa - pe) * nn / (na + nn); return calc(`Augmentation de capital : <b>${f(nn)} actions nouvelles</b> émises à <b>${f(pe)} FCFA</b> pour <b>${f(na)} anciennes</b>. Le cours avant l'opération est de <b>${f(pa)} FCFA</b>. Calcule la <b>valeur théorique du droit préférentiel de souscription</b> : DPS = (cours avant − prix d'émission) × nouvelles ÷ (anciennes + nouvelles).`,
      r2(dps), `DPS = (${f(pa)} − ${f(pe)}) × ${f(nn)} ÷ (${f(na)} + ${f(nn)}) = <b>${f(dps, 2)} FCFA</b>.`, 'FCFA', 0.02); },
  () => { const c = ri(5, 90) * 1000, n = pick([2, 4, 5, 10]); return calc(`Une société <b>divise</b> la valeur de ses actions par <b>${n}</b> (une action ancienne = ${n} actions nouvelles). Le cours avant division est de <b>${f(c)} FCFA</b>. Quel est le cours théorique après division, en FCFA ?`,
      c / n, `Cours théorique = ${f(c)} ÷ ${n} = <b>${f(c / n, 2)} FCFA</b> (la capitalisation reste inchangée).`, 'FCFA', 0.01); },
  () => { const a = ri(100, 900), q1 = ri(2, 10) * 100, pa = ri(5, 40) * 100, q2 = ri(2, 10) * 100, pb = pa + ri(-3, 6) * 100; const pru = (q1 * pa + q2 * pb) / (q1 + q2); return calc(`Un investisseur achète <b>${f(q1)} actions à ${f(pa)} FCFA</b>, puis <b>${f(q2)} actions à ${f(pb)} FCFA</b>. Quel est son <b>prix de revient unitaire moyen</b>, en FCFA ?`,
      r2(pru), `PRU = (${f(q1)} × ${f(pa)} + ${f(q2)} × ${f(pb)}) ÷ ${f(q1 + q2)} = ${f(q1 * pa + q2 * pb)} ÷ ${f(q1 + q2)} = <b>${f(pru, 2)} FCFA</b>.`, 'FCFA', 0.02); },
  () => { const e = equilibre(); const tb = e.rows.map(r => `<tr><td>${f(r.p)}</td><td>${f(r.D)}</td><td>${f(r.S)}</td><td>${f(r.V)}</td></tr>`).join('');
    return calc(`<b>Fixing.</b> Carnet d'ordres à cours limité.<br>Achats : ${e.buys.map(o => `${f(o.q)} à ${f(o.p)}`).join(' ; ')}.<br>Ventes : ${e.sells.map(o => `${f(o.q)} à ${f(o.p)}`).join(' ; ')}.<br>Quel est le <b>cours du fixing</b> (celui qui maximise le volume échangé), en FCFA ?`,
      e.win.p, `Pour chaque prix : demande cumulée (achats dont la limite ≥ prix), offre cumulée (ventes dont la limite ≤ prix), volume = minimum des deux.<table class="mdtbl"><tr><th>Prix</th><th>Demande</th><th>Offre</th><th>Volume</th></tr>${tb}</table>Volume maximal : <b>${f(e.win.V)}</b> au prix de <b>${f(e.win.p)} FCFA</b>.`, 'FCFA'); },
  () => { const cp = ri(1, 100) * 1000000; const d = ri(50, 900) * 10; return calc(`Indice pondéré par la capitalisation : au jour J-1, la capitalisation totale du marché est de <b>${f(cp * 100)} FCFA</b> et l'indice vaut <b>${f(1000 + d)}</b>. Le lendemain, la capitalisation passe à <b>${f(Math.round(cp * 100 * 1.02))} FCFA</b> (+2 %) sans opération sur titres. Quelle est la valeur de l'indice ?`,
      r2((1000 + d) * 1.02), `L'indice suit la capitalisation : ${f(1000 + d)} × 1,02 = <b>${f((1000 + d) * 1.02, 2)}</b>.`, 'points', 0.02); },
].filter(Boolean);

window.B = window.B || { routes: {} };
B.calculs = { 'p9-reperes': coach, 'p5-ordre-denouement': culture };   // clés = identifiants des parcours
})();
