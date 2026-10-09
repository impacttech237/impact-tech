/* Coffre d'accès du projet : accès confiés par le client + accès du site
   livré que nous lui transmettons. */
import { useState } from "react";
import { Badge, Button, Card, EmptyState, Input, LoadingSpinner } from "../../ui";
import { Eye, Lock, Plus, Trash2 } from "../../../lib/icons";
import { CopyButton, ErrorText, fmtAgo, papi, useLoad } from "../shared";

export default function VaultTab({ project }) {
  const { data, error, reload } = useLoad(`projects/${project.id}/vault`);
  const [shown, setShown] = useState({});
  const [f, setF] = useState(null);
  const [err, setErr] = useState("");

  return (
    <div className="space-y-4">
      <p className="text-sm text-adm-text-3">Mots de passe chiffrés (AES-256). « Ajouté par nous » = visible par le client dans son kit de livraison.</p>
      <ErrorText>{error || err}</ErrorText>
      {!data ? (
        <LoadingSpinner />
      ) : !data.entries.length ? (
        <EmptyState icon={Lock} message="Aucun accès enregistré." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {data.entries.map((e) => (
            <Card key={e.id} padding="p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-adm-text">{e.label}</p>
                  <Badge variant={e.created_by === "client" ? "success" : "info"}>{e.created_by === "client" ? "Confié par le client" : "Ajouté par nous"}</Badge>
                </div>
                <button type="button" className="cursor-pointer text-adm-text-3 hover:text-adm-red" aria-label="Supprimer" onClick={() => confirm("Supprimer cet accès ?") && papi(`vault/${e.id}`, "DELETE").then(reload)}>
                  <Trash2 size={14} />
                </button>
              </div>
              <dl className="mt-2 space-y-1 text-sm">
                {e.url && (
                  <div>
                    <a className="text-adm-text-2 underline" href={e.url} target="_blank" rel="noreferrer">
                      {e.url}
                    </a>
                  </div>
                )}
                {e.login && (
                  <div className="flex items-center gap-2">
                    <span className="text-adm-text">{e.login}</span>
                    <CopyButton text={e.login} label="Copier" variant="ghost" />
                  </div>
                )}
                {e.secret && (
                  <div className="flex items-center gap-2">
                    <code className="rounded bg-adm-surface-3 px-2 py-0.5 text-adm-text">{shown[e.id] ? e.secret : "••••••••"}</code>
                    <button type="button" className="cursor-pointer text-adm-text-3 hover:text-adm-text" aria-label="Afficher" onClick={() => setShown({ ...shown, [e.id]: !shown[e.id] })}>
                      <Eye size={14} />
                    </button>
                    <CopyButton text={e.secret} label="Copier" variant="ghost" />
                  </div>
                )}
                {e.note && <p className="text-xs text-adm-text-3">{e.note}</p>}
                <p className="text-[11px] text-adm-text-3">{fmtAgo(e.created_at)}</p>
              </dl>
            </Card>
          ))}
        </div>
      )}
      {f ? (
        <Card padding="p-4" className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Libellé" value={f.label} onChange={(e) => setF({ ...f, label: e.target.value })} placeholder="Ex : Administration du site" />
            <Input label="URL" value={f.url} onChange={(e) => setF({ ...f, url: e.target.value })} />
            <Input label="Identifiant" value={f.login} onChange={(e) => setF({ ...f, login: e.target.value })} />
            <Input label="Mot de passe" value={f.secret} onChange={(e) => setF({ ...f, secret: e.target.value })} />
          </div>
          <Input label="Note" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} />
          <div className="flex gap-2">
            <Button
              disabled={!f.label}
              onClick={async () => {
                try {
                  await papi(`projects/${project.id}/vault`, "POST", f);
                  setF(null);
                  reload();
                } catch (e) {
                  setErr(e.message);
                }
              }}
            >
              Ajouter
            </Button>
            <Button variant="ghost" onClick={() => setF(null)}>
              Annuler
            </Button>
          </div>
        </Card>
      ) : (
        <Button variant="ghost" icon={Plus} onClick={() => setF({ label: "", url: "", login: "", secret: "", note: "" })}>
          Ajouter un accès pour le client
        </Button>
      )}
    </div>
  );
}
