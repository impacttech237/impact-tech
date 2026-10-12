/* ------------------------------------------------------------------
   Questionnaire client (/q/<token>) — Preact.
   Une étape par section (moins décourageant qu'une longue page), accueil
   avec le sommaire, sauvegarde automatique (serveur + copie locale de
   secours) à chaque saisie et à chaque changement d'étape, envoi final.
   Le client peut revenir plus tard : il reprend à l'étape où il était.
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
    start: "Commencer",
    resume: (n: number) => `Reprendre à l'étape ${n}`,
    review: "Revoir mes réponses",
    steps: (n: number) => `${n} étapes courtes · rien n'est obligatoire`,
    stepOf: (i: number, n: number) => `Étape ${i} sur ${n}`,
    next: "Suivant",
    nextTo: (title: string) => `Suivant : ${title}`,
    prev: "Précédent",
    home: "Sommaire",
    left: (n: number) => (n === 1 ? "Plus qu'une étape, vous y êtes presque !" : `Bravo, plus que ${n} étapes.`),
    last: "Dernière étape : relisez si vous voulez, puis envoyez.",
    stepCount: (f: number, t: number) => `${f}/${t}`,
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
    start: "Start",
    resume: (n: number) => `Resume at step ${n}`,
    review: "Review my answers",
    steps: (n: number) => `${n} short steps · nothing is mandatory`,
    stepOf: (i: number, n: number) => `Step ${i} of ${n}`,
    next: "Next",
    nextTo: (title: string) => `Next: ${title}`,
    prev: "Back",
    home: "Overview",
    left: (n: number) => (n === 1 ? "Just one step left, you're almost there!" : `Well done, ${n} steps to go.`),
    last: "Last step: review if you like, then send.",
    stepCount: (f: number, t: number) => `${f}/${t}`,
  },
};

type Answers = Record<string, string | string[]>;

function sectionKeys(section: any): string[] {
  const keys: string[] = [];
  for (const f of section.fields) {
    if (f.type === "info") continue;
    if (f.type === "repeat") for (let n = 1; n <= f.count; n++) for (const sub of f.fields) keys.push(`${f.id}.${n}.${sub.id}`);
    else keys.push(f.id);
  }
  return keys;
}
const flatKeys = (def: any): string[] => def.sections.flatMap(sectionKeys);

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
const STEP_KEY = `${LOCAL_KEY}-step`;
function readStep(): number {
  try {
    return parseInt(localStorage.getItem(STEP_KEY) || "", 10);
  } catch {
    return NaN;
  }
}
function writeStep(n: number) {
  try {
    localStorage.setItem(STEP_KEY, String(n));
  } catch {}
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
  const [step, setStep] = useState(-1); // -1 = accueil / sommaire
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
  const perSection = useMemo(() => (data ? data.definition.sections.map(sectionKeys) : []), [data]);
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
      goTo(-1);
    }
  }

  function goTo(n: number) {
    if (state === "dirty") persist();
    setStep(n);
    if (n >= 0) writeStep(n);
    window.scrollTo({ top: 0 });
    // Le focus suit le changement d'étape (lecteurs d'écran, clavier).
    requestAnimationFrame(() => document.getElementById("q-step-title")?.focus());
  }

  if (error) return <main class="q-wrap q-center"><p class="q-muted">{error === "network" ? "Connexion impossible. Réessayez dans un instant." : TXT.fr.invalid}</p></main>;
  if (!data) return <main class="q-wrap q-center"><div class="q-boot">impact<span>.</span>Tech</div></main>;

  const def = data.definition;
  const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString(data.locale === "en" ? "en-GB" : "fr-FR", { hour: "2-digit", minute: "2-digit" });

  const sections = def.sections;
  const total = sections.length;
  const sectionDone = (i: number) => perSection[i].filter((k: string) => filled(answers[k])).length;

  const status = (
    <div class="q-progress" aria-live="polite">
      <div class="q-progress__track">
        <div class="q-progress__fill" style={{ width: `${keys.length ? Math.round((done / keys.length) * 100) : 0}%` }} />
      </div>
      <div class="q-progress__label">
        <span>{step >= 0 ? t.stepOf(step + 1, total) : t.progress(done, keys.length)}</span>
        <span class={state === "offline" ? "q-warn" : ""}>
          {state === "saving" ? t.saving : state === "offline" ? t.offline : savedAt ? t.saved(fmtTime(savedAt)) : t.autosave}
        </span>
      </div>
    </div>
  );

  const banners = (
    <>
      {submitted && step < 0 && (
        <div class="q-banner q-banner--ok" role="status">
          <strong>{t.doneTitle}</strong>
          <span>{t.doneText}</span>
        </div>
      )}
      {readOnly && <div class="q-banner" role="status">{t.closed}</div>}
      {notice && <div class="q-banner" role="status">{notice}</div>}
    </>
  );

  /* Accueil : la promesse, le sommaire des étapes, commencer ou reprendre. */
  if (step < 0) {
    const saved = readStep();
    const firstOpen = sections.findIndex((_: any, i: number) => sectionDone(i) < perSection[i].length);
    const startAt = done === 0 ? 0 : Number.isFinite(saved) && saved >= 0 && saved < total ? saved : Math.max(0, firstOpen);
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
        {banners}
        {status}
        <p class="q-steps__count">{t.steps(total)}</p>
        <ol class="q-steps">
          {sections.map((s: any, i: number) => {
            const d = sectionDone(i);
            const n = perSection[i].length;
            const complete = n > 0 && d === n;
            return (
              <li key={i}>
                <button type="button" class={`q-steps__item ${complete ? "is-done" : d ? "is-started" : ""}`} onClick={() => goTo(i)}>
                  <span class="q-steps__num" aria-hidden="true">
                    {complete ? "✓" : String(i + 1).padStart(2, "0")}
                  </span>
                  <span class="q-steps__title">{s.title}</span>
                  {n > 0 && <span class="q-steps__meta">{t.stepCount(d, n)}</span>}
                </button>
              </li>
            );
          })}
        </ol>
        <div class="q-cta">
          <button type="button" class="q-btn" onClick={() => goTo(startAt)}>
            {submitted ? t.review : done > 0 ? t.resume(startAt + 1) : t.start} →
          </button>
        </div>
      </main>
    );
  }

  /* Une étape = une section : quelques questions, puis on avance. */
  const s = sections[step];
  const isLast = step === total - 1;
  return (
    <main class="q-wrap">
      <header class="q-stepbar">
        <button type="button" class="q-link" onClick={() => goTo(-1)}>
          ← {t.home}
        </button>
        <div class="q-logo q-logo--small">impact<span>.</span>Tech</div>
      </header>
      <nav class="q-dots" aria-label={t.home}>
        {sections.map((s2: any, i: number) => {
          const n = perSection[i].length;
          const complete = n > 0 && sectionDone(i) === n;
          return (
            <button
              key={i}
              type="button"
              class={`q-dot ${i === step ? "is-current" : ""} ${complete ? "is-done" : ""}`}
              aria-label={`${i + 1}. ${s2.title}`}
              aria-current={i === step ? "step" : undefined}
              title={s2.title}
              onClick={() => goTo(i)}
            />
          );
        })}
      </nav>
      {banners}
      {status}

      <form onSubmit={(e) => e.preventDefault()}>
        <fieldset disabled={readOnly}>
          <section class="q-block q-block--step" key={step}>
            <div class="q-block__head">
              <span class="q-block__index">{String(step + 1).padStart(2, "0")}</span>
              <h2 id="q-step-title" tabIndex={-1}>
                {s.title}
              </h2>
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
        </fieldset>
      </form>

      {step > 0 && <p class="q-cheer">{isLast ? t.last : t.left(total - step - 1)}</p>}
      <div class="q-footer q-footer--nav">
        <button key="prev" type="button" class="q-btn q-btn--ghost" onClick={() => goTo(step - 1)}>
          ← {step === 0 ? t.home : t.prev}
        </button>
        {isLast ? (
          !readOnly && (
            <button type="button" class="q-btn" disabled={sending} onClick={submit}>
              {sending ? t.sending : submitted ? t.update : t.submit}
            </button>
          )
        ) : (
          <button key="next" type="button" class="q-btn" onClick={() => goTo(step + 1)}>
            <span class="q-btn__long">{t.nextTo(sections[step + 1].title)}</span>
            <span class="q-btn__short">{t.next}</span> →
          </button>
        )}
      </div>
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
