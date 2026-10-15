/* Clients du portail : création, partage du lien, code manuel, projets. */
import { useEffect, useState } from "react";
import { Badge, Button, Card, EmptyState, Input, LoadingSpinner, Modal, Select, Textarea } from "../ui";
import { ChevronDown, ChevronRight, Edit3, ExternalLink, Lock, Plus, Search, Send, Trash2, Users } from "../../lib/icons";
import { ClientMembers } from "./Members";
import { CopyButton, ErrorText, PROJECT_STATUS, fmtAgo, fmtMoney, papi, useLoad } from "./shared";

export default function Clients({ openProject }) {
  const [search, setSearch] = useState("");
  const { data, error, reload } = useLoad(`clients?search=${encodeURIComponent(search)}`, [search]);
  const [editing, setEditing] = useState(null);
  const [sharing, setSharing] = useState(null);
  const [open, setOpen] = useState(null);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="w-full sm:w-72">
          <Input icon={Search} placeholder="Rechercher un client…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Button icon={Plus} onClick={() => setEditing({ name: "", email: "", phone: "", company: "", locale: "fr" })}>
          Nouveau client
        </Button>
      </div>
      <ErrorText>{error}</ErrorText>
      {!data ? (
        <LoadingSpinner />
      ) : !data.clients.length ? (
        <EmptyState icon={Users} message="Aucun client. Créez-en un, ou convertissez une demande depuis l'onglet « Demandes »." />
      ) : (
        <div className="space-y-2">
          {data.clients.map((c) => (
            <Card key={c.id} padding="p-0">
              <div className="flex flex-wrap items-center gap-3 p-4">
                <button type="button" className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-left" onClick={() => setOpen(open === c.id ? null : c.id)}>
                  {open === c.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-sm font-semibold text-adm-text">
                      {c.name} {c.company && <span className="font-normal text-adm-text-3">· {c.company}</span>}
                      {!c.active && <Badge variant="default">Désactivé</Badge>}
                    </div>
                    <div className="truncate text-xs text-adm-text-3">
                      {[c.email, c.phone].filter(Boolean).join(" · ")} · {c.project_count} projet(s) · vu {fmtAgo(c.last_seen_at)}
                      {c.referrals > 0 && ` · ${c.referrals} parrainage(s)`}
                    </div>
                  </div>
                </button>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" icon={Send} onClick={() => setSharing(c)}>
                    Partager l'accès
                  </Button>
                  <Button size="sm" variant="ghost" icon={Edit3} onClick={() => setEditing(c)} aria-label="Modifier" />
                  <Button
                    size="sm"
                    variant="danger"
                    icon={Trash2}
                    aria-label="Supprimer"
                    onClick={async () => {
                      if (!confirm(`Supprimer ${c.name} et TOUS ses projets, fichiers et documents ? Action définitive.`)) return;
                      await papi(`clients/${c.id}`, "DELETE");
                      reload();
                    }}
                  />
                </div>
              </div>
              {open === c.id && (
                <>
                  <ClientMembers client={c} />
                  <ClientProjects client={c} openProject={openProject} />
                </>
              )}
            </Card>
          ))}
        </div>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? "Modifier le client" : "Nouveau client"}>
        {editing && (
          <ClientForm
            client={editing}
            onSaved={(res) => {
              setEditing(null);
              reload();
              if (res?.client && !editing.id) setSharing(res.client);
            }}
          />
        )}
      </Modal>
      <Modal open={!!sharing} onClose={() => setSharing(null)} title={`Accès de ${sharing?.name || ""}`}>
        {sharing && <ShareAccess client={sharing} />}
      </Modal>
    </div>
  );
}

function ClientForm({ client, onSaved }) {
  const [f, setF] = useState({ ...client, internal_notes: client.internal_notes || "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const slugPreview = (f.slug || f.company || f.name || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  async function save() {
    setBusy(true);
    setError("");
    try {
      const res = f.id ? await papi(`clients/${f.id}`, "PUT", f) : await papi("clients", "POST", f);
      onSaved(res);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <ErrorText>{error}</ErrorText>
      <div className="grid gap-3 sm:grid-cols-2">
        <Input label="Nom du contact *" value={f.name} onChange={set("name")} />
        <Input label="Entreprise" value={f.company || ""} onChange={set("company")} />
        <Input label="Email" type="email" value={f.email || ""} onChange={set("email")} />
        <Input label="Téléphone / WhatsApp" value={f.phone || ""} onChange={set("phone")} placeholder="+237 6…" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Input label="Lien personnalisé" value={f.slug || ""} onChange={set("slug")} placeholder={slugPreview} />
        <Select label="Langue du client" value={f.locale || "fr"} onChange={set("locale")} options={[{ value: "fr", label: "Français" }, { value: "en", label: "English" }]} />
      </div>
      <p className="text-xs text-adm-text-3">
        Lien du client : <span className="text-adm-text-2">impacttech237.com/espace/{slugPreview || "…"}</span>
      </p>
      {f.id && <Textarea label="Notes internes (jamais visibles par le client)" value={f.internal_notes} onChange={set("internal_notes")} />}
      <Button onClick={save} loading={busy} disabled={!f.name || (!f.email && !f.phone)}>
        {f.id ? "Enregistrer" : "Créer le client"}
      </Button>
    </div>
  );
}

/* Partage de l'accès : lien, WhatsApp, email, code manuel. */
function ShareAccess({ client }) {
  const [share, setShare] = useState(null);
  const [emailState, setEmailState] = useState(null);
  const [code, setCode] = useState(null);
  const [busy, setBusy] = useState("");

  useEffect(() => {
    papi(`clients/${client.id}/share`).then((r) => setShare(r.share));
  }, [client.id]);

  if (!share) return <LoadingSpinner />;
  return (
    <div className="space-y-5">
      <div>
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-adm-text-3">Lien personnel</p>
        <div className="flex flex-wrap items-center gap-2">
          <code className="break-all rounded-lg bg-adm-surface-3 px-3 py-2 text-sm text-adm-text">{share.url}</code>
          <CopyButton text={share.url} />
          <a href={share.url} target="_blank" rel="noreferrer" className="text-adm-text-3 hover:text-adm-text" aria-label="Ouvrir">
            <ExternalLink size={16} />
          </a>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <a href={share.whatsapp} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700">
          Envoyer par WhatsApp
        </a>
        <Button
          variant="secondary"
          icon={Send}
          loading={busy === "email"}
          disabled={!client.email}
          onClick={async () => {
            setBusy("email");
            try {
              const r = await papi(`clients/${client.id}/send-link`, "POST");
              setEmailState(r.emailSent ? { ok: true, text: "Email envoyé ✓" } : { ok: false, text: r.emailError || "Email non envoyé" });
            } finally {
              setBusy("");
            }
          }}
        >
          Envoyer par email
        </Button>
      </div>
      {emailState && <p className={`text-sm ${emailState.ok ? "text-emerald-400" : "text-amber-400"}`}>{emailState.text}</p>}
      <CopyButton text={share.text} label="Copier le message complet" />

      <div className="rounded-xl border border-adm-border bg-adm-surface-2 p-4">
        <p className="flex items-center gap-2 text-sm font-semibold text-adm-text">
          <Lock size={14} /> Code de connexion manuel
        </p>
        <p className="mb-3 text-xs text-adm-text-3">Pour un client sans email (ou si l'email n'arrive pas) : valable 24 h, à donner par téléphone ou WhatsApp.</p>
        {code ? (
          <div className="space-y-2">
            <p className="font-head text-3xl font-bold tracking-[0.3em] text-adm-text">{code.code}</p>
            <div className="flex flex-wrap gap-2">
              <a href={code.whatsapp} target="_blank" rel="noreferrer" className="inline-flex items-center rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700">
                Envoyer le code par WhatsApp
              </a>
              <CopyButton text={code.text} label="Copier le message" />
            </div>
          </div>
        ) : (
          <Button
            size="sm"
            variant="secondary"
            icon={Lock}
            loading={busy === "code"}
            onClick={async () => {
              setBusy("code");
              try {
                setCode(await papi(`clients/${client.id}/code`, "POST"));
              } finally {
                setBusy("");
              }
            }}
          >
            Générer un code
          </Button>
        )}
      </div>
    </div>
  );
}

function ClientProjects({ client, openProject }) {
  const { data, reload } = useLoad(`clients/${client.id}/projects`);
  const [creating, setCreating] = useState(false);
  return (
    <div className="border-t border-adm-border bg-adm-surface-2/40 p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-adm-text">Projets</p>
        <Button size="sm" icon={Plus} onClick={() => setCreating(true)}>
          Nouveau projet
        </Button>
      </div>
      {!data ? (
        <LoadingSpinner />
      ) : !data.projects.length ? (
        <p className="text-sm text-adm-text-3">Aucun projet pour ce client.</p>
      ) : (
        <ul className="space-y-2">
          {data.projects.map((p) => (
            <li key={p.id}>
              <button type="button" onClick={() => openProject(p.id)} className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg border border-adm-border bg-adm-surface px-3 py-2 text-left hover:border-adm-border-2">
                <span className="text-sm text-adm-text">
                  {p.title} <span className="text-adm-text-3">· {p.pack || "—"} · {fmtMoney(p.amount, p.currency)}</span>
                </span>
                <Badge variant={PROJECT_STATUS[p.status]?.variant || "default"}>{PROJECT_STATUS[p.status]?.label || p.status}</Badge>
              </button>
            </li>
          ))}
        </ul>
      )}
      <Modal open={creating} onClose={() => setCreating(false)} title="Nouveau projet">
        <NewProjectForm
          clientId={client.id}
          defaultTitle={`Site ${client.company || client.name}`}
          onCreated={(id) => {
            setCreating(false);
            reload();
            openProject(id);
          }}
        />
      </Modal>
    </div>
  );
}

export function NewProjectForm({ clientId, defaultTitle, onCreated }) {
  const { data } = useLoad("templates");
  const [f, setF] = useState({ title: defaultTitle, pack: "", amount: "", currency: "XAF", start_date: new Date().toISOString().slice(0, 10) });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const packs = data?.effective || [];
  useEffect(() => {
    if (!f.pack && packs.length) setF((x) => ({ ...x, pack: packs[0].pack }));
  }, [packs.length]);
  const tpl = packs.find((t) => t.pack === f.pack);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  return (
    <div className="space-y-3">
      <ErrorText>{error}</ErrorText>
      <Input label="Titre du projet *" value={f.title} onChange={set("title")} />
      <Select label="Pack" value={f.pack} onChange={set("pack")} options={packs.map((t) => ({ value: t.pack, label: t.pack }))} />
      {tpl && (
        <p className="text-xs text-adm-text-3">
          Le modèle crée automatiquement {tpl.steps.length} étapes et {tpl.checklist.length} éléments à demander au client
          {tpl.delay_days ? `, livraison prévue sous ${tpl.delay_days} jours` : ""}. Tout reste modifiable ensuite.
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-3">
        <Input label="Montant" type="number" value={f.amount} onChange={set("amount")} />
        <Select label="Devise" value={f.currency} onChange={set("currency")} options={["XAF", "EUR"]} />
        <Input label="Début" type="date" value={f.start_date} onChange={set("start_date")} />
      </div>
      <Button
        loading={busy}
        disabled={!f.title}
        onClick={async () => {
          setBusy(true);
          try {
            const r = await papi("projects", "POST", { ...f, client_id: clientId });
            onCreated(r.id);
          } catch (e) {
            setError(e.message);
          } finally {
            setBusy(false);
          }
        }}
      >
        Créer le projet
      </Button>
    </div>
  );
}
