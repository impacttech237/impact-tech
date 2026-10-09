/* Mon site : aperçu du site en développement (ordinateur / tablette /
   téléphone) + demandes de modification et leur suivi. */
import { useEffect, useState } from "preact/hooks";
import { api } from "../api";
import { fmtRelative, t } from "../i18n";
import { usePortal } from "../state";
import { Badge, Button, Card, Empty, Icon, toast } from "../ui";

const DEVICES = [
  { key: "desktop", icon: "laptop", width: "100%" },
  { key: "tablet", icon: "tablet", width: "768px" },
  { key: "mobile", icon: "mobile", width: "390px" },
];

const REQ_TONE: Record<string, any> = { nouveau: "blue", en_cours: "amber", fait: "green", refuse: "default", devis: "red" };

export function Site() {
  const { dash, projectId } = usePortal();
  const p = dash.project;
  const url = p.delivered_at ? p.site_url || p.preview_url : p.preview_url;
  const [device, setDevice] = useState(matchMedia("(max-width: 700px)").matches ? "mobile" : "desktop");

  return (
    <div class="pt-page">
      <h1 class="pt-h1">{t("site_title")}</h1>
      {!url ? (
        <Empty icon="site" title={t("site_not_ready")} />
      ) : (
        <>
          <div class="pt-row pt-row--between pt-gap pt-wrap">
            <div class="pt-seg" role="tablist" aria-label="Appareil">
              {DEVICES.map((d) => (
                <button key={d.key} type="button" role="tab" aria-selected={device === d.key} class={device === d.key ? "is-on" : ""} onClick={() => setDevice(d.key)}>
                  <Icon name={d.icon} size={16} />
                  <span>{t(`site_${d.key}` as any)}</span>
                </button>
              ))}
            </div>
            <Button variant="ghost" size="sm" icon="ext" href={url} target="_blank">
              {t("site_open")}
            </Button>
          </div>
          <div class="pt-frame">
            <iframe src={url} title={t("site_title")} style={{ width: DEVICES.find((d) => d.key === device)!.width }} loading="lazy" sandbox="allow-scripts allow-same-origin allow-forms allow-popups" />
          </div>
          <p class="pt-small pt-muted">{t("site_tip")}</p>
        </>
      )}
      <RequestForm projectId={projectId!} />
      <RequestList projectId={projectId!} />
    </div>
  );
}

export function RequestForm({ projectId, support }: { projectId: number; support?: boolean }) {
  const [comment, setComment] = useState("");
  const [page, setPage] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: Event) {
    e.preventDefault();
    setBusy(true);
    try {
      const device = matchMedia("(max-width: 700px)").matches ? "mobile" : "desktop";
      await api(`/projects/${projectId}/requests`, { body: { comment: page ? `[${page}] ${comment}` : comment, device } });
      setComment("");
      setPage("");
      toast(t("sent"));
      window.dispatchEvent(new Event("pt-requests"));
    } catch (err: any) {
      toast(err.message, "error");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Card>
      <h2 class="pt-h3">{support ? t("kit_support_request") : t("site_comment_title")}</h2>
      <p class="pt-muted pt-small">{t("site_comment_sub")}</p>
      <form class="pt-stack pt-mt" onSubmit={submit}>
        <input class="pt-input" placeholder={t("site_comment_page")} aria-label={t("site_comment_page")} value={page} onInput={(e: any) => setPage(e.currentTarget.value)} />
        <textarea class="pt-input" rows={3} required placeholder={t("site_comment_ph")} aria-label={t("site_comment_title")} value={comment} onInput={(e: any) => setComment(e.currentTarget.value)} />
        <Button type="submit" icon="send" loading={busy} disabled={!comment.trim()}>
          {t("send")}
        </Button>
      </form>
    </Card>
  );
}

export function RequestList({ projectId }: { projectId: number }) {
  const [list, setList] = useState<any[] | null>(null);
  const load = () => api(`/projects/${projectId}/requests`).then((r) => setList(r.requests)).catch(() => setList([]));
  useEffect(() => {
    load();
    window.addEventListener("pt-requests", load);
    return () => window.removeEventListener("pt-requests", load);
  }, [projectId]);
  if (!list) return null;
  return (
    <section>
      <h2 class="pt-h2">{t("site_requests")}</h2>
      {!list.length ? (
        <p class="pt-muted">{t("site_no_requests")}</p>
      ) : (
        <ul class="pt-list">
          {list.map((r) => (
            <li key={r.id} class="pt-req">
              <div class="pt-row pt-row--between pt-gap">
                <span class="pt-small pt-muted">
                  {fmtRelative(r.created_at)}
                  {r.round ? ` · ${t("req_round", { n: r.round })}` : ""}
                </span>
                <Badge tone={REQ_TONE[r.status]}>{t(`req_${r.status}` as any)}</Badge>
              </div>
              <p class="pt-pre">{r.comment}</p>
              {r.admin_reply && (
                <p class="pt-reply">
                  <strong>Impact Tech :</strong> {r.admin_reply}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
