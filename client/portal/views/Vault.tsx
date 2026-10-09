/* Coffre d'accès : formulaire d'ajout + liste (mot de passe masqué). */
import { useEffect, useState } from "preact/hooks";
import { api } from "../api";
import { t } from "../i18n";
import { Button, Empty, Icon, toast } from "../ui";

export function VaultForm({ projectId, checklistItemId, defaultLabel = "", onSaved }: { projectId: number; checklistItemId?: number; defaultLabel?: string; onSaved?: () => void }) {
  const [f, setF] = useState({ label: defaultLabel, url: "", login: "", secret: "", note: "" });
  const [busy, setBusy] = useState(false);
  const set = (k: string) => (e: any) => setF({ ...f, [k]: e.currentTarget.value });

  async function submit(e: Event) {
    e.preventDefault();
    setBusy(true);
    try {
      await api(`/projects/${projectId}/vault`, { body: { ...f, checklistItemId } });
      toast(t("saved"));
      setF({ label: defaultLabel, url: "", login: "", secret: "", note: "" });
      onSaved?.();
    } catch (err: any) {
      toast(err.message, "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form class="pt-stack" onSubmit={submit} autoComplete="off">
      <div class="pt-field">
        <label for={`v-label-${checklistItemId || 0}`}>{t("vault_label")}</label>
        <input id={`v-label-${checklistItemId || 0}`} class="pt-input" required placeholder={t("vault_label_ph")} value={f.label} onInput={set("label")} />
      </div>
      <div class="pt-grid2">
        <div class="pt-field">
          <label for={`v-login-${checklistItemId || 0}`}>{t("vault_login")}</label>
          <input id={`v-login-${checklistItemId || 0}`} class="pt-input" value={f.login} onInput={set("login")} autoComplete="off" />
        </div>
        <div class="pt-field">
          <label for={`v-secret-${checklistItemId || 0}`}>{t("vault_secret")}</label>
          <input id={`v-secret-${checklistItemId || 0}`} class="pt-input" type="password" value={f.secret} onInput={set("secret")} autoComplete="new-password" />
        </div>
      </div>
      <div class="pt-field">
        <label for={`v-url-${checklistItemId || 0}`}>{t("vault_url")}</label>
        <input id={`v-url-${checklistItemId || 0}`} class="pt-input" inputMode="url" value={f.url} onInput={set("url")} />
      </div>
      <div class="pt-field">
        <label for={`v-note-${checklistItemId || 0}`}>{t("vault_note")}</label>
        <input id={`v-note-${checklistItemId || 0}`} class="pt-input" value={f.note} onInput={set("note")} />
      </div>
      <Button type="submit" icon="lock" loading={busy} disabled={!f.label.trim()}>
        {t("vault_add")}
      </Button>
    </form>
  );
}

export function VaultList({ projectId, onlyAdmin }: { projectId: number; onlyAdmin?: boolean }) {
  const [entries, setEntries] = useState<any[] | null>(null);
  const [shown, setShown] = useState<Record<number, boolean>>({});
  const load = () => api(`/projects/${projectId}/vault`).then((r) => setEntries(r.entries)).catch(() => setEntries([]));
  useEffect(() => {
    load();
  }, [projectId]);
  if (!entries) return null;
  const list = onlyAdmin ? entries.filter((e) => e.created_by === "admin") : entries;
  if (!list.length) return <Empty icon="key" title={t("vault_empty")} />;

  async function remove(id: number) {
    if (!confirm(t("delete") + " ?")) return;
    try {
      await api(`/vault/${id}`, { method: "DELETE" });
      load();
    } catch (e: any) {
      toast(e.message, "error");
    }
  }

  return (
    <ul class="pt-vault">
      {list.map((e) => (
        <li key={e.id} class="pt-vault__item">
          <div class="pt-row pt-row--between pt-gap">
            <strong>{e.label}</strong>
            {e.created_by === "client" && (
              <button type="button" class="pt-iconbtn" aria-label={t("delete")} onClick={() => remove(e.id)}>
                <Icon name="trash" size={16} />
              </button>
            )}
          </div>
          {e.url && (
            <a class="pt-small pt-link" href={e.url} target="_blank" rel="noopener noreferrer">
              {e.url}
            </a>
          )}
          {e.login && <p class="pt-small">{e.login}</p>}
          {e.secret && (
            <div class="pt-row pt-gap pt-small">
              <code class="pt-secret">{shown[e.id] ? e.secret : "••••••••"}</code>
              <button type="button" class="pt-link" onClick={() => setShown({ ...shown, [e.id]: !shown[e.id] })}>
                {shown[e.id] ? t("vault_hide") : t("vault_show")}
              </button>
            </div>
          )}
          {e.note && <p class="pt-small pt-muted">{e.note}</p>}
        </li>
      ))}
    </ul>
  );
}
