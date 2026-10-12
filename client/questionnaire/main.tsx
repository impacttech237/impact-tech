/* ------------------------------------------------------------------
   Questionnaire client (/q/<token>) — Preact.
   Sauvegarde automatique (serveur + copie locale de secours), barre de
   progression, envoi final. Le client peut revenir et compléter plus tard.
------------------------------------------------------------------- */
import { render } from "preact";
import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import "./q.css";

const root = document.getElementById("q-root")!;
const token = root.dataset.token || "";
const LOCAL_KEY = `it-q-${token}`;

const TXT = {
  fr: {
    loading: "Chargement…",
    invalid: "Ce lien n'est pas valide. Vérifiez le lien reçu ou contactez Impact Tech.",
    hello: (n: string) => `Bonjour ${n},`,
    progress: (f: number, t: number) => `${f} / ${t} réponses`,
    autosave: "Vos réponses s'enregistrent automatiquement : vous pouvez revenir plus tard.",
    saving: "Enregistrement…",
    saved: (t: string) => `Enregistré à ${t}`,
    offline: "Hors connexion : vos réponses sont gardées sur cet appareil et seront envoyées dès le retour du réseau.",
    submit: "Envoyer mes réponses",
    update: "Mettre à jour mes réponses",
    sending: "Envoi…",
    doneTitle: "Merci, c'est bien reçu ! 🙏",
    doneText: "Impact Tech a reçu vos réponses. Vous pouvez encore les modifier : vos changements seront enregistrés automatiquement.",
    edit: "Modifier mes réponses",
    closed: "Ce questionnaire est clôturé : il n'est plus modifiable. Merci !",
    yes: "Oui",
    no: "Non",
    choose: "Choisir…",
    empty: "Vous n'avez encore rien rempli. Rien n'est obligatoire : laissez vide ce qui n'est pas prêt.",
    restored: "Des réponses non envoyées ont été retrouvées sur cet appareil et rechargées.",
  },
  en: {
    loading: "Loading…",
    invalid: "This link is not valid. Check the link you received or contact Impact Tech.",
    hello: (n: string) => `Hello ${n},`,
    progress: (f: number, t: number) => `${f} / ${t} answers`,
    autosave: "Your answers are saved automatically: you can come back later.",
    saving: "Saving…",
    saved: (t: string) => `Saved at ${t}`,
    offline: "Offline: your answers are kept on this device and will be sent as soon as you're back online.",
    submit: "Send my answers",
    update: "Update my answers",
    sending: "Sending…",
    doneTitle: "Thank you, we've got it! 🙏",
    doneText: "Impact Tech has received your answers. You can still edit them: changes are saved automatically.",
    edit: "Edit my answers",
    closed: "This questionnaire is closed and can no longer be edited. Thank you!",
    yes: "Yes",
    no: "No",
    choose: "Choose…",
    empty: "Nothing filled in yet. Nothing is mandatory: leave blank whatever isn't ready.",
    restored: "Unsent answers were found on this device and restored.",
  },
};

type Answers = Record<string, string | string[]>;

function flatKeys(def: any): string[] {
  const keys: string[] = [];
  for (const s of def.sections)
    for (const f of s.fields) {
      if (f.type === "info") continue;
      if (f.type === "repeat") for (let n = 1; n <= f.count; n++) for (const sub of f.fields) keys.push(`${f.id}.${n}.${sub.id}`);
      else keys.push(f.id);
    }
  return keys;
}

const filled = (v: any) => (Array.isArray(v) ? v.length > 0 : v != null && String(v).trim() !== "");

/* « Ce qu'on va *écrire* » -> mot en italique rouge (signature de la marque) */
function Accent({ text }: { text: string }) {
  const parts = text.split(/\*([^*]+)\*/);
  return <>{parts.map((p, i) => (i % 2 ? <em key={i}>{p}</em> : p))}</>;
}

function readLocal(): { answers: Answers; at: string } | null {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) || "null");
  } catch {
    return null;
  }
}
function writeLocal(answers: Answers) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify({ answers, at: new Date().toISOString() }));
  } catch {}
}

function App() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");
  const [answers, setAnswers] = useState<Answers>({});
  const [state, setState] = useState<"idle" | "dirty" | "saving" | "saved" | "offline">("idle");
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState("");
  const timer = useRef<any>(null);
  const latest = useRef<Answers>({});

  const t = TXT[data?.locale === "en" ? "en" : "fr"];

  useEffect(() => {
    fetch(`/api/q/${token}`)
      .then((r) => r.json())
      .then((r) => {
        if (!r.ok) return setError(r.error || "invalid");
        const q = r.questionnaire;
        document.documentElement.lang = q.locale === "en" ? "en" : "fr";
        document.title = `${q.title} — Impact Tech`;
        let a: Answers = q.answers || {};
        // Copie locale plus récente que le serveur (coupure réseau) -> on la reprend.
        const local = readLocal();
        if (local && (!q.savedAt || local.at > q.savedAt) && JSON.stringify(local.answers) !== JSON.stringify(a)) {
          a = { ...a, ...local.answers };
          setNotice(TXT[q.locale === "en" ? "en" : "fr"].restored);
          setState("dirty");
        }
        latest.current = a;
        setAnswers(a);
        setSavedAt(q.savedAt);
        setSubmitted(q.status === "submitted");
        setData(q);
      })
      .catch(() => setError("network"));
  }, []);

  const keys = useMemo(() => (data ? flatKeys(data.definition) : []), [data]);
  const done = keys.filter((k) => filled(answers[k])).length;
  const readOnly = data?.status === "closed";

  async function persist(submit = false) {
    clearTimeout(timer.current);
    setState("saving");
    try {
      const res = await fetch(`/api/q/${token}${submit ? "/submit" : ""}`, {
        method: submit ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: latest.current }),
      });
      const r = await res.json();
      if (!r.ok) throw new Error(r.error);
      setSavedAt(r.savedAt);
      setState("saved");
      try {
        localStorage.removeItem(LOCAL_KEY);
      } catch {}
      return true;
    } catch {
      setState("offline");
      timer.current = setTimeout(() => persist(), 15000);
      return false;
    }
  }

  // Envoi des modifications en attente au retour du réseau / à la fermeture.
  useEffect(() => {
    const online = () => state === "offline" && persist();
    const beforeUnload = (e: BeforeUnloadEvent) => {
      if (state === "dirty" || state === "saving" || state === "offline") {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("online", online);
    window.addEventListener("beforeunload", beforeUnload);
    return () => {
      window.removeEventListener("online", online);
      window.removeEventListener("beforeunload", beforeUnload);
    };
  }, [state]);

  function set(key: string, value: string | string[]) {
    const next = { ...latest.current, [key]: value };
    latest.current = next;
    setAnswers(next);
    writeLocal(next);
    setState("dirty");
    clearTimeout(timer.current);
    timer.current = setTimeout(() => persist(), 1500);
  }

  async function submit() {
    setSending(true);
    const ok = await persist(true);
    setSending(false);
    if (ok) {
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  if (error) return <main class="q-wrap q-center"><p class="q-muted">{error === "network" ? "Connexion impossible. Réessayez dans un instant." : TXT.fr.invalid}</p></main>;
  if (!data) return <main class="q-wrap q-center"><div class="q-boot">impact<span>.</span>Tech</div></main>;

  const def = data.definition;
  const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString(data.locale === "en" ? "en-GB" : "fr-FR", { hour: "2-digit", minute: "2-digit" });

  return (
    <main class="q-wrap">
      <header class="q-top">
        <div class="q-logo">impact<span>.</span>Tech</div>
        {def.eyebrow && <span class="q-eyebrow">{def.eyebrow}</span>}
        <h1>
          <Accent text={def.heading || def.title} />
        </h1>
        {data.clientFirstName && <p class="q-hello">{t.hello(data.clientFirstName)}</p>}
        {def.intro && <p class="q-lede">{def.intro}</p>}
      </header>

      {submitted && (
        <div class="q-banner q-banner--ok" role="status">
          <strong>{t.doneTitle}</strong>
          <span>{t.doneText}</span>
        </div>
      )}
      {readOnly && <div class="q-banner" role="status">{t.closed}</div>}
      {notice && <div class="q-banner" role="status">{notice}</div>}

      <div class="q-progress" aria-live="polite">
        <div class="q-progress__track">
          <div class="q-progress__fill" style={{ width: `${keys.length ? Math.round((done / keys.length) * 100) : 0}%` }} />
        </div>
        <div class="q-progress__label">
          <span>{t.progress(done, keys.length)}</span>
          <span class={state === "offline" ? "q-warn" : ""}>
            {state === "saving" ? t.saving : state === "offline" ? t.offline : savedAt ? t.saved(fmtTime(savedAt)) : t.autosave}
          </span>
        </div>
      </div>

      <form onSubmit={(e) => e.preventDefault()}>
        <fieldset disabled={readOnly}>
          {def.sections.map((s: any, i: number) => (
            <section class="q-block" key={i}>
              <div class="q-block__head">
                <span class="q-block__index">{String(i + 1).padStart(2, "0")}</span>
                <h2>{s.title}</h2>
              </div>
              {s.context && <p class="q-block__context">{s.context}</p>}
              <div class="q-fields">
                {s.fields.map((f: any) =>
                  f.type === "repeat" ? (
                    Array.from({ length: f.count }).map((_, n) => (
                      <div class="q-repeat" key={`${f.id}-${n}`}>
                        <span class="q-repeat__label">
                          {f.label || f.id} {n + 1}
                        </span>
                        {f.fields.map((sub: any) => (
                          <Field key={sub.id} f={sub} k={`${f.id}.${n + 1}.${sub.id}`} value={answers[`${f.id}.${n + 1}.${sub.id}`]} set={set} t={t} />
                        ))}
                      </div>
                    ))
                  ) : (
                    <Field key={f.id} f={f} k={f.id} value={answers[f.id]} set={set} t={t} />
                  )
                )}
              </div>
            </section>
          ))}
        </fieldset>
      </form>

      {!readOnly && (
        <div class="q-footer">
          <span class="q-footer__status">{done === 0 ? t.empty : t.progress(done, keys.length)}</span>
          <button type="button" class="q-btn" disabled={sending} onClick={submit}>
            {sending ? t.sending : submitted ? t.update : t.submit}
          </button>
        </div>
      )}
    </main>
  );
}

function Field({ f, k, value, set, t }: { f: any; k: string; value: any; set: (k: string, v: any) => void; t: any }) {
  const id = `f-${k.replace(/\./g, "-")}`;
  if (f.type === "info") return <p class="q-info">{f.text || f.label}</p>;
  const v = value ?? (f.type === "checkbox" ? [] : "");
  const common = { id, placeholder: f.placeholder || "", "aria-describedby": f.hint ? `${id}-hint` : undefined };
  let input;
  switch (f.type) {
    case "textarea":
      input = <textarea {...common} rows={f.rows || 3} value={v} onInput={(e: any) => set(k, e.currentTarget.value)} />;
      break;
    case "select":
      input = (
        <select {...common} value={v} onChange={(e: any) => set(k, e.currentTarget.value)}>
          <option value="">{t.choose}</option>
          {f.options.map((o: string) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      );
      break;
    case "radio":
    case "yesno": {
      const opts = f.type === "yesno" ? [t.yes, t.no] : f.options;
      input = (
        <div class="q-choices" role="radiogroup" aria-labelledby={`${id}-label`}>
          {opts.map((o: string) => (
            <label key={o} class={`q-choice ${v === o ? "is-on" : ""}`}>
              <input type="radio" name={id} checked={v === o} onChange={() => set(k, o)} />
              <span>{o}</span>
            </label>
          ))}
        </div>
      );
      break;
    }
    case "checkbox":
      input = (
        <div class="q-choices" role="group" aria-labelledby={`${id}-label`}>
          {f.options.map((o: string) => {
            const on = Array.isArray(v) && v.includes(o);
            return (
              <label key={o} class={`q-choice ${on ? "is-on" : ""}`}>
                <input type="checkbox" checked={on} onChange={() => set(k, on ? v.filter((x: string) => x !== o) : [...(Array.isArray(v) ? v : []), o])} />
                <span>{o}</span>
              </label>
            );
          })}
        </div>
      );
      break;
    case "scale": {
      const nums = [];
      for (let n = f.min; n <= f.max; n++) nums.push(String(n));
      input = (
        <div>
          <div class="q-scale" role="radiogroup" aria-labelledby={`${id}-label`}>
            {nums.map((n) => (
              <label key={n} class={`q-scale__item ${v === n ? "is-on" : ""}`}>
                <input type="radio" name={id} checked={v === n} onChange={() => set(k, n)} />
                <span>{n}</span>
              </label>
            ))}
          </div>
          {(f.minLabel || f.maxLabel) && (
            <div class="q-scale__legend">
              <span>{f.minLabel}</span>
              <span>{f.maxLabel}</span>
            </div>
          )}
        </div>
      );
      break;
    }
    default: {
      const type = ["url", "email", "tel", "number", "date"].includes(f.type) ? f.type : "text";
      input = <input {...common} type={type} inputMode={type === "tel" ? "tel" : type === "url" ? "url" : undefined} value={v} onInput={(e: any) => set(k, e.currentTarget.value)} />;
    }
  }
  return (
    <div class={`q-field ${f.half ? "q-field--half" : ""}`}>
      {f.label && (
        <label for={id} id={`${id}-label`}>
          {f.label}
          {f.required && <span class="q-req"> *</span>}
        </label>
      )}
      {input}
      {f.hint && (
        <span class="q-hint" id={`${id}-hint`}>
          {f.hint}
        </span>
      )}
    </div>
  );
}

render(<App />, root);
