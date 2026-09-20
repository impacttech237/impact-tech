/* ------------------------------------------------------------------
   Client‑side survey renderer (vanilla JS, no React).
   Reads the form JSON embedded by enquete.tsx and drives the multi‑
   section flow: progress bar, conditional nav, validation, submission.
------------------------------------------------------------------- */

interface Question {
  id: number;
  type: string;
  label: string;
  description: string | null;
  required: number;
  config: any;
}

interface Section {
  id: number;
  title: string;
  description: string | null;
  condition: { question_id: number; value: string } | null;
  questions: Question[];
}

interface Form {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  redirect_url: string | null;
  sections: Section[];
}

const root = document.getElementById("survey-root")!;
const dataEl = document.getElementById("survey-data")!;
const form: Form = JSON.parse(dataEl.textContent || "{}");

let responseId: number | null = null;
let currentIndex = 0;
const answers: Map<number, string> = new Map();

function getVisibleSections(): Section[] {
  return form.sections.filter((s) => {
    if (!s.condition) return true;
    const stored = answers.get(s.condition.question_id);
    return stored === s.condition.value;
  });
}

function h(tag: string, attrs: Record<string, any> = {}, ...children: (string | Node)[]): HTMLElement {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "className") el.className = v;
    else if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2).toLowerCase(), v);
    else el.setAttribute(k, v);
  }
  for (const child of children) {
    if (typeof child === "string") el.appendChild(document.createTextNode(child));
    else if (child) el.appendChild(child);
  }
  return el;
}

function renderIntro() {
  root.innerHTML = "";
  root.appendChild(
    h("div", { className: "survey-container" },
      h("div", { className: "survey-card" },
        h("img", { src: "/icon-square.png", alt: "Impact Tech", className: "survey-logo" }),
        h("h1", { className: "survey-title" }, form.title),
        form.description ? h("p", { className: "survey-desc" }, form.description) : document.createTextNode(""),
        h("p", { className: "survey-meta" },
          `${form.sections.length} sections · ${form.sections.reduce((n, s) => n + s.questions.length, 0)} questions`
        ),
        h("button", { className: "survey-btn", onClick: startSurvey }, "Commencer")
      )
    )
  );
}

async function startSurvey() {
  try {
    const res = await fetch(`/api/surveys/${form.slug}/start`, { method: "POST" });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error);
    responseId = data.responseId;
    currentIndex = 0;
    renderSection();
  } catch (e: any) {
    alert(e.message || "Erreur lors du démarrage.");
  }
}

function renderProgressBar(visible: Section[]) {
  const total = visible.length;
  const pct = Math.round(((currentIndex + 1) / total) * 100);
  return h("div", { className: "survey-progress" },
    h("div", { className: "survey-progress-bar" },
      h("div", { className: "survey-progress-fill", style: `width:${pct}%` })
    ),
    h("span", { className: "survey-progress-text" }, `Section ${currentIndex + 1} sur ${total}`)
  );
}

function renderQuestion(q: Question): HTMLElement {
  const wrap = h("div", { className: `survey-question${q.required ? " required" : ""}` },
    h("label", { className: "survey-label" }, q.label),
    q.description ? h("p", { className: "survey-help" }, q.description) : document.createTextNode("")
  );

  const stored = answers.get(q.id) || "";

  switch (q.type) {
    case "short_text": {
      const input = h("input", {
        type: "text", className: "survey-input", value: stored,
        placeholder: "Votre réponse...",
      }) as HTMLInputElement;
      input.addEventListener("input", () => answers.set(q.id, input.value));
      wrap.appendChild(input);
      break;
    }
    case "long_text": {
      const ta = h("textarea", {
        className: "survey-textarea", rows: "4",
        placeholder: "Votre réponse...",
      }) as HTMLTextAreaElement;
      ta.value = stored;
      ta.addEventListener("input", () => answers.set(q.id, ta.value));
      wrap.appendChild(ta);
      break;
    }
    case "single_choice":
    case "yes_no": {
      const options = q.type === "yes_no" ? ["Oui", "Non"] : (q.config?.options || []);
      const group = h("div", { className: "survey-options" });
      for (const opt of options) {
        const id = `q${q.id}-${opt}`;
        const radio = h("input", {
          type: "radio", name: `q${q.id}`, id, value: opt,
          ...(stored === opt ? { checked: "checked" } : {}),
        }) as HTMLInputElement;
        radio.addEventListener("change", () => answers.set(q.id, opt));
        group.appendChild(h("div", { className: "survey-option" },
          radio, h("label", { for: id }, opt)
        ));
      }
      wrap.appendChild(group);
      break;
    }
    case "multi_choice": {
      const options = q.config?.options || [];
      const max = q.config?.max_selections || 0;
      let selected: string[] = stored ? JSON.parse(stored) : [];
      const group = h("div", { className: "survey-options" });

      const updateCheckboxes = () => {
        const checkboxes = group.querySelectorAll("input[type=checkbox]") as NodeListOf<HTMLInputElement>;
        checkboxes.forEach((cb) => {
          cb.disabled = !cb.checked && max > 0 && selected.length >= max;
        });
      };

      for (const opt of options) {
        const id = `q${q.id}-${opt}`;
        const cb = h("input", {
          type: "checkbox", id, value: opt,
          ...(selected.includes(opt) ? { checked: "checked" } : {}),
        }) as HTMLInputElement;
        cb.addEventListener("change", () => {
          if (cb.checked) selected.push(opt);
          else selected = selected.filter((s) => s !== opt);
          answers.set(q.id, JSON.stringify(selected));
          updateCheckboxes();
        });
        group.appendChild(h("div", { className: "survey-option" },
          cb, h("label", { for: id }, opt)
        ));
      }
      if (max > 0) {
        group.appendChild(h("p", { className: "survey-help" }, `${max} choix maximum`));
      }
      wrap.appendChild(group);
      setTimeout(updateCheckboxes, 0);
      break;
    }
    case "scale": {
      const min = q.config?.min ?? 1;
      const max = q.config?.max ?? 5;
      const minLabel = q.config?.min_label || "";
      const maxLabel = q.config?.max_label || "";
      const group = h("div", { className: "survey-scale" });
      if (minLabel) group.appendChild(h("span", { className: "survey-scale-label" }, minLabel));
      for (let i = min; i <= max; i++) {
        const id = `q${q.id}-${i}`;
        const radio = h("input", {
          type: "radio", name: `q${q.id}`, id, value: String(i),
          ...(stored === String(i) ? { checked: "checked" } : {}),
        }) as HTMLInputElement;
        radio.addEventListener("change", () => answers.set(q.id, String(i)));
        group.appendChild(h("div", { className: "survey-scale-item" },
          radio, h("label", { for: id }, String(i))
        ));
      }
      if (maxLabel) group.appendChild(h("span", { className: "survey-scale-label" }, maxLabel));
      wrap.appendChild(group);
      break;
    }
    case "grid": {
      const rows: string[] = q.config?.rows || [];
      const cols: string[] = q.config?.columns || [];
      let gridAnswers: Record<string, string> = stored ? JSON.parse(stored) : {};
      const table = h("table", { className: "survey-grid" });
      const thead = h("tr", {}, h("th", {}));
      for (const col of cols) thead.appendChild(h("th", {}, col));
      table.appendChild(thead);

      for (const row of rows) {
        const tr = h("tr", {}, h("td", { className: "survey-grid-row-label" }, row));
        for (const col of cols) {
          const radio = h("input", {
            type: "radio", name: `q${q.id}-${row}`, value: col,
            ...(gridAnswers[row] === col ? { checked: "checked" } : {}),
          }) as HTMLInputElement;
          radio.addEventListener("change", () => {
            gridAnswers[row] = col;
            answers.set(q.id, JSON.stringify(gridAnswers));
          });
          tr.appendChild(h("td", { className: "survey-grid-cell" }, radio));
        }
        table.appendChild(tr);
      }
      wrap.appendChild(h("div", { className: "survey-grid-wrap" }, table));
      break;
    }
  }

  return wrap;
}

function validate(section: Section): string | null {
  for (const q of section.questions) {
    if (!q.required) continue;
    const val = answers.get(q.id);
    if (!val || val.trim() === "" || val === "[]" || val === "{}") {
      return `La question « ${q.label} » est obligatoire.`;
    }
  }
  return null;
}

async function submitSectionAnswers(section: Section) {
  const sectionAnswers = section.questions
    .filter((q) => answers.has(q.id))
    .map((q) => ({ question_id: q.id, value: answers.get(q.id)! }));

  if (!sectionAnswers.length) return;

  const res = await fetch(`/api/surveys/${form.slug}/answer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ responseId, answers: sectionAnswers }),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error);
}

function renderSection() {
  const visible = getVisibleSections();
  if (currentIndex >= visible.length) {
    renderContact();
    return;
  }

  const section = visible[currentIndex];
  root.innerHTML = "";

  const container = h("div", { className: "survey-container" },
    renderProgressBar(visible),
    h("div", { className: "survey-card" },
      h("h2", { className: "survey-section-title" }, section.title),
      section.description ? h("p", { className: "survey-desc" }, section.description) : document.createTextNode("")
    )
  );

  const card = container.querySelector(".survey-card")!;
  for (const q of section.questions) {
    card.appendChild(renderQuestion(q));
  }

  const nav = h("div", { className: "survey-nav" });
  if (currentIndex > 0) {
    nav.appendChild(h("button", {
      className: "survey-btn secondary",
      onClick: () => { currentIndex--; renderSection(); },
    }, "← Précédent"));
  } else {
    nav.appendChild(h("span", {}));
  }

  nav.appendChild(h("button", {
    className: "survey-btn",
    onClick: async (e: Event) => {
      const err = validate(section);
      if (err) { alert(err); return; }
      const btn = e.target as HTMLButtonElement;
      btn.disabled = true;
      btn.textContent = "Envoi...";
      try {
        await submitSectionAnswers(section);
        currentIndex++;
        renderSection();
      } catch (ex: any) {
        alert(ex.message || "Erreur d'envoi.");
        btn.disabled = false;
        btn.textContent = "Suivant →";
      }
    },
  }, currentIndex < visible.length - 1 ? "Suivant →" : "Terminer →"));

  card.appendChild(nav);
  root.appendChild(container);
  window.scrollTo(0, 0);
}

function renderContact() {
  root.innerHTML = "";
  const card = h("div", { className: "survey-card" },
    h("h2", { className: "survey-section-title" }, "Vos coordonnées (facultatif)"),
    h("p", { className: "survey-desc" }, "Laissez vos coordonnées si vous souhaitez être recontacté.")
  );

  const fields = [
    { key: "name", label: "Nom complet", type: "text" },
    { key: "email", label: "Email", type: "email" },
    { key: "phone", label: "Téléphone", type: "tel" },
    { key: "company", label: "Entreprise", type: "text" },
  ];
  const contact: Record<string, string> = {};

  for (const f of fields) {
    const input = h("input", {
      type: f.type, className: "survey-input", placeholder: f.label,
    }) as HTMLInputElement;
    input.addEventListener("input", () => { contact[f.key] = input.value; });
    card.appendChild(h("div", { className: "survey-question" },
      h("label", { className: "survey-label" }, f.label), input
    ));
  }

  const nav = h("div", { className: "survey-nav" });
  nav.appendChild(h("button", {
    className: "survey-btn secondary",
    onClick: () => { currentIndex--; renderSection(); },
  }, "← Précédent"));

  nav.appendChild(h("button", {
    className: "survey-btn",
    onClick: async (e: Event) => {
      const btn = e.target as HTMLButtonElement;
      btn.disabled = true;
      btn.textContent = "Envoi...";
      try {
        const res = await fetch(`/api/surveys/${form.slug}/complete`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ responseId, ...contact }),
        });
        const data = await res.json();
        if (!data.ok) throw new Error(data.error);
        if (data.redirect) {
          window.location.href = data.redirect;
        } else {
          renderSuccess();
        }
      } catch (ex: any) {
        alert(ex.message || "Erreur d'envoi.");
        btn.disabled = false;
        btn.textContent = "Envoyer";
      }
    },
  }, "Envoyer"));

  card.appendChild(nav);
  root.appendChild(h("div", { className: "survey-container" }, card));
  window.scrollTo(0, 0);
}

function renderSuccess() {
  root.innerHTML = "";
  root.appendChild(
    h("div", { className: "survey-container" },
      h("div", { className: "survey-card survey-success" },
        h("div", { className: "survey-check" }, "✓"),
        h("h2", { className: "survey-section-title" }, "Merci pour vos réponses !"),
        h("p", { className: "survey-desc" }, "Nous avons bien reçu votre questionnaire. Nous reviendrons vers vous très vite."),
        h("a", { href: "/", className: "survey-btn" }, "Retour à l'accueil")
      )
    )
  );
}

// ── Styles (injected inline, keeps the survey self‑contained) ──
const style = document.createElement("style");
style.textContent = `
  #survey-root { min-height: 100svh; background: #0e0e0c; color: #f7efd9; font-family: 'Inter', system-ui, sans-serif; }
  .survey-container { max-width: 680px; margin: 0 auto; padding: 24px 16px 60px; }
  .survey-card { background: rgba(247,239,217,.06); border: 1px solid rgba(247,239,217,.1); border-radius: 16px; padding: 32px 28px; margin-bottom: 20px; }
  .survey-logo { width: 48px; height: 48px; margin-bottom: 16px; border-radius: 10px; }
  .survey-title { font-family: 'Space Grotesk', sans-serif; font-size: 1.8rem; font-weight: 700; margin: 0 0 12px; }
  .survey-section-title { font-family: 'Space Grotesk', sans-serif; font-size: 1.35rem; font-weight: 600; margin: 0 0 8px; }
  .survey-desc { color: rgba(247,239,217,.65); margin: 0 0 20px; line-height: 1.6; }
  .survey-meta { color: rgba(247,239,217,.4); font-size: .85rem; margin: 0 0 24px; }
  .survey-help { color: rgba(247,239,217,.45); font-size: .82rem; margin: 4px 0 0; }

  .survey-progress { margin-bottom: 20px; }
  .survey-progress-bar { height: 4px; background: rgba(247,239,217,.1); border-radius: 4px; overflow: hidden; }
  .survey-progress-fill { height: 100%; background: #c0202b; border-radius: 4px; transition: width .3s; }
  .survey-progress-text { display: block; text-align: right; font-size: .78rem; color: rgba(247,239,217,.4); margin-top: 6px; }

  .survey-question { margin-bottom: 24px; }
  .survey-question.required .survey-label::after { content: ' *'; color: #c0202b; }
  .survey-label { display: block; font-weight: 500; margin-bottom: 8px; font-size: .95rem; }
  .survey-input, .survey-textarea {
    width: 100%; background: rgba(247,239,217,.06); border: 1px solid rgba(247,239,217,.15);
    border-radius: 10px; padding: 12px 14px; color: #f7efd9; font-size: .95rem; font-family: inherit;
    outline: none; transition: border-color .2s; box-sizing: border-box;
  }
  .survey-input:focus, .survey-textarea:focus { border-color: #c0202b; }
  .survey-textarea { resize: vertical; min-height: 100px; }

  .survey-options { display: flex; flex-direction: column; gap: 8px; }
  .survey-option { display: flex; align-items: center; gap: 10px; padding: 10px 14px;
    background: rgba(247,239,217,.04); border: 1px solid rgba(247,239,217,.1); border-radius: 10px;
    cursor: pointer; transition: border-color .2s; }
  .survey-option:hover { border-color: rgba(247,239,217,.25); }
  .survey-option:has(input:checked) { border-color: #c0202b; background: rgba(192,32,43,.08); }
  .survey-option input { accent-color: #c0202b; }
  .survey-option label { cursor: pointer; flex: 1; font-size: .92rem; }

  .survey-scale { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
  .survey-scale-item { display: flex; flex-direction: column; align-items: center; gap: 4px; }
  .survey-scale-item input { accent-color: #c0202b; }
  .survey-scale-item label { font-size: .82rem; color: rgba(247,239,217,.5); cursor: pointer; }
  .survey-scale-label { font-size: .78rem; color: rgba(247,239,217,.4); padding: 0 4px; }

  .survey-grid-wrap { overflow-x: auto; }
  .survey-grid { width: 100%; border-collapse: collapse; font-size: .88rem; }
  .survey-grid th, .survey-grid td { padding: 8px 10px; text-align: center; border-bottom: 1px solid rgba(247,239,217,.08); }
  .survey-grid th { color: rgba(247,239,217,.5); font-weight: 500; font-size: .8rem; }
  .survey-grid-row-label { text-align: left !important; font-weight: 500; }
  .survey-grid-cell input { accent-color: #c0202b; }

  .survey-nav { display: flex; justify-content: space-between; align-items: center; margin-top: 32px; gap: 12px; }
  .survey-btn {
    display: inline-block; background: #c0202b; color: #fff; border: none; padding: 14px 32px;
    border-radius: 100px; font-weight: 600; font-size: .95rem; cursor: pointer; text-decoration: none;
    font-family: inherit; transition: opacity .2s;
  }
  .survey-btn:hover { opacity: .88; }
  .survey-btn:disabled { opacity: .5; cursor: not-allowed; }
  .survey-btn.secondary { background: transparent; border: 1px solid rgba(247,239,217,.2); color: #f7efd9; }
  .survey-btn.secondary:hover { border-color: rgba(247,239,217,.4); }

  .survey-success { text-align: center; padding: 48px 28px; }
  .survey-check { width: 56px; height: 56px; line-height: 56px; border-radius: 50%; background: rgba(62,207,110,.12);
    color: #3ecf6e; font-size: 1.6rem; margin: 0 auto 20px; }

  @media (max-width: 600px) {
    .survey-card { padding: 24px 18px; }
    .survey-title { font-size: 1.4rem; }
    .survey-nav { flex-direction: column-reverse; }
    .survey-nav .survey-btn { width: 100%; text-align: center; }
  }
`;
document.head.appendChild(style);

// ── Boot ──
renderIntro();
