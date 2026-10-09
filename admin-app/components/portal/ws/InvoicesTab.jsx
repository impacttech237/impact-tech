/* Devis & factures d'un projet (paiement Mobile Money côté client). */
import { useState } from "react";
import { Badge, Button, Card, EmptyState, Input, LoadingSpinner, Modal, Select, Textarea } from "../../ui";
import { CreditCard, Eye, Plus, Send, Trash2 } from "../../../lib/icons";
import { ErrorText, fmtDate, fmtMoney, papi, useLoad } from "../shared";

const STATUS = {
  brouillon: { label: "Brouillon", variant: "default" },
  envoye: { label: "Envoyé — en attente", variant: "warning" },
  accepte: { label: "Accepté", variant: "info" },
  refuse: { label: "Refusé", variant: "danger" },
  paye: { label: "Payé", variant: "success" },
  annule: { label: "Annulé", variant: "default" },
};

export default function InvoicesTab({ project }) {
  const { data, error, reload } = useLoad(`projects/${project.id}/invoices`);
  const [editing, setEditing] = useState(null);
  const [err, setErr] = useState("");

  const act = async (fn) => {
    setErr("");
    try {
      const r = await fn();
      if (r?.emailSent === false) setErr("Envoyé dans l'espace client, mais l'email n'est pas parti : prévenez le client par WhatsApp.");
      reload();
    } catch (e) {
      setErr(e.message);
    }
  };

  const amountLabel = project.amount ? `${project.title} — ${project.pack || ""}`.trim() : project.title;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button icon={Plus} onClick={() => setEditing({ kind: "facture", title: amountLabel, items: [{ label: amountLabel, qty: 1, unit: project.amount || "" }], currency: project.currency || "XAF" })}>
          Nouvelle facture
        </Button>
        <Button variant="secondary" icon={Plus} onClick={() => setEditing({ kind: "devis", title: "", items: [{ label: "", qty: 1, unit: "" }], currency: project.currency || "XAF" })}>
          Nouveau devis
        </Button>
      </div>
      <p className="text-xs text-adm-text-3">Rappel : paiement à la livraison. La facture finale s'envoie quand le client a validé la livraison ; il la règle en un clic par Mobile Money depuis son espace.</p>
      <ErrorText>{error || err}</ErrorText>
      {!data ? (
        <LoadingSpinner />
      ) : !data.invoices.length ? (
        <EmptyState icon={CreditCard} message="Aucun devis ni facture." />
      ) : (
        data.invoices.map((inv) => (
          <Card key={inv.id} padding="p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs uppercase tracking-wide text-adm-text-3">
                    {inv.kind} {inv.number}
                  </span>
                  <Badge variant={STATUS[inv.status].variant}>{STATUS[inv.status].label}</Badge>
                </div>
                <p className="font-semibold text-adm-text">{inv.title}</p>
                <p className="text-sm text-adm-text-2">
                  {fmtMoney(inv.amount, inv.currency)}
                  {inv.due_date && ` · échéance ${fmtDate(inv.due_date)}`}
                  {inv.paid_at && ` · payé le ${fmtDate(inv.paid_at)}`}
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <a className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-adm-text-2 hover:bg-adm-surface-2" href={`/api/admin/portal/invoices/${inv.id}/pdf`} target="_blank" rel="noreferrer">
                  <Eye size={14} /> PDF
                </a>
                {inv.status === "brouillon" && (
                  <>
                    <Button size="sm" variant="ghost" onClick={() => setEditing(inv)}>
                      Modifier
                    </Button>
                    <Button size="sm" icon={Send} onClick={() => act(() => papi(`invoices/${inv.id}/send`, "POST"))}>
                      Envoyer
                    </Button>
                  </>
                )}
                {["envoye", "accepte"].includes(inv.status) && (
                  <Button size="sm" variant="secondary" onClick={() => confirm("Marquer comme payé (paiement reçu hors K-PAY : espèces, virement…) ?") && act(() => papi(`invoices/${inv.id}`, "PUT", { status: "paye" }))}>
                    Marquer payé
                  </Button>
                )}
                {inv.status !== "paye" && inv.status !== "annule" && inv.status !== "brouillon" && (
                  <Button size="sm" variant="ghost" onClick={() => act(() => papi(`invoices/${inv.id}`, "PUT", { status: "annule" }))}>
                    Annuler
                  </Button>
                )}
                {inv.status !== "paye" && <Button size="sm" variant="ghost" icon={Trash2} aria-label="Supprimer" onClick={() => confirm("Supprimer ?") && act(() => papi(`invoices/${inv.id}`, "DELETE"))} />}
              </div>
            </div>
          </Card>
        ))
      )}
      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? "Modifier" : editing?.kind === "devis" ? "Nouveau devis" : "Nouvelle facture"} wide>
        {editing && <InvoiceForm project={project} initial={editing} onDone={() => (setEditing(null), reload())} />}
      </Modal>
    </div>
  );
}

export function InvoiceForm({ project, initial, onDone }) {
  const [f, setF] = useState({
    kind: initial.kind || "facture",
    title: initial.title || "",
    items: initial.items?.length ? initial.items : [{ label: "", qty: 1, unit: "" }],
    currency: initial.currency || project.currency || "XAF",
    due_date: initial.due_date || "",
    notes: initial.notes || "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const total = f.items.reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.unit) || 0), 0);
  const setItem = (i, k, v) => setF({ ...f, items: f.items.map((it, j) => (j === i ? { ...it, [k]: v } : it)) });

  return (
    <div className="space-y-3">
      <ErrorText>{error}</ErrorText>
      <div className="grid gap-3 sm:grid-cols-3">
        <Select label="Type" value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })} options={[{ value: "facture", label: "Facture" }, { value: "devis", label: "Devis" }]} disabled={!!initial.id} />
        <Select label="Devise" value={f.currency} onChange={(e) => setF({ ...f, currency: e.target.value })} options={["XAF", "EUR"]} />
        <Input label="Échéance" type="date" value={f.due_date} onChange={(e) => setF({ ...f, due_date: e.target.value })} />
      </div>
      <Input label="Titre" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-adm-text-3">Lignes</p>
        {f.items.map((it, i) => (
          <div key={i} className="grid grid-cols-[1fr_70px_130px_32px] items-center gap-2">
            <input className="rounded-lg border border-adm-border-2 bg-adm-surface-3 px-3 py-2 text-sm text-adm-text" placeholder="Désignation" value={it.label} onChange={(e) => setItem(i, "label", e.target.value)} />
            <input className="rounded-lg border border-adm-border-2 bg-adm-surface-3 px-2 py-2 text-sm text-adm-text" type="number" min="1" value={it.qty} onChange={(e) => setItem(i, "qty", e.target.value)} aria-label="Quantité" />
            <input className="rounded-lg border border-adm-border-2 bg-adm-surface-3 px-2 py-2 text-sm text-adm-text" type="number" placeholder="Prix unitaire" value={it.unit} onChange={(e) => setItem(i, "unit", e.target.value)} />
            <button type="button" className="cursor-pointer text-adm-text-3 hover:text-adm-red" aria-label="Retirer la ligne" onClick={() => setF({ ...f, items: f.items.filter((_, j) => j !== i) })}>
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        <Button size="sm" variant="ghost" icon={Plus} onClick={() => setF({ ...f, items: [...f.items, { label: "", qty: 1, unit: "" }] })}>
          Ajouter une ligne
        </Button>
      </div>
      <p className="text-right font-head text-lg font-bold text-adm-text">Total : {fmtMoney(total, f.currency)}</p>
      <Textarea label="Notes (visibles sur le PDF)" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} />
      <Button
        loading={busy}
        disabled={!f.title || !total}
        onClick={async () => {
          setBusy(true);
          try {
            if (initial.id) await papi(`invoices/${initial.id}`, "PUT", f);
            else await papi(`projects/${project.id}/invoices`, "POST", { ...f, request_id: initial.request_id });
            onDone();
          } catch (e) {
            setError(e.message);
          } finally {
            setBusy(false);
          }
        }}
      >
        Enregistrer (brouillon)
      </Button>
    </div>
  );
}
