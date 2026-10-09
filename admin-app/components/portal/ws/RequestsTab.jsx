/* Retours sur le site, demandes de support et hors périmètre. */
import { useState } from "react";
import { Badge, Button, Card, EmptyState, LoadingSpinner, Modal, Select, Textarea } from "../../ui";
import { CreditCard, ExternalLink, Monitor, RefreshCw, Trash2 } from "../../../lib/icons";
import { CopyButton, ErrorText, fmtAgo, papi, useLoad } from "../shared";
import { InvoiceForm } from "./InvoicesTab";

const STATUS = [
  { value: "nouveau", label: "Nouveau" },
  { value: "en_cours", label: "En cours" },
  { value: "fait", label: "Fait ✓" },
  { value: "refuse", label: "Non retenu" },
  { value: "devis", label: "Devis (hors forfait)" },
];
const KIND = { retour: "Retour", support: "Support", hors_perimetre: "Hors périmètre" };
const VARIANT = { nouveau: "danger", en_cours: "warning", fait: "success", refuse: "default", devis: "info" };

export default function RequestsTab({ project, reload: reloadProject }) {
  const { data, error, reload } = useLoad(`projects/${project.id}/requests`);
  const [replying, setReplying] = useState(null);
  const [quoteFor, setQuoteFor] = useState(null);
  const [shot, setShot] = useState(null);
  const [key, setKey] = useState(project.feedback_key);
  const snippet = `<script src="${location.origin}/feedback.js" data-key="${key}" defer></script>`;
  const rounds = project.revision_rounds;

  const update = async (r, body) => {
    await papi(`requests/${r.id}`, "PUT", body);
    reload();
    reloadProject?.();
  };

  return (
    <div className="space-y-4">
      <Card padding="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-head text-base font-semibold text-adm-text">Séries de modifications</h3>
            <p className="text-sm text-adm-text-2">
              {rounds == null ? "Non définies pour ce projet" : rounds < 0 ? `Illimitées — ${project.revision_used || 0} série(s) faite(s)` : `${project.revision_used || 0} utilisée(s) sur ${rounds}`}
            </p>
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={async () => {
              if (!confirm("Clore la série de modifications en cours ? Le client le verra dans son fil d'activité.")) return;
              await papi(`projects/${project.id}/close-round`, "POST");
              reloadProject?.();
            }}
          >
            Clore la série en cours
          </Button>
        </div>
      </Card>

      <Card padding="p-4">
        <h3 className="flex items-center gap-2 font-head text-base font-semibold text-adm-text">
          <Monitor size={16} /> Widget « Commenter » pour le site en développement
        </h3>
        <p className="mb-2 text-xs text-adm-text-3">Collez cette ligne avant &lt;/body&gt; du site en dev : le client pourra cliquer sur n'importe quel élément et laisser un commentaire (avec capture d'écran). À retirer avant la mise en ligne.</p>
        <code className="block break-all rounded-lg bg-adm-surface-3 p-3 text-xs text-adm-text">{snippet}</code>
        <div className="mt-2 flex gap-2">
          <CopyButton text={snippet} label="Copier le code" />
          <Button
            size="sm"
            variant="ghost"
            icon={RefreshCw}
            onClick={async () => {
              if (!confirm("Générer une nouvelle clé ? L'ancien code ne fonctionnera plus.")) return;
              const r = await papi(`projects/${project.id}/feedback-key`, "POST");
              setKey(r.key);
            }}
          >
            Nouvelle clé
          </Button>
        </div>
      </Card>

      <ErrorText>{error}</ErrorText>
      {!data ? (
        <LoadingSpinner />
      ) : !data.requests.length ? (
        <EmptyState icon={Monitor} message="Aucun retour pour l'instant." />
      ) : (
        data.requests.map((r) => (
          <Card key={r.id} padding="p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-adm-text-3">
                  <Badge variant={VARIANT[r.status]}>{STATUS.find((s) => s.value === r.status)?.label}</Badge>
                  <span>{KIND[r.kind]}</span>
                  {r.round && <span>· série {r.round}</span>}
                  {r.device && <span>· {r.device}</span>}
                  <span>· {fmtAgo(r.created_at)}</span>
                </div>
                <p className="whitespace-pre-wrap text-sm text-adm-text">{r.comment}</p>
                {r.page_url && (
                  <a href={r.page_url} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs text-adm-text-3 hover:text-adm-text">
                    <ExternalLink size={12} /> {r.page_url}
                  </a>
                )}
                {r.selector && <p className="mt-1 truncate font-mono text-[11px] text-adm-text-3">{r.selector}</p>}
                {r.admin_reply && <p className="mt-2 rounded bg-adm-surface-2 p-2 text-sm text-adm-text-2">Réponse : {r.admin_reply}</p>}
              </div>
              {r.screenshot_key && (
                <button type="button" onClick={() => setShot(r.id)} className="cursor-pointer overflow-hidden rounded-lg border border-adm-border">
                  <img src={`/api/admin/portal/requests/${r.id}/screenshot`} alt="Capture" className="h-24 w-40 object-cover object-top" loading="lazy" />
                </button>
              )}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <div className="w-48">
                <Select value={r.status} onChange={(e) => update(r, { status: e.target.value, notify: e.target.value === "fait" })} options={STATUS} />
              </div>
              <Button size="sm" variant="secondary" onClick={() => setReplying(r)}>
                Répondre au client
              </Button>
              {r.status !== "devis" && (
                <Button size="sm" variant="ghost" icon={CreditCard} onClick={() => setQuoteFor(r)}>
                  Hors forfait → mini-devis
                </Button>
              )}
              <Button size="sm" variant="ghost" icon={Trash2} aria-label="Supprimer" onClick={() => confirm("Supprimer ce retour ?") && papi(`requests/${r.id}`, "DELETE").then(reload)} />
            </div>
            <p className="mt-1 text-[11px] text-adm-text-3">Passer en « Fait ✓ » prévient le client par email.</p>
          </Card>
        ))
      )}

      <Modal open={!!replying} onClose={() => setReplying(null)} title="Répondre au client">
        {replying && <Reply req={replying} onDone={() => (setReplying(null), reload())} />}
      </Modal>
      <Modal open={!!quoteFor} onClose={() => setQuoteFor(null)} title="Mini-devis (hors forfait)" wide>
        {quoteFor && (
          <InvoiceForm
            project={project}
            initial={{ kind: "devis", title: `Modification hors forfait`, items: [{ label: quoteFor.comment.slice(0, 200), qty: 1, unit: "" }], request_id: quoteFor.id }}
            onDone={() => (setQuoteFor(null), reload())}
          />
        )}
      </Modal>
      <Modal open={!!shot} onClose={() => setShot(null)} title="Capture d'écran du client" wide>
        {shot && <img src={`/api/admin/portal/requests/${shot}/screenshot`} alt="Capture" className="w-full rounded-lg" />}
      </Modal>
    </div>
  );
}

function Reply({ req, onDone }) {
  const [text, setText] = useState(req.admin_reply || "");
  const [status, setStatus] = useState(req.status === "nouveau" ? "en_cours" : req.status);
  const [busy, setBusy] = useState(false);
  return (
    <div className="space-y-3">
      <p className="rounded bg-adm-surface-2 p-2 text-sm text-adm-text-2">« {req.comment} »</p>
      <Textarea label="Votre réponse (envoyée par email au client)" value={text} onChange={(e) => setText(e.target.value)} />
      <Select label="Nouveau statut" value={status} onChange={(e) => setStatus(e.target.value)} options={STATUS} />
      <Button
        loading={busy}
        disabled={!text.trim()}
        onClick={async () => {
          setBusy(true);
          await papi(`requests/${req.id}`, "PUT", { admin_reply: text, status, notify: true });
          onDone();
        }}
      >
        Envoyer
      </Button>
    </div>
  );
}
