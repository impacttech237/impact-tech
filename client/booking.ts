/* ------------------------------------------------------------------
   booking.ts — client JS pour la page de prise de RDV /rdv
   Vanilla TypeScript, cohérent avec le reste du site public.
------------------------------------------------------------------- */

interface AppointmentType {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  duration: number;
  color: string;
  location: string | null;
}

interface Slot {
  start: string;
  end: string;
}

const root = document.getElementById("booking-root");
if (!root) throw new Error("Missing #booking-root");

// Inject styles
const style = document.createElement("style");
style.textContent = `
#booking-root{max-width:640px;margin:0 auto;padding:80px 20px 60px;min-height:100vh;font-family:'Inter',system-ui,sans-serif;color:#f7efd9}
.bk-title{font-family:'Space Grotesk',system-ui,sans-serif;font-size:2rem;font-weight:700;margin-bottom:8px}
.bk-sub{color:rgba(247,239,217,.6);font-size:.9rem;margin-bottom:32px}
.bk-step-label{font-size:.75rem;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:rgba(247,239,217,.5);margin-bottom:16px}
.bk-types{display:grid;gap:12px}
.bk-type{background:#1a1a17;border:2px solid transparent;border-radius:12px;padding:20px;cursor:pointer;transition:border-color .2s}
.bk-type:hover,.bk-type.active{border-color:#C0202B}
.bk-type h3{margin:0 0 4px;font-size:1rem;font-weight:600}
.bk-type p{margin:0;font-size:.8rem;color:rgba(247,239,217,.5)}
.bk-type .dur{display:inline-block;margin-top:8px;font-size:.75rem;background:rgba(192,32,43,.15);color:#C0202B;padding:2px 8px;border-radius:20px;font-weight:600}
.bk-calendar{margin-top:16px}
.bk-cal-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
.bk-cal-header h3{margin:0;font-size:1rem;font-weight:600}
.bk-cal-header button{background:none;border:1px solid rgba(247,239,217,.2);color:#f7efd9;border-radius:8px;padding:6px 12px;cursor:pointer;font-size:.8rem}
.bk-cal-header button:hover{border-color:#C0202B;color:#C0202B}
.bk-cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;text-align:center}
.bk-cal-day{font-size:.7rem;font-weight:600;color:rgba(247,239,217,.4);padding:6px 0}
.bk-cal-cell{font-size:.85rem;padding:8px 0;border-radius:8px;cursor:pointer;transition:background .15s}
.bk-cal-cell:hover{background:rgba(192,32,43,.2)}
.bk-cal-cell.today{border:1px solid rgba(192,32,43,.4)}
.bk-cal-cell.selected{background:#C0202B;color:#fff;font-weight:600}
.bk-cal-cell.disabled{color:rgba(247,239,217,.15);cursor:default;pointer-events:none}
.bk-cal-cell.empty{pointer-events:none}
.bk-slots{display:grid;grid-template-columns:repeat(auto-fill,minmax(90px,1fr));gap:8px;margin-top:16px}
.bk-slot{background:#1a1a17;border:2px solid transparent;border-radius:8px;padding:10px;text-align:center;cursor:pointer;font-size:.85rem;font-weight:600;transition:border-color .2s}
.bk-slot:hover,.bk-slot.active{border-color:#C0202B;color:#C0202B}
.bk-form{display:grid;gap:12px;margin-top:20px}
.bk-form label{display:block;font-size:.75rem;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:rgba(247,239,217,.5);margin-bottom:4px}
.bk-form input,.bk-form textarea{width:100%;background:#1a1a17;border:1px solid rgba(247,239,217,.15);border-radius:8px;padding:10px 12px;color:#f7efd9;font-size:.9rem;font-family:inherit;outline:none;box-sizing:border-box}
.bk-form input:focus,.bk-form textarea:focus{border-color:#C0202B}
.bk-btn{display:inline-block;background:#C0202B;color:#fff;border:none;padding:14px 32px;border-radius:100px;font-weight:700;font-size:.9rem;cursor:pointer;transition:background .2s;font-family:inherit}
.bk-btn:hover{background:#96131B}
.bk-btn:disabled{opacity:.5;cursor:default}
.bk-btn-ghost{background:transparent;border:1px solid rgba(247,239,217,.2);color:#f7efd9}
.bk-btn-ghost:hover{border-color:#C0202B;color:#C0202B}
.bk-back{font-size:.8rem;color:rgba(247,239,217,.5);cursor:pointer;border:none;background:none;padding:0;margin-bottom:16px;font-family:inherit}
.bk-back:hover{color:#C0202B}
.bk-success{text-align:center;padding:60px 0}
.bk-success h2{font-family:'Space Grotesk',system-ui,sans-serif;font-size:1.6rem;margin-bottom:8px}
.bk-success p{color:rgba(247,239,217,.6);font-size:.9rem}
.bk-success .info{background:#1a1a17;border-radius:12px;padding:20px;margin:24px 0;text-align:left}
.bk-success .info p{margin:4px 0;font-size:.85rem;color:#f7efd9}
.bk-success .info span{color:rgba(247,239,217,.5);display:inline-block;width:80px}
.bk-loading{text-align:center;padding:40px 0;color:rgba(247,239,217,.5);font-size:.9rem}
.bk-err{color:#C0202B;font-size:.85rem;margin-top:8px}
@media(max-width:600px){.bk-title{font-size:1.5rem}.bk-slots{grid-template-columns:repeat(3,1fr)}}
`;
document.head.appendChild(style);

let state = {
  step: "types" as "types" | "calendar" | "form" | "success",
  types: [] as AppointmentType[],
  selectedType: null as AppointmentType | null,
  selectedDate: "",
  slots: [] as Slot[],
  selectedSlot: null as Slot | null,
  loadingSlots: false,
  booking: false,
  error: "",
  result: null as any,
};

async function fetchTypes() {
  const res = await fetch("/api/appointments/types");
  const data = await res.json();
  if (data.ok) state.types = data.types;
}

async function fetchSlots(slug: string, date: string) {
  state.loadingSlots = true;
  state.selectedSlot = null;
  state.error = "";
  render();
  const res = await fetch(`/api/appointments/slots/${slug}?date=${date}`);
  const data = await res.json();
  state.loadingSlots = false;
  if (data.ok) state.slots = data.slots;
  else state.slots = [];
  render();
}

function render() {
  switch (state.step) {
    case "types": renderTypes(); break;
    case "calendar": renderCalendar(); break;
    case "form": renderForm(); break;
    case "success": renderSuccess(); break;
  }
}

function renderTypes() {
  root.innerHTML = `
    <h1 class="bk-title">Prendre rendez-vous</h1>
    <p class="bk-sub">Choisissez le type de rendez-vous qui correspond à votre besoin.</p>
    <p class="bk-step-label">Étape 1 — Type de RDV</p>
    <div class="bk-types">
      ${state.types.length === 0 ? '<p class="bk-loading">Chargement...</p>' :
        state.types.map((t, i) => `
          <div class="bk-type" data-idx="${i}">
            <h3>${esc(t.title)}</h3>
            ${t.description ? `<p>${esc(t.description)}</p>` : ""}
            <span class="dur">${t.duration} min${t.location ? ` · ${esc(t.location)}` : ""}</span>
          </div>
        `).join("")}
    </div>
  `;
  root.querySelectorAll(".bk-type").forEach((el) => {
    el.addEventListener("click", () => {
      const idx = parseInt((el as HTMLElement).dataset.idx || "0");
      state.selectedType = state.types[idx];
      state.step = "calendar";
      // Default to today or tomorrow
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 86400000);
      state.selectedDate = tomorrow.toISOString().slice(0, 10);
      fetchSlots(state.selectedType!.slug, state.selectedDate);
      render();
    });
  });
}

function renderCalendar() {
  const type = state.selectedType!;
  const [year, month] = state.selectedDate ? state.selectedDate.split("-").map(Number) : [new Date().getFullYear(), new Date().getMonth() + 1];
  const firstDay = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const startWeekday = firstDay.getDay(); // 0=Sun
  const today = new Date().toISOString().slice(0, 10);
  const monthNames = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
  const dayNames = ["Dim","Lun","Mar","Mer","Jeu","Ven","Sam"];

  let cells = dayNames.map((d) => `<div class="bk-cal-day">${d}</div>`).join("");
  for (let i = 0; i < startWeekday; i++) cells += `<div class="bk-cal-cell empty"></div>`;
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const isPast = dateStr < today;
    const isSelected = dateStr === state.selectedDate;
    const isToday = dateStr === today;
    const cls = [
      "bk-cal-cell",
      isPast ? "disabled" : "",
      isSelected ? "selected" : "",
      isToday ? "today" : "",
    ].filter(Boolean).join(" ");
    cells += `<div class="${cls}" data-date="${dateStr}">${d}</div>`;
  }

  const prevMonth = month === 1 ? `${year - 1}-12` : `${year}-${String(month - 1).padStart(2, "0")}`;
  const nextMonth = month === 12 ? `${year + 1}-01` : `${year}-${String(month + 1).padStart(2, "0")}`;

  root.innerHTML = `
    <button class="bk-back" id="bk-back">← Changer de type</button>
    <h1 class="bk-title">${esc(type.title)}</h1>
    <p class="bk-sub">${type.duration} min${type.location ? ` · ${esc(type.location)}` : ""}</p>
    <p class="bk-step-label">Étape 2 — Choisissez une date et un créneau</p>
    <div class="bk-calendar">
      <div class="bk-cal-header">
        <button id="bk-prev">←</button>
        <h3>${monthNames[month - 1]} ${year}</h3>
        <button id="bk-next">→</button>
      </div>
      <div class="bk-cal-grid">${cells}</div>
    </div>
    ${state.selectedDate ? `
      <p style="margin-top:16px;font-size:.85rem;font-weight:600">Créneaux pour le ${formatDateFr(state.selectedDate)}</p>
      ${state.loadingSlots ? '<p class="bk-loading">Chargement des créneaux...</p>' :
        state.slots.length === 0 ? '<p style="color:rgba(247,239,217,.5);font-size:.85rem">Aucun créneau disponible ce jour.</p>' : `
        <div class="bk-slots">
          ${state.slots.map((s, i) => `
            <div class="bk-slot${state.selectedSlot?.start === s.start ? " active" : ""}" data-idx="${i}">
              ${s.start.slice(11, 16)}
            </div>
          `).join("")}
        </div>
      `}
      ${state.selectedSlot ? '<div style="margin-top:20px;text-align:center"><button class="bk-btn" id="bk-continue">Continuer →</button></div>' : ""}
    ` : ""}
  `;

  document.getElementById("bk-back")?.addEventListener("click", () => {
    state.step = "types";
    state.selectedType = null;
    state.selectedDate = "";
    state.selectedSlot = null;
    render();
  });

  document.getElementById("bk-prev")?.addEventListener("click", () => {
    state.selectedDate = `${prevMonth}-01`;
    state.selectedSlot = null;
    state.slots = [];
    render();
  });

  document.getElementById("bk-next")?.addEventListener("click", () => {
    state.selectedDate = `${nextMonth}-01`;
    state.selectedSlot = null;
    state.slots = [];
    render();
  });

  root.querySelectorAll(".bk-cal-cell:not(.disabled):not(.empty)").forEach((el) => {
    el.addEventListener("click", () => {
      const date = (el as HTMLElement).dataset.date!;
      state.selectedDate = date;
      state.selectedSlot = null;
      fetchSlots(type.slug, date);
    });
  });

  root.querySelectorAll(".bk-slot").forEach((el) => {
    el.addEventListener("click", () => {
      const idx = parseInt((el as HTMLElement).dataset.idx || "0");
      state.selectedSlot = state.slots[idx];
      render();
    });
  });

  document.getElementById("bk-continue")?.addEventListener("click", () => {
    state.step = "form";
    render();
  });
}

function renderForm() {
  const type = state.selectedType!;
  const slot = state.selectedSlot!;

  root.innerHTML = `
    <button class="bk-back" id="bk-back">← Changer de créneau</button>
    <h1 class="bk-title">Vos coordonnées</h1>
    <p class="bk-sub">${esc(type.title)} — ${formatDateFr(state.selectedDate)} à ${slot.start.slice(11, 16)}</p>
    <p class="bk-step-label">Étape 3 — Informations de contact</p>
    <div class="bk-form">
      <div>
        <label for="bk-name">Nom complet *</label>
        <input id="bk-name" type="text" placeholder="Votre nom" required>
      </div>
      <div>
        <label for="bk-phone">Téléphone *</label>
        <input id="bk-phone" type="tel" placeholder="+237 6XX XXX XXX" required>
      </div>
      <div>
        <label for="bk-email">Email</label>
        <input id="bk-email" type="email" placeholder="vous@exemple.com">
      </div>
      <div>
        <label for="bk-company">Entreprise</label>
        <input id="bk-company" type="text" placeholder="Nom de votre entreprise">
      </div>
      <div>
        <label for="bk-notes">Notes (optionnel)</label>
        <textarea id="bk-notes" rows="3" placeholder="Décrivez brièvement votre besoin..."></textarea>
      </div>
      ${state.error ? `<p class="bk-err">${state.error}</p>` : ""}
      <div style="display:flex;gap:12px;margin-top:8px">
        <button class="bk-btn" id="bk-submit" ${state.booking ? "disabled" : ""}>${state.booking ? "Réservation..." : "Confirmer le RDV"}</button>
      </div>
    </div>
  `;

  document.getElementById("bk-back")?.addEventListener("click", () => {
    state.step = "calendar";
    state.error = "";
    render();
  });

  document.getElementById("bk-submit")?.addEventListener("click", async () => {
    const name = (document.getElementById("bk-name") as HTMLInputElement).value.trim();
    const phone = (document.getElementById("bk-phone") as HTMLInputElement).value.trim();
    const email = (document.getElementById("bk-email") as HTMLInputElement).value.trim();
    const company = (document.getElementById("bk-company") as HTMLInputElement).value.trim();
    const notes = (document.getElementById("bk-notes") as HTMLTextAreaElement).value.trim();

    if (!name || !phone) {
      state.error = "Le nom et le téléphone sont obligatoires.";
      render();
      return;
    }

    state.booking = true;
    state.error = "";
    render();

    try {
      const res = await fetch("/api/appointments/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          typeSlug: type.slug,
          startTime: slot.start,
          clientName: name,
          clientEmail: email || undefined,
          clientPhone: phone,
          clientCompany: company || undefined,
          notes: notes || undefined,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        state.result = { ...data.appointment, clientName: name };
        state.step = "success";
      } else {
        state.error = data.error || "Erreur lors de la réservation.";
      }
    } catch {
      state.error = "Erreur réseau. Vérifiez votre connexion.";
    }
    state.booking = false;
    render();
  });
}

function renderSuccess() {
  const r = state.result;
  root.innerHTML = `
    <div class="bk-success">
      <h2>Rendez-vous confirmé ✓</h2>
      <p>Nous avons bien enregistré votre réservation.</p>
      <div class="info">
        <p><span>Type</span> ${esc(r.typeName)}</p>
        <p><span>Date</span> ${formatDateFr(r.startTime.slice(0, 10))}</p>
        <p><span>Heure</span> ${r.startTime.slice(11, 16)}</p>
        <p><span>Durée</span> ${r.duration} min</p>
      </div>
      <p>Vous recevrez un email de confirmation si vous avez fourni votre adresse email.</p>
      <div style="margin-top:24px;display:flex;gap:12px;justify-content:center">
        <a href="/" class="bk-btn">Retour à l'accueil</a>
        <button class="bk-btn bk-btn-ghost" id="bk-another">Nouveau RDV</button>
      </div>
    </div>
  `;

  document.getElementById("bk-another")?.addEventListener("click", () => {
    state = {
      step: "types",
      types: state.types,
      selectedType: null,
      selectedDate: "",
      slots: [],
      selectedSlot: null,
      loadingSlots: false,
      booking: false,
      error: "",
      result: null,
    };
    render();
  });
}

function formatDateFr(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// Init
(async () => {
  await fetchTypes();
  render();
})();
