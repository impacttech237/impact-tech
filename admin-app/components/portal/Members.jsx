/* Personnes d'un client : les collaborateurs qui ont accès à son espace.
   Chacun se connecte avec SON numéro WhatsApp ou SON email ; ses actions
   portent son nom. Signer/valider, payer et le coffre sont des droits
   à cocher (non par défaut). */
import { useState } from "react";
import { Badge, Button, Checkbox, Input, LoadingSpinner, Modal } from "../ui";
import { Edit3, Lock, Plus, Users } from "../../lib/icons";
import { CopyButton, ErrorText, fmtAgo, papi, useLoad } from "./shared";

const EMPTY = { name: "", role: "", phone: "", email: "", can_decide: false, can_pay: false, can_vault: false };

export function ClientMembers({ client }) {
  const { data, error, reload } = useLoad(`clients/${client.id}/members`);
  const [editing, setEditing] = useState(null);
  const [welcome, setWelcome] = useState(null); // message à envoyer au nouveau membre
  const [code, setCode] = useState(null);
  const [busy, setBusy] = useState(0);
  const members = data?.members || [];

  async function generateCode(m) {
    setBusy(m.id);
    try {
      setCode({ member: m, ...(await papi(`members/${m.id}/code`, "POST")) });
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(0);
    }
  }

  async function toggle(m) {
    if (m.active && !confirm(`Retirer l'accès de ${m.name} ? Il/elle sera déconnecté(e) immédiatement. Son nom reste dans l'historique.`)) return;
    try {
      await (m.active ? papi(`members/${m.id}`, "DELETE") : papi(`members/${m.id}`, "PUT", { active: true }));
      reload();
    } catch (e) {
      alert(e.message);
    }
  }

  return (
    <div className="border-t border-adm-border bg-adm-surface-2/40 p-4">
      <div className="mb-1 flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm font-semibold text-adm-text">
          <Users size={14} /> Personnes ayant accès
        </p>
        <Button size="sm" variant="secondary" icon={Plus} onClick={() => setEditing({ ...EMPTY })}>
          Ajouter une personne
        </Button>
      </div>
      <p className="mb-3 text-xs text-adm-text-3">
        En plus de {client.name} (responsable, tous les droits). Chaque personne se connecte sur le même lien avec son propre numéro ou email.
      </p>
      <ErrorText>{error}</ErrorText>
      {!data ? (
        <LoadingSpinner />
      ) : !members.length ? (
        <p className="text-sm text-adm-text-3">Personne d'autre pour l'instant.</p>
      ) : (
        <div className="space-y-2">
          {members.map((m) => (
            <div key={m.id} className={`flex flex-wrap items-center gap-3 rounded-lg border border-adm-border p-3 ${m.active ? "" : "opacity-60"}`}>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-adm-text">
                  {m.name}
                  {m.role && <span className="font-normal text-adm-text-3">· {m.role}</span>}
                  {!m.active && <Badge variant="default">Accès retiré</Badge>}
                </div>
                <div className="truncate text-xs text-adm-text-3">
                  {[m.phone, m.email].filter(Boolean).join(" · ")} · vu {fmtAgo(m.last_seen_at)}
                </div>
                <div className="mt-1 flex flex-wrap gap-1">
                  <Badge variant={m.can_decide ? "success" : "default"}>{m.can_decide ? "Signe et valide" : "Ne signe pas"}</Badge>
                  <Badge variant={m.can_pay ? "success" : "default"}>{m.can_pay ? "Paie" : "Ne paie pas"}</Badge>
                  <Badge variant={m.can_vault ? "success" : "default"}>{m.can_vault ? "Coffre d'accès" : "Pas de coffre"}</Badge>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {!!m.active && (
                  <Button size="sm" variant="secondary" icon={Lock} loading={busy === m.id} onClick={() => generateCode(m)}>
                    Code
                  </Button>
                )}
                <Button size="sm" variant="ghost" icon={Edit3} aria-label="Modifier" onClick={() => setEditing({ ...m, can_decide: !!m.can_decide, can_pay: !!m.can_pay, can_vault: !!m.can_vault })} />
                <Button size="sm" variant={m.active ? "danger" : "secondary"} onClick={() => toggle(m)}>
                  {m.active ? "Retirer l'accès" : "Rétablir"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? `Modifier ${editing.name}` : `Ajouter une personne — ${client.company || client.name}`}>
        {editing && (
          <MemberForm
            clientId={client.id}
            member={editing}
            onSaved={(res) => {
              const isNew = !editing.id;
              setEditing(null);
              reload();
              if (isNew && res?.share) setWelcome({ member: res.member, share: res.share });
            }}
          />
        )}
      </Modal>

      <Modal open={!!welcome} onClose={() => setWelcome(null)} title={`Prévenir ${welcome?.member?.name || ""}`}>
        {welcome && (
          <div className="space-y-3">
            <p className="text-sm text-adm-text-2">Envoyez-lui le lien : il/elle se connecte en touchant « Recevoir mon code sur WhatsApp » et en indiquant son numéro.</p>
            <p className="whitespace-pre-wrap rounded-lg bg-adm-surface-3 p-3 text-sm text-adm-text">{welcome.share.text}</p>
            <div className="flex flex-wrap gap-2">
              <a href={welcome.share.whatsapp} target="_blank" rel="noreferrer" className="inline-flex items-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
                Envoyer par WhatsApp
              </a>
              <CopyButton text={welcome.share.text} label="Copier le message" />
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!code} onClose={() => setCode(null)} title={`Code de ${code?.member?.name || ""}`}>
        {code && (
          <div className="space-y-3">
            <p className="text-xs text-adm-text-3">Valable 24 h. À transmettre uniquement à cette personne.</p>
            <p className="font-head text-3xl font-bold tracking-[0.3em] text-adm-text">{code.code}</p>
            <div className="flex flex-wrap gap-2">
              <a href={code.whatsapp} target="_blank" rel="noreferrer" className="inline-flex items-center rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700">
                Envoyer le code par WhatsApp
              </a>
              <CopyButton text={code.text} label="Copier le message" />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function MemberForm({ clientId, member, onSaved }) {
  const [f, setF] = useState(member);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const check = (k) => (v) => setF({ ...f, [k]: v });

  async function save() {
    setBusy(true);
    setError("");
    try {
      onSaved(f.id ? await papi(`members/${f.id}`, "PUT", f) : await papi(`clients/${clientId}/members`, "POST", f));
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
        <Input label="Nom *" value={f.name} onChange={set("name")} placeholder="Ex : Aïcha Ndongo" />
        <Input label="Rôle" value={f.role || ""} onChange={set("role")} placeholder="Ex : Assistante, Graphiste" />
        <Input label="Numéro WhatsApp" value={f.phone || ""} onChange={set("phone")} placeholder="+237 6…" />
        <Input label="Email" type="email" value={f.email || ""} onChange={set("email")} />
      </div>
      <p className="text-xs text-adm-text-3">Au moins un des deux : c'est avec lui que la personne recevra son code de connexion.</p>
      <div className="space-y-2 rounded-xl border border-adm-border bg-adm-surface-2 p-3">
        <p className="text-xs font-medium uppercase tracking-wide text-adm-text-3">Ce qu'elle peut faire en plus</p>
        <p className="text-xs text-adm-text-3">Par défaut : voir le projet, envoyer des fichiers, écrire des messages, répondre aux éléments attendus.</p>
        <Checkbox label="Signer les documents, valider les étapes, répondre aux devis" checked={f.can_decide} onChange={check("can_decide")} />
        <Checkbox label="Payer les factures" checked={f.can_pay} onChange={check("can_pay")} />
        <Checkbox label="Voir et ajouter des accès dans le coffre (mots de passe)" checked={f.can_vault} onChange={check("can_vault")} />
      </div>
      <Button onClick={save} loading={busy} disabled={!f.name || (!f.phone && !f.email)}>
        {f.id ? "Enregistrer" : "Ajouter"}
      </Button>
    </div>
  );
}
