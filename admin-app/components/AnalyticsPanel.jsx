import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { Card, StatsCard, Chart } from "./ui";
import { Activity, Users, Clock, TrendingUp, CreditCard, Eye } from "../lib/icons";

/* ------------------------------------------------------------------
   Rubrique « Audience » : comportement des visiteurs de la page /livre.
   Données : /api/admin/analytics (voir src/api/analytics.ts).
------------------------------------------------------------------- */

const PERIODS = [7, 14, 30, 90];

const SECTION_NAMES = {
  "00:nav": "En-tête",
  "01:hero": "Haut de page (hero)",
  "02:probleme": "Le problème",
  "03:methode": "La méthode",
  "04:avant-apres": "Curseur avant / après",
  "05:exemples": "Exemples (café)",
  "06:apercu": "Aperçu du livre",
  "07:contenu": "Contenu du livre",
  "08:calcul": "Le calcul honnête",
  "09:verite": "« Dis-toi la vérité »",
  "10:auteur": "Qui a écrit le livre",
  "11:faq": "Questions fréquentes",
  "12:extrait": "Extrait gratuit WhatsApp",
  "13:achat": "Achat (bas de page)",
  "14:pied": "Pied de page",
};
const BA_NAMES = { soldes: "Affiche de soldes", festival: "Festival", convention: "Convention", cafe: "Site du café" };

const nameOf = (label) => SECTION_NAMES[label] || label || "—";
const buttonName = (label) => (label === "00:nav" ? "En-tête (tout en haut)" : `Bouton dans « ${nameOf(label)} »`);
const fmt = (n, d = 0) => (Number(n) || 0).toLocaleString("fr-FR", { maximumFractionDigits: d });
const pct = (n, d, digits = 1) => (d > 0 ? `${fmt((n / d) * 100, digits)} %` : "—");
const ratio = (n, d) => (d > 0 ? (n / d) * 100 : 0);
const dur = (s) => {
  s = Math.round(Number(s) || 0);
  if (s < 60) return `${s} s`;
  return `${Math.floor(s / 60)} min ${String(s % 60).padStart(2, "0")} s`;
};
const trendOf = (cur, prev) => {
  if (!prev) return {};
  const d = ((cur - prev) / prev) * 100;
  if (!isFinite(d) || Math.abs(d) < 0.5) return {};
  return { trend: `${fmt(Math.abs(d), 0)} %`, trendUp: d > 0 };
};
const pointTrend = (cur, prev, hasPrev) => {
  if (!hasPrev) return {};
  const d = cur - prev;
  if (Math.abs(d) < 0.05) return {};
  return { trend: `${fmt(Math.abs(d), 1)} pt`, trendUp: d > 0 };
};

function Th({ children, right }) {
  return <th className={`px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-adm-text-3 ${right ? "text-right" : ""}`}>{children}</th>;
}
function Td({ children, right, strong }) {
  return <td className={`px-4 py-2.5 ${right ? "text-right" : ""} ${strong ? "font-medium text-adm-text" : "text-adm-text-2"}`}>{children}</td>;
}
function Table({ head, rows, empty = "Pas encore de données." }) {
  if (!rows.length) return <p className="text-sm text-adm-text-3">{empty}</p>;
  return (
    <div className="overflow-x-auto rounded-lg border border-adm-border">
      <table className="w-full text-left text-sm">
        <thead><tr className="border-b border-adm-border bg-adm-surface-2">{head}</tr></thead>
        <tbody className="bg-adm-surface">{rows}</tbody>
      </table>
    </div>
  );
}
function Block({ title, hint, children, className = "" }) {
  return (
    <Card className={className}>
      <h3 className="font-head text-base font-semibold text-adm-text">{title}</h3>
      {hint && <p className="mt-1 mb-4 text-xs text-adm-text-3">{hint}</p>}
      {!hint && <div className="mb-4" />}
      {children}
    </Card>
  );
}

export default function AnalyticsPanel({ onUnauthorized }) {
  const [days, setDays] = useState(14);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try { setData(await api(`analytics?days=${days}`)); } catch (err) {
      if (err.message === "__unauthorized__") return onUnauthorized();
      setError(err.message); setData({ empty: true });
    }
  }, [days, onUnauthorized]);

  useEffect(() => { setData(null); load(); }, [load]);

  const view = useMemo(() => {
    if (!data || data.empty) return null;
    const t = data.totals || {};
    const p = data.previous || {};
    const visits = t.visits || 0;
    const steps = [
      { k: "Visites", n: visits },
      { k: "Ont lu 25 % de la page", n: t.sc25 || 0 },
      { k: "Ont lu 50 %", n: t.sc50 || 0 },
      { k: "Ont lu 75 %", n: t.sc75 || 0 },
      { k: "Sont allés jusqu'en bas", n: t.sc100 || 0 },
      { k: "Ont cliqué « Acheter »", n: t.cta || 0 },
      { k: "Ont ouvert le paiement", n: t.chk || 0 },
    ];
    // Plus gros décrochage entre deux étapes consécutives (hors écart lecture → clic, qui n'est pas séquentiel).
    let worst = null;
    for (let i = 1; i < steps.length; i++) {
      const prev = steps[i - 1].n;
      if (prev < 20) continue;
      const lost = 100 - ratio(steps[i].n, prev);
      if (!worst || lost > worst.lost) worst = { from: steps[i - 1].k, to: steps[i].k, lost };
    }
    const bestBtn = [...(data.buttons || [])].sort((a, b) => b.sessions - a.sessions)[0];
    return { t, p, visits, steps, worst, bestBtn };
  }, [data]);

  if (data === null) return <p className="text-sm text-adm-text-3">Chargement...</p>;

  const Header = (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="font-head text-lg font-semibold text-adm-text">Audience — page du livre</h2>
        {data && !data.empty && <p className="text-xs text-adm-text-3">Du {data.from} au {data.to} (heure de Douala) · visiteurs anonymes, sans cookie, robots exclus</p>}
      </div>
      <div className="flex gap-1.5">
        {PERIODS.map((d) => (
          <button key={d} onClick={() => setDays(d)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${days === d ? "border-adm-red bg-adm-red/15 text-adm-text" : "border-adm-border text-adm-text-3 hover:text-adm-text"}`}>
            {d} jours
          </button>
        ))}
      </div>
    </div>
  );

  if (data.empty || !view) {
    return <div className="space-y-4">{Header}{error && <p className="text-sm text-adm-red">{error}</p>}</div>;
  }

  const { t, p, visits, steps, worst, bestBtn } = view;
  const hasPrev = (p.visits || 0) > 0;
  const tr = (cur, prv) => (hasPrev ? trendOf(cur, prv) : {});

  /* --- graphiques --- */
  const dailyData = {
    labels: data.daily.map((d) => d.day.slice(5).split("-").reverse().join("/")),
    datasets: [
      { label: "Visites", data: data.daily.map((d) => d.visits), borderColor: "#ffd51c", backgroundColor: "rgba(255,213,28,0.08)", fill: true, tension: 0.35, pointRadius: 3, pointBackgroundColor: "#ffd51c" },
      { label: "Clics « Acheter »", data: data.daily.map((d) => d.cta), borderColor: "#60a5fa", backgroundColor: "transparent", tension: 0.35, pointRadius: 3, pointBackgroundColor: "#60a5fa" },
      { label: "Paiements ouverts", data: data.daily.map((d) => d.chk), borderColor: "#22c55e", backgroundColor: "transparent", tension: 0.35, pointRadius: 3, pointBackgroundColor: "#22c55e" },
    ],
  };
  const funnelData = {
    labels: steps.map((s) => `${s.k} — ${fmt(s.n)} (${pct(s.n, visits, 0)})`),
    datasets: [{ data: steps.map((s) => s.n), backgroundColor: steps.map((_, i) => (i >= 5 ? "#22c55e" : "#ffd51c")), borderRadius: 4 }],
  };
  const sectionMap = new Map((data.sections || []).map((s) => [s.label, s.sessions]));
  const sectionKeys = Object.keys(SECTION_NAMES).filter((k) => k !== "00:nav");
  const sectionData = {
    labels: sectionKeys.map((k) => `${nameOf(k)} — ${pct(sectionMap.get(k) || 0, visits, 0)}`),
    datasets: [{ data: sectionKeys.map((k) => Math.round(ratio(sectionMap.get(k) || 0, visits))), backgroundColor: "#60a5fa", borderRadius: 4 }],
  };
  const hoursData = {
    labels: data.hours.map((h) => `${h.h}h`),
    datasets: [{ data: data.hours.map((h) => h.visits), backgroundColor: "#ffd51c", borderRadius: 3 }],
  };
  const hbar = { indexAxis: "y", plugins: { legend: { display: false } } };

  /* --- tableaux --- */
  const chkByLabel = new Map((data.checkouts || []).map((c) => [c.label, c.sessions]));
  const deepestTotal = (data.deepest || []).reduce((a, b) => a + b.sessions, 0);
  const eng = (ev) => (data.engagement || []).filter((e) => e.event === ev);
  const engRows = (ev, fmtLabel) => {
    const rows = eng(ev);
    if (!rows.length) return <p className="text-sm text-adm-text-3">Aucune action pour l'instant.</p>;
    return (
      <ul className="space-y-1.5 text-sm">
        {rows.slice(0, 8).map((r, i) => (
          <li key={i} className="flex justify-between gap-3">
            <span className="truncate text-adm-text-2">{fmtLabel ? fmtLabel(r.label) : r.label}</span>
            <span className="shrink-0 font-medium text-adm-text">{fmt(r.sessions)} <span className="text-xs text-adm-text-3">({pct(r.sessions, visits, 0)})</span></span>
          </li>
        ))}
      </ul>
    );
  };
  const segHead = (first) => (<><Th>{first}</Th><Th right>Visites</Th><Th right>Lu ≥ 50 %</Th><Th right>Clic achat</Th><Th right>Paiement</Th><Th right>Temps moy.</Th></>);
  const segRow = (key, label, r) => (
    <tr key={key} className="border-b border-adm-border last:border-0 hover:bg-adm-surface-2">
      <Td strong>{label}</Td><Td right>{fmt(r.visits)}</Td><Td right>{pct(r.sc50, r.visits, 0)}</Td>
      <Td right>{pct(r.cta, r.visits)}</Td><Td right>{pct(r.chk, r.visits)}</Td><Td right>{dur(r.avg_secs)}</Td>
    </tr>
  );

  const enough = visits >= 30;

  return (
    <div className="space-y-6">
      {Header}
      {error && <p className="text-sm text-adm-red">{error}</p>}

      {visits === 0 ? (
        <Card><p className="text-sm text-adm-text-3">Aucune visite enregistrée sur cette période. Le suivi enregistre les visites depuis la mise en ligne de cette rubrique.</p></Card>
      ) : (
        <>
          {/* KPI */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
            <StatsCard icon={Eye} label="Visites" value={fmt(visits)} accent="amber" {...tr(visits, p.visits)} />
            <StatsCard icon={Users} label="Visiteurs (par jour, uniques)" value={fmt(t.visitors)} accent="blue" {...tr(t.visitors, p.visitors)} />
            <StatsCard icon={Clock} label="Temps moyen sur la page" value={dur(t.avg_secs)} accent="purple" {...tr(t.avg_secs, p.avg_secs)} />
            <StatsCard icon={TrendingUp} label="Ont lu ≥ 50 % de la page" value={pct(t.sc50, visits)} accent="green" {...pointTrend(ratio(t.sc50, visits), ratio(p.sc50, p.visits), hasPrev)} />
            <StatsCard icon={Activity} label="Ont cliqué « Acheter »" value={pct(t.cta, visits)} accent="red" {...pointTrend(ratio(t.cta, visits), ratio(p.cta, p.visits), hasPrev)} />
            <StatsCard icon={CreditCard} label="Ont ouvert le paiement" value={pct(t.chk, visits)} accent="green" {...pointTrend(ratio(t.chk, visits), ratio(p.chk, p.visits), hasPrev)} />
          </div>
          <p className="-mt-3 text-xs text-adm-text-3">Les flèches comparent aux {days} jours précédents. « Paiement ouvert » = la fenêtre Chariow s'est ouverte, pas un achat (l'achat se fait chez Chariow : compare avec tes ventes là-bas).</p>

          {/* Lecture rapide */}
          <Card>
            <h3 className="font-head text-base font-semibold text-adm-text">Lecture rapide</h3>
            {!enough ? (
              <p className="mt-2 text-sm text-adm-text-3">Seulement {fmt(visits)} visites : trop peu pour tirer des conclusions fiables. Attends au moins 100 visites avant de modifier la page.</p>
            ) : (
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-adm-text-2">
                {worst && <li>Plus gros décrochage : entre « {worst.from} » et « {worst.to} », on perd <b className="text-adm-text">{fmt(worst.lost, 0)} %</b> des visiteurs.</li>}
                <li>{pct(t.cta, visits)} des visites cliquent sur « Acheter » et {pct(t.chk, t.cta, 0)} de ces clics ouvrent bien le paiement{ratio(t.chk, t.cta) < 70 && t.cta >= 10 ? " — un écart anormal : vérifie le widget Chariow (téléphone, navigateur intégré à Facebook)." : "."}</li>
                {bestBtn && <li>Bouton le plus utilisé : <b className="text-adm-text">{buttonName(bestBtn.label)}</b> ({fmt(bestBtn.sessions)} visiteurs).</li>}
                {(t.t_lt10 || 0) / Math.max(visits - (t.t_unknown || 0), 1) > 0.5 && <li>Plus de la moitié des visiteurs repartent en moins de 10 secondes : le haut de page (titre, couverture, vitesse sur mobile) ne les accroche pas. À l'ouverture depuis Facebook, regarde aussi la pub elle-même.</li>}
              </ul>
            )}
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Block title="Visites par jour" hint="Visites, clics sur « Acheter » et paiements ouverts.">
              <Chart data={dailyData} height={260} options={{ plugins: { legend: { display: true, labels: { color: "#b8b0a0", boxWidth: 12, padding: 14 } } } }} />
            </Block>
            <Block title="Entonnoir : de la visite au paiement" hint="Combien de visiteurs atteignent chaque étape.">
              <Chart type="bar" data={funnelData} height={260} options={hbar} />
            </Block>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Block title="Jusqu'où ils lisent la page" hint="Part des visites qui ont vu chaque section (dans l'ordre de la page).">
              <Chart type="bar" data={sectionData} height={380} options={{ ...hbar, scales: { x: { max: 100, grid: { color: "#2a2a26" }, ticks: { color: "#7a7568", callback: (v) => `${v} %` } }, y: { grid: { display: false }, ticks: { color: "#b8b0a0", font: { size: 11 } } } } }} />
            </Block>
            <Block title="Où ils s'arrêtent" hint="Dernière section atteinte avant de partir : là où la page perd les gens.">
              <Table
                head={<><Th>Section la plus profonde atteinte</Th><Th right>Visites</Th><Th right>Part</Th></>}
                rows={(data.deepest || []).map((r) => (
                  <tr key={r.label} className="border-b border-adm-border last:border-0 hover:bg-adm-surface-2">
                    <Td strong>{nameOf(r.label)}</Td><Td right>{fmt(r.sessions)}</Td><Td right>{pct(r.sessions, deepestTotal, 0)}</Td>
                  </tr>
                ))}
              />
              <p className="mt-3 text-xs text-adm-text-3">Temps sur la page : &lt; 10 s : {fmt(t.t_lt10)} · 10–30 s : {fmt(t.t_10_30)} · 30–60 s : {fmt(t.t_30_60)} · 1–3 min : {fmt(t.t_1_3)} · &gt; 3 min : {fmt(t.t_gt3)}{t.t_unknown ? ` · inconnu : ${fmt(t.t_unknown)}` : ""}</p>
            </Block>
          </div>

          <Block title="Quel bouton « Acheter » fonctionne ?" hint="Les 7 boutons sont suivis séparément. « Ouverture » = part des visiteurs ayant cliqué dont la fenêtre de paiement s'est ouverte.">
            <Table
              head={<><Th>Emplacement</Th><Th right>Clics</Th><Th right>Visiteurs</Th><Th right>% des visites</Th><Th right>Paiement ouvert</Th><Th right>Ouverture</Th></>}
              rows={(data.buttons || []).map((b) => {
                const opened = chkByLabel.get(b.label) || 0;
                return (
                  <tr key={b.label} className="border-b border-adm-border last:border-0 hover:bg-adm-surface-2">
                    <Td strong>{buttonName(b.label)}</Td><Td right>{fmt(b.clicks)}</Td><Td right>{fmt(b.sessions)}</Td>
                    <Td right>{pct(b.sessions, visits)}</Td><Td right>{fmt(opened)}</Td><Td right>{pct(opened, b.sessions, 0)}</Td>
                  </tr>
                );
              })}
              empty="Aucun clic sur « Acheter » pour l'instant."
            />
          </Block>

          <div className="grid gap-6 lg:grid-cols-4">
            <Block title="Curseur avant / après" hint="Visiteurs ayant touché au curseur ou changé d'onglet.">
              {engRows("ba_tab", (l) => BA_NAMES[l] || l)}
            </Block>
            <Block title="Questions FAQ ouvertes" hint="Ce qui les freine avant d'acheter.">
              {engRows("faq", (l) => String(l).replace(/^\d+-/, "").replace(/-/g, " "))}
            </Block>
            <Block title="Images agrandies" hint="Exemples ouverts en grand.">
              {engRows("zoom", (l) => String(l).replace(/-/g, " "))}
            </Block>
            <Block title="Extrait gratuit WhatsApp" hint="Clics pour recevoir l'extrait.">
              {engRows("wa", () => "Clic sur le bouton")}
            </Block>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Block title="D'où viennent-ils ?" hint="Source du trafic, avec ce que chacune produit.">
              <Table head={segHead("Source")} rows={(data.sources || []).map((r) => segRow(r.k, r.k, r))} />
            </Block>
            <Block title="Campagnes et pubs" hint="Nécessite des paramètres d'URL : ?utm_source=facebook&utm_campaign=NOM&utm_content=NOM-PUB (voir en bas).">
              <Table head={segHead("Campagne · pub")} rows={(data.campaigns || []).map((r, i) => segRow(i, `${r.camp}${r.ad ? " · " + r.ad : ""}`, r))} empty="Aucune visite avec paramètres de campagne pour l'instant." />
            </Block>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Block title="Appareils"><Table head={segHead("Appareil")} rows={(data.devices || []).map((r) => segRow(r.k, r.k, r))} /></Block>
            <Block title="Pays"><Table head={segHead("Pays")} rows={(data.countries || []).map((r) => segRow(r.k, r.k, r))} /></Block>
            <Block title="Heures de visite" hint="Heure de Douala : utile pour programmer les pubs.">
              <Chart type="bar" data={hoursData} height={200} />
            </Block>
          </div>
        </>
      )}

      <Card>
        <h3 className="font-head text-base font-semibold text-adm-text">Mode d'emploi</h3>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-adm-text-2">
          <li><b className="text-adm-text">Exclure tes propres visites :</b> ouvre une fois <code className="rounded bg-adm-surface-2 px-1.5 py-0.5 text-xs">impacttech237.com/livre/?notrack=1</code> sur chacun de tes appareils (pour réactiver : <code className="rounded bg-adm-surface-2 px-1.5 py-0.5 text-xs">?notrack=0</code>).</li>
          <li><b className="text-adm-text">Suivre une pub Facebook :</b> dans l'URL du site de la pub, ajoute <code className="rounded bg-adm-surface-2 px-1.5 py-0.5 text-xs">?utm_source=facebook&amp;utm_campaign=NOM_CAMPAGNE&amp;utm_content=NOM_PUB</code> (Meta propose aussi « Paramètres d'URL » dans la pub).</li>
          <li><b className="text-adm-text">Vie privée :</b> pas de cookie, pas d'adresse IP conservée, visiteur reconnu seulement le temps d'une journée. Les personnes qui activent « Do Not Track » ne sont pas suivies.</li>
          <li><b className="text-adm-text">Ne conclus pas trop vite :</b> sous ~100 visites, les pourcentages bougent beaucoup. Change une chose à la fois sur la page, puis compare 7 jours avant / après.</li>
        </ul>
      </Card>
    </div>
  );
}
