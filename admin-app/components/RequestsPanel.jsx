import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api";
import { REQUEST_STATUSES } from "../lib/constants";
import { Button, Badge, Card, Input, Modal, Select } from "./ui";
import { Trash2, Users } from "../lib/icons";
import { CopyButton, papi, useLoad } from "./portal/shared";

export default function RequestsPanel({ onUnauthorized }) {
  const [items, setItems] = useState(null);
  const [error, setError] = useState("");
  const [converting, setConverting] = useState(null);

  const load = useCallback(async () => {
    try { const data = await api("requests"); setItems(data.items); } catch (err) {
      if (err.message === "__unauthorized__") return onUnauthorized();
      setError(err.message); setItems([]);
    }
  }, [onUnauthorized]);

  useEffect(() => { load(); }, [load]);

  const setStatus = async (item, status) => {
    try { await api(`requests/${item.id}`, { method: "PUT", body: JSON.stringify({ status }) }); load(); } catch (err) { alert(err.message); }
  };

  const remove = async (item) => {
    if (!confirm(`Supprimer la demande de ${item.name} ?`)) return;
    try { await api(`requests/${item.id}`, { method: "DELETE" }); load(); } catch (err) { alert(err.message); }
  };

  if (items === null) return <p className="text-sm text-adm-text-3">Chargement...</p>;

  const newCount = items.filter((i) => i.status === "new").length;

  return (
    <div className="space-y-4">
      <h2 className="font-head text-lg font-semibold text-adm-text">
        Demandes de devis <span className="text-sm font-normal text-adm-text-3">({items.length} au total, {newCount} nouvelle{newCount > 1 ? "s" : ""})</span>
      </h2>
      {error && <p className="text-sm text-adm-red">{error}</p>}
      {items.length === 0 ? (
        <Card><p className="text-sm text-adm-text-3">Aucune demande pour le moment.</p></Card>
      ) : (
        <div className="space-y-3">
          {items.map((r) => {
            const status = REQUEST_STATUSES.find((s) => s.value === r.status) || REQUEST_STATUSES[0];
            return (
              <Card key={r.id} padding="p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <strong className="text-adm-text">{r.name}</strong>
                  {r.company && <span className="text-sm text-adm-text-3">{r.company}</span>}
                  <Badge variant={status.color} className="ml-auto">{status.label}</Badge>
                </div>
                <p className="mt-1 text-xs text-adm-text-3">
                  {r.created_at} · {r.project_type || "Type non précisé"} · {r.budget || "Budget non précisé"}
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-adm-text-2">{r.message}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                  {r.phone && (
                    <a className="font-semibold text-adm-red hover:underline" href={`https://wa.me/${r.phone.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer">
                      WhatsApp : {r.phone}
                    </a>
                  )}
                  {r.email && (
                    <a className="font-semibold text-adm-red hover:underline" href={`mailto:${r.email}`}>{r.email}</a>
                  )}
                  <div className="ml-auto flex items-center gap-2">
                    {r.converted_client_id ? (
                      <Badge variant="success">Client créé</Badge>
                    ) : (
                      <Button size="sm" icon={Users} onClick={() => setConverting(r)}>Créer le client + projet</Button>
                    )}
                    <select
                      value={r.status}
                      onChange={(e) => setStatus(r, e.target.value)}
                      className="cursor-pointer appearance-none rounded-lg border border-adm-border-2 bg-adm-surface-3 px-2 py-1 pr-6 text-xs text-adm-text outline-none transition-colors focus:border-adm-red"
                    >
                      {REQUEST_STATUSES.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                    <Button variant="danger" size="sm" icon={Trash2} onClick={() => remove(r)}>Supprimer</Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
      <Modal open={!!converting} onClose={() => { setConverting(null); load(); }} title={`Nouveau client : ${converting?.name || ""}`}>
        {converting && <ConvertRequest request={converting} />}
      </Modal>
    </div>
  );
}

/* Demande de devis -> client + projet (modèle du pack) + lien à partager. */
function ConvertRequest({ request }) {
  const { data } = useLoad("templates");
  const packs = data?.effective || [];
  const [f, setF] = useState({ title: `Site ${request.company || request.name}`, pack: request.project_type || "", amount: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(null);

  if (done) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-emerald-400">Client et projet créés ✓ Le projet contient déjà les étapes et la liste des éléments à demander.</p>
        <code className="block break-all rounded-lg bg-adm-surface-3 px-3 py-2 text-sm text-adm-text">{done.share.url}</code>
        <div className="flex flex-wrap gap-2">
          <a href={done.share.whatsapp} target="_blank" rel="noreferrer" className="inline-flex items-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">Envoyer le lien par WhatsApp</a>
          <CopyButton text={done.share.text} label="Copier le message" />
        </div>
        <p className="text-xs text-adm-text-3">Retrouvez le projet dans Portail client → Projets.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-adm-red">{error}</p>}
      <Input label="Titre du projet" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
      <Select label="Pack" value={f.pack} onChange={(e) => setF({ ...f, pack: e.target.value })} options={[{ value: "", label: "Choisir…" }, ...packs.map((t) => ({ value: t.pack, label: t.pack }))]} />
      <Input label="Montant convenu (FCFA)" type="number" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} />
      <p className="text-xs text-adm-text-3">Nom, téléphone, email et entreprise sont repris de la demande.</p>
      <Button loading={busy} disabled={!f.pack || !f.title} onClick={async () => {
        setBusy(true); setError("");
        try { setDone(await papi(`from-request/${request.id}`, "POST", f)); } catch (e) { setError(e.message); } finally { setBusy(false); }
      }}>Créer</Button>
    </div>
  );
}
