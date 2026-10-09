/* Documents & contrats d'un projet : upload, modèle, rédaction, envoi,
   signature du client puis contresignature. */
import { useRef, useState } from "react";
import { apiForm } from "../../../lib/api";
import { Badge, Button, Card, EmptyState, Input, LoadingSpinner, Modal, Select, Textarea } from "../../ui";
import { Download, Eye, FileText, PenTool, Send, Trash2, Upload, X } from "../../../lib/icons";
import { ErrorText, SignaturePad, fmtDateTime, papi, useLoad } from "../shared";

const CATEGORIES = [
  { value: "contrat", label: "Contrat" },
  { value: "devis", label: "Devis signé" },
  { value: "maquette", label: "Maquette" },
  { value: "document", label: "Document" },
  { value: "livraison", label: "Livraison" },
];

function statusBadge(d) {
  if (d.status === "draft") return <Badge>Brouillon</Badge>;
  if (d.status === "sent") return <Badge variant={d.needs_signature ? "warning" : "info"}>{d.needs_signature ? "En attente de signature" : "Partagé"}</Badge>;
  if (d.admin_signed_at) return <Badge variant="success">Signé par les deux parties</Badge>;
  return <Badge variant="success">Signé par le client</Badge>;
}

export default function DocumentsTab({ project }) {
  const { data, error, reload } = useLoad(`projects/${project.id}/documents`);
  const [mode, setMode] = useState(null); // upload | template | write
  const [editing, setEditing] = useState(null);
  const [countersign, setCountersign] = useState(null);
  const [err, setErr] = useState("");

  const act = async (fn) => {
    setErr("");
    try {
      const r = await fn();
      if (r && r.emailSent === false) setErr("Document envoyé, mais l'email n'est pas parti (emails non configurés). Prévenez le client par WhatsApp.");
      reload();
    } catch (e) {
      setErr(e.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button icon={Upload} onClick={() => setMode("upload")}>
          Uploader un document
        </Button>
        <Button variant="secondary" icon={FileText} onClick={() => setMode("template")}>
          Depuis un modèle de contrat
        </Button>
        <Button variant="ghost" icon={PenTool} onClick={() => setMode("write")}>
          Rédiger
        </Button>
      </div>
      <ErrorText>{error || err}</ErrorText>

      {!data ? (
        <LoadingSpinner />
      ) : !data.documents.length ? (
        <EmptyState icon={FileText} message="Aucun document. Uploadez votre contrat (PDF, Word…) ou créez-le depuis un modèle." />
      ) : (
        <div className="space-y-2">
          {data.documents.map((d) => (
            <Card key={d.id} padding="p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-adm-text">{d.title}</span>
                    {statusBadge(d)}
                    <span className="text-xs text-adm-text-3">{d.category}</span>
                  </div>
                  <p className="text-xs text-adm-text-3">
                    {d.file_name ? `Fichier : ${d.file_name}` : "Document rédigé"}
                    {d.signed_at && ` · signé le ${fmtDateTime(d.signed_at)} (IP ${d.sig_ip})`}
                    {d.admin_signed_at && ` · contresigné le ${fmtDateTime(d.admin_signed_at)}`}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <a className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-adm-text-2 hover:bg-adm-surface-2" href={`/api/admin/portal/documents/${d.id}/preview`} target="_blank" rel="noreferrer">
                    <Eye size={14} /> Aperçu
                  </a>
                  {d.status === "draft" && !d.has_file && (
                    <Button size="sm" variant="ghost" onClick={() => papi(`documents/${d.id}`).then((r) => setEditing(r.document))}>
                      Modifier
                    </Button>
                  )}
                  {d.status === "draft" && (
                    <Button
                      size="sm"
                      icon={Send}
                      onClick={() =>
                        act(async () => {
                          try {
                            return await papi(`documents/${d.id}/send`, "POST", {});
                          } catch (e) {
                            if (/à compléter/.test(e.message) && confirm(`${e.message}\n\nEnvoyer quand même ?`)) return papi(`documents/${d.id}/send`, "POST", { force: true });
                            throw e;
                          }
                        })
                      }
                    >
                      Envoyer au client
                    </Button>
                  )}
                  {d.status === "sent" && (
                    <Button size="sm" variant="ghost" icon={X} onClick={() => act(() => papi(`documents/${d.id}/unsend`, "POST"))}>
                      Retirer
                    </Button>
                  )}
                  {d.status === "signed" && !d.admin_signed_at && (
                    <Button size="sm" icon={PenTool} onClick={() => setCountersign(d)}>
                      Contresigner
                    </Button>
                  )}
                  {d.has_signed_pdf ? (
                    <a className="inline-flex items-center gap-1 rounded-lg bg-emerald-600/20 px-2.5 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-600/30" href={`/api/admin/portal/documents/${d.id}/signed?download=1`}>
                      <Download size={14} /> PDF signé
                    </a>
                  ) : null}
                  <Button size="sm" variant="ghost" icon={Trash2} aria-label="Supprimer" onClick={() => confirm(`Supprimer « ${d.title} » ?`) && act(() => papi(`documents/${d.id}`, "DELETE"))} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={mode === "upload"} onClose={() => setMode(null)} title="Uploader un document">
        <UploadDoc projectId={project.id} onDone={() => (setMode(null), reload())} />
      </Modal>
      <Modal open={mode === "template"} onClose={() => setMode(null)} title="Créer depuis un modèle">
        <FromTemplate project={project} onDone={() => (setMode(null), reload())} />
      </Modal>
      <Modal open={mode === "write" || !!editing} onClose={() => (setMode(null), setEditing(null))} title={editing ? "Modifier le document" : "Rédiger un document"} wide>
        <WriteDoc projectId={project.id} doc={editing} onDone={() => (setMode(null), setEditing(null), reload())} />
      </Modal>
      <Modal open={!!countersign} onClose={() => setCountersign(null)} title={`Contresigner « ${countersign?.title || ""} »`}>
        {countersign && <Countersign doc={countersign} onDone={() => (setCountersign(null), reload())} />}
      </Modal>
    </div>
  );
}

function UploadDoc({ projectId, onDone }) {
  const input = useRef(null);
  const [file, setFile] = useState(null);
  const [f, setF] = useState({ title: "", category: "contrat", needs_signature: true });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <div className="space-y-3">
      <ErrorText>{error}</ErrorText>
      <button type="button" onClick={() => input.current?.click()} className="w-full cursor-pointer rounded-xl border-2 border-dashed border-adm-border-2 p-6 text-center text-sm text-adm-text-2 hover:border-adm-red">
        {file ? `📄 ${file.name}` : "Choisir un fichier (PDF, Word, image — 30 Mo max)"}
      </button>
      <input
        ref={input}
        type="file"
        hidden
        accept=".pdf,.doc,.docx,.odt,.png,.jpg,.jpeg,.xlsx,.pptx,.txt"
        onChange={(e) => {
          const x = e.target.files?.[0];
          if (x) {
            setFile(x);
            if (!f.title) setF({ ...f, title: x.name.replace(/\.[a-z0-9]+$/i, "") });
          }
        }}
      />
      <Input label="Titre affiché au client" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
      <Select label="Type" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value, needs_signature: e.target.value === "contrat" || e.target.value === "devis" })} options={CATEGORIES} />
      <label className="flex items-center gap-2 text-sm text-adm-text-2">
        <input type="checkbox" checked={f.needs_signature} onChange={(e) => setF({ ...f, needs_signature: e.target.checked })} /> Le client doit le signer
      </label>
      <p className="text-xs text-adm-text-3">PDF ou image : la signature est apposée sur le document. Word : le PDF signé contient le certificat avec l'empreinte du fichier (conseil : exportez en PDF).</p>
      <Button
        loading={busy}
        disabled={!file}
        onClick={async () => {
          setBusy(true);
          setError("");
          try {
            const fd = new FormData();
            fd.append("file", file);
            fd.append("title", f.title);
            fd.append("category", f.category);
            fd.append("needs_signature", f.needs_signature ? "1" : "0");
            await apiForm(`portal/projects/${projectId}/documents/upload`, fd);
            onDone();
          } catch (e) {
            setError(e.message);
          } finally {
            setBusy(false);
          }
        }}
      >
        Ajouter (brouillon)
      </Button>
    </div>
  );
}

function FromTemplate({ project, onDone }) {
  const { data } = useLoad("contract-templates");
  const [tpl, setTpl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (!data) return <LoadingSpinner />;
  const list = [...data.templates].filter((t) => t.active).sort((a, b) => (b.pack === project.pack) - (a.pack === project.pack));
  if (!list.length) return <p className="text-sm text-adm-text-3">Aucun modèle. Créez-en un dans Portail client → Modèles.</p>;
  return (
    <div className="space-y-3">
      <ErrorText>{error}</ErrorText>
      <Select label="Modèle" value={tpl} onChange={(e) => setTpl(e.target.value)} options={[{ value: "", label: "Choisir…" }, ...list.map((t) => ({ value: t.id, label: `${t.title}${t.pack ? ` (${t.pack})` : ""}${t.file_name ? " — fichier" : ""}` }))]} />
      <p className="text-xs text-adm-text-3">Les variables ({"{{client_name}}"}, {"{{amount}}"}…) sont remplies automatiquement avec les infos du client et du projet. Vérifiez l'aperçu avant l'envoi.</p>
      <Button
        loading={busy}
        disabled={!tpl}
        onClick={async () => {
          setBusy(true);
          try {
            await papi(`projects/${project.id}/documents`, "POST", { template_id: tpl, category: "contrat" });
            onDone();
          } catch (e) {
            setError(e.message);
          } finally {
            setBusy(false);
          }
        }}
      >
        Créer le brouillon
      </Button>
    </div>
  );
}

function WriteDoc({ projectId, doc, onDone }) {
  const [f, setF] = useState({ title: doc?.title || "", content: doc?.content || "", category: doc?.category || "document", needs_signature: doc ? !!doc.needs_signature : false });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <div className="space-y-3">
      <ErrorText>{error}</ErrorText>
      <div className="grid gap-3 sm:grid-cols-2">
        <Input label="Titre" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
        <Select label="Type" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} options={CATEGORIES} />
      </div>
      <Textarea label="Contenu" className="min-h-[340px] font-mono text-[13px]" value={f.content} onChange={(e) => setF({ ...f, content: e.target.value })} />
      <label className="flex items-center gap-2 text-sm text-adm-text-2">
        <input type="checkbox" checked={f.needs_signature} onChange={(e) => setF({ ...f, needs_signature: e.target.checked })} /> Le client doit le signer
      </label>
      <Button
        loading={busy}
        disabled={!f.title || !f.content.trim()}
        onClick={async () => {
          setBusy(true);
          try {
            if (doc) await papi(`documents/${doc.id}`, "PUT", f);
            else await papi(`projects/${projectId}/documents`, "POST", f);
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

function Countersign({ doc, onDone }) {
  const [sig, setSig] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <div className="space-y-3">
      <ErrorText>{error}</ErrorText>
      <p className="text-sm text-adm-text-2">Signez dans le cadre. Le PDF final (signatures du client + Impact Tech + certificat) sera envoyé au client.</p>
      <SignaturePad onChange={setSig} />
      <Button
        icon={PenTool}
        loading={busy}
        disabled={!sig}
        onClick={async () => {
          setBusy(true);
          try {
            await papi(`documents/${doc.id}/countersign`, "POST", { signature: sig });
            onDone();
          } catch (e) {
            setError(e.message);
          } finally {
            setBusy(false);
          }
        }}
      >
        Contresigner
      </Button>
    </div>
  );
}
