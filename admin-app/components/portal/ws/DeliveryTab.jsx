/* Livraison : site en ligne, kit (guides, notes), renouvellements,
   santé du site, demande d'avis. */
import { useState } from "react";
import { Badge, Button, Card, Input, Textarea } from "../../ui";
import { Gift, Plus, Star, Trash2 } from "../../../lib/icons";
import { ErrorText, fmtAgo, fmtDate, papi } from "../shared";

export default function DeliveryTab({ project, reload }) {
  const [f, setF] = useState({
    site_url: project.site_url || "",
    admin_url: project.admin_url || "",
    support_until: project.support_until || "",
    hosting_renewal_at: project.hosting_renewal_at || "",
    domain_renewal_at: project.domain_renewal_at || "",
    renewal_amount: project.renewal_amount ?? "",
    handover_notes: project.handover_notes || "",
    handover_links: project.handover_links?.length ? project.handover_links : [],
  });
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const up = project.health_status >= 200 && project.health_status < 400;

  const run = async (key, fn, ok) => {
    setBusy(key);
    setErr("");
    try {
      const r = await fn();
      setMsg(r?.emailSent === false ? `${ok} (email non parti — prévenez le client par WhatsApp)` : ok);
      reload();
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
      <Card padding="p-4" className="space-y-3">
        <h3 className="font-head text-base font-semibold text-adm-text">Kit de livraison (visible par le client)</h3>
        <ErrorText>{err}</ErrorText>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Adresse du site en ligne" value={f.site_url} onChange={set("site_url")} placeholder="https://…" />
          <Input label="Back-office du site" value={f.admin_url} onChange={set("admin_url")} placeholder="https://…/admin" />
          <Input label="Support inclus jusqu'au" type="date" value={f.support_until} onChange={set("support_until")} />
          <Input label="Montant du renouvellement" type="number" value={f.renewal_amount} onChange={set("renewal_amount")} />
          <Input label="Renouvellement hébergement" type="date" value={f.hosting_renewal_at} onChange={set("hosting_renewal_at")} />
          <Input label="Renouvellement nom de domaine" type="date" value={f.domain_renewal_at} onChange={set("domain_renewal_at")} />
        </div>
        <p className="text-[11px] text-adm-text-3">Rappels automatiques au client (et à vous) 30 et 7 jours avant chaque renouvellement.</p>
        <Textarea label="Notes de livraison (comment gérer le site, contacts…)" value={f.handover_notes} onChange={set("handover_notes")} />
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-adm-text-3">Guides et tutoriels (vidéos, PDF…)</p>
          {f.handover_links.map((l, i) => (
            <div key={i} className="grid grid-cols-[1fr_1.4fr_32px] gap-2">
              <input className="rounded-lg border border-adm-border-2 bg-adm-surface-3 px-3 py-2 text-sm text-adm-text" placeholder="Titre" value={l.title} onChange={(e) => setF({ ...f, handover_links: f.handover_links.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)) })} />
              <input className="rounded-lg border border-adm-border-2 bg-adm-surface-3 px-3 py-2 text-sm text-adm-text" placeholder="https://youtu.be/…" value={l.url} onChange={(e) => setF({ ...f, handover_links: f.handover_links.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)) })} />
              <button type="button" aria-label="Retirer" className="cursor-pointer text-adm-text-3 hover:text-adm-red" onClick={() => setF({ ...f, handover_links: f.handover_links.filter((_, j) => j !== i) })}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          <Button size="sm" variant="ghost" icon={Plus} onClick={() => setF({ ...f, handover_links: [...f.handover_links, { title: "", url: "" }] })}>
            Ajouter un guide
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button loading={busy === "save"} onClick={() => run("save", () => papi(`projects/${project.id}`, "PUT", f), "Enregistré ✓")}>
            Enregistrer
          </Button>
          {msg && <span className="text-sm text-emerald-400">{msg}</span>}
        </div>
        <p className="text-xs text-adm-text-3">Les accès du site (identifiants back-office) s'ajoutent dans l'onglet « Accès » → visibles dans le kit du client.</p>
      </Card>

      <div className="space-y-4">
        <Card padding="p-4" className="space-y-3">
          <h3 className="flex items-center gap-2 font-head text-base font-semibold text-adm-text">
            <Gift size={16} /> Livraison
          </h3>
          {project.delivered_at ? (
            <p className="text-sm text-emerald-400">Livré le {fmtDate(project.delivered_at)}</p>
          ) : (
            <>
              <p className="text-sm text-adm-text-2">Passe le projet en « Livré », démarre la période de support, prévoit le renouvellement d'hébergement à 1 an et prévient le client.</p>
              <Button loading={busy === "deliver"} onClick={() => confirm("Marquer le projet comme livré et prévenir le client ?") && run("deliver", () => papi(`projects/${project.id}/deliver`, "POST", { site_url: f.site_url }), "Projet livré 🎉")}>
                Marquer comme livré
              </Button>
            </>
          )}
        </Card>
        <Card padding="p-4" className="space-y-2">
          <h3 className="font-head text-base font-semibold text-adm-text">Santé du site</h3>
          {project.health_checked_at ? (
            <p className="text-sm">
              <Badge variant={up ? "success" : "danger"}>{up ? "En ligne" : project.health_status ? `Erreur ${project.health_status}` : "Ne répond pas"}</Badge>
              <span className="ml-2 text-adm-text-3">
                {project.health_ms} ms · vérifié {fmtAgo(project.health_checked_at)}
              </span>
            </p>
          ) : (
            <p className="text-sm text-adm-text-3">Vérification automatique chaque jour une fois le site livré (adresse en ligne renseignée).</p>
          )}
        </Card>
        <Card padding="p-4" className="space-y-2">
          <h3 className="flex items-center gap-2 font-head text-base font-semibold text-adm-text">
            <Star size={16} /> Avis client
          </h3>
          <p className="text-sm text-adm-text-2">Demandez un avis juste après une livraison réussie : c'est le meilleur moment.</p>
          <Button size="sm" variant="secondary" loading={busy === "review"} onClick={() => run("review", () => papi(`projects/${project.id}/ask-review`, "POST"), "Demande d'avis envoyée ✓")}>
            Demander un avis
          </Button>
        </Card>
      </div>
    </div>
  );
}
