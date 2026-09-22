import { useState, useEffect, useCallback } from "react";
import { api, apiForm } from "../lib/api";
import { Button, Input, Textarea, Card, Badge } from "./ui";
import { Users, FileText, Send, Edit3, Trash2, Plus, ArrowLeft, Briefcase, File } from "../lib/icons";

const STATUS_LABELS = { cadrage: "Cadrage", devis: "Devis", contrat: "Contrat", en_cours: "En cours", livraison: "Livraison", termine: "Terminé" };
const STATUS_COLORS = { cadrage: "#6366f1", devis: "#f59e0b", contrat: "#C0202B", en_cours: "#3b82f6", livraison: "#8b5cf6", termine: "#3ecf6e" };

export default function PortalPanel({ onUnauthorized }) {
  const [tab, setTab] = useState("clients");
  const TABS = [
    { key: "clients", label: "Clients", Icon: Users },
    { key: "templates", label: "Modèles contrat", Icon: FileText },
    { key: "stats", label: "Stats", Icon: Briefcase },
  ];

  const handleUnauth = useCallback(() => {
    if (onUnauthorized) onUnauthorized();
  }, [onUnauthorized]);

  return (
    <div>
      <div className="flex gap-2 mb-6 border-b border-adm-border pb-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex cursor-pointer items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.key ? "bg-adm-red text-white" : "text-adm-text-3 hover:text-adm-text hover:bg-adm-surface-2"
            }`}
          >
            <t.Icon size={14} /> {t.label}
          </button>
        ))}
      </div>
      {tab === "clients" && <ClientsManager onUnauthorized={handleUnauth} />}
      {tab === "templates" && <TemplatesManager onUnauthorized={handleUnauth} />}
      {tab === "stats" && <PortalStatsView onUnauthorized={handleUnauth} />}
    </div>
  );
}

function ClientsManager({ onUnauthorized }) {
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const data = await api(`portal/clients?search=${encodeURIComponent(search)}`);
      setClients(data.clients);
    } catch (e) {
      if (e.message === "__unauthorized__") return onUnauthorized();
      setError(e.message);
    }
  }, [search, onUnauthorized]);

  useEffect(() => { load(); }, [load]);

  if (selected) return <ClientDetail client={selected} onBack={() => { setSelected(null); load(); }} onUnauthorized={onUnauthorized} />;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <input
          className="rounded-lg border border-adm-border-2 bg-adm-surface-3 px-3 py-2 text-sm text-adm-text w-64 outline-none focus:border-adm-red"
          placeholder="Rechercher..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button icon={Plus} onClick={() => setEditing({ name: "", email: "", phone: "", company: "" })}>Nouveau client</Button>
      </div>

      {error && <p className="text-adm-red text-sm mb-2">{error}</p>}

      {editing && (
        <ClientForm
          client={editing}
          onSave={async (data) => {
            try {
              if (data.id) {
                await api(`portal/clients/${data.id}`, { method: "PUT", body: JSON.stringify(data) });
              } else {
                const res = await api("portal/clients", { method: "POST", body: JSON.stringify(data) });
                alert(`Client créé !\nLien portail : ${res.portalUrl}`);
              }
              setEditing(null);
              load();
            } catch (e) { setError(e.message); }
          }}
          onCancel={() => setEditing(null)}
        />
      )}

      <div className="space-y-2">
        {clients.map((c) => (
          <Card key={c.id} className="flex items-center justify-between p-4 hover:bg-adm-surface-2 transition-colors">
            <div className="cursor-pointer flex-1" onClick={() => setSelected(c)}>
              <div className="font-semibold text-sm text-adm-text">{c.name}</div>
              <div className="text-xs text-adm-text-3">{c.email} {c.company ? `· ${c.company}` : ""}</div>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" icon={Send} onClick={async () => {
                try {
                  const res = await api(`portal/clients/${c.id}/send-link`, { method: "POST" });
                  alert(res.ok ? "Lien envoyé par email !" : "Erreur d'envoi");
                } catch (e) { alert(e.message); }
              }}>Envoyer lien</Button>
              <Button variant="ghost" size="sm" icon={Edit3} onClick={() => setEditing(c)} />
              <Button variant="danger" size="sm" icon={Trash2} onClick={async () => {
                if (!confirm(`Supprimer ${c.name} ?`)) return;
                await api(`portal/clients/${c.id}`, { method: "DELETE" });
                load();
              }} />
            </div>
          </Card>
        ))}
        {clients.length === 0 && <p className="text-sm text-adm-text-3 text-center py-8">Aucun client</p>}
      </div>
    </div>
  );
}

function ClientForm({ client, onSave, onCancel }) {
  const [form, setForm] = useState({ ...client });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <Card className="p-4 mb-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Input label="Nom *" value={form.name} onChange={(e) => set("name", e.target.value)} />
        <Input label="Email *" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
        <Input label="Téléphone" value={form.phone || ""} onChange={(e) => set("phone", e.target.value)} />
        <Input label="Entreprise" value={form.company || ""} onChange={(e) => set("company", e.target.value)} />
      </div>
      <div className="flex gap-2">
        <Button onClick={() => onSave(form)} disabled={!form.name || !form.email}>Enregistrer</Button>
        <Button variant="ghost" onClick={onCancel}>Annuler</Button>
      </div>
    </Card>
  );
}

function ClientDetail({ client, onBack, onUnauthorized }) {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [editingProject, setEditingProject] = useState(null);
  const [error, setError] = useState("");

  const loadProjects = useCallback(async () => {
    try {
      const data = await api(`portal/clients/${client.id}/projects`);
      setProjects(data.projects);
    } catch (e) {
      if (e.message === "__unauthorized__") return onUnauthorized();
      setError(e.message);
    }
  }, [client.id, onUnauthorized]);

  useEffect(() => { loadProjects(); }, [loadProjects]);

  if (selectedProject) {
    return <ProjectDetail project={selectedProject} clientId={client.id} onBack={() => { setSelectedProject(null); loadProjects(); }} onUnauthorized={onUnauthorized} />;
  }

  return (
    <div>
      <button onClick={onBack} className="flex cursor-pointer items-center gap-1 text-sm text-adm-text-3 transition-colors hover:text-adm-text mb-4">
        <ArrowLeft size={14} /> Retour aux clients
      </button>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-head text-lg font-bold text-adm-text">{client.name}</h3>
          <p className="text-sm text-adm-text-3">{client.email} {client.company ? `· ${client.company}` : ""}</p>
        </div>
        <Button icon={Plus} onClick={() => setEditingProject({ client_id: client.id, title: "", description: "", status: "cadrage" })}>Nouveau projet</Button>
      </div>

      {error && <p className="text-adm-red text-sm mb-2">{error}</p>}

      {editingProject && (
        <ProjectForm
          project={editingProject}
          onSave={async (data) => {
            try {
              if (data.id) {
                await api(`portal/projects/${data.id}`, { method: "PUT", body: JSON.stringify(data) });
              } else {
                await api("portal/projects", { method: "POST", body: JSON.stringify(data) });
              }
              setEditingProject(null);
              loadProjects();
            } catch (e) { setError(e.message); }
          }}
          onCancel={() => setEditingProject(null)}
        />
      )}

      <div className="space-y-2">
        {projects.map((p) => (
          <Card key={p.id} className="flex items-center justify-between p-4 hover:bg-adm-surface-2 transition-colors">
            <div className="cursor-pointer flex-1" onClick={() => setSelectedProject(p)}>
              <div className="font-semibold text-sm text-adm-text">{p.title}</div>
              <div className="text-xs text-adm-text-3">{p.description || "Aucune description"}</div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-1 rounded-full text-white" style={{ background: STATUS_COLORS[p.status] || "#888" }}>
                {STATUS_LABELS[p.status] || p.status}
              </span>
              <Button variant="ghost" size="sm" icon={Edit3} onClick={() => setEditingProject(p)} />
              <Button variant="danger" size="sm" icon={Trash2} onClick={async () => {
                if (!confirm("Supprimer ce projet ?")) return;
                await api(`portal/projects/${p.id}`, { method: "DELETE" });
                loadProjects();
              }} />
            </div>
          </Card>
        ))}
        {projects.length === 0 && <p className="text-sm text-adm-text-3 text-center py-8">Aucun projet</p>}
      </div>
    </div>
  );
}

function ProjectForm({ project, onSave, onCancel }) {
  const [form, setForm] = useState({ ...project });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <Card className="p-4 mb-4 space-y-3">
      <Input label="Titre *" value={form.title} onChange={(e) => set("title", e.target.value)} />
      <Textarea label="Description" value={form.description || ""} onChange={(e) => set("description", e.target.value)} />
      <div className="grid grid-cols-3 gap-3">
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-adm-text-3">Statut</span>
          <select
            value={form.status}
            onChange={(e) => set("status", e.target.value)}
            className="w-full cursor-pointer rounded-lg border border-adm-border-2 bg-adm-surface-3 px-3 py-2 text-sm text-adm-text outline-none transition-colors focus:border-adm-red"
          >
            {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
        <Input label="Date de début" type="date" value={form.start_date || ""} onChange={(e) => set("start_date", e.target.value)} />
        <Input label="Échéance" type="date" value={form.due_date || ""} onChange={(e) => set("due_date", e.target.value)} />
      </div>
      <div className="flex gap-2">
        <Button onClick={() => onSave(form)} disabled={!form.title}>Enregistrer</Button>
        <Button variant="ghost" onClick={onCancel}>Annuler</Button>
      </div>
    </Card>
  );
}

function ProjectDetail({ project, clientId, onBack, onUnauthorized }) {
  const [subTab, setSubTab] = useState("documents");
  const [documents, setDocuments] = useState([]);
  const [files, setFiles] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [editingDoc, setEditingDoc] = useState(null);
  const [error, setError] = useState("");

  const loadDocs = useCallback(async () => {
    try {
      const data = await api(`portal/projects/${project.id}/documents`);
      setDocuments(data.documents);
    } catch (e) {
      if (e.message === "__unauthorized__") return onUnauthorized();
      setError(e.message);
    }
  }, [project.id, onUnauthorized]);

  const loadFiles = useCallback(async () => {
    try {
      const data = await api(`portal/projects/${project.id}/files`);
      setFiles(data.files);
    } catch (e) { setError(e.message); }
  }, [project.id]);

  const loadTemplates = useCallback(async () => {
    try {
      const data = await api("portal/templates");
      setTemplates(data.templates);
    } catch (e) {}
  }, []);

  useEffect(() => { loadDocs(); loadFiles(); loadTemplates(); }, [loadDocs, loadFiles, loadTemplates]);

  return (
    <div>
      <button onClick={onBack} className="flex cursor-pointer items-center gap-1 text-sm text-adm-text-3 transition-colors hover:text-adm-text mb-4">
        <ArrowLeft size={14} /> Retour aux projets
      </button>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-head text-lg font-bold text-adm-text">{project.title}</h3>
        <span className="text-xs font-semibold px-2 py-1 rounded-full text-white" style={{ background: STATUS_COLORS[project.status] || "#888" }}>
          {STATUS_LABELS[project.status] || project.status}
        </span>
      </div>

      {error && <p className="text-adm-red text-sm mb-2">{error}</p>}

      <div className="flex gap-2 mb-4 border-b border-adm-border pb-2">
        <button onClick={() => setSubTab("documents")} className={`flex cursor-pointer items-center gap-1 px-3 py-1.5 text-sm rounded-lg transition-colors ${subTab === "documents" ? "bg-adm-red text-white" : "text-adm-text-3 hover:text-adm-text hover:bg-adm-surface-2"}`}>
          <FileText size={14} /> Documents
        </button>
        <button onClick={() => setSubTab("files")} className={`flex cursor-pointer items-center gap-1 px-3 py-1.5 text-sm rounded-lg transition-colors ${subTab === "files" ? "bg-adm-red text-white" : "text-adm-text-3 hover:text-adm-text hover:bg-adm-surface-2"}`}>
          <File size={14} /> Fichiers
        </button>
      </div>

      {subTab === "documents" && (
        <div>
          <div className="flex gap-2 mb-4">
            <Button icon={Plus} onClick={() => setEditingDoc({ project_id: project.id, title: "", category: "document", content: "", template_id: "" })}>Document</Button>
            <Button variant="ghost" icon={Plus} onClick={() => setEditingDoc({ project_id: project.id, title: "", category: "contrat", content: "", template_id: "" })}>Contrat</Button>
          </div>

          {editingDoc && (
            <DocumentEditor
              doc={editingDoc}
              templates={templates}
              onSave={async (data) => {
                try {
                  if (data.id) {
                    await api(`portal/documents/${data.id}`, { method: "PUT", body: JSON.stringify(data) });
                  } else {
                    await api("portal/documents", { method: "POST", body: JSON.stringify(data) });
                  }
                  setEditingDoc(null);
                  loadDocs();
                } catch (e) { setError(e.message); }
              }}
              onCancel={() => setEditingDoc(null)}
            />
          )}

          <div className="space-y-2">
            {documents.map((d) => (
              <Card key={d.id} className="flex items-center justify-between p-4">
                <div className="flex-1">
                  <div className="font-semibold text-sm text-adm-text">{d.title}</div>
                  <div className="text-xs text-adm-text-3">
                    {d.category === "contrat" ? "Contrat" : "Document"}
                    {d.signed_at ? ` — Signé le ${new Date(d.signed_at).toLocaleDateString("fr-FR")}` : ""}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={d.status === "signed" ? "success" : d.status === "sent" ? "danger" : "default"}>
                    {d.status === "signed" ? "Signé" : d.status === "sent" ? "Envoyé" : "Brouillon"}
                  </Badge>
                  {d.status === "draft" && (
                    <>
                      <Button variant="ghost" size="sm" icon={Edit3} onClick={() => setEditingDoc(d)} />
                      <Button size="sm" icon={Send} onClick={async () => {
                        if (!confirm("Envoyer ce document au client ?")) return;
                        try {
                          await api(`portal/documents/${d.id}/send`, { method: "POST" });
                          alert("Document envoyé !");
                          loadDocs();
                        } catch (e) { alert(e.message); }
                      }}>Envoyer</Button>
                    </>
                  )}
                  {d.status !== "signed" && (
                    <Button variant="danger" size="sm" icon={Trash2} onClick={async () => {
                      if (!confirm("Supprimer ?")) return;
                      await api(`portal/documents/${d.id}`, { method: "DELETE" });
                      loadDocs();
                    }} />
                  )}
                </div>
              </Card>
            ))}
            {documents.length === 0 && <p className="text-sm text-adm-text-3 text-center py-8">Aucun document</p>}
          </div>
        </div>
      )}

      {subTab === "files" && (
        <div>
          <div className="mb-4">
            <label className="cursor-pointer">
              <Button icon={Plus}>Ajouter un fichier</Button>
              <input type="file" className="hidden" onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const fd = new FormData();
                fd.append("file", file);
                try {
                  await apiForm(`portal/projects/${project.id}/files`, fd);
                  loadFiles();
                } catch (err) { setError(err.message); }
                e.target.value = "";
              }} />
            </label>
          </div>
          <div className="space-y-2">
            {files.map((f) => (
              <Card key={f.id} className="flex items-center justify-between p-3">
                <div className="flex items-center gap-2 flex-1">
                  <File size={14} className="text-adm-text-3" />
                  <div>
                    <div className="text-sm font-medium text-adm-text">{f.name}</div>
                    <div className="text-xs text-adm-text-3">{(f.size / 1024).toFixed(1)} Ko — {new Date(f.created_at).toLocaleDateString("fr-FR")}</div>
                  </div>
                </div>
                <Button variant="danger" size="sm" icon={Trash2} onClick={async () => {
                  if (!confirm("Supprimer ce fichier ?")) return;
                  await api(`portal/files/${f.id}`, { method: "DELETE" });
                  loadFiles();
                }} />
              </Card>
            ))}
            {files.length === 0 && <p className="text-sm text-adm-text-3 text-center py-8">Aucun fichier</p>}
          </div>
        </div>
      )}
    </div>
  );
}

function DocumentEditor({ doc, templates, onSave, onCancel }) {
  const [form, setForm] = useState({ ...doc });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const applyTemplate = (tplId) => {
    const tpl = templates.find((t) => t.id === parseInt(tplId, 10));
    if (tpl) {
      set("content", tpl.content);
      set("template_id", tpl.id);
    }
  };

  return (
    <Card className="p-4 mb-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Input label="Titre *" value={form.title} onChange={(e) => set("title", e.target.value)} />
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-adm-text-3">Catégorie</span>
          <select
            value={form.category}
            onChange={(e) => set("category", e.target.value)}
            className="w-full cursor-pointer rounded-lg border border-adm-border-2 bg-adm-surface-3 px-3 py-2 text-sm text-adm-text outline-none transition-colors focus:border-adm-red"
          >
            <option value="document">Document</option>
            <option value="contrat">Contrat</option>
            <option value="devis">Devis</option>
            <option value="facture">Facture</option>
          </select>
        </label>
      </div>
      {templates.length > 0 && (
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-adm-text-3">Modèle de contrat</span>
          <select
            value={form.template_id || ""}
            onChange={(e) => applyTemplate(e.target.value)}
            className="w-full cursor-pointer rounded-lg border border-adm-border-2 bg-adm-surface-3 px-3 py-2 text-sm text-adm-text outline-none transition-colors focus:border-adm-red"
          >
            <option value="">— Aucun modèle —</option>
            {templates.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
          </select>
        </label>
      )}
      <Textarea
        label="Contenu"
        value={form.content || ""}
        onChange={(e) => set("content", e.target.value)}
        style={{ minHeight: "300px", fontFamily: "monospace", fontSize: "13px" }}
      />
      <p className="text-xs text-adm-text-3">
        Variables disponibles : {"{{client_name}}"}, {"{{client_email}}"}, {"{{client_company}}"}, {"{{date}}"}, {"{{project_title}}"}
      </p>
      <div className="flex gap-2">
        <Button onClick={() => onSave(form)} disabled={!form.title}>Enregistrer</Button>
        <Button variant="ghost" onClick={onCancel}>Annuler</Button>
      </div>
    </Card>
  );
}

function TemplatesManager({ onUnauthorized }) {
  const [templates, setTemplates] = useState([]);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const data = await api("portal/templates");
      setTemplates(data.templates);
    } catch (e) {
      if (e.message === "__unauthorized__") return onUnauthorized();
      setError(e.message);
    }
  }, [onUnauthorized]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <div className="flex justify-between mb-4">
        <h3 className="font-head text-lg font-semibold text-adm-text">Modèles de contrat</h3>
        <Button icon={Plus} onClick={() => setEditing({ title: "", content: "", variables: "" })}>Nouveau modèle</Button>
      </div>

      {error && <p className="text-adm-red text-sm mb-2">{error}</p>}

      {editing && (
        <Card className="p-4 mb-4 space-y-3">
          <Input label="Titre *" value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
          <Textarea
            label="Contenu du contrat"
            value={editing.content}
            onChange={(e) => setEditing({ ...editing, content: e.target.value })}
            style={{ minHeight: "400px", fontFamily: "monospace", fontSize: "13px" }}
          />
          <Input label="Variables (séparées par virgule)" value={editing.variables || ""} onChange={(e) => setEditing({ ...editing, variables: e.target.value })} />
          <p className="text-xs text-adm-text-3">
            Utilisez {"{{nom_variable}}"} dans le contenu. Ex: {"{{client_name}}"}, {"{{date}}"}, {"{{montant}}"}
          </p>
          <div className="flex gap-2">
            <Button onClick={async () => {
              try {
                if (editing.id) {
                  await api(`portal/templates/${editing.id}`, { method: "PUT", body: JSON.stringify(editing) });
                } else {
                  await api("portal/templates", { method: "POST", body: JSON.stringify(editing) });
                }
                setEditing(null);
                load();
              } catch (e) { setError(e.message); }
            }} disabled={!editing.title || !editing.content}>Enregistrer</Button>
            <Button variant="ghost" onClick={() => setEditing(null)}>Annuler</Button>
          </div>
        </Card>
      )}

      <div className="space-y-2">
        {templates.map((t) => (
          <Card key={t.id} className="flex items-center justify-between p-4">
            <div className="flex-1">
              <div className="font-semibold text-sm text-adm-text">{t.title}</div>
              <div className="text-xs text-adm-text-3">{t.content?.substring(0, 100)}...</div>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" icon={Edit3} onClick={() => setEditing(t)} />
              <Button variant="danger" size="sm" icon={Trash2} onClick={async () => {
                if (!confirm("Supprimer ce modèle ?")) return;
                await api(`portal/templates/${t.id}`, { method: "DELETE" });
                load();
              }} />
            </div>
          </Card>
        ))}
        {templates.length === 0 && <p className="text-sm text-adm-text-3 text-center py-8">Aucun modèle</p>}
      </div>
    </div>
  );
}

function PortalStatsView({ onUnauthorized }) {
  const [stats, setStats] = useState(null);
  useEffect(() => {
    api("portal/stats").then((d) => setStats(d.stats)).catch((e) => {
      if (e.message === "__unauthorized__" && onUnauthorized) onUnauthorized();
    });
  }, [onUnauthorized]);

  if (!stats) return <p className="text-sm text-adm-text-3">Chargement...</p>;

  const cards = [
    { label: "Clients", value: stats.clients, Icon: Users, color: "#3b82f6" },
    { label: "Projets", value: stats.projects, Icon: Briefcase, color: "#8b5cf6" },
    { label: "Documents en attente", value: stats.pendingDocuments, Icon: FileText, color: "#f59e0b" },
    { label: "Contrats signés", value: stats.signedContracts, Icon: FileText, color: "#3ecf6e" },
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      {cards.map((c, i) => (
        <Card key={i} className="p-6 text-center">
          <div className="inline-flex rounded-lg p-2 mb-2" style={{ background: `${c.color}15` }}>
            <c.Icon size={20} className="text-adm-text-2" style={{ color: c.color }} />
          </div>
          <div className="font-head text-3xl font-bold" style={{ color: c.color }}>{c.value}</div>
          <div className="text-sm text-adm-text-3 mt-1">{c.label}</div>
        </Card>
      ))}
    </div>
  );
}
