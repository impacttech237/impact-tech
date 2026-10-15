/* Documents & contrats : lecture dans le portail + signature au doigt. */
import { useEffect, useRef, useState } from "preact/hooks";
import { api } from "../api";
import { fmtDate, getLocale, t } from "../i18n";
import { usePortal } from "../state";
import { Badge, Button, Card, Empty, ErrorBox, Icon, Skeleton, toast } from "../ui";

export function Documents() {
  const { projectId, route, go } = usePortal();
  const [docs, setDocs] = useState<any[] | null>(null);
  const [error, setError] = useState("");
  const load = () =>
    api(`/projects/${projectId}/documents`)
      .then((r) => setDocs(r.documents))
      .catch((e) => setError(e.message));
  useEffect(() => {
    load();
  }, [projectId]);

  if (route.id) return <DocumentView id={route.id} onBack={() => go("documents")} onSigned={load} />;

  return (
    <div class="pt-page">
      <h1 class="pt-h1">{t("docs_title")}</h1>
      {error && <ErrorBox message={error} onRetry={load} />}
      {!docs && !error && <Skeleton />}
      {docs && !docs.length && <Empty icon="doc" title={t("docs_empty")} />}
      <ul class="pt-list">
        {docs?.map((d) => (
          <li key={d.id}>
            <button type="button" class="pt-listitem" onClick={() => go("documents", d.id)}>
              <span class="pt-file__icon">
                <Icon name={d.needs_signature ? "pen" : "doc"} />
              </span>
              <span class="pt-file__info">
                <strong>{d.title}</strong>
                <small class="pt-muted">{fmtDate(d.sent_at || d.created_at)}</small>
              </span>
              {docBadge(d)}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function docBadge(d: any) {
  if (d.needs_signature && d.status === "sent") return <Badge tone="red">{t("doc_to_sign")}</Badge>;
  if (d.status === "signed" && d.admin_signed_at) return <Badge tone="green">{t("doc_countersigned")}</Badge>;
  if (d.status === "signed") return <Badge tone="green">{t("doc_signed")}</Badge>;
  return <Badge>{t("doc_available")}</Badge>;
}

function DocumentView({ id, onBack, onSigned }: { id: number; onBack: () => void; onSigned: () => void }) {
  const { reloadDash } = usePortal();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");
  const load = () =>
    api(`/documents/${id}`)
      .then(setData)
      .catch((e) => setError(e.message));
  useEffect(() => {
    load();
  }, [id]);

  if (error) return <ErrorBox message={error} onRetry={load} />;
  if (!data) return <Skeleton lines={6} />;
  const d = data.document;
  const toSign = !!d.needs_signature && d.status === "sent";
  const fileSrc = `/api/portal/documents/${d.id}/file`;
  const isPdf = d.file_mime === "application/pdf";
  const isImg = /^image\//.test(d.file_mime || "");

  return (
    <div class="pt-page">
      <button type="button" class="pt-back" onClick={onBack}>
        <Icon name="back" size={16} /> {t("back")}
      </button>
      <div class="pt-row pt-row--between pt-gap pt-wrap">
        <h1 class="pt-h1">{d.title}</h1>
        {docBadge(d)}
      </div>
      {toSign && <p class="pt-note">{t("doc_read_then_sign")}</p>}

      {d.has_file ? (
        <div class="pt-docview">
          {isPdf && <iframe src={`${fileSrc}#view=FitH`} title={d.title} />}
          {isImg && <img src={fileSrc} alt={d.title} />}
          {!isPdf && !isImg && <p class="pt-muted">{t("doc_cannot_preview")}</p>}
          <div class="pt-row pt-gap pt-wrap">
            {isPdf && (
              <Button variant="ghost" size="sm" icon="ext" href={fileSrc} target="_blank">
                {t("doc_open_fullscreen")}
              </Button>
            )}
            <Button variant="ghost" size="sm" icon="download" href={`${fileSrc}?download=1`}>
              {t("doc_download_original")}
            </Button>
          </div>
        </div>
      ) : (
        <article class="pt-doctext">{d.content}</article>
      )}

      {d.has_signed_pdf && (
        <Card tone="success">
          <p>{data.signature ? t("doc_signed_ok") : ""}</p>
          <Button icon="download" href={`/api/portal/documents/${d.id}/signed?download=1`}>
            {t("doc_download_signed")}
          </Button>
        </Card>
      )}

      {toSign && (
        <SignBox
          docId={d.id}
          onDone={async () => {
            await load();
            onSigned();
            reloadDash();
          }}
        />
      )}
    </div>
  );
}

function SignBox({ docId, onDone }: { docId: number; onDone: () => void }) {
  const { person } = usePortal();
  if (!person.rights.decide)
    return (
      <Card tone="accent">
        <h2 class="pt-h3">{t("doc_sign_title")}</h2>
        <p class="pt-muted">{t("right_decide")}</p>
      </Card>
    );
  return <SignForm docId={docId} onDone={onDone} />;
}

function SignForm({ docId, onDone }: { docId: number; onDone: () => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [approval, setApproval] = useState("");
  const [hasInk, setHasInk] = useState(false);
  const [busy, setBusy] = useState(false);
  const expected = getLocale() === "en" ? ["read and approved", "lu et approuvé"] : ["lu et approuvé", "lu et approuve"];
  const approvalOk = expected.includes(approval.trim().toLowerCase().replace(/\s+/g, " "));

  useEffect(() => {
    const c = canvas.current!;
    const ratio = window.devicePixelRatio || 1;
    const resize = () => {
      const w = c.parentElement!.clientWidth;
      c.width = w * ratio;
      c.height = 180 * ratio;
      c.style.width = `${w}px`;
      c.style.height = "180px";
      const ctx = c.getContext("2d")!;
      ctx.scale(ratio, ratio);
      ctx.lineWidth = 2.4;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#111";
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, w, 180);
      setHasInk(false);
    };
    resize();
    let drawing = false;
    let last: { x: number; y: number } | null = null;
    const pos = (e: PointerEvent) => {
      const r = c.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const down = (e: PointerEvent) => {
      drawing = true;
      last = pos(e);
      c.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (!drawing || !last) return;
      const p = pos(e);
      const ctx = c.getContext("2d")!;
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      last = p;
      setHasInk(true);
    };
    const up = () => {
      drawing = false;
      last = null;
    };
    c.addEventListener("pointerdown", down);
    c.addEventListener("pointermove", move);
    c.addEventListener("pointerup", up);
    c.addEventListener("pointercancel", up);
    window.addEventListener("resize", resize);
    return () => {
      c.removeEventListener("pointerdown", down);
      c.removeEventListener("pointermove", move);
      c.removeEventListener("pointerup", up);
      c.removeEventListener("pointercancel", up);
      window.removeEventListener("resize", resize);
    };
  }, []);

  function clear() {
    const c = canvas.current!;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, c.width, c.height);
    setHasInk(false);
  }

  async function sign() {
    setBusy(true);
    try {
      // Réduit la signature (PNG léger) avant l'envoi.
      const src = canvas.current!;
      const out = document.createElement("canvas");
      out.width = Math.min(600, src.width);
      out.height = Math.round((out.width / src.width) * src.height);
      out.getContext("2d")!.drawImage(src, 0, 0, out.width, out.height);
      await api(`/documents/${docId}/sign`, { body: { approvalText: approval.trim(), signature: out.toDataURL("image/png") } });
      toast(t("doc_signed"));
      onDone();
    } catch (e: any) {
      toast(e.message, "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card tone="accent">
      <h2 class="pt-h3">{t("doc_sign_title")}</h2>
      <div class="pt-field">
        <label for="pt-approval">{t("doc_sign_approval")}</label>
        <input id="pt-approval" class={`pt-input ${approval && !approvalOk ? "is-bad" : ""}`} placeholder={t("doc_sign_approval_ph")} value={approval} onInput={(e: any) => setApproval(e.currentTarget.value)} autoComplete="off" />
      </div>
      <div class="pt-field">
        <span class="pt-label">{t("doc_sign_draw")}</span>
        <div class="pt-sigpad">
          <canvas ref={canvas} aria-label={t("doc_sign_draw")} role="img" />
        </div>
        <button type="button" class="pt-link pt-small" onClick={clear}>
          {t("doc_sign_clear")}
        </button>
      </div>
      <Button size="lg" block icon="pen" loading={busy} disabled={!approvalOk || !hasInk} onClick={sign}>
        {t("doc_sign_btn")}
      </Button>
    </Card>
  );
}
