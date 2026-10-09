/* Après la livraison : kit (accès, guides, santé du site, renouvellements),
   support, avis et parrainage. */
import { useState } from "preact/hooks";
import { api } from "../api";
import { fmtDate, fmtRelative, t } from "../i18n";
import { usePortal, whatsappLink } from "../state";
import { Button, Card, Icon, toast } from "../ui";
import { RequestForm, RequestList } from "./Site";
import { VaultList } from "./Vault";

export function Kit() {
  const { dash, projectId, me } = usePortal();
  const p = dash.project;
  const up = p.health_status && p.health_status >= 200 && p.health_status < 400;
  const supportActive = p.support_until && p.support_until >= new Date().toISOString().slice(0, 10);

  return (
    <div class="pt-page">
      <header>
        <h1 class="pt-h1">{t("kit_title")}</h1>
        <p class="pt-muted">{t("kit_sub")}</p>
      </header>

      {(p.site_url || p.admin_url) && (
        <Card tone="success">
          {p.site_url && (
            <div class="pt-row pt-row--between pt-gap pt-wrap">
              <div>
                <p class="pt-eyebrow">{t("kit_site")}</p>
                <a class="pt-link pt-strong" href={p.site_url} target="_blank" rel="noopener noreferrer">
                  {p.site_url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                </a>
                {p.health_checked_at && (
                  <p class="pt-small">
                    <span class={up ? "pt-ok" : "pt-bad"}>{up ? t("kit_health_ok") : t("kit_health_ko")}</span>
                    <span class="pt-muted"> · {t("kit_checked", { when: fmtRelative(p.health_checked_at) })}</span>
                  </p>
                )}
              </div>
              <Button variant="secondary" size="sm" icon="ext" href={p.site_url} target="_blank">
                {t("open")}
              </Button>
            </div>
          )}
          {p.admin_url && (
            <Button class="pt-mt" icon="key" href={p.admin_url} target="_blank">
              {t("kit_admin")}
            </Button>
          )}
        </Card>
      )}

      <Card>
        <ul class="pt-facts">
          {p.support_until && <li>{supportActive ? t("kit_support", { date: fmtDate(p.support_until, true) }) : t("kit_support_over")}</li>}
          {p.hosting_renewal_at && <li>{t("kit_renewal", { date: fmtDate(p.hosting_renewal_at, true) })}</li>}
          {p.domain_renewal_at && <li>{t("kit_domain", { date: fmtDate(p.domain_renewal_at, true) })}</li>}
        </ul>
        {p.handover_notes && <p class="pt-pre pt-mt">{p.handover_notes}</p>}
      </Card>

      {p.handover_links?.length > 0 && (
        <section>
          <h2 class="pt-h2">{t("kit_guides")}</h2>
          <ul class="pt-list">
            {p.handover_links.map((l: any, i: number) => (
              <li key={i}>
                <a class="pt-listitem" href={l.url} target="_blank" rel="noopener noreferrer">
                  <span class="pt-file__icon">
                    <Icon name={/youtu|vimeo|\.mp4/.test(l.url) ? "video" : "doc"} />
                  </span>
                  <span class="pt-file__info">
                    <strong>{l.title}</strong>
                  </span>
                  <Icon name="ext" size={16} />
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 class="pt-h2">{t("kit_access")}</h2>
        <VaultList projectId={projectId!} onlyAdmin />
      </section>

      <RequestForm projectId={projectId!} support />
      <RequestList projectId={projectId!} />
      <Review />
      {me.referralUrl && <Referral url={me.referralUrl} />}
    </div>
  );
}

export function Review() {
  const { dash, projectId, reloadDash } = usePortal();
  const [rating, setRating] = useState(dash.review?.rating || 0);
  const [text, setText] = useState(dash.review?.text || "");
  const [allow, setAllow] = useState(true);
  const [busy, setBusy] = useState(false);
  if (dash.review) {
    return (
      <Card tone="success">
        <p class="pt-strong">{t("review_thanks")}</p>
        <p aria-label={`${dash.review.rating}/5`}>{"★".repeat(dash.review.rating)}</p>
      </Card>
    );
  }
  async function send() {
    setBusy(true);
    try {
      await api(`/projects/${projectId}/review`, { body: { rating, text, allowPublish: allow } });
      toast(t("review_thanks"));
      reloadDash();
    } catch (e: any) {
      toast(e.message, "error");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Card>
      <h2 class="pt-h3">{t("review_title")}</h2>
      <p class="pt-muted pt-small">{t("review_sub")}</p>
      <div class="pt-stars" role="radiogroup" aria-label={t("review_title")}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n}/5`} class={n <= rating ? "is-on" : ""} onClick={() => setRating(n)}>
            ★
          </button>
        ))}
      </div>
      {rating > 0 && (
        <div class="pt-stack pt-mt">
          <textarea class="pt-input" rows={3} placeholder={t("review_ph")} aria-label={t("review_ph")} value={text} onInput={(e: any) => setText(e.currentTarget.value)} />
          <label class="pt-check">
            <input type="checkbox" checked={allow} onChange={(e: any) => setAllow(e.currentTarget.checked)} />
            <span>{t("review_publish")}</span>
          </label>
          <Button icon="star" loading={busy} onClick={send}>
            {t("review_send")}
          </Button>
        </div>
      )}
    </Card>
  );
}

function Referral({ url }: { url: string }) {
  const { settings } = usePortal();
  const [copied, setCopied] = useState(false);
  return (
    <Card>
      <h2 class="pt-h3">
        <Icon name="gift" size={18} /> {t("referral_title")}
      </h2>
      <p class="pt-muted pt-small">{settings.referralReward || t("referral_sub")}</p>
      <code class="pt-secret pt-block">{url}</code>
      <div class="pt-row pt-gap pt-wrap pt-mt">
        <Button
          variant="secondary"
          icon="clip"
          onClick={() => {
            navigator.clipboard?.writeText(url).then(() => setCopied(true));
          }}
        >
          {copied ? t("referral_copied") : t("referral_copy")}
        </Button>
        <Button icon="chat" href={whatsappLink("", `Je te recommande Impact Tech pour ton site internet 👉 ${url}`)} target="_blank">
          {t("referral_share")}
        </Button>
      </div>
    </Card>
  );
}
