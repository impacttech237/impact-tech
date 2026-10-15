/* Fichiers : dépôt (tous formats), classement par dossier, aperçu. */
import { useEffect, useState } from "preact/hooks";
import { api, fileUrl } from "../api";
import { fmtRelative, fmtSize, t } from "../i18n";
import { isMine, usePortal } from "../state";
import { Empty, ErrorBox, Icon, Modal, Skeleton, fileIcon, toast } from "../ui";
import { Uploader } from "./Uploader";

const CATS = ["logo", "photos", "videos", "musique", "textes", "documents", "autre"];

export function Files() {
  const { projectId, person, me } = usePortal();
  const [files, setFiles] = useState<any[] | null>(null);
  const [error, setError] = useState("");
  const [cat, setCat] = useState("all");
  const [upCat, setUpCat] = useState("");
  const [preview, setPreview] = useState<any>(null);

  const load = () =>
    api(`/projects/${projectId}/files`)
      .then((r) => {
        setFiles(r.files);
        setError("");
      })
      .catch((e) => setError(e.message));
  useEffect(() => {
    load();
  }, [projectId]);

  const present = CATS.filter((c) => files?.some((f) => f.category === c));
  const shown = (files || []).filter((f) => cat === "all" || f.category === cat);

  async function remove(f: any) {
    if (!confirm(`${t("delete")} « ${f.name} » ?`)) return;
    try {
      await api(`/files/${f.id}`, { method: "DELETE" });
      load();
    } catch (e: any) {
      toast(e.message, "error");
    }
  }

  return (
    <div class="pt-page">
      <header>
        <h1 class="pt-h1">{t("files_title")}</h1>
        <p class="pt-muted">{t("files_sub")}</p>
      </header>

      <div class="pt-stack">
        <label class="pt-field">
          <span>{t("files_category")}</span>
          <select class="pt-input" value={upCat} onChange={(e: any) => setUpCat(e.currentTarget.value)}>
            <option value="">—</option>
            {CATS.map((c) => (
              <option key={c} value={c}>
                {t(`cat_${c}` as any)}
              </option>
            ))}
          </select>
        </label>
        <Uploader projectId={projectId!} category={upCat || undefined} onUploaded={load} />
      </div>

      {present.length > 1 && (
        <div class="pt-chips" role="tablist">
          {["all", ...present].map((c) => (
            <button type="button" role="tab" aria-selected={cat === c} key={c} class={`pt-chip ${cat === c ? "is-on" : ""}`} onClick={() => setCat(c)}>
              {t(`cat_${c}` as any)}
            </button>
          ))}
        </div>
      )}

      {error && <ErrorBox message={error} onRetry={load} />}
      {!files && !error && <Skeleton />}
      {files && !shown.length && <Empty title={t("files_empty")} />}

      <ul class="pt-files">
        {shown.map((f) => (
          <li key={f.id} class="pt-file">
            <button type="button" class="pt-file__main" onClick={() => setPreview(f)}>
              {f.mime_type?.startsWith("image/") ? (
                <img class="pt-file__thumb" src={fileUrl(f.id)} alt="" loading="lazy" />
              ) : (
                <span class="pt-file__icon">
                  <Icon name={fileIcon(f.mime_type)} />
                </span>
              )}
              <span class="pt-file__info">
                <strong class="pt-ellipsis">{f.name}</strong>
                <small class="pt-muted">
                  {fmtSize(f.size)} · {fmtRelative(f.created_at)} · {f.uploaded_by === "admin" ? t("files_from_us") : isMine(person, f.uploaded_by_name) ? t("files_from_you") : t("files_from_person", { name: f.uploaded_by_name || me.name })}
                </small>
              </span>
            </button>
            <a class="pt-iconbtn" href={fileUrl(f.id, true)} aria-label={`${t("download")} ${f.name}`}>
              <Icon name="download" size={18} />
            </a>
            {f.uploaded_by === "client" && (
              <button type="button" class="pt-iconbtn" aria-label={`${t("delete")} ${f.name}`} onClick={() => remove(f)}>
                <Icon name="trash" size={18} />
              </button>
            )}
          </li>
        ))}
      </ul>

      <Modal open={!!preview} onClose={() => setPreview(null)} title={preview?.name || ""} wide>
        {preview && <FilePreview file={preview} />}
      </Modal>
    </div>
  );
}

export function FilePreview({ file }: { file: any }) {
  const m = file.mime_type || "";
  const src = fileUrl(file.id);
  return (
    <div class="pt-preview">
      {m.startsWith("image/") && <img src={src} alt={file.name} />}
      {m.startsWith("video/") && <video src={src} controls playsInline preload="metadata" />}
      {m.startsWith("audio/") && <audio src={src} controls preload="metadata" />}
      {m === "application/pdf" && <iframe src={src} title={file.name} />}
      {!/^(image|video|audio)\//.test(m) && m !== "application/pdf" && <p class="pt-muted">{t("doc_cannot_preview")}</p>}
      <a class="pt-btn pt-btn--secondary pt-btn--md" href={fileUrl(file.id, true)}>
        <Icon name="download" size={18} />
        <span>{t("download")}</span>
      </a>
    </div>
  );
}
