/* Questionnaires clients : créer (définition JSON), partager le lien,
   lire les réponses, exporter en PDF. */
import { useState } from "react";
import { Badge, Button, Card, EmptyState, LoadingSpinner, Modal, Select, Textarea } from "../ui";
import { ArrowLeft, ClipboardList, Copy, Download, ExternalLink, Plus, Trash2 } from "../../lib/icons";
import { CopyButton, ErrorText, fmtAgo, fmtDateTime, papi, useLoad } from "./shared";

const STATUS = {
  sent: { label: "Envoyé — pas encore ouvert", variant: "default" },
  in_progress: { label: "En cours de remplissage", variant: "warning" },
  submitted: { label: "Réponses reçues", variant: "success" },
  closed: { label: "Clôturé", variant: "default" },
};

const EXAMPLE = `{
  "title": "Contenu du site — Nom du client",
  "eyebrow": "Contenu du site",
  "heading": "Ce qu'on va *écrire*, on le prend de vos mots.",
  "intro": "Rien n'est obligatoire : laissez vide ce qui n'est pas prêt.",
  "sections": [
    {
      "title": "Identité",
      "context": "Ce qui apparaît en haut et en bas de chaque page.",
      "fields": [
        { "id": "nom", "type": "text", "label": "Nom affiché sur le site", "half": true },
        { "id": "ville", "type": "text", "label": "Ville affichée", "half": true },
        { "id": "domaines", "type": "repeat", "label": "Domaine", "count": 3,
          "fields": [
            { "id": "nom", "type": "text", "placeholder": "Nom du domaine" },
            { "id": "description", "type": "textarea", "placeholder": "En une phrase" }
          ] }
      ]
    }
  ]
}`;

export default function Questionnaires({ clientId, projectId }) {
  const { data, error, reload } = useLoad(`questionnaires${clientId ? `?client_id=${clientId}` : ""}`, [clientId]);
  const [openId, setOpenId] = useState(null);
  const [creating, setCreating] = useState(false);

  if (openId) return <QuestionnaireDetail id={openId} onBack={() => (setOpenId(null), reload())} />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-adm-text-3">Après l'appel découverte : un questionnaire sur mesure, un lien à envoyer, les réponses ici (export PDF).</p>
        <Button icon={Plus} onClick={() => setCreating(true)}>
          Nouveau questionnaire
        </Button>
      </div>
      <ErrorText>{error}</ErrorText>
      {!data ? (
        <LoadingSpinner />
      ) : !data.questionnaires.length ? (
        <EmptyState icon={ClipboardList} message="Aucun questionnaire. Décrivez l'appel à Claude : il rédige le questionnaire et vous donne le lien." />
      ) : (
        <div className="space-y-2">
          {data.questionnaires.map((q) => (
            <Card key={q.id} padding="p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <button type="button" className="min-w-0 flex-1 cursor-pointer text-left" onClick={() => setOpenId(q.id)}>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-adm-text hover:underline">{q.title}</span>
                    <Badge variant={STATUS[q.status]?.variant}>{STATUS[q.status]?.label || q.status}</Badge>
                  </div>
                  <p className="text-xs text-adm-text-3">
                    {q.client_name || "Sans client"}
                    {q.project_title ? ` · ${q.project_title}` : ""} · {q.total ? `${q.filled}/${q.total} réponses` : "aucune réponse"} ·{" "}
                    {q.saved_at ? `modifié ${fmtAgo(q.saved_at)}` : q.opened_at ? `ouvert ${fmtAgo(q.opened_at)}` : `créé ${fmtAgo(q.created_at)}`}
                  </p>
                </button>
                <div className="flex gap-1.5">
                  <CopyButton text={q.link} label="Lien" />
                  <a className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-adm-text-2 hover:bg-adm-surface-2" href={`/api/admin/portal/questionnaires/${q.id}/pdf`} target="_blank" rel="noreferrer">
                    <Download size={14} /> PDF
                  </a>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      <Modal open={creating} onClose={() => setCreating(false)} title="Nouveau questionnaire" wide>
        <CreateForm
          clientId={clientId}
          projectId={projectId}
          onCreated={(id) => {
            setCreating(false);
            reload();
            setOpenId(id);
          }}
        />
      </Modal>
    </div>
  );
}

function CreateForm({ clientId, projectId, onCreated }) {
  const clients = useLoad(clientId ? null : "clients?search=");
  const [json, setJson] = useState(EXAMPLE);
  const [client, setClient] = useState(clientId || "");
  const [locale, setLocale] = useState("fr");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  return (
    <div className="space-y-3">
      <p className="text-sm text-adm-text-2">
        Collez la définition rédigée par Claude après votre appel (ou adaptez l'exemple). Types de champs : text, textarea, url, email, tel, number, date, select, radio,
        checkbox, yesno, scale, repeat, info. Un mot entre *astérisques* dans le titre apparaît en italique rouge.
      </p>
      <ErrorText>{error}</ErrorText>
      <div className="grid gap-3 sm:grid-cols-2">
        {!clientId && (
          <Select
            label="Client (facultatif)"
            value={client}
            onChange={(e) => setClient(e.target.value)}
            options={[{ value: "", label: "Aucun — lien seul" }, ...(clients.data?.clients || []).map((c) => ({ value: c.id, label: `${c.name}${c.company ? ` (${c.company})` : ""}` }))]}
          />
        )}
        <Select label="Langue" value={locale} onChange={(e) => setLocale(e.target.value)} options={[{ value: "fr", label: "Français" }, { value: "en", label: "English" }]} />
      </div>
      <Textarea label="Définition (JSON)" className="min-h-[360px] font-mono text-[12.5px]" value={json} onChange={(e) => setJson(e.target.value)} />
      <Button
        loading={busy}
        onClick={async () => {
          setError("");
          let definition;
          try {
            definition = JSON.parse(json);
          } catch (e) {
            return setError(`JSON invalide : ${e.message}`);
          }
          setBusy(true);
          try {
            const r = await papi("questionnaires", "POST", { definition, client_id: client || null, project_id: projectId || null, locale });
            onCreated(r.id);
          } catch (e) {
            setError(e.message);
          } finally {
            setBusy(false);
          }
        }}
      >
        Créer et obtenir le lien
      </Button>
    </div>
  );
}

function QuestionnaireDetail({ id, onBack }) {
  const { data, error, reload } = useLoad(`questionnaires/${id}`);
  const [editing, setEditing] = useState(false);
  if (error) return <ErrorText>{error}</ErrorText>;
  if (!data) return <LoadingSpinner />;
  const q = data.questionnaire;

  const setStatus = async (status) => {
    await papi(`questionnaires/${id}`, "PUT", { status });
    reload();
  };

  return (
    <div className="space-y-4">
      <button type="button" onClick={onBack} className="flex cursor-pointer items-center gap-1.5 text-sm text-adm-text-3 hover:text-adm-text">
        <ArrowLeft size={14} /> Tous les questionnaires
      </button>
      <Card padding="p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-head text-xl font-bold text-adm-text">{q.title}</h2>
              <Badge variant={STATUS[q.status]?.variant}>{STATUS[q.status]?.label || q.status}</Badge>
            </div>
            <p className="mt-1 text-sm text-adm-text-2">
              {q.client_name || "Sans client"} · {q.total ? `${q.filled}/${q.total} réponses` : "aucune réponse"}
              {q.submitted_at && ` · envoyé le ${fmtDateTime(q.submitted_at)}`}
              {!q.submitted_at && q.saved_at && ` · brouillon du ${fmtDateTime(q.saved_at)}`}
              {!q.saved_at && (q.opened_at ? ` · ouvert le ${fmtDateTime(q.opened_at)}` : " · pas encore ouvert")}
            </p>
            <code className="mt-2 block break-all text-xs text-adm-text-3">{q.link}</code>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href={q.share.whatsapp} target="_blank" rel="noreferrer" className="inline-flex items-center rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700">
              Envoyer par WhatsApp
            </a>
            <CopyButton text={q.link} label="Copier le lien" />
            <CopyButton text={q.share.text} label="Copier le message" />
            <a className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs text-adm-text-2 hover:bg-adm-surface-2" href={q.link} target="_blank" rel="noreferrer">
              <ExternalLink size={14} /> Voir comme le client
            </a>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 border-t border-adm-border pt-4">
          <a className="inline-flex items-center gap-1.5 rounded-lg bg-adm-red px-4 py-2 text-sm font-semibold text-white hover:bg-adm-red-dark" href={`/api/admin/portal/questionnaires/${id}/pdf?download=1`}>
            <Download size={16} /> Exporter en PDF
          </a>
          <Button variant="secondary" size="md" onClick={() => setEditing(true)}>
            Modifier les questions
          </Button>
          {q.status !== "closed" ? (
            <Button variant="ghost" onClick={() => confirm("Clôturer ? Le client ne pourra plus modifier ses réponses.") && setStatus("closed")}>
              Clôturer
            </Button>
          ) : (
            <Button variant="ghost" onClick={() => setStatus(q.submitted_at ? "submitted" : "in_progress")}>
              Rouvrir
            </Button>
          )}
          <Button
            variant="ghost"
            icon={Copy}
            onClick={async () => {
              const r = await papi(`questionnaires/${id}/duplicate`, "POST", {});
              alert(`Copie créée (sans client ni réponses) :\n${r.link}`);
            }}
          >
            Dupliquer
          </Button>
          <Button
            variant="danger"
            icon={Trash2}
            onClick={async () => {
              if (!confirm("Supprimer ce questionnaire et ses réponses ? Action définitive.")) return;
              await papi(`questionnaires/${id}`, "DELETE");
              onBack();
            }}
          >
            Supprimer
          </Button>
        </div>
      </Card>

      {q.sections.map((s, i) => (
        <Card key={i} padding="p-5">
          <h3 className="mb-3 flex items-baseline gap-3 font-head text-base font-semibold text-adm-text">
            <span className="text-adm-red">{String(i + 1).padStart(2, "0")}</span> {s.title}
          </h3>
          <dl className="space-y-3">
            {s.items.map((it, j) => (
              <div key={j} className={j > 0 && it.group && it.group !== s.items[j - 1].group ? "border-t border-adm-border pt-3" : ""}>
                {it.group && (j === 0 || it.group !== s.items[j - 1].group) && <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-adm-red">{it.group}</p>}
                <dt className="text-xs font-semibold text-adm-text-3">{it.label}</dt>
                <dd className={`whitespace-pre-wrap text-sm ${it.value ? "text-adm-text" : "text-adm-text-3"}`}>{it.value || "—"}</dd>
              </div>
            ))}
          </dl>
        </Card>
      ))}

      <Modal open={editing} onClose={() => setEditing(false)} title="Modifier les questions" wide>
        <EditDefinition id={id} definition={q.definition} onSaved={() => (setEditing(false), reload())} />
      </Modal>
    </div>
  );
}

function EditDefinition({ id, definition, onSaved }) {
  const [json, setJson] = useState(JSON.stringify(definition, null, 2));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <div className="space-y-3">
      <p className="text-sm text-adm-text-2">Les réponses déjà saisies sont conservées pour les champs dont l'identifiant (« id ») ne change pas.</p>
      <ErrorText>{error}</ErrorText>
      <Textarea className="min-h-[420px] font-mono text-[12.5px]" value={json} onChange={(e) => setJson(e.target.value)} />
      <Button
        loading={busy}
        onClick={async () => {
          setError("");
          let def;
          try {
            def = JSON.parse(json);
          } catch (e) {
            return setError(`JSON invalide : ${e.message}`);
          }
          setBusy(true);
          try {
            await papi(`questionnaires/${id}`, "PUT", { definition: def });
            onSaved();
          } catch (e) {
            setError(e.message);
          } finally {
            setBusy(false);
          }
        }}
      >
        Enregistrer
      </Button>
    </div>
  );
}
