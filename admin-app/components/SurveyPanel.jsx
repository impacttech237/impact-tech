import { useState, useEffect, useCallback } from "react";
import { api } from "../lib/api";
import { Button, Input, Textarea, Select, Card, Badge } from "./ui";
import { Checkbox } from "./ui/Checkbox";

const QUESTION_TYPES = [
  { value: "short_text", label: "Texte court" },
  { value: "long_text", label: "Texte long" },
  { value: "single_choice", label: "Choix unique" },
  { value: "multi_choice", label: "Choix multiples" },
  { value: "yes_no", label: "Oui / Non" },
  { value: "scale", label: "Échelle" },
  { value: "grid", label: "Grille" },
];

function QuestionEditor({ question, onSave, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ...question });
  const [saving, setSaving] = useState(false);

  const hasOptions = ["single_choice", "multi_choice"].includes(form.type);
  const isScale = form.type === "scale";
  const isGrid = form.type === "grid";

  const config = typeof form.config === "string" ? JSON.parse(form.config || "{}") : form.config || {};

  const setConfig = (key, val) => {
    const next = { ...config, [key]: val };
    setForm((f) => ({ ...f, config: next }));
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        type: form.type,
        label: form.label,
        description: form.description || null,
        required: form.required ? 1 : 0,
        sort_order: form.sort_order,
        config: typeof form.config === "object" ? form.config : JSON.parse(form.config || "{}"),
      };
      await api(`surveys/questions/${question.id}`, { method: "PUT", body: JSON.stringify(payload) });
      onSave();
      setEditing(false);
    } catch (err) {
      alert(err.message);
    }
    setSaving(false);
  };

  if (!editing) {
    const typeLabel = QUESTION_TYPES.find((t) => t.value === question.type)?.label || question.type;
    return (
      <div className="flex items-start gap-2 rounded-lg border border-adm-border bg-adm-surface px-3 py-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm text-adm-text">
            {question.required ? <span className="text-adm-red">* </span> : null}
            {question.label}
          </p>
          <p className="text-xs text-adm-text-3">{typeLabel}</p>
        </div>
        <button onClick={() => setEditing(true)} className="shrink-0 cursor-pointer text-xs text-adm-text-3 transition-colors hover:text-adm-red">Modifier</button>
        <button onClick={onDelete} className="shrink-0 cursor-pointer text-xs text-adm-red transition-colors hover:underline">Suppr.</button>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-lg border border-adm-red/30 bg-adm-surface-2 p-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Input label="Intitulé" value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} />
        <Select
          label="Type"
          value={form.type}
          onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
          options={QUESTION_TYPES.map((t) => ({ value: t.value, label: t.label }))}
        />
      </div>
      <Input label="Description (optionnel)" value={form.description || ""} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
      <Checkbox label="Obligatoire" checked={!!form.required} onChange={(e) => setForm((f) => ({ ...f, required: e.target.checked ? 1 : 0 }))} />

      {hasOptions && (
        <Textarea
          label="Options (une par ligne)"
          rows={4}
          value={(config.options || []).join("\n")}
          onChange={(e) => setConfig("options", e.target.value.split("\n").filter((l) => l.trim()))}
        />
      )}
      {form.type === "multi_choice" && (
        <Input label="Sélections max (0 = illimité)" type="number" value={config.max_selections || 0} onChange={(e) => setConfig("max_selections", parseInt(e.target.value) || 0)} />
      )}
      {isScale && (
        <div className="grid gap-3 sm:grid-cols-4">
          <Input label="Min" type="number" value={config.min ?? 1} onChange={(e) => setConfig("min", parseInt(e.target.value))} />
          <Input label="Max" type="number" value={config.max ?? 5} onChange={(e) => setConfig("max", parseInt(e.target.value))} />
          <Input label="Label min" value={config.min_label || ""} onChange={(e) => setConfig("min_label", e.target.value)} />
          <Input label="Label max" value={config.max_label || ""} onChange={(e) => setConfig("max_label", e.target.value)} />
        </div>
      )}
      {isGrid && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Textarea label="Lignes (une par ligne)" rows={3} value={(config.rows || []).join("\n")} onChange={(e) => setConfig("rows", e.target.value.split("\n").filter((l) => l.trim()))} />
          <Textarea label="Colonnes (une par ligne)" rows={3} value={(config.columns || []).join("\n")} onChange={(e) => setConfig("columns", e.target.value.split("\n").filter((l) => l.trim()))} />
        </div>
      )}

      <div className="flex gap-2">
        <Button loading={saving} onClick={save}>{saving ? "Enregistrement..." : "Enregistrer"}</Button>
        <Button variant="ghost" onClick={() => { setForm({ ...question }); setEditing(false); }}>Annuler</Button>
      </div>
    </div>
  );
}

function SectionEditor({ section, onReload, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const [questions, setQuestions] = useState(section.questions || []);
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState(section.title);
  const [addingQ, setAddingQ] = useState(false);
  const [newQ, setNewQ] = useState({ label: "", type: "short_text", required: false });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setQuestions(section.questions || []);
    setTitle(section.title);
  }, [section]);

  const saveTitle = async () => {
    try {
      await api(`surveys/sections/${section.id}`, { method: "PUT", body: JSON.stringify({ title }) });
      setEditingTitle(false);
      onReload();
    } catch (err) {
      alert(err.message);
    }
  };

  const addQuestion = async () => {
    setSaving(true);
    try {
      const maxOrder = questions.reduce((m, q) => Math.max(m, q.sort_order || 0), 0);
      const payload = {
        section_id: section.id,
        type: newQ.type,
        label: newQ.label,
        required: newQ.required ? 1 : 0,
        sort_order: maxOrder + 1,
        config: ["single_choice", "multi_choice"].includes(newQ.type) ? { options: ["Option 1", "Option 2"] } : undefined,
      };
      await api("surveys/questions", { method: "POST", body: JSON.stringify(payload) });
      setAddingQ(false);
      setNewQ({ label: "", type: "short_text", required: false });
      onReload();
    } catch (err) {
      alert(err.message);
    }
    setSaving(false);
  };

  const deleteQuestion = async (qId) => {
    if (!confirm("Supprimer cette question ?")) return;
    try {
      await api(`surveys/questions/${qId}`, { method: "DELETE" });
      onReload();
    } catch (err) {
      alert(err.message);
    }
  };

  const condition = section.condition ? (typeof section.condition === "string" ? JSON.parse(section.condition) : section.condition) : null;

  return (
    <Card>
      <div className="flex items-center gap-2 px-4 py-3">
        <button onClick={() => setExpanded(!expanded)} className="cursor-pointer text-sm text-adm-text-2 transition-colors hover:text-adm-text">{expanded ? "▾" : "▸"}</button>
        {editingTitle ? (
          <div className="flex flex-1 items-center gap-2">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="flex-1 rounded-lg border border-adm-border-2 bg-adm-surface-3 px-2 py-1 text-sm text-adm-text outline-none focus:border-adm-red"
            />
            <button onClick={saveTitle} className="text-xs text-adm-red hover:underline">OK</button>
            <button onClick={() => { setTitle(section.title); setEditingTitle(false); }} className="text-xs text-adm-text-3">Annuler</button>
          </div>
        ) : (
          <span className="flex-1 text-sm font-semibold text-adm-text cursor-pointer" onClick={() => setEditingTitle(true)}>
            {section.title}
          </span>
        )}
        {condition && <Badge variant="warning">Conditionnelle</Badge>}
        <span className="text-xs text-adm-text-3">{questions.length} question{questions.length !== 1 ? "s" : ""}</span>
        <button onClick={onDelete} className="cursor-pointer text-xs text-adm-red transition-colors hover:underline">Supprimer</button>
      </div>

      {expanded && (
        <div className="space-y-2 border-t border-adm-border px-4 py-3">
          {questions.length === 0 && <p className="text-xs text-adm-text-3">Aucune question dans cette section.</p>}
          {questions.map((q) => (
            <QuestionEditor key={q.id} question={q} onSave={onReload} onDelete={() => deleteQuestion(q.id)} />
          ))}

          {addingQ ? (
            <div className="space-y-2 rounded-lg border border-dashed border-adm-red/30 bg-adm-surface-2 p-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Input label="Intitule" value={newQ.label} onChange={(e) => setNewQ((q) => ({ ...q, label: e.target.value }))} />
                <Select
                  label="Type"
                  value={newQ.type}
                  onChange={(e) => setNewQ((q) => ({ ...q, type: e.target.value }))}
                  options={QUESTION_TYPES.map((t) => ({ value: t.value, label: t.label }))}
                />
              </div>
              <Checkbox label="Obligatoire" checked={newQ.required} onChange={(e) => setNewQ((q) => ({ ...q, required: e.target.checked }))} />
              <div className="flex gap-2">
                <Button disabled={saving || !newQ.label.trim()} onClick={addQuestion}>{saving ? "Ajout..." : "Ajouter"}</Button>
                <Button variant="ghost" onClick={() => setAddingQ(false)}>Annuler</Button>
              </div>
            </div>
          ) : (
            <button onClick={() => setAddingQ(true)} className="cursor-pointer text-xs font-semibold text-adm-red transition-colors hover:underline">
              + Ajouter une question
            </button>
          )}
        </div>
      )}
    </Card>
  );
}

function FormEditor({ formId, onUnauthorized }) {
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addingSection, setAddingSection] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api(`surveys/forms/${formId}/structure`);
      setForm(data.form);
    } catch (err) {
      if (err.message === "__unauthorized__") return onUnauthorized();
    }
    setLoading(false);
  }, [formId, onUnauthorized]);

  useEffect(() => { setLoading(true); load(); }, [load]);

  const addSection = async () => {
    setSaving(true);
    try {
      const maxOrder = (form?.sections || []).reduce((m, s) => Math.max(m, s.sort_order || 0), 0);
      await api("surveys/sections", {
        method: "POST",
        body: JSON.stringify({ form_id: formId, title: newSectionTitle, sort_order: maxOrder + 1 }),
      });
      setAddingSection(false);
      setNewSectionTitle("");
      load();
    } catch (err) {
      alert(err.message);
    }
    setSaving(false);
  };

  const deleteSection = async (sId) => {
    if (!confirm("Supprimer cette section et toutes ses questions ?")) return;
    try {
      await api(`surveys/sections/${sId}`, { method: "DELETE" });
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <p className="text-sm text-adm-text-3">Chargement de la structure...</p>;
  if (!form) return <p className="text-sm text-adm-red">Formulaire introuvable.</p>;

  return (
    <div className="space-y-3">
      <Card className="p-4">
        <p className="text-sm font-semibold text-adm-text">{form.title}</p>
        {form.description && <p className="mt-1 text-xs text-adm-text-3">{form.description}</p>}
        <p className="mt-1 text-xs text-adm-text-3">
          Slug : <code className="rounded bg-adm-surface-3 px-1 py-0.5 text-adm-red">{form.slug}</code>
          {" · "}
          <a href={`/enquete/${form.slug}`} target="_blank" rel="noopener noreferrer" className="text-adm-red hover:underline">
            Voir le formulaire
          </a>
        </p>
        {form.redirect_url && <p className="mt-1 text-xs text-adm-text-3">Redirection : {form.redirect_url}</p>}
      </Card>

      <p className="text-xs font-semibold uppercase tracking-wide text-adm-text-3">
        Sections ({(form.sections || []).length})
      </p>

      {(form.sections || []).map((s) => (
        <SectionEditor key={s.id} section={s} onReload={load} onDelete={() => deleteSection(s.id)} />
      ))}

      {addingSection ? (
        <div className="flex items-end gap-2">
          <Input label="Titre de la section" value={newSectionTitle} onChange={(e) => setNewSectionTitle(e.target.value)} className="flex-1" />
          <Button disabled={saving || !newSectionTitle.trim()} onClick={addSection}>{saving ? "Ajout..." : "Ajouter"}</Button>
          <Button variant="ghost" onClick={() => setAddingSection(false)}>Annuler</Button>
        </div>
      ) : (
        <Button variant="ghost" onClick={() => setAddingSection(true)}>+ Ajouter une section</Button>
      )}
    </div>
  );
}

function ResponseDetail({ responseId, onBack, onUnauthorized }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const d = await api(`surveys/responses/${responseId}`);
        setData(d);
      } catch (err) {
        if (err.message === "__unauthorized__") return onUnauthorized();
      }
    })();
  }, [responseId, onUnauthorized]);

  if (!data) return <p className="text-sm text-adm-text-3">Chargement...</p>;

  const { response, answers } = data;

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="cursor-pointer text-sm font-semibold text-adm-red transition-colors hover:underline">&larr; Retour aux réponses</button>

      <Card className="p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          {response.respondent_name && <div><p className="text-xs text-adm-text-3">Nom</p><p className="text-sm font-medium text-adm-text">{response.respondent_name}</p></div>}
          {response.respondent_email && <div><p className="text-xs text-adm-text-3">Email</p><p className="text-sm font-medium text-adm-text">{response.respondent_email}</p></div>}
          {response.respondent_phone && <div><p className="text-xs text-adm-text-3">Téléphone</p><p className="text-sm font-medium text-adm-text">{response.respondent_phone}</p></div>}
          {response.respondent_company && <div><p className="text-xs text-adm-text-3">Entreprise</p><p className="text-sm font-medium text-adm-text">{response.respondent_company}</p></div>}
        </div>
        <div className="mt-3 flex gap-4 text-xs text-adm-text-3">
          <span>Début : {new Date(response.started_at).toLocaleString("fr-FR")}</span>
          {response.completed_at && <span>Fin : {new Date(response.completed_at).toLocaleString("fr-FR")}</span>}
          <Badge variant={response.completed_at ? "success" : "warning"}>
            {response.completed_at ? "Complété" : "En cours"}
          </Badge>
        </div>
      </Card>

      <div className="space-y-2">
        {answers.map((a, i) => (
          <div key={i} className="rounded-lg border border-adm-border bg-adm-surface px-4 py-2">
            <p className="text-xs font-semibold text-adm-text-3">{a.label || `Question #${a.question_id}`}</p>
            <p className="mt-0.5 text-sm text-adm-text whitespace-pre-wrap">{a.value || "—"}</p>
          </div>
        ))}
        {answers.length === 0 && <p className="text-sm text-adm-text-3">Aucune réponse enregistrée.</p>}
      </div>
    </div>
  );
}

function SurveyStatsView({ formId, onUnauthorized }) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await api(`surveys/stats/${formId}`);
        setStats(data);
      } catch (err) {
        if (err.message === "__unauthorized__") return onUnauthorized();
      }
    })();
  }, [formId, onUnauthorized]);

  if (!stats) return <p className="text-sm text-adm-text-3">Chargement des stats...</p>;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="p-4 text-center">
          <p className="font-head text-2xl font-bold text-adm-text">{stats.total}</p>
          <p className="text-xs text-adm-text-3">Réponses totales</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="font-head text-2xl font-bold text-emerald-400">{stats.completed}</p>
          <p className="text-xs text-adm-text-3">Complétées</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="font-head text-2xl font-bold text-adm-red">{stats.completionRate}%</p>
          <p className="text-xs text-adm-text-3">Taux de complétion</p>
        </Card>
      </div>

      {stats.questions && stats.questions.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-adm-text-3">Distribution par question</p>
          {stats.questions.map((q) => (
            <Card key={q.question_id} className="p-4">
              <p className="text-sm font-semibold text-adm-text">{q.label}</p>
              {q.distribution && Object.keys(q.distribution).length > 0 ? (
                <div className="mt-2 space-y-1">
                  {Object.entries(q.distribution).sort((a, b) => b[1] - a[1]).map(([val, count]) => {
                    const pct = q.totalAnswers ? Math.round((count / q.totalAnswers) * 100) : 0;
                    return (
                      <div key={val} className="flex items-center gap-2 text-xs">
                        <span className="w-32 truncate text-adm-text" title={val}>{val}</span>
                        <div className="flex-1 h-4 rounded-full bg-adm-surface-3 overflow-hidden">
                          <div className="h-full rounded-full bg-adm-red" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="w-12 text-right text-adm-text-3">{pct}%</span>
                        <span className="w-8 text-right text-adm-text-3">({count})</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="mt-1 text-xs text-adm-text-3">Pas assez de données</p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function ResponsesList({ formId, onUnauthorized }) {
  const [responses, setResponses] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [viewId, setViewId] = useState(null);
  const [showStats, setShowStats] = useState(false);

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams({ form_id: formId, page });
      if (search) params.set("search", search);
      if (filter === "completed") params.set("completed", "true");
      if (filter === "incomplete") params.set("completed", "false");
      const data = await api(`surveys/responses?${params}`);
      setResponses(data.responses);
      setTotal(data.total);
    } catch (err) {
      if (err.message === "__unauthorized__") return onUnauthorized();
      setResponses([]);
    }
  }, [formId, page, search, filter, onUnauthorized]);

  useEffect(() => { load(); }, [load]);

  const exportCsv = async () => {
    try {
      const res = await api(`surveys/export/${formId}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `enquete-${formId}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.message);
    }
  };

  const deleteResponse = async (id) => {
    if (!confirm("Supprimer cette reponse ?")) return;
    try {
      await api(`surveys/responses/${id}`, { method: "DELETE" });
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  if (viewId) return <ResponseDetail responseId={viewId} onBack={() => { setViewId(null); load(); }} onUnauthorized={onUnauthorized} />;
  if (showStats) {
    return (
      <div>
        <button onClick={() => setShowStats(false)} className="mb-3 cursor-pointer text-sm font-semibold text-adm-red transition-colors hover:underline">&larr; Retour aux réponses</button>
        <SurveyStatsView formId={formId} onUnauthorized={onUnauthorized} />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          placeholder="Rechercher..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="rounded-lg border border-adm-border-2 bg-adm-surface-3 px-3 py-2 text-sm text-adm-text outline-none focus:border-adm-red"
        />
        <select
          value={filter}
          onChange={(e) => { setFilter(e.target.value); setPage(1); }}
          className="cursor-pointer rounded-lg border border-adm-border-2 bg-adm-surface-3 px-3 py-2 text-sm text-adm-text outline-none transition-colors focus:border-adm-red"
        >
          <option value="all">Toutes</option>
          <option value="completed">Complétées</option>
          <option value="incomplete">En cours</option>
        </select>
        <span className="text-xs text-adm-text-3">{total} réponse{total !== 1 ? "s" : ""}</span>
        <div className="ml-auto flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => setShowStats(true)}>Stats</Button>
          <Button variant="ghost" size="sm" onClick={exportCsv}>CSV</Button>
        </div>
      </div>

      {responses === null ? (
        <p className="text-sm text-adm-text-3">Chargement...</p>
      ) : responses.length === 0 ? (
        <Card className="p-4 text-sm text-adm-text-3">Aucune réponse.</Card>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-adm-border">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-adm-border bg-adm-surface-2">
                <th className="px-4 py-3 text-xs font-medium uppercase text-adm-text-3">Nom</th>
                <th className="px-4 py-3 text-xs font-medium uppercase text-adm-text-3">Email</th>
                <th className="px-4 py-3 text-xs font-medium uppercase text-adm-text-3">Date</th>
                <th className="px-4 py-3 text-xs font-medium uppercase text-adm-text-3">Statut</th>
                <th className="px-4 py-3 text-xs font-medium uppercase text-adm-text-3"></th>
              </tr>
            </thead>
            <tbody className="bg-adm-surface">
              {responses.map((r) => (
                <tr key={r.id} className="border-b border-adm-border last:border-0 hover:bg-adm-surface-2">
                  <td className="px-4 py-3 font-medium text-adm-text">{r.respondent_name || "Anonyme"}</td>
                  <td className="px-4 py-3 text-adm-text-2">{r.respondent_email || "—"}</td>
                  <td className="px-4 py-3 text-adm-text-2">{new Date(r.started_at).toLocaleDateString("fr-FR")}</td>
                  <td className="px-4 py-3">
                    <Badge variant={r.completed_at ? "success" : "warning"}>
                      {r.completed_at ? "Complété" : "En cours"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setViewId(r.id)} className="cursor-pointer text-xs font-semibold text-adm-red transition-colors hover:underline">Voir</button>
                    <button onClick={() => deleteResponse(r.id)} className="ml-2 cursor-pointer text-xs text-adm-text-3 transition-colors hover:text-adm-red">Suppr.</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {total > 20 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="ghost" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>&larr; Précédent</Button>
          <span className="text-xs text-adm-text-3">Page {page} / {Math.ceil(total / 20)}</span>
          <Button variant="ghost" size="sm" disabled={page >= Math.ceil(total / 20)} onClick={() => setPage((p) => p + 1)}>Suivant &rarr;</Button>
        </div>
      )}
    </div>
  );
}

export default function SurveyPanel({ onUnauthorized }) {
  const [forms, setForms] = useState(null);
  const [selectedFormId, setSelectedFormId] = useState(null);
  const [view, setView] = useState("editor");
  const [error, setError] = useState("");

  const loadForms = useCallback(async () => {
    try {
      const data = await api("surveys/forms");
      setForms(data.forms);
      if (data.forms.length > 0 && !selectedFormId) {
        setSelectedFormId(data.forms[0].id);
      }
    } catch (err) {
      if (err.message === "__unauthorized__") return onUnauthorized();
      setError(err.message);
      setForms([]);
    }
  }, [onUnauthorized, selectedFormId]);

  useEffect(() => { loadForms(); }, [loadForms]);

  if (forms === null) return <p className="text-sm text-adm-text-3">Chargement...</p>;

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-adm-red">{error}</p>}

      {forms.length === 0 ? (
        <Card className="p-4 text-sm text-adm-text-3">
          Aucun formulaire. Exécutez le script de seed pour créer les 3 formulaires permanents.
        </Card>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedFormId || ""}
              onChange={(e) => setSelectedFormId(parseInt(e.target.value))}
              className="cursor-pointer rounded-lg border border-adm-border-2 bg-adm-surface-3 px-3 py-2 text-sm font-semibold text-adm-text outline-none transition-colors focus:border-adm-red"
            >
              {forms.map((f) => (
                <option key={f.id} value={f.id}>{f.title}</option>
              ))}
            </select>

            <div className="flex rounded-lg border border-adm-border overflow-hidden">
              <button
                onClick={() => setView("editor")}
                className={`cursor-pointer px-3 py-1.5 text-xs font-semibold transition-colors ${view === "editor" ? "bg-adm-red text-white" : "bg-adm-surface text-adm-text-2 hover:bg-adm-surface-2"}`}
              >
                Éditeur
              </button>
              <button
                onClick={() => setView("responses")}
                className={`cursor-pointer px-3 py-1.5 text-xs font-semibold transition-colors ${view === "responses" ? "bg-adm-red text-white" : "bg-adm-surface text-adm-text-2 hover:bg-adm-surface-2"}`}
              >
                Réponses
              </button>
            </div>

            {forms.find((f) => f.id === selectedFormId) && (
              <Badge variant={forms.find((f) => f.id === selectedFormId)?.active ? "success" : "default"}>
                {forms.find((f) => f.id === selectedFormId)?.active ? "Actif" : "Inactif"}
              </Badge>
            )}
          </div>

          {selectedFormId && view === "editor" && (
            <FormEditor formId={selectedFormId} onUnauthorized={onUnauthorized} />
          )}
          {selectedFormId && view === "responses" && (
            <ResponsesList formId={selectedFormId} onUnauthorized={onUnauthorized} />
          )}
        </>
      )}
    </div>
  );
}
