/* Espace de travail d'un projet client (vue admin). */
import { useEffect, useState } from "react";
import { Badge, Button, Card, Input, LoadingSpinner, Select, Textarea } from "../ui";
import {
  Activity,
  ArrowLeft,
  CheckCircle,
  ClipboardList,
  CreditCard,
  ExternalLink,
  File,
  FileText,
  Gift,
  Lock,
  MessageCircle,
  Monitor,
  Plus,
  Send,
  Trash2,
} from "../../lib/icons";
import { CopyButton, ErrorText, PROJECT_STATUS, STEP_STATUS, SubTabs, fmtDate, fmtDateTime, fmtMoney, papi, useLoad, waLink } from "./shared";
import ChecklistTab from "./ws/ChecklistTab";
import DocumentsTab from "./ws/DocumentsTab";
import FilesTab from "./ws/FilesTab";
import MessagesTab from "./ws/MessagesTab";
import RequestsTab from "./ws/RequestsTab";
import InvoicesTab from "./ws/InvoicesTab";
import VaultTab from "./ws/VaultTab";
import DeliveryTab from "./ws/DeliveryTab";
import ActivityTab from "./ws/ActivityTab";

export default function ProjectWorkspace({ projectId, onBack }) {
  const { data, error, reload } = useLoad(`projects/${projectId}`);
  const [tab, setTab] = useState("steps");
  useEffect(() => window.scrollTo(0, 0), [projectId]);

  if (error) return <ErrorText>{error}</ErrorText>;
  if (!data) return <LoadingSpinner />;
  const p = data.project;
  const todo = data.checklist.filter((c) => c.status === "todo").length;
  const toCheck = data.checklist.filter((c) => c.status === "sent").length;
  const portalUrl = `${location.origin}/espace/${p.client_slug || p.client_token}`;

  const tabs = [
    { key: "steps", label: "Étapes", Icon: CheckCircle },
    { key: "checklist", label: "Attendu du client", Icon: ClipboardList, badge: toCheck || null },
    { key: "documents", label: "Documents", Icon: FileText },
    { key: "files", label: "Fichiers", Icon: File, badge: null },
    { key: "messages", label: "Messages", Icon: MessageCircle, badge: data.counts.unreadMessages || null },
    { key: "requests", label: "Retours", Icon: Monitor, badge: data.counts.newRequests || null },
    { key: "invoices", label: "Devis & factures", Icon: CreditCard },
    { key: "vault", label: "Accès", Icon: Lock },
    { key: "delivery", label: "Livraison", Icon: Gift },
    { key: "activity", label: "Journal", Icon: Activity },
  ];

  return (
    <div>
      <button type="button" onClick={onBack} className="mb-4 flex cursor-pointer items-center gap-1.5 text-sm text-adm-text-3 hover:text-adm-text">
        <ArrowLeft size={14} /> Retour au portail
      </button>

      <Card padding="p-5" className="mb-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-head text-xl font-bold text-adm-text">{p.title}</h2>
              <Badge variant={PROJECT_STATUS[p.status]?.variant || "default"}>{PROJECT_STATUS[p.status]?.label || p.status}</Badge>
            </div>
            <p className="mt-1 text-sm text-adm-text-2">
              {p.client_name} · {p.pack || "Sans pack"} · {fmtMoney(p.amount, p.currency)} · livraison {fmtDate(p.due_date)}
            </p>
            <div className="mt-3 flex items-center gap-3">
              <div className="h-2 w-48 overflow-hidden rounded-full bg-adm-surface-3">
                <div className="h-full rounded-full bg-adm-red" style={{ width: `${data.progress}%` }} />
              </div>
              <span className="text-sm font-semibold text-adm-text">{data.progress}%</span>
              {todo > 0 && <Badge variant="danger">{todo} élément(s) attendu(s)</Badge>}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <CopyButton text={portalUrl} label="Copier le lien client" />
            {p.client_phone && (
              <a
                className="inline-flex items-center rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                href={waLink(p.client_phone, `Bonjour ${String(p.client_name).split(" ")[0]}, `)}
                target="_blank"
                rel="noreferrer"
              >
                WhatsApp
              </a>
            )}
            <a className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs text-adm-text-2 hover:bg-adm-surface-2" href={portalUrl} target="_blank" rel="noreferrer">
              <ExternalLink size={14} /> Espace client
            </a>
          </div>
        </div>
      </Card>

      <SubTabs tabs={tabs} value={tab} onChange={setTab} />

      {tab === "steps" && <StepsTab data={data} reload={reload} />}
      {tab === "checklist" && <ChecklistTab data={data} reload={reload} />}
      {tab === "documents" && <DocumentsTab project={p} />}
      {tab === "files" && <FilesTab project={p} />}
      {tab === "messages" && <MessagesTab project={p} onRead={reload} />}
      {tab === "requests" && <RequestsTab project={p} reload={reload} />}
      {tab === "invoices" && <InvoicesTab project={p} />}
      {tab === "vault" && <VaultTab project={p} />}
      {tab === "delivery" && <DeliveryTab project={p} reload={reload} />}
      {tab === "activity" && <ActivityTab activity={data.activity} />}
    </div>
  );
}

function StepsTab({ data, reload }) {
  const p = data.project;
  const [weekly, setWeekly] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [newStep, setNewStep] = useState(null);

  const run = async (key, fn) => {
    setBusy(key);
    setError("");
    try {
      await fn();
      await reload();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy("");
    }
  };
  const setStatus = (s, status) => run(`s${s.id}`, () => papi(`steps/${s.id}`, "PUT", { status }));

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
      <div className="space-y-5">
        <ErrorText>{error}</ErrorText>
        <Card padding="p-4">
          <h3 className="mb-3 font-head text-base font-semibold text-adm-text">Étapes du projet</h3>
          <ol className="space-y-3">
            {data.steps.map((s, i) => (
              <li key={s.id} className="rounded-lg border border-adm-border bg-adm-surface-2 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-adm-surface-3 text-xs font-bold text-adm-text-2">{i + 1}</span>
                    <span className="font-semibold text-adm-text">{s.title}</span>
                    <Badge variant={STEP_STATUS[s.status].variant}>{STEP_STATUS[s.status].label}</Badge>
                    {s.satisfaction && <span className="text-xs text-adm-text-3">Note client : {s.satisfaction}/5</span>}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {s.status === "todo" && (
                      <Button size="sm" variant="secondary" loading={busy === `s${s.id}`} onClick={() => setStatus(s, "in_progress")}>
                        Démarrer
                      </Button>
                    )}
                    {s.status === "in_progress" && s.needs_validation === 1 && (
                      <Button size="sm" icon={Send} loading={busy === `s${s.id}`} onClick={() => setStatus(s, "review")}>
                        Demander la validation au client
                      </Button>
                    )}
                    {(s.status === "in_progress" || s.status === "review") && (
                      <Button size="sm" variant="secondary" loading={busy === `s${s.id}`} onClick={() => setStatus(s, "done")}>
                        Marquer terminée
                      </Button>
                    )}
                    {s.status === "done" && (
                      <Button size="sm" variant="ghost" onClick={() => setStatus(s, "in_progress")}>
                        Rouvrir
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={Trash2}
                      aria-label="Supprimer l'étape"
                      onClick={() => confirm(`Supprimer l'étape « ${s.title} » ?`) && run("del", () => papi(`steps/${s.id}`, "DELETE"))}
                    />
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-adm-text-3">
                  <label className="flex items-center gap-1">
                    Échéance
                    <input
                      type="date"
                      className="rounded border border-adm-border-2 bg-adm-surface-3 px-1.5 py-0.5 text-adm-text"
                      defaultValue={s.due_date || ""}
                      onBlur={(e) => e.target.value !== (s.due_date || "") && run("d", () => papi(`steps/${s.id}`, "PUT", { due_date: e.target.value }))}
                    />
                  </label>
                  <label className="flex cursor-pointer items-center gap-1">
                    <input type="checkbox" checked={!!s.needs_validation} onChange={(e) => run("v", () => papi(`steps/${s.id}`, "PUT", { needs_validation: e.target.checked }))} />
                    Validation client requise
                  </label>
                  {s.validated_at && <span>Validé le {fmtDateTime(s.validated_at)} (IP {s.validated_ip})</span>}
                </div>
                {s.validation_comment && <p className="mt-2 rounded bg-adm-surface-3 px-2 py-1 text-sm text-adm-text-2">💬 {s.validation_comment}</p>}
                {s.satisfaction_comment && <p className="mt-1 text-xs text-amber-400">Commentaire satisfaction : {s.satisfaction_comment}</p>}
              </li>
            ))}
          </ol>
          {newStep ? (
            <div className="mt-3 space-y-2">
              <Input label="Titre de l'étape" value={newStep.title} onChange={(e) => setNewStep({ ...newStep, title: e.target.value })} />
              <Textarea label="Description (visible par le client)" value={newStep.description} onChange={(e) => setNewStep({ ...newStep, description: e.target.value })} />
              <label className="flex items-center gap-2 text-sm text-adm-text-2">
                <input type="checkbox" checked={newStep.needs_validation} onChange={(e) => setNewStep({ ...newStep, needs_validation: e.target.checked })} /> Validation client requise
              </label>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => run("new", async () => (await papi(`projects/${p.id}/steps`, "POST", newStep), setNewStep(null)))}>
                  Ajouter
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setNewStep(null)}>
                  Annuler
                </Button>
              </div>
            </div>
          ) : (
            <Button className="mt-3" size="sm" variant="ghost" icon={Plus} onClick={() => setNewStep({ title: "", description: "", needs_validation: false })}>
              Ajouter une étape
            </Button>
          )}
        </Card>

        <Card padding="p-4">
          <h3 className="font-head text-base font-semibold text-adm-text">Point de la semaine</h3>
          <p className="mb-2 text-xs text-adm-text-3">2-3 lignes pour rassurer le client. Publié sur son accueil + email + messagerie.</p>
          {p.weekly_update && (
            <p className="mb-2 rounded-lg bg-adm-surface-2 p-2 text-sm text-adm-text-2">
              Dernier ({fmtDate(p.weekly_update_at)}) : {p.weekly_update}
            </p>
          )}
          <Textarea value={weekly} onChange={(e) => setWeekly(e.target.value)} placeholder="Cette semaine : page Accueil et Services terminées. La semaine prochaine : intégration des photos et du formulaire." />
          <Button className="mt-2" size="sm" icon={Send} loading={busy === "weekly"} disabled={!weekly.trim()} onClick={() => run("weekly", async () => (await papi(`projects/${p.id}/weekly-update`, "POST", { text: weekly }), setWeekly("")))}>
            Publier
          </Button>
        </Card>
      </div>

      <ProjectSettings project={p} reload={reload} />
    </div>
  );
}

function ProjectSettings({ project, reload }) {
  const [f, setF] = useState({
    title: project.title || "",
    pack: project.pack || "",
    status: project.status || "actif",
    amount: project.amount ?? "",
    currency: project.currency || "XAF",
    start_date: project.start_date || "",
    due_date: project.due_date || "",
    preview_url: project.preview_url || "",
    revision_rounds: project.revision_rounds ?? "",
    revision_used: project.revision_used ?? 0,
    support_days: project.support_days ?? "",
    internal_notes: project.internal_notes || "",
  });
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  return (
    <Card padding="p-4" className="h-fit space-y-3">
      <h3 className="font-head text-base font-semibold text-adm-text">Réglages du projet</h3>
      <Input label="Titre" value={f.title} onChange={set("title")} />
      <div className="grid grid-cols-2 gap-2">
        <Input label="Pack" value={f.pack} onChange={set("pack")} />
        <Select label="Statut" value={f.status} onChange={set("status")} options={Object.entries(PROJECT_STATUS).map(([value, v]) => ({ value, label: v.label }))} />
        <Input label="Montant" type="number" value={f.amount} onChange={set("amount")} />
        <Select label="Devise" value={f.currency} onChange={set("currency")} options={["XAF", "EUR"]} />
        <Input label="Début" type="date" value={f.start_date} onChange={set("start_date")} />
        <Input label="Livraison prévue" type="date" value={f.due_date} onChange={set("due_date")} />
      </div>
      <Input label="URL du site en développement" value={f.preview_url} onChange={set("preview_url")} placeholder="https://…pages.dev" />
      <div className="grid grid-cols-3 gap-2">
        <Input label="Séries de modifs" type="number" value={f.revision_rounds} onChange={set("revision_rounds")} placeholder="—" />
        <Input label="Utilisées" type="number" value={f.revision_used} onChange={set("revision_used")} />
        <Input label="Support (jours)" type="number" value={f.support_days} onChange={set("support_days")} />
      </div>
      <p className="text-[11px] text-adm-text-3">Séries de modifs : vide = non affiché, -1 = illimitées.</p>
      <Textarea label="Notes internes (privées)" value={f.internal_notes} onChange={set("internal_notes")} />
      <Button
        loading={busy}
        onClick={async () => {
          setBusy(true);
          try {
            await papi(`projects/${project.id}`, "PUT", f);
            setSaved(true);
            setTimeout(() => setSaved(false), 1800);
            reload();
          } finally {
            setBusy(false);
          }
        }}
      >
        {saved ? "Enregistré ✓" : "Enregistrer"}
      </Button>
      <Button
        variant="danger"
        size="sm"
        icon={Trash2}
        onClick={async () => {
          if (!confirm("Supprimer définitivement ce projet, ses fichiers, documents et factures ?")) return;
          await papi(`projects/${project.id}`, "DELETE");
          location.reload();
        }}
      >
        Supprimer le projet
      </Button>
    </Card>
  );
}
