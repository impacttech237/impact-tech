/* Ce qu'on attend du client : vérifier, valider ou renvoyer avec explication. */
import { useState } from "react";
import { Badge, Button, Card, Input, Select, Textarea } from "../../ui";
import { Check, Plus, RefreshCw, Trash2 } from "../../../lib/icons";
import { CHECK_STATUS, ErrorText, FILE_CATEGORIES, KIND_LABEL, fmtDate, papi, useLoad } from "../shared";

export default function ChecklistTab({ data, reload }) {
  const p = data.project;
  const files = useLoad(`projects/${p.id}/files`);
  const [adding, setAdding] = useState(null);
  const [error, setError] = useState("");

  const update = async (item, body) => {
    try {
      await papi(`checklist/${item.id}`, "PUT", body);
      reload();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="space-y-3">
      <ErrorText>{error}</ErrorText>
      <p className="text-sm text-adm-text-3">Le client voit cette liste dans « À faire ». Il est relancé automatiquement par email à l'échéance, puis 4 jours après.</p>
      {data.checklist.map((item) => {
        const itemFiles = (files.data?.files || []).filter((f) => f.checklist_item_id === item.id);
        return (
          <Card key={item.id} padding="p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-adm-text">{item.label}</span>
                  <Badge variant={CHECK_STATUS[item.status].variant}>{CHECK_STATUS[item.status].label}</Badge>
                  <span className="text-xs text-adm-text-3">{KIND_LABEL[item.kind]}</span>
                </div>
                <p className="text-xs text-adm-text-3">
                  Échéance {fmtDate(item.due_date)}
                  {item.reminder_count ? ` · ${item.reminder_count} relance(s)` : ""}
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {item.status !== "ok" && (
                  <Button size="sm" icon={Check} onClick={() => update(item, { status: "ok" })}>
                    Valider
                  </Button>
                )}
                {item.status !== "todo" && (
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={RefreshCw}
                    onClick={() => {
                      const reason = prompt("Que doit refaire le client ? (envoyé dans sa messagerie)", "La photo est trop floue, pouvez-vous en envoyer une autre ?");
                      if (reason !== null) update(item, { status: "todo", reason });
                    }}
                  >
                    Renvoyer au client
                  </Button>
                )}
                <Button size="sm" variant="ghost" icon={Trash2} aria-label="Supprimer" onClick={() => confirm("Supprimer cet élément ?") && papi(`checklist/${item.id}`, "DELETE").then(reload)} />
              </div>
            </div>

            {item.kind === "form" && item.answer && (
              <dl className="mt-3 space-y-2 rounded-lg bg-adm-surface-2 p-3 text-sm">
                {(item.config || []).map((q, i) => (
                  <div key={i}>
                    <dt className="text-xs font-semibold text-adm-text-3">{q.q}</dt>
                    <dd className="whitespace-pre-wrap text-adm-text">{item.answer[i] || <span className="text-adm-text-3">—</span>}</dd>
                  </div>
                ))}
              </dl>
            )}
            {item.kind !== "form" && Array.isArray(item.answer) && item.answer[0] && <p className="mt-2 rounded bg-adm-surface-2 p-2 text-sm text-adm-text-2">💬 {item.answer[0]}</p>}
            {itemFiles.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-2">
                {itemFiles.map((f) => (
                  <li key={f.id}>
                    <a href={`/api/admin/portal/files/${f.id}`} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-lg border border-adm-border hover:border-adm-border-2">
                      {f.mime_type?.startsWith("image/") ? (
                        <img src={`/api/admin/portal/files/${f.id}`} alt={f.name} className="h-20 w-20 object-cover" loading="lazy" />
                      ) : (
                        <span className="block max-w-[180px] truncate px-3 py-2 text-xs text-adm-text-2">{f.name}</span>
                      )}
                    </a>
                  </li>
                ))}
              </ul>
            )}
            {item.kind === "access" && item.status !== "todo" && <p className="mt-2 text-xs text-adm-text-3">→ Les identifiants sont dans l'onglet « Accès ».</p>}
          </Card>
        );
      })}

      {adding ? (
        <Card padding="p-4" className="space-y-3">
          <Input label="Ce qu'on demande au client" value={adding.label} onChange={(e) => setAdding({ ...adding, label: e.target.value })} placeholder="Ex : Les photos de votre équipe" />
          <Textarea label="Aide / explication (simple)" value={adding.help} onChange={(e) => setAdding({ ...adding, help: e.target.value })} />
          <div className="grid gap-3 sm:grid-cols-3">
            <Select label="Type" value={adding.kind} onChange={(e) => setAdding({ ...adding, kind: e.target.value })} options={Object.entries(KIND_LABEL).map(([value, label]) => ({ value, label }))} />
            {adding.kind === "file" && <Select label="Dossier" value={adding.category} onChange={(e) => setAdding({ ...adding, category: e.target.value })} options={FILE_CATEGORIES} />}
            <Input label="Échéance" type="date" value={adding.due_date} onChange={(e) => setAdding({ ...adding, due_date: e.target.value })} />
          </div>
          {adding.kind === "form" && (
            <Textarea
              label="Questions (une par ligne)"
              value={adding.questions}
              onChange={(e) => setAdding({ ...adding, questions: e.target.value })}
              placeholder={"Quels sont vos horaires ?\nQuelle est votre adresse ?"}
            />
          )}
          <div className="flex gap-2">
            <Button
              disabled={!adding.label}
              onClick={async () => {
                try {
                  await papi(`projects/${p.id}/checklist`, "POST", {
                    ...adding,
                    config: adding.kind === "form" ? adding.questions.split("\n").map((q) => ({ q: q.trim(), long: q.length > 40 })).filter((q) => q.q) : undefined,
                  });
                  setAdding(null);
                  reload();
                } catch (e) {
                  setError(e.message);
                }
              }}
            >
              Ajouter
            </Button>
            <Button variant="ghost" onClick={() => setAdding(null)}>
              Annuler
            </Button>
          </div>
        </Card>
      ) : (
        <Button variant="ghost" icon={Plus} onClick={() => setAdding({ label: "", help: "", kind: "file", category: "photos", due_date: "", questions: "" })}>
          Demander autre chose au client
        </Button>
      )}
    </div>
  );
}
