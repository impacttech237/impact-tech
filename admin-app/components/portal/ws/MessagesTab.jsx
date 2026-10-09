/* Messagerie du projet (vue admin). */
import { useEffect, useRef, useState } from "react";
import { uploadFile } from "../../../../client/portal/upload";
import { Button, LoadingSpinner, Textarea } from "../../ui";
import { Paperclip, Send } from "../../../lib/icons";
import { ErrorText, fmtDateTime, fmtSize, papi } from "../shared";

export default function MessagesTab({ project, onRead }) {
  const [msgs, setMsgs] = useState(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const end = useRef(null);
  const input = useRef(null);

  const load = async () => {
    try {
      const r = await papi(`projects/${project.id}/messages`);
      setMsgs(r.messages);
    } catch (e) {
      setError(e.message);
    }
  };
  useEffect(() => {
    load().then(onRead);
    const id = setInterval(load, 20000);
    return () => clearInterval(id);
  }, [project.id]);
  useEffect(() => end.current?.scrollIntoView({ block: "end" }), [msgs?.length]);

  async function send(body) {
    setBusy(true);
    try {
      await papi(`projects/${project.id}/messages`, "POST", body);
      setText("");
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <ErrorText>{error}</ErrorText>
      {!msgs ? (
        <LoadingSpinner />
      ) : (
        <div className="mb-4 max-h-[60vh] space-y-3 overflow-y-auto rounded-xl border border-adm-border bg-adm-surface p-4">
          {!msgs.length && <p className="text-center text-sm text-adm-text-3">Aucun message. Écrivez au client pour démarrer.</p>}
          {msgs.map((m) => (
            <div key={m.id} className={`flex ${m.author === "admin" ? "justify-end" : m.author === "system" ? "justify-center" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                  m.author === "admin" ? "bg-adm-red text-white" : m.author === "system" ? "bg-emerald-500/10 text-emerald-300" : "bg-adm-surface-3 text-adm-text"
                } ${m.kind === "update" ? "border-l-4 border-white/50" : ""}`}
              >
                <p className="mb-0.5 text-[11px] opacity-70">
                  {m.kind === "update" ? "Point de la semaine" : m.author === "client" ? project.client_name : m.author === "system" ? "Automatique" : "Nous"} · {fmtDateTime(m.created_at)}
                  {m.author === "admin" && (m.read_by_client_at ? " · lu ✓" : " · non lu")}
                </p>
                {m.body && <p className="whitespace-pre-wrap">{m.body}</p>}
                {m.file_id &&
                  (m.kind === "voice" || m.file_mime?.startsWith("audio/") ? (
                    <audio className="mt-1 w-64 max-w-full" src={`/api/admin/portal/files/${m.file_id}`} controls preload="none" />
                  ) : m.file_mime?.startsWith("image/") ? (
                    <img className="mt-1 max-h-60 rounded-lg" src={`/api/admin/portal/files/${m.file_id}`} alt={m.file_name} />
                  ) : (
                    <a className="mt-1 block underline" href={`/api/admin/portal/files/${m.file_id}?download=1`}>
                      📎 {m.file_name} ({fmtSize(m.file_size)})
                    </a>
                  ))}
              </div>
            </div>
          ))}
          <div ref={end} />
        </div>
      )}
      <div className="flex items-end gap-2">
        <Button variant="ghost" icon={Paperclip} aria-label="Joindre un fichier" onClick={() => input.current?.click()} disabled={busy} />
        <input
          ref={input}
          type="file"
          hidden
          onChange={async (e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (!f) return;
            setBusy(true);
            try {
              const file = await uploadFile({ projectId: project.id, file: f, base: "/api/admin/portal" });
              await send({ fileId: file.id, body: text });
            } catch (err) {
              setError(err.message);
              setBusy(false);
            }
          }}
        />
        <div className="flex-1">
          <Textarea
            className="min-h-[60px]"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Votre message au client… (Ctrl+Entrée pour envoyer)"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && text.trim()) send({ body: text });
            }}
          />
        </div>
        <Button icon={Send} loading={busy} disabled={!text.trim()} onClick={() => send({ body: text })}>
          Envoyer
        </Button>
      </div>
      <p className="mt-1 text-xs text-adm-text-3">Le client est prévenu par email (au plus un email toutes les 10 minutes).</p>
    </div>
  );
}
