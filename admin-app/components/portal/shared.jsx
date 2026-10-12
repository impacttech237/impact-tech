/* Outils partagés de l'admin du portail client. */
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../../lib/api";
import { Button } from "../ui";
import { Check, Copy } from "../../lib/icons";

export const papi = (path, method = "GET", body) =>
  api(`portal/${path}`, { method, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });

/* Chargement simple avec état (données, erreur, rechargement). */
export function useLoad(path, deps = []) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    if (!path) return;
    try {
      setData(await papi(path));
      setError("");
    } catch (e) {
      if (e.message !== "__unauthorized__") setError(e.message);
    }
  }, [path, ...deps]);
  useEffect(() => {
    load();
  }, [load]);
  return { data, error, reload: load, setData };
}

const toDate = (iso) => (iso ? new Date(iso.length === 10 ? `${iso}T12:00:00Z` : iso.includes("T") ? iso : `${iso.replace(" ", "T")}Z`) : null);
export const fmtDate = (iso) => (iso ? toDate(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }) : "—");
export const fmtDateTime = (iso) => (iso ? toDate(iso).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—");
export function fmtAgo(iso) {
  if (!iso) return "jamais";
  const s = (Date.now() - toDate(iso).getTime()) / 1000;
  if (s < 60) return "à l'instant";
  if (s < 3600) return `il y a ${Math.round(s / 60)} min`;
  if (s < 86400) return `il y a ${Math.round(s / 3600)} h`;
  if (s < 86400 * 30) return `il y a ${Math.round(s / 86400)} j`;
  return fmtDate(iso);
}
export const fmtMoney = (n, cur = "XAF") =>
  n == null || n === "" ? "—" : `${Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")} ${cur === "EUR" ? "€" : "FCFA"}`;
export const fmtSize = (b) => (!b ? "" : b < 1024 ** 2 ? `${Math.round(b / 1024)} Ko` : b < 1024 ** 3 ? `${(b / 1024 ** 2).toFixed(1)} Mo` : `${(b / 1024 ** 3).toFixed(2)} Go`);

export const STEP_STATUS = {
  todo: { label: "À venir", variant: "default" },
  in_progress: { label: "En cours", variant: "info" },
  review: { label: "Chez le client (validation)", variant: "warning" },
  done: { label: "Terminé", variant: "success" },
};
export const CHECK_STATUS = {
  todo: { label: "Attendu du client", variant: "danger" },
  sent: { label: "Reçu — à vérifier", variant: "warning" },
  ok: { label: "Validé", variant: "success" },
};
export const PROJECT_STATUS = {
  actif: { label: "En cours", variant: "info" },
  pause: { label: "En pause", variant: "warning" },
  livre: { label: "Livré", variant: "success" },
  termine: { label: "Terminé", variant: "default" },
};
export const KIND_LABEL = { file: "Fichiers", form: "Formulaire guidé", access: "Accès (coffre)", confirm: "Simple confirmation" };
export const FILE_CATEGORIES = [
  { value: "logo", label: "Logo" },
  { value: "photos", label: "Photos" },
  { value: "videos", label: "Vidéos" },
  { value: "musique", label: "Musique & audio" },
  { value: "textes", label: "Textes" },
  { value: "documents", label: "Documents" },
  { value: "autre", label: "Autres" },
];
export const ACTION_LABEL = {
  login: "Connexion",
  file_uploaded: "Fichier ajouté",
  file_deleted: "Fichier supprimé",
  step_validated: "Étape validée",
  step_changes_requested: "Changements demandés",
  step_review: "Étape envoyée en validation",
  step_done: "Étape terminée",
  step_started: "Étape démarrée",
  checklist_sent: "Élément envoyé",
  checklist_ok: "Élément validé",
  checklist_reopened: "Élément renvoyé au client",
  checklist_added: "Élément ajouté",
  document_signed: "Document signé",
  document_to_sign: "Document envoyé pour signature",
  document_shared: "Document partagé",
  document_countersigned: "Document contresigné",
  weekly_update: "Point de la semaine",
  project_created: "Projet créé",
  preview_ready: "Aperçu du site disponible",
  delivered: "Projet livré",
  invoice_sent: "Facture envoyée",
  quote_sent: "Devis envoyé",
  quote_accepted: "Devis accepté",
  quote_refused: "Devis refusé",
  invoice_paid: "Paiement reçu",
  payment_started: "Paiement lancé",
  feedback: "Retour client",
  support_request: "Demande de support",
  request_done: "Demande traitée",
  round_closed: "Série de modifications close",
  vault_added: "Accès ajouté",
  vault_removed: "Accès supprimé",
  review: "Avis client",
  review_requested: "Avis demandé",
  satisfaction: "Note de satisfaction",
  reminder_sent: "Relance automatique",
  reminder_signature: "Relance signature",
  reminder_invoice: "Relance facture",
  renewal_reminder: "Rappel de renouvellement",
  site_down: "Site hors ligne",
  client_created: "Client créé",
  link_sent: "Lien envoyé",
  manual_code: "Code manuel généré",
  questionnaire_sent: "Questionnaire créé",
  questionnaire_submitted: "Questionnaire rempli",
  reminder_questionnaire: "Relance questionnaire",
};

export function CopyButton({ text, label = "Copier", size = "sm", variant = "secondary" }) {
  const [ok, setOk] = useState(false);
  return (
    <Button
      size={size}
      variant={variant}
      icon={ok ? Check : Copy}
      onClick={() => {
        navigator.clipboard?.writeText(text).then(() => {
          setOk(true);
          setTimeout(() => setOk(false), 1800);
        });
      }}
    >
      {ok ? "Copié" : label}
    </Button>
  );
}

export function SubTabs({ tabs, value, onChange }) {
  return (
    <div className="mb-5 flex gap-1 overflow-x-auto border-b border-adm-border pb-2">
      {tabs.map((t) => (
        <button
          key={t.key}
          type="button"
          onClick={() => onChange(t.key)}
          className={`flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            value === t.key ? "bg-adm-red text-white" : "text-adm-text-3 hover:bg-adm-surface-2 hover:text-adm-text"
          }`}
        >
          {t.Icon && <t.Icon size={14} />} {t.label}
          {t.badge ? <span className="ml-1 rounded-full bg-white/20 px-1.5 text-[11px] font-bold">{t.badge}</span> : null}
        </button>
      ))}
    </div>
  );
}

/* Signature à la souris / au doigt (contresignature). */
export function SignaturePad({ onChange }) {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current;
    const ratio = window.devicePixelRatio || 1;
    const w = c.parentElement.clientWidth;
    c.width = w * ratio;
    c.height = 160 * ratio;
    c.style.width = `${w}px`;
    c.style.height = "160px";
    const ctx = c.getContext("2d");
    ctx.scale(ratio, ratio);
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, w, 160);
    ctx.lineWidth = 2.4;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#111";
    let last = null;
    const pos = (e) => {
      const r = c.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const down = (e) => {
      last = pos(e);
      c.setPointerCapture(e.pointerId);
    };
    const move = (e) => {
      if (!last) return;
      const p = pos(e);
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      last = p;
    };
    const up = () => {
      if (last) onChange(c.toDataURL("image/png"));
      last = null;
    };
    c.addEventListener("pointerdown", down);
    c.addEventListener("pointermove", move);
    c.addEventListener("pointerup", up);
    return () => {
      c.removeEventListener("pointerdown", down);
      c.removeEventListener("pointermove", move);
      c.removeEventListener("pointerup", up);
    };
  }, []);
  return (
    <div className="overflow-hidden rounded-lg border border-adm-border-2 bg-white" style={{ touchAction: "none" }}>
      <canvas ref={ref} style={{ display: "block", touchAction: "none", cursor: "crosshair" }} />
    </div>
  );
}

export function ErrorText({ children }) {
  return children ? <p className="mb-3 rounded-lg border border-adm-red/30 bg-adm-red/10 px-3 py-2 text-sm text-adm-red">{children}</p> : null;
}

export const waLink = (phone, text) => {
  const d = String(phone || "").replace(/[^\d]/g, "");
  return d ? `https://wa.me/${d}?text=${encodeURIComponent(text)}` : `https://wa.me/?text=${encodeURIComponent(text)}`;
};
