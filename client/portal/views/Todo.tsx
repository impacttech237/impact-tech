/* « Ce qu'on attend de vous » : fichiers, formulaires guidés, accès. */
import { useEffect, useState } from "preact/hooks";
import { api } from "../api";
import { fmtDate, t } from "../i18n";
import { usePortal } from "../state";
import { Badge, Button, Card, Icon, Progress, toast } from "../ui";
import { Uploader } from "./Uploader";
import { VaultForm } from "./Vault";

const STATUS_TONE: Record<string, "red" | "amber" | "green"> = { todo: "red", sent: "amber", ok: "green" };

export function Todo() {
  const { dash, projectId, reloadDash } = usePortal();
  const [files, setFiles] = useState<any[]>([]);
  const loadFiles = () => api(`/projects/${projectId}/files`).then((r) => setFiles(r.files)).catch(() => {});
  useEffect(() => {
    loadFiles();
  }, [projectId]);

  const items = dash.checklist;
  const done = items.filter((i: any) => i.status !== "todo").length;
  const sorted = [...items].sort((a: any, b: any) => (a.status === "ok" ? 1 : 0) - (b.status === "ok" ? 1 : 0));
  const refresh = async () => {
    await Promise.all([reloadDash(), loadFiles()]);
  };

  return (
    <div class="pt-page">
      <header>
        <h1 class="pt-h1">{t("todo_title")}</h1>
        <p class="pt-muted">{t("todo_sub")}</p>
        {items.length > 0 && (
          <div class="pt-mt">
            <div class="pt-row pt-row--between pt-small">
              <span>{t("todo_done_count", { done, total: items.length })}</span>
            </div>
            <Progress value={(done / items.length) * 100} />
          </div>
        )}
      </header>
      {sorted.map((item: any) => (
        <TodoItem key={item.id} item={item} files={files.filter((f) => f.checklist_item_id === item.id)} onChange={refresh} />
      ))}
    </div>
  );
}

function TodoItem({ item, files, onChange }: { item: any; files: any[]; onChange: () => Promise<void> }) {
  const { projectId } = usePortal();
  const [open, setOpen] = useState(item.status === "todo");
  const [busy, setBusy] = useState(false);

  async function markDone() {
    setBusy(true);
    try {
      await api(`/checklist/${item.id}/done`, { body: {} });
      toast(t("sent"));
      await onChange();
    } catch (e: any) {
      toast(e.message, "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card class={`pt-todo pt-todo--${item.status}`}>
      <button type="button" class="pt-todo__head" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span class={`pt-todo__check pt-todo__check--${item.status}`}>{item.status === "ok" ? <Icon name="check" size={16} /> : <Icon name={KIND_ICON[item.kind] || "todo"} size={16} />}</span>
        <span class="pt-todo__title">
          <strong>{item.label}</strong>
          {item.status === "todo" && item.due_date && <small class="pt-muted">{t("todo_due", { date: fmtDate(item.due_date) })}</small>}
        </span>
        <Badge tone={STATUS_TONE[item.status]}>{t(`todo_status_${item.status}` as any)}</Badge>
      </button>

      {open && (
        <div class="pt-todo__body">
          {item.help && <p class="pt-muted pt-small">{item.help}</p>}

          {item.kind === "file" && (
            <>
              {files.length > 0 && <p class="pt-small pt-ok">{t("todo_files_here", { n: files.length })}</p>}
              <Uploader projectId={projectId!} category={item.category} checklistItemId={item.id} onUploaded={onChange} compact label={files.length ? t("todo_upload_more") : t("todo_upload")} />
              {files.length > 0 && item.status === "todo" && (
                <Button variant="secondary" size="sm" icon="check" loading={busy} onClick={markDone}>
                  {t("todo_mark_done")}
                </Button>
              )}
            </>
          )}

          {item.kind === "form" && <GuidedForm item={item} onDone={onChange} />}

          {item.kind === "access" && (
            <>
              <p class="pt-small pt-muted">
                <Icon name="lock" size={14} /> {t("todo_access_hint")}
              </p>
              <VaultForm projectId={projectId!} checklistItemId={item.id} defaultLabel={item.label} onSaved={onChange} />
            </>
          )}

          {item.kind === "confirm" && item.status === "todo" && (
            <Button icon="check" loading={busy} onClick={markDone}>
              {t("todo_confirm")}
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}

const KIND_ICON: Record<string, string> = { file: "upload", form: "pen", access: "key", confirm: "check" };

function GuidedForm({ item, onDone }: { item: any; onDone: () => Promise<void> }) {
  const questions: any[] = item.config || [];
  const [answers, setAnswers] = useState<string[]>(() => questions.map((_, i) => (item.answer && item.answer[i]) || ""));
  const [busy, setBusy] = useState(false);
  const filled = answers.filter((a) => a.trim()).length;

  async function save(final: boolean) {
    setBusy(true);
    try {
      await api(`/checklist/${item.id}/answer`, { body: { answers, final } });
      toast(final ? t("sent") : t("saved"));
      if (final) await onDone();
    } catch (e: any) {
      toast(e.message, "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      class="pt-stack"
      onSubmit={(e) => {
        e.preventDefault();
        save(true);
      }}
    >
      {questions.map((q, i) => (
        <div class="pt-field" key={i}>
          <label for={`q-${item.id}-${i}`}>{q.q}</label>
          {q.hint && <p class="pt-field__hint">{q.hint}</p>}
          {q.long ? (
            <textarea id={`q-${item.id}-${i}`} class="pt-input" rows={3} value={answers[i]} onInput={(e: any) => setAnswers(answers.map((a, k) => (k === i ? e.currentTarget.value : a)))} />
          ) : (
            <input id={`q-${item.id}-${i}`} class="pt-input" value={answers[i]} onInput={(e: any) => setAnswers(answers.map((a, k) => (k === i ? e.currentTarget.value : a)))} />
          )}
        </div>
      ))}
      <div class="pt-row pt-gap pt-wrap">
        <Button type="submit" icon="send" loading={busy} disabled={!filled}>
          {t("todo_form_submit")}
        </Button>
        <Button variant="ghost" onClick={() => save(false)} disabled={busy}>
          {t("todo_form_save_draft")}
        </Button>
      </div>
    </form>
  );
}
