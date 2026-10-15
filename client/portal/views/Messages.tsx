/* Messagerie du projet : texte, notes vocales, pièces jointes. */
import { useEffect, useRef, useState } from "preact/hooks";
import { api, fileUrl } from "../api";
import { fmtRelative, fmtSize, t } from "../i18n";
import { isMine, usePortal } from "../state";
import { uploadFile } from "../upload";
import { Button, Empty, ErrorBox, Icon, Skeleton, fileIcon, toast } from "../ui";

export function Messages() {
  const { projectId, reloadDash, person, me } = usePortal();
  const [msgs, setMsgs] = useState<any[] | null>(null);
  const [error, setError] = useState("");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = () =>
    api(`/projects/${projectId}/messages`)
      .then((r) => {
        setMsgs(r.messages);
        setError("");
      })
      .catch((e) => setError(e.message));

  useEffect(() => {
    load().then(() => reloadDash());
    const id = setInterval(() => document.visibilityState === "visible" && load(), 20000);
    return () => clearInterval(id);
  }, [projectId]);
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [msgs?.length]);

  async function send(body: any) {
    setBusy(true);
    try {
      await api(`/projects/${projectId}/messages`, { body });
      setText("");
      await load();
    } catch (e: any) {
      toast(e.message, "error");
    } finally {
      setBusy(false);
    }
  }

  async function attach(file: File, kind: "file" | "voice" = "file") {
    setBusy(true);
    let uploaded: any = null;
    try {
      uploaded = await uploadFile({ projectId: projectId!, file, name: (file as any).name || `note-vocale-${Date.now()}.webm` });
      await api(`/projects/${projectId}/messages`, { body: { fileId: uploaded.id, kind, body: kind === "file" ? text : "" } });
      setText("");
      await load();
    } catch (e: any) {
      // message non créé : on ne laisse pas la pièce jointe orpheline dans « Fichiers »
      if (uploaded?.id) api(`/files/${uploaded.id}`, { method: "DELETE" }).catch(() => {});
      toast(e.message, "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div class="pt-page pt-chat">
      <header>
        <h1 class="pt-h1">{t("msg_title")}</h1>
        <p class="pt-muted">{t("msg_sub")}</p>
      </header>
      {error && <ErrorBox message={error} onRetry={load} />}
      {!msgs && !error && <Skeleton />}
      {msgs && !msgs.length && <Empty icon="chat" title={t("msg_empty")} />}
      <ol class="pt-msgs">
        {msgs?.map((m) => (
          <li key={m.id} class={`pt-msg pt-msg--${m.author} ${m.kind === "update" ? "pt-msg--update" : ""}`}>
            <div class="pt-msg__meta">
              {m.kind === "update" ? t("msg_update") : m.author === "client" ? (isMine(person, m.author_name) ? t("msg_you") : m.author_name || me.name) : t("msg_us")} · {fmtRelative(m.created_at)}
            </div>
            {m.body && <p class="pt-pre">{m.body}</p>}
            {m.file_id && <Attachment m={m} />}
          </li>
        ))}
      </ol>
      <div ref={endRef} />

      <form
        class="pt-composer"
        onSubmit={(e) => {
          e.preventDefault();
          if (text.trim()) send({ body: text });
        }}
      >
        <button type="button" class="pt-iconbtn" aria-label={t("msg_attach")} onClick={() => fileRef.current?.click()} disabled={busy}>
          <Icon name="clip" />
        </button>
        <input
          ref={fileRef}
          type="file"
          hidden
          onChange={(e: any) => {
            const f = e.currentTarget.files?.[0];
            if (f) attach(f);
            e.currentTarget.value = "";
          }}
        />
        <textarea
          class="pt-input pt-composer__input"
          rows={1}
          placeholder={t("msg_placeholder")}
          aria-label={t("msg_placeholder")}
          value={text}
          onInput={(e: any) => setText(e.currentTarget.value)}
          onKeyDown={(e: any) => {
            if (e.key === "Enter" && !e.shiftKey && !matchMedia("(pointer: coarse)").matches) {
              e.preventDefault();
              if (text.trim()) send({ body: text });
            }
          }}
        />
        {text.trim() ? (
          <Button type="submit" icon="send" loading={busy} aria-label={t("send")} />
        ) : (
          <VoiceRecorder disabled={busy} onRecorded={(blob) => attach(new File([blob], `note-vocale-${Date.now()}.${blob.type.includes("mp4") ? "m4a" : "webm"}`, { type: blob.type }), "voice")} />
        )}
      </form>
    </div>
  );
}

function Attachment({ m }: { m: any }) {
  const src = fileUrl(m.file_id);
  if (m.kind === "voice" || m.file_mime?.startsWith("audio/")) return <audio class="pt-audio" src={src} controls preload="none" />;
  if (m.file_mime?.startsWith("image/")) return <img class="pt-msg__img" src={src} alt={m.file_name} loading="lazy" />;
  return (
    <a class="pt-attach" href={fileUrl(m.file_id, true)}>
      <Icon name={fileIcon(m.file_mime)} size={18} />
      <span class="pt-ellipsis">{m.file_name}</span>
      <small>{fmtSize(m.file_size)}</small>
    </a>
  );
}

/* Note vocale : un appui pour démarrer, un appui pour envoyer. */
function VoiceRecorder({ onRecorded, disabled }: { onRecorded: (b: Blob) => void; disabled?: boolean }) {
  const [rec, setRec] = useState<MediaRecorder | null>(null);
  const [secs, setSecs] = useState(0);
  const chunks = useRef<Blob[]>([]);

  useEffect(() => {
    if (!rec) return;
    const id = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [rec]);

  if (typeof MediaRecorder === "undefined") return null;

  async function start() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const type = ["audio/webm;codecs=opus", "audio/mp4", "audio/webm"].find((x) => MediaRecorder.isTypeSupported?.(x)) || "";
      const r = new MediaRecorder(stream, type ? { mimeType: type } : undefined);
      chunks.current = [];
      r.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
      r.onstop = () => {
        stream.getTracks().forEach((tr) => tr.stop());
        const blob = new Blob(chunks.current, { type: r.mimeType || "audio/webm" });
        if (blob.size > 1000) onRecorded(blob);
      };
      r.start(1000);
      setSecs(0);
      setRec(r);
    } catch {
      toast(t("msg_mic_denied"), "error");
    }
  }

  function stop() {
    rec?.stop();
    setRec(null);
  }

  return rec ? (
    <Button variant="danger" icon="send" onClick={stop} aria-label={t("msg_stop_send")}>
      {t("msg_recording", { s: secs })}
    </Button>
  ) : (
    <button type="button" class="pt-iconbtn pt-iconbtn--accent" aria-label={t("msg_voice")} onClick={start} disabled={disabled}>
      <Icon name="mic" />
    </button>
  );
}
