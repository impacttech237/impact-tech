/* Zone d'envoi de fichiers : glisser-déposer ou toucher pour choisir,
   progression par fichier, envois enchaînés (un à la fois = fiable en 3G). */
import { useRef, useState } from "preact/hooks";
import { api } from "../api";
import { fmtSize, t } from "../i18n";
import { uploadFile } from "../upload";
import { Icon, Progress, toast } from "../ui";

type Item = { id: string; name: string; size: number; progress: number; state: "wait" | "up" | "done" | "error"; error?: string };

export function Uploader({
  projectId,
  category,
  checklistItemId,
  onUploaded,
  compact,
  label,
}: {
  projectId: number;
  category?: string;
  checklistItemId?: number;
  onUploaded?: () => void;
  compact?: boolean;
  label?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [drag, setDrag] = useState(false);
  const busy = items.some((i) => i.state === "up" || i.state === "wait");
  const touch = typeof matchMedia !== "undefined" && matchMedia("(pointer: coarse)").matches;

  async function handle(files: FileList | File[]) {
    const list = Array.from(files);
    if (!list.length) return;
    const fresh: Item[] = list.map((f) => ({ id: `${f.name}-${f.size}-${Math.random()}`, name: f.name, size: f.size, progress: 0, state: "wait" }));
    setItems((cur) => [...cur.filter((i) => i.state !== "done"), ...fresh]);
    const update = (id: string, patch: Partial<Item>) => setItems((cur) => cur.map((i) => (i.id === id ? { ...i, ...patch } : i)));

    const okNames: string[] = [];
    for (let k = 0; k < list.length; k++) {
      const f = list[k];
      const it = fresh[k];
      update(it.id, { state: "up" });
      try {
        await uploadFile({ projectId, file: f, category, checklistItemId, onProgress: (p) => update(it.id, { progress: p }) });
        update(it.id, { state: "done", progress: 1 });
        okNames.push(f.name);
      } catch (e: any) {
        update(it.id, { state: "error", error: e?.message || "" });
        toast(t("files_failed", { name: f.name, error: e?.message === "network" ? "connexion perdue" : e?.message || "" }), "error");
      }
    }
    if (okNames.length) {
      toast(t("files_done", { n: okNames.length }));
      api(`/projects/${projectId}/uploads/batch-done`, { body: { names: okNames } }).catch(() => {});
      onUploaded?.();
    }
  }

  return (
    <div class="pt-uploader">
      <button
        type="button"
        class={`pt-drop ${drag ? "is-drag" : ""} ${compact ? "pt-drop--compact" : ""}`}
        onClick={() => input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e: DragEvent) => {
          e.preventDefault();
          setDrag(false);
          if (e.dataTransfer?.files) handle(e.dataTransfer.files);
        }}
        disabled={busy}
      >
        <Icon name="upload" size={compact ? 18 : 26} />
        <span>{label || (touch ? t("files_drop") : t("files_drop_desktop"))}</span>
      </button>
      <input
        ref={input}
        type="file"
        multiple
        hidden
        onChange={(e: any) => {
          handle(e.currentTarget.files);
          e.currentTarget.value = "";
        }}
      />
      {items.length > 0 && (
        <ul class="pt-uplist" aria-live="polite">
          {busy && <li class="pt-small pt-muted">{t("files_uploading")}</li>}
          {items.map((i) => (
            <li key={i.id} class={`pt-upitem pt-upitem--${i.state}`}>
              <div class="pt-row pt-row--between pt-gap">
                <span class="pt-ellipsis">{i.name}</span>
                <span class="pt-small pt-muted">{i.state === "done" ? "✓" : i.state === "error" ? "✗" : `${Math.round(i.progress * 100)}% · ${fmtSize(i.size)}`}</span>
              </div>
              {i.state !== "done" && i.state !== "error" && <Progress value={i.progress * 100} label={i.name} />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
