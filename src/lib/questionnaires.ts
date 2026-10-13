/* ------------------------------------------------------------------
   Questionnaires sur mesure (envoyés au client après l'appel découverte).

   Format de définition (JSON), pensé pour être écrit à la main :
   {
     "title": "Contenu du site — Malcom",
     "eyebrow": "Contenu du site",            // petit sur-titre (facultatif)
     "heading": "Ce qu'on va écrire, on le prend de vos mots.",
     "intro": "Texte d'introduction…",
     "sections": [
       {
         "title": "Identité générale",
         "context": "Ce qui apparaît dans l'en-tête…",
         "fields": [
           { "id": "nom", "type": "text", "label": "Nom affiché", "hint": "…", "placeholder": "…", "half": true },
           { "id": "ville", "type": "select", "label": "Ville", "options": ["Douala", "Yaoundé"] },
           { "id": "domaines", "type": "repeat", "label": "Domaine", "count": 5,
             "fields": [ { "id": "nom", "type": "text", "placeholder": "Nom du domaine" },
                         { "id": "description", "type": "textarea", "placeholder": "En une phrase" } ] }
         ]
       }
     ]
   }
   Types : text, textarea, url, email, tel, number, date, select, radio,
   checkbox (plusieurs choix), yesno, scale (min/max), repeat, info (texte seul).
   Les réponses sont stockées à plat : { "nom": "…", "domaines.2.nom": "…" }.
------------------------------------------------------------------- */

export const FIELD_TYPES = ["text", "textarea", "url", "email", "tel", "number", "date", "select", "radio", "checkbox", "yesno", "scale", "repeat", "info"];

export interface QField {
  id: string;
  type: string;
  label?: string;
  hint?: string;
  placeholder?: string;
  options?: string[];
  required?: boolean;
  half?: boolean;
  rows?: number;
  min?: number;
  max?: number;
  minLabel?: string;
  maxLabel?: string;
  count?: number;
  fields?: QField[];
  text?: string;
}

export interface QSection {
  title: string;
  context?: string;
  fields: QField[];
}

export interface QDefinition {
  title: string;
  eyebrow?: string;
  heading?: string;
  intro?: string;
  sections: QSection[];
}

const str = (v: any, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const idOk = (v: any) => typeof v === "string" && /^[a-zA-Z][a-zA-Z0-9_-]{0,60}$/.test(v);

function normalizeField(f: any, path: string, seen: Set<string>, nested = false): QField {
  if (!f || typeof f !== "object") throw new Error(`${path} : champ invalide`);
  const type = FIELD_TYPES.includes(f.type) ? f.type : null;
  if (!type) throw new Error(`${path} : type « ${f.type} » inconnu (types possibles : ${FIELD_TYPES.join(", ")})`);
  if (nested && type === "repeat") throw new Error(`${path} : un « repeat » ne peut pas en contenir un autre`);
  const id = type === "info" && !f.id ? `info${seen.size}` : f.id;
  if (!idOk(id)) throw new Error(`${path} : identifiant « ${f.id} » invalide (lettres, chiffres, _ ou -, commence par une lettre)`);
  if (seen.has(id)) throw new Error(`${path} : identifiant « ${id} » utilisé deux fois`);
  seen.add(id);

  const out: QField = { id, type };
  for (const k of ["label", "hint", "placeholder", "minLabel", "maxLabel", "text"]) {
    const v = str(f[k], k === "text" || k === "hint" ? 2000 : 400);
    if (v) (out as any)[k] = v;
  }
  if (f.required) out.required = true;
  if (f.half) out.half = true;
  if (f.rows) out.rows = Math.max(1, Math.min(12, parseInt(f.rows, 10) || 3));
  if (["select", "radio", "checkbox"].includes(type)) {
    out.options = Array.isArray(f.options) ? f.options.map((o: any) => str(String(o), 200)).filter(Boolean).slice(0, 50) : [];
    if (!out.options.length) throw new Error(`${path} : « options » requis pour le type ${type}`);
  }
  if (type === "scale") {
    out.min = Number.isFinite(+f.min) ? +f.min : 1;
    out.max = Number.isFinite(+f.max) ? +f.max : 5;
    if (out.max <= out.min || out.max - out.min > 10) throw new Error(`${path} : échelle min/max invalide`);
  }
  if (type === "repeat") {
    out.count = Math.max(1, Math.min(20, parseInt(f.count, 10) || 3));
    if (!Array.isArray(f.fields) || !f.fields.length) throw new Error(`${path} : « fields » requis pour un repeat`);
    const sub = new Set<string>();
    out.fields = f.fields.map((x: any, i: number) => normalizeField(x, `${path}.fields[${i}]`, sub, true));
  }
  if (type !== "info" && !out.label && !out.placeholder) throw new Error(`${path} : « label » ou « placeholder » requis`);
  return out;
}

/* Coordonnées : toujours demandées, en première étape. Elles complètent la
   fiche du client (voir src/api/questionnaires.ts) pour l'envoi du code
   d'accès par email ou WhatsApp. */
export const CONTACT_PHONE = "contactPhone";
export const CONTACT_EMAIL = "contactEmail";

function contactSection(locale: string): QSection {
  const en = locale === "en";
  return {
    title: en ? "Your contact details" : "Vos coordonnées",
    context: en
      ? "So we can send you the access code to your client space and keep you posted on your project."
      : "Pour vous envoyer le code d'accès à votre espace client et vous tenir informé de votre projet.",
    fields: [
      { id: CONTACT_PHONE, type: "tel", label: en ? "Your WhatsApp number" : "Votre numéro WhatsApp", placeholder: en ? "E.g. +237 6 90 00 00 00" : "Ex : 6 90 00 00 00", half: true },
      { id: CONTACT_EMAIL, type: "email", label: en ? "Your email" : "Votre email", placeholder: en ? "E.g. name@company.com" : "Ex : nom@entreprise.cm", half: true },
    ],
  };
}

/* Valide et nettoie une définition ; lève une Error lisible sinon.
   Ajoute la section « Vos coordonnées » si elle n'y est pas déjà. */
export function normalizeDefinition(input: any, locale = "fr"): QDefinition {
  const def = typeof input === "string" ? JSON.parse(input) : input;
  if (def && Array.isArray(def.sections)) {
    const has = (id: string) => def.sections.some((s: any) => Array.isArray(s?.fields) && s.fields.some((f: any) => f?.id === id));
    if (!has(CONTACT_PHONE) && !has(CONTACT_EMAIL)) def.sections = [contactSection(locale), ...def.sections];
  }
  return normalizeRaw(def);
}

function normalizeRaw(input: any): QDefinition {
  const def = typeof input === "string" ? JSON.parse(input) : input;
  if (!def || typeof def !== "object") throw new Error("Définition vide");
  const title = str(def.title, 200);
  if (!title) throw new Error("« title » requis");
  if (!Array.isArray(def.sections) || !def.sections.length) throw new Error("Au moins une section est requise");
  const seen = new Set<string>();
  const sections = def.sections.slice(0, 40).map((s: any, i: number) => {
    const t = str(s?.title, 200);
    if (!t) throw new Error(`sections[${i}] : « title » requis`);
    if (!Array.isArray(s.fields) || !s.fields.length) throw new Error(`sections[${i}] : au moins un champ`);
    const sec: QSection = { title: t, fields: s.fields.slice(0, 80).map((f: any, j: number) => normalizeField(f, `sections[${i}].fields[${j}]`, seen)) };
    const ctx = str(s.context, 2000);
    if (ctx) sec.context = ctx;
    return sec;
  });
  const out: QDefinition = { title, sections };
  for (const k of ["eyebrow", "heading", "intro"]) {
    const v = str(def[k], k === "intro" ? 4000 : 300);
    if (v) (out as any)[k] = v;
  }
  return out;
}

export interface FlatField {
  key: string; // clé de réponse
  label: string;
  type: string;
  section: string;
  group?: string; // « Domaine 2 » pour un repeat
}

/* Liste à plat de tous les champs à remplir (repeat déplié). */
export function flattenFields(def: QDefinition): FlatField[] {
  const out: FlatField[] = [];
  for (const s of def.sections) {
    for (const f of s.fields) {
      if (f.type === "info") continue;
      if (f.type === "repeat") {
        for (let n = 1; n <= (f.count || 1); n++) {
          for (const sub of f.fields || []) {
            out.push({ key: `${f.id}.${n}.${sub.id}`, label: sub.label || sub.placeholder || sub.id, type: sub.type, section: s.title, group: `${f.label || f.id} ${n}` });
          }
        }
      } else {
        out.push({ key: f.id, label: f.label || f.placeholder || f.id, type: f.type, section: s.title });
      }
    }
  }
  return out;
}

export function isFilled(v: any) {
  if (Array.isArray(v)) return v.length > 0;
  return v != null && String(v).trim() !== "";
}

/* Ne garde que les clés connues, tronque les valeurs. */
export function sanitizeAnswers(def: QDefinition, answers: any) {
  const fields = flattenFields(def);
  const clean: Record<string, string | string[]> = {};
  let filled = 0;
  for (const f of fields) {
    const v = answers?.[f.key];
    if (v == null) continue;
    if (Array.isArray(v)) {
      const arr = v.map((x) => String(x).slice(0, 300)).slice(0, 50);
      if (arr.length) clean[f.key] = arr;
    } else {
      const s = String(v).slice(0, 10000);
      if (s.trim()) clean[f.key] = s;
    }
    if (isFilled(clean[f.key])) filled++;
  }
  return { answers: clean, filled, total: fields.length };
}

export function formatAnswer(v: any): string {
  if (Array.isArray(v)) return v.join(", ");
  return v == null ? "" : String(v);
}
