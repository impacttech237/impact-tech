/* Modèles : projet par pack (étapes + ce qu'on demande au client)
   et contrats (texte à variables ou fichier). */
import { useRef, useState } from "react";
import { apiForm } from "../../lib/api";
import { Badge, Button, Card, EmptyState, Input, LoadingSpinner, Modal, Select, Textarea } from "../ui";
import { Edit3, Eye, FileText, Plus, Trash2, Upload } from "../../lib/icons";
import { ErrorText, FILE_CATEGORIES, KIND_LABEL, papi, useLoad } from "./shared";

export default function Templates() {
  return (
    <div className="space-y-8">
      <ProjectTemplates />
      <ContractTemplates />
    </div>
  );
}

/* ── Modèles de projet par pack ── */

function ProjectTemplates() {
  const { data, error, reload } = useLoad("templates");
  const [editing, setEditing] = useState(null);
  if (error) return <ErrorText>{error}</ErrorText>;
  if (!data) return <LoadingSpinner />;
  const saved = data.templates;
  const list = saved.length ? saved : data.defaults.map((d) => ({ ...d, id: null }));

  return (
    <section>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-head text-lg font-semibold text-adm-text">Modèles de projet par pack</h3>
          <p className="text-sm text-adm-text-3">À la création d'un projet, ses étapes, ce qu'on demande au client et ses délais viennent d'ici.</p>
        </div>
        <Button size="sm" icon={Plus} onClick={() => setEditing({ pack: "", title: "", steps: [], checklist: [] })}>
          Nouveau modèle
        </Button>
      </div>
      {!saved.length && <p className="mb-3 rounded-lg bg-amber-500/10 p-3 text-sm text-amber-300">Modèles par défaut affichés : ouvrez-en un et enregistrez-le pour le personnaliser.</p>}
      <div className="grid gap-3 lg:grid-cols-3">
        {list.map((t, i) => (
          <Card key={t.id || `d${i}`} padding="p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-adm-text">{t.pack}</p>
                <p className="text-xs text-adm-text-3">{t.title}</p>
              </div>
              {!t.id && <Badge>Par défaut</Badge>}
            </div>
            <ul className="mt-3 space-y-1 text-xs text-adm-text-2">
              <li>Délai : {t.delay_days ? `${t.delay_days} jours` : "à définir"}</li>
              <li>Séries de modifications : {t.revision_rounds == null ? "non affichées" : t.revision_rounds < 0 ? "illimitées" : t.revision_rounds}</li>
              <li>Support : {t.support_days ? `${t.support_days} jours` : "—"}</li>
              <li>
                {t.steps.length} étapes · {t.checklist.length} éléments demandés au client
              </li>
            </ul>
            <div className="mt-3 flex gap-2">
              <Button size="sm" variant="secondary" icon={Edit3} onClick={() => setEditing(t)}>
                {t.id ? "Modifier" : "Personnaliser"}
              </Button>
              {t.id && <Button size="sm" variant="ghost" icon={Trash2} aria-label="Supprimer" onClick={() => confirm("Supprimer ce modèle ?") && papi(`templates/${t.id}`, "DELETE").then(reload)} />}
            </div>
          </Card>
        ))}
      </div>
      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? `Modèle — ${editing.pack}` : "Modèle de projet"} wide>
        {editing && <ProjectTemplateForm tpl={editing} onDone={() => (setEditing(null), reload())} />}
      </Modal>
    </section>
  );
}

function ProjectTemplateForm({ tpl, onDone }) {
  const contracts = useLoad("contract-templates");
  const [f, setF] = useState({
    ...tpl,
    delay_days: tpl.delay_days ?? "",
    revision_rounds: tpl.revision_rounds ?? "",
    support_days: tpl.support_days ?? "",
    contract_template_id: tpl.contract_template_id ?? "",
    steps: tpl.steps.map((s) => ({ ...s })),
    checklist: tpl.checklist.map((c) => ({ ...c, questions: (c.config || []).map((q) => q.q).join("\n") })),
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const setStep = (i, k, v) => setF({ ...f, steps: f.steps.map((s, j) => (j === i ? { ...s, [k]: v } : s)) });
  const setItem = (i, k, v) => setF({ ...f, checklist: f.checklist.map((s, j) => (j === i ? { ...s, [k]: v } : s)) });
  const move = (key, i, d) => {
    const arr = [...f[key]];
    const j = i + d;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    setF({ ...f, [key]: arr });
  };
  const inputCls = "w-full rounded-lg border border-adm-border-2 bg-adm-surface-3 px-3 py-2 text-sm text-adm-text";

  async function save() {
    setBusy(true);
    setError("");
    const body = {
      ...f,
      checklist: f.checklist.map(({ questions, ...c }) => ({
        ...c,
        config: c.kind === "form" ? (questions || "").split("\n").map((q) => ({ q: q.trim(), long: q.length > 40 })).filter((q) => q.q) : undefined,
      })),
    };
    try {
      if (tpl.id) await papi(`templates/${tpl.id}`, "PUT", body);
      else await papi("templates", "POST", body);
      onDone();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <ErrorText>{error}</ErrorText>
      <div className="grid gap-3 sm:grid-cols-2">
        <Input label="Pack (nom exact de l'offre)" value={f.pack} onChange={(e) => setF({ ...f, pack: e.target.value })} placeholder="Impact Essentiel" />
        <Input label="Titre" value={f.title || ""} onChange={(e) => setF({ ...f, title: e.target.value })} />
      </div>
      <div className="grid gap-3 sm:grid-cols-4">
        <Input label="Délai (jours)" type="number" value={f.delay_days} onChange={(e) => setF({ ...f, delay_days: e.target.value })} />
        <Input label="Séries de modifs" type="number" value={f.revision_rounds} onChange={(e) => setF({ ...f, revision_rounds: e.target.value })} placeholder="vide / -1" />
        <Input label="Support (jours)" type="number" value={f.support_days} onChange={(e) => setF({ ...f, support_days: e.target.value })} />
        <Select
          label="Contrat par défaut"
          value={f.contract_template_id}
          onChange={(e) => setF({ ...f, contract_template_id: e.target.value })}
          options={[{ value: "", label: "Aucun" }, ...(contracts.data?.templates || []).map((t) => ({ value: t.id, label: t.title }))]}
        />
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-adm-text">Étapes</p>
        <div className="space-y-2">
          {f.steps.map((s, i) => (
            <div key={i} className="grid grid-cols-[1fr_1.6fr_70px_auto_auto] items-center gap-2">
              <input className={inputCls} placeholder="Titre" value={s.title} onChange={(e) => setStep(i, "title", e.target.value)} />
              <input className={inputCls} placeholder="Description pour le client" value={s.description || ""} onChange={(e) => setStep(i, "description", e.target.value)} />
              <input className={inputCls} type="number" title="Durée en jours" value={s.days || ""} onChange={(e) => setStep(i, "days", e.target.value)} placeholder="jours" />
              <label className="flex items-center gap-1 whitespace-nowrap text-xs text-adm-text-2">
                <input type="checkbox" checked={!!s.needs_validation} onChange={(e) => setStep(i, "needs_validation", e.target.checked)} /> validation
              </label>
              <div className="flex gap-1 text-adm-text-3">
                <button type="button" className="cursor-pointer px-1" onClick={() => move("steps", i, -1)} aria-label="Monter">↑</button>
                <button type="button" className="cursor-pointer px-1" onClick={() => move("steps", i, 1)} aria-label="Descendre">↓</button>
                <button type="button" className="cursor-pointer px-1 hover:text-adm-red" onClick={() => setF({ ...f, steps: f.steps.filter((_, j) => j !== i) })} aria-label="Retirer">✕</button>
              </div>
            </div>
          ))}
        </div>
        <Button className="mt-2" size="sm" variant="ghost" icon={Plus} onClick={() => setF({ ...f, steps: [...f.steps, { title: "", description: "", days: "", needs_validation: false }] })}>
          Ajouter une étape
        </Button>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-adm-text">Ce qu'on demande au client</p>
        <div className="space-y-3">
          {f.checklist.map((c, i) => (
            <div key={i} className="space-y-2 rounded-lg border border-adm-border bg-adm-surface-2 p-3">
              <div className="grid grid-cols-[1.5fr_1fr_1fr_80px_auto] items-center gap-2">
                <input className={inputCls} placeholder="Élément demandé" value={c.label} onChange={(e) => setItem(i, "label", e.target.value)} />
                <select className={inputCls} value={c.kind} onChange={(e) => setItem(i, "kind", e.target.value)}>
                  {Object.entries(KIND_LABEL).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
                <select className={inputCls} value={c.category || ""} onChange={(e) => setItem(i, "category", e.target.value)}>
                  <option value="">Dossier…</option>
                  {FILE_CATEGORIES.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <input className={inputCls} type="number" title="Échéance : jours après le début" placeholder="J+" value={c.due_days || ""} onChange={(e) => setItem(i, "due_days", e.target.value)} />
                <div className="flex gap-1 text-adm-text-3">
                  <button type="button" className="cursor-pointer px-1" onClick={() => move("checklist", i, -1)} aria-label="Monter">↑</button>
                  <button type="button" className="cursor-pointer px-1" onClick={() => move("checklist", i, 1)} aria-label="Descendre">↓</button>
                  <button type="button" className="cursor-pointer px-1 hover:text-adm-red" onClick={() => setF({ ...f, checklist: f.checklist.filter((_, j) => j !== i) })} aria-label="Retirer">✕</button>
                </div>
              </div>
              <input className={inputCls} placeholder="Aide affichée au client (simple)" value={c.help || ""} onChange={(e) => setItem(i, "help", e.target.value)} />
              {c.kind === "form" && <textarea className={`${inputCls} min-h-[80px]`} placeholder="Questions, une par ligne" value={c.questions || ""} onChange={(e) => setItem(i, "questions", e.target.value)} />}
            </div>
          ))}
        </div>
        <Button className="mt-2" size="sm" variant="ghost" icon={Plus} onClick={() => setF({ ...f, checklist: [...f.checklist, { label: "", kind: "file", category: "photos", help: "", due_days: "" }] })}>
          Ajouter un élément
        </Button>
      </div>
      <Button loading={busy} disabled={!f.pack} onClick={save}>
        Enregistrer le modèle
      </Button>
    </div>
  );
}

/* ── Modèles de contrat ── */

function ContractTemplates() {
  const { data, error, reload } = useLoad("contract-templates");
  const [editing, setEditing] = useState(null);
  const [uploading, setUploading] = useState(false);
  if (error) return <ErrorText>{error}</ErrorText>;
  if (!data) return <LoadingSpinner />;

  return (
    <section>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-head text-lg font-semibold text-adm-text">Modèles de contrat</h3>
          <p className="text-sm text-adm-text-3">Un texte avec variables remplies automatiquement, ou votre propre fichier (PDF, Word).</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" icon={Upload} variant="secondary" onClick={() => setUploading(true)}>
            Uploader un modèle
          </Button>
          <Button size="sm" icon={Plus} onClick={() => setEditing({ title: "", content: "", pack: "" })}>
            Rédiger un modèle
          </Button>
        </div>
      </div>
      {!data.templates.length ? (
        <EmptyState icon={FileText} message="Aucun modèle de contrat." />
      ) : (
        <div className="space-y-2">
          {data.templates.map((t) => (
            <Card key={t.id} padding="p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-adm-text">{t.title}</p>
                  <p className="text-xs text-adm-text-3">
                    {t.pack || "Tous les packs"} · {t.file_name ? `Fichier : ${t.file_name}` : `Texte (${(t.content.match(/\{\{\s*[a-z_]+\s*\}\}/g) || []).length} variables)`}
                  </p>
                </div>
                <div className="flex gap-1.5">
                  {t.file_name ? (
                    <a className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-adm-text-2 hover:bg-adm-surface-2" href={`/api/admin/portal/contract-templates/${t.id}/file`} target="_blank" rel="noreferrer">
                      <Eye size={14} /> Voir
                    </a>
                  ) : (
                    <Button size="sm" variant="secondary" icon={Edit3} onClick={() => setEditing(t)}>
                      Modifier
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" icon={Trash2} aria-label="Supprimer" onClick={() => confirm(`Supprimer « ${t.title} » ?`) && papi(`contract-templates/${t.id}`, "DELETE").then(reload)} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? "Modifier le modèle" : "Nouveau modèle de contrat"} wide>
        {editing && <ContractEditor tpl={editing} variables={data.variables} onDone={() => (setEditing(null), reload())} />}
      </Modal>
      <Modal open={uploading} onClose={() => setUploading(false)} title="Uploader un modèle de contrat">
        <UploadTemplate onDone={() => (setUploading(false), reload())} />
      </Modal>
    </section>
  );
}

function ContractEditor({ tpl, variables, onDone }) {
  const [f, setF] = useState({ title: tpl.title, content: tpl.content || "", pack: tpl.pack || "" });
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const area = useRef(null);

  const insert = (key) => {
    const el = area.current?.querySelector("textarea");
    const token = `{{${key}}}`;
    if (!el) return setF({ ...f, content: f.content + token });
    const { selectionStart: a, selectionEnd: b } = el;
    const content = f.content.slice(0, a) + token + f.content.slice(b);
    setF({ ...f, content });
    setTimeout(() => {
      el.focus();
      el.selectionStart = el.selectionEnd = a + token.length;
    }, 0);
  };

  return (
    <div className="space-y-3">
      <ErrorText>{error}</ErrorText>
      <div className="grid gap-3 sm:grid-cols-2">
        <Input label="Titre" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
        <Input label="Pack (facultatif)" value={f.pack} onChange={(e) => setF({ ...f, pack: e.target.value })} placeholder="Impact Business" />
      </div>
      <div>
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-adm-text-3">Insérer une variable (cliquez)</p>
        <div className="flex flex-wrap gap-1.5">
          {variables.map((v) => (
            <button key={v.key} type="button" onClick={() => insert(v.key)} className="cursor-pointer rounded-full bg-adm-surface-3 px-2.5 py-1 text-xs text-adm-text-2 hover:bg-adm-red hover:text-white" title={`{{${v.key}}}`}>
              {v.label}
            </button>
          ))}
        </div>
      </div>
      <div ref={area}>
        <Textarea label="Contenu (titres : une ligne commençant par #)" className="min-h-[360px] font-mono text-[13px]" value={f.content} onChange={(e) => setF({ ...f, content: e.target.value })} />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          icon={Eye}
          onClick={async () => {
            const r = await papi("contract-templates/preview", "POST", { content: f.content });
            setPreview(r.content);
          }}
        >
          Aperçu avec un client exemple
        </Button>
        <Button
          loading={busy}
          disabled={!f.title || !f.content.trim()}
          onClick={async () => {
            setBusy(true);
            try {
              if (tpl.id) await papi(`contract-templates/${tpl.id}`, "PUT", f);
              else await papi("contract-templates", "POST", f);
              onDone();
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
      {preview && <pre className="max-h-[50vh] overflow-y-auto whitespace-pre-wrap rounded-lg bg-[#fbf8f0] p-5 font-body text-sm text-[#1b1a17]">{preview}</pre>}
    </div>
  );
}

function UploadTemplate({ onDone }) {
  const input = useRef(null);
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [pack, setPack] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <div className="space-y-3">
      <ErrorText>{error}</ErrorText>
      <button type="button" onClick={() => input.current?.click()} className="w-full cursor-pointer rounded-xl border-2 border-dashed border-adm-border-2 p-6 text-center text-sm text-adm-text-2 hover:border-adm-red">
        {file ? `📄 ${file.name}` : "Choisir le fichier du contrat (PDF, Word)"}
      </button>
      <input ref={input} type="file" hidden accept=".pdf,.doc,.docx,.odt" onChange={(e) => (setFile(e.target.files?.[0] || null), !title && setTitle((e.target.files?.[0]?.name || "").replace(/\.[a-z0-9]+$/i, "")))} />
      <Input label="Titre" value={title} onChange={(e) => setTitle(e.target.value)} />
      <Input label="Pack (facultatif)" value={pack} onChange={(e) => setPack(e.target.value)} />
      <p className="text-xs text-adm-text-3">Un fichier n'a pas de variables : il est envoyé tel quel au client. Pour un contrat pré-rempli automatiquement, rédigez un modèle texte.</p>
      <Button
        loading={busy}
        disabled={!file}
        onClick={async () => {
          setBusy(true);
          try {
            const fd = new FormData();
            fd.append("file", file);
            fd.append("title", title);
            fd.append("pack", pack);
            await apiForm("portal/contract-templates/upload", fd);
            onDone();
          } catch (e) {
            setError(e.message);
          } finally {
            setBusy(false);
          }
        }}
      >
        Enregistrer le modèle
      </Button>
    </div>
  );
}
