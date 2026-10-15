/* Fichiers du projet (déposés par le client ou par nous). */
import { useRef, useState } from "react";
import { uploadFile } from "../../../../client/portal/upload";
import { Badge, Button, EmptyState, LoadingSpinner, Select } from "../../ui";
import { Download, File, Trash2, Upload } from "../../../lib/icons";
import { ErrorText, FILE_CATEGORIES, fmtAgo, fmtSize, papi, useLoad } from "../shared";

export default function FilesTab({ project }) {
  const { data, error, reload } = useLoad(`projects/${project.id}/files`);
  const [cat, setCat] = useState("all");
  const [upCat, setUpCat] = useState("documents");
  const [progress, setProgress] = useState(null);
  const [err, setErr] = useState("");
  const input = useRef(null);

  async function upload(files) {
    setErr("");
    for (const f of Array.from(files)) {
      try {
        setProgress({ name: f.name, p: 0 });
        await uploadFile({ projectId: project.id, file: f, category: upCat, base: "/api/admin/portal", onProgress: (p) => setProgress({ name: f.name, p }) });
      } catch (e) {
        setErr(`${f.name} : ${e.message}`);
      }
    }
    setProgress(null);
    reload();
  }

  const files = (data?.files || []).filter((f) => !f.message_id);
  const shown = files.filter((f) => cat === "all" || f.category === cat);
  const counts = Object.fromEntries(FILE_CATEGORIES.map((c) => [c.value, files.filter((f) => f.category === c.value).length]));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-48">
          <Select label="Dossier" value={upCat} onChange={(e) => setUpCat(e.target.value)} options={FILE_CATEGORIES} />
        </div>
        <Button icon={Upload} onClick={() => input.current?.click()} loading={!!progress}>
          Envoyer des fichiers au client
        </Button>
        <input ref={input} type="file" multiple hidden onChange={(e) => (upload(e.target.files), (e.target.value = ""))} />
        {progress && (
          <span className="text-sm text-adm-text-2">
            {progress.name} — {Math.round(progress.p * 100)}%
          </span>
        )}
      </div>
      <ErrorText>{error || err}</ErrorText>

      <div className="flex flex-wrap gap-1.5">
        {[{ value: "all", label: "Tout" }, ...FILE_CATEGORIES].map((c) =>
          c.value === "all" || counts[c.value] ? (
            <button
              key={c.value}
              type="button"
              onClick={() => setCat(c.value)}
              className={`cursor-pointer rounded-full px-3 py-1 text-xs font-medium ${cat === c.value ? "bg-adm-text text-adm-bg" : "bg-adm-surface-2 text-adm-text-2 hover:bg-adm-surface-3"}`}
            >
              {c.label} {c.value === "all" ? files.length : counts[c.value]}
            </button>
          ) : null
        )}
      </div>

      {!data ? (
        <LoadingSpinner />
      ) : !shown.length ? (
        <EmptyState icon={File} message="Aucun fichier." />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {shown.map((f) => {
            const url = `/api/admin/portal/files/${f.id}`;
            return (
              <div key={f.id} className="group overflow-hidden rounded-xl border border-adm-border bg-adm-surface">
                <a href={url} target="_blank" rel="noreferrer" className="block aspect-square bg-adm-surface-2">
                  {f.mime_type?.startsWith("image/") ? (
                    <img src={url} alt={f.name} className="h-full w-full object-cover" loading="lazy" />
                  ) : f.mime_type?.startsWith("video/") ? (
                    <video src={url} className="h-full w-full object-cover" preload="metadata" muted />
                  ) : (
                    <span className="flex h-full items-center justify-center p-3 text-center text-xs text-adm-text-3">{(f.name.split(".").pop() || "").toUpperCase()}</span>
                  )}
                </a>
                <div className="p-2">
                  <p className="truncate text-xs font-medium text-adm-text" title={f.name}>
                    {f.name}
                  </p>
                  <p className="text-[11px] text-adm-text-3">
                    {fmtSize(f.size)} · {fmtAgo(f.created_at)}
                  </p>
                  <div className="mt-1 flex items-center justify-between">
                    <Badge variant={f.uploaded_by === "client" ? "success" : "info"}>{f.uploaded_by === "client" ? f.uploaded_by_name || "Client" : "Nous"}</Badge>
                    <div className="flex gap-1">
                      <a href={`${url}?download=1`} className="rounded p-1 text-adm-text-3 hover:text-adm-text" aria-label="Télécharger">
                        <Download size={14} />
                      </a>
                      <button type="button" className="cursor-pointer rounded p-1 text-adm-text-3 hover:text-adm-red" aria-label="Supprimer" onClick={() => confirm(`Supprimer ${f.name} ?`) && papi(`files/${f.id}`, "DELETE").then(reload)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
