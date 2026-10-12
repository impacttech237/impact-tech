/* Accueil : où en est mon projet / que dois-je faire / quoi de neuf. */
import { useState } from "preact/hooks";
import { api } from "../api";
import { fmtDate, fmtRelative, hasKey, t } from "../i18n";
import { usePortal } from "../state";
import { Badge, Button, Card, Icon, Progress, toast } from "../ui";

const STEP_TONE: Record<string, "default" | "blue" | "amber" | "green"> = { todo: "default", in_progress: "blue", review: "amber", done: "green" };

export function Home() {
  const { me, dash, go } = usePortal();
  const p = dash.project;
  const current = dash.steps.find((s: any) => s.id === dash.currentStepId);
  const review = dash.steps.find((s: any) => s.status === "review" && s.needs_validation);
  const [first, ...rest] = dash.actions.filter((a: any) => a.type !== "validate");

  return (
    <div class="pt-page">
      <header class="pt-hero">
        <p class="pt-eyebrow">{p.pack || p.title}</p>
        <h1>{t("hello", { name: String(me.name).split(" ")[0] })}</h1>
        <div class="pt-hero__progress">
          <div class="pt-row pt-row--between">
            <span>{t("progress_label")}</span>
            <strong>{dash.progress}%</strong>
          </div>
          <Progress value={dash.progress} label={t("progress_label")} />
          <div class="pt-row pt-row--between pt-muted pt-small">
            <span>{current ? `${t("current_step")} : ${current.title}` : t("step_done")}</span>
            {p.due_date && !p.delivered_at && <span>{t("delivery_planned", { date: fmtDate(p.due_date) })}</span>}
          </div>
        </div>
      </header>

      {review && <ValidateStep step={review} />}

      <section aria-labelledby="next-title">
        <h2 id="next-title" class="pt-h2">{t("next_action")}</h2>
        {first ? (
          <Card tone="accent">
            <button type="button" class="pt-action" onClick={() => (first.url ? (location.href = first.url) : go(first.target, first.type === "sign" ? first.id : undefined))}>
              <span class="pt-action__icon">
                <Icon name={first.type === "checklist" ? KIND_ICON[first.kind] || "upload" : ACTION_ICON[first.type] || "todo"} />
              </span>
              <span class="pt-action__text">
                <strong>{actionLabel(first)}</strong>
                {first.due && <small>{t("todo_due", { date: fmtDate(first.due) })}</small>}
              </span>
              <Icon name="back" class="pt-flip" />
            </button>
            {rest.length > 0 && (
              <button type="button" class="pt-link pt-mt" onClick={() => go("todo")}>
                {t("more_actions", { n: rest.length })}
              </button>
            )}
          </Card>
        ) : (
          !review && (
            <Card tone="success">
              <p class="pt-strong">{t("all_good")}</p>
              <p class="pt-muted">{t("all_good_sub")}</p>
            </Card>
          )
        )}
      </section>

      {p.preview_url && !p.delivered_at && (
        <Button variant="secondary" block icon="site" onClick={() => go("site")}>
          {t("see_site")}
        </Button>
      )}

      {p.weekly_update && (
        <Card>
          <p class="pt-eyebrow">
            {t("weekly_update")} · {fmtRelative(p.weekly_update_at)}
          </p>
          <p class="pt-pre">{p.weekly_update}</p>
        </Card>
      )}

      <section aria-labelledby="steps-title">
        <h2 id="steps-title" class="pt-h2">{t("steps_title")}</h2>
        <ol class="pt-steps">
          {dash.steps.map((s: any, i: number) => (
            <li key={s.id} class={`pt-step pt-step--${s.status}`}>
              <span class="pt-step__dot">{s.status === "done" ? <Icon name="check" size={14} /> : i + 1}</span>
              <div class="pt-step__body">
                <div class="pt-row pt-row--between pt-gap">
                  <strong>{s.title}</strong>
                  <Badge tone={STEP_TONE[s.status]}>{t(`step_${s.status}` as any)}</Badge>
                </div>
                {s.status !== "done" && s.description && <p class="pt-muted pt-small">{s.description}</p>}
                {s.validated_at && <p class="pt-muted pt-small">{t("validated_at", { date: fmtDate(s.validated_at) })}</p>}
                {s.status === "done" && !!s.needs_validation && !s.satisfaction && <Satisfaction step={s} />}
              </div>
            </li>
          ))}
        </ol>
        {p.revision_rounds != null && (
          <p class="pt-muted pt-small">
            {p.revision_rounds < 0 ? t("revisions_unlimited") : t("revisions_left", { used: Math.min(p.revision_used, p.revision_rounds), total: p.revision_rounds })}
          </p>
        )}
      </section>

      <section aria-labelledby="feed-title">
        <h2 id="feed-title" class="pt-h2">{t("whats_new")}</h2>
        {dash.feed.length ? (
          <ul class="pt-feed">
            {dash.feed.slice(0, 8).map((f: any) => (
              <li key={f.id}>
                <span class={`pt-feed__dot pt-feed__dot--${f.actor}`} />
                <span>{activityLabel(f)}</span>
                <time class="pt-muted pt-small">{fmtRelative(f.created_at)}</time>
              </li>
            ))}
          </ul>
        ) : (
          <p class="pt-muted">{t("no_news")}</p>
        )}
      </section>
    </div>
  );
}

const KIND_ICON: Record<string, string> = { file: "upload", form: "pen", access: "key", confirm: "check" };
const ACTION_ICON: Record<string, string> = { questionnaire: "pen", sign: "pen", checklist: "upload", pay: "money", accept_quote: "money", message: "chat", validate: "check" };

export function actionLabel(a: any) {
  const key = `a_${a.type}`;
  return hasKey(key) ? t(key, { t: a.title ?? a.label, a: a.amount || "" }) : a.label;
}

export function activityLabel(f: any) {
  const key = `act_${f.action}`;
  return hasKey(key) ? t(key, { d: f.detail || "" }) : f.detail || f.action;
}

function ValidateStep({ step }: { step: any }) {
  const { reloadDash } = usePortal();
  const [mode, setMode] = useState<"ask" | "changes">("ask");
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(kind: "validate" | "changes") {
    setBusy(true);
    try {
      await api(`/steps/${step.id}/${kind}`, { body: { comment } });
      toast(t("sent"));
      await reloadDash();
    } catch (e: any) {
      toast(e.message, "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card tone="warn">
      <h2 class="pt-h3">{t("validate_title", { step: step.title })}</h2>
      <p class="pt-muted">{t("validate_sub")}</p>
      {mode === "ask" ? (
        <div class="pt-row pt-gap pt-wrap pt-mt">
          <Button icon="check" variant="success" loading={busy} onClick={() => submit("validate")}>
            {t("validate_btn")}
          </Button>
          <Button variant="secondary" icon="pen" onClick={() => setMode("changes")}>
            {t("changes_btn")}
          </Button>
        </div>
      ) : (
        <div class="pt-stack pt-mt">
          <textarea class="pt-input" rows={4} placeholder={t("changes_placeholder")} value={comment} onInput={(e: any) => setComment(e.currentTarget.value)} aria-label={t("changes_placeholder")} />
          <div class="pt-row pt-gap">
            <Button loading={busy} disabled={!comment.trim()} onClick={() => submit("changes")} icon="send">
              {t("send")}
            </Button>
            <Button variant="ghost" onClick={() => setMode("ask")}>
              {t("cancel")}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

function Satisfaction({ step }: { step: any }) {
  const [rating, setRating] = useState(0);
  const [done, setDone] = useState(false);
  const [comment, setComment] = useState("");
  if (done) return <p class="pt-small pt-ok">{t("satisfaction_thanks")}</p>;
  const faces = ["😞", "😕", "😐", "🙂", "😍"];
  async function send(r: number, c = "") {
    try {
      await api(`/steps/${step.id}/satisfaction`, { body: { rating: r, comment: c } });
      setDone(true);
    } catch (e: any) {
      toast(e.message, "error");
    }
  }
  return (
    <div class="pt-satisfaction">
      <p class="pt-small">{t("satisfaction_q")}</p>
      <div class="pt-row pt-gap" role="radiogroup" aria-label={t("satisfaction_q")}>
        {faces.map((f, i) => (
          <button
            type="button"
            key={i}
            role="radio"
            aria-checked={rating === i + 1}
            aria-label={`${i + 1}/5`}
            class={`pt-face ${rating === i + 1 ? "is-on" : ""}`}
            onClick={() => (i >= 2 ? send(i + 1) : setRating(i + 1))}
          >
            {f}
          </button>
        ))}
      </div>
      {rating > 0 && rating <= 2 && (
        <div class="pt-stack pt-mt">
          <textarea class="pt-input" rows={2} placeholder={t("satisfaction_comment")} value={comment} onInput={(e: any) => setComment(e.currentTarget.value)} />
          <Button size="sm" onClick={() => send(rating, comment)}>
            {t("send")}
          </Button>
        </div>
      )}
    </div>
  );
}
