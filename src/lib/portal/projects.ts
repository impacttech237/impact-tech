/* ------------------------------------------------------------------
   Logique métier des projets clients : modèles par pack, création d'un
   projet complet (étapes + checklist + contrat), résumé « 3 questions »
   pour le client et tableau « Qui attend qui ? » pour l'admin.
------------------------------------------------------------------- */
import { addDays, nowIso, parseJson, randomToken, todayIso, formatMoney } from "./util";

export interface TemplateStep {
  title: string;
  description?: string;
  needs_validation?: boolean;
  days?: number; // durée indicative (calcule les échéances)
}

export interface FormQuestion {
  q: string;
  hint?: string;
  long?: boolean;
}

export interface TemplateChecklistItem {
  label: string;
  help?: string;
  kind: "file" | "form" | "access" | "confirm";
  category?: string;
  config?: FormQuestion[];
  due_days?: number;
}

/* Étapes communes (identiques au process affiché sur le site). */
const STEPS = (devDays: number): TemplateStep[] => [
  { title: "Appel découverte", description: "On écoute votre besoin et on définit ensemble le projet.", days: 2 },
  { title: "Proposition + maquette", description: "Vous voyez le design de votre site avant qu'on le construise. Vous validez ou on ajuste.", needs_validation: true, days: 3 },
  { title: "Développement", description: "On construit votre site. Vous suivez l'avancement et vous pouvez le voir en construction.", days: devDays },
  { title: "Livraison + paiement", description: "Votre site est en ligne, vous testez tout, et vous ne payez que si vous êtes satisfait.", needs_validation: true, days: 2 },
];

const PRESENTATION: TemplateChecklistItem = {
  label: "Présentez votre entreprise",
  help: "Répondez simplement, comme si vous parliez à un client. On s'occupe de la mise en forme.",
  kind: "form",
  category: "textes",
  due_days: 4,
  config: [
    { q: "Que fait votre entreprise, en 2 ou 3 phrases ?", hint: "Ex : Nous fabriquons du pain artisanal à Douala depuis 2015.", long: true },
    { q: "Quels sont vos 3 principaux services ou produits ?", long: true },
    { q: "Qu'est-ce qui vous rend différent de vos concurrents ?", long: true },
    { q: "Qui sont vos clients ?", hint: "Ex : familles, restaurants, entreprises..." },
  ],
};

const COORDONNEES: TemplateChecklistItem = {
  label: "Vos coordonnées et horaires",
  kind: "form",
  category: "textes",
  due_days: 4,
  config: [
    { q: "Adresse (ou zone d'intervention)" },
    { q: "Téléphone / WhatsApp à afficher" },
    { q: "Email à afficher" },
    { q: "Horaires d'ouverture", hint: "Ex : lun-sam 8h-18h" },
    { q: "Liens de vos réseaux sociaux (Facebook, Instagram, TikTok...)", long: true },
  ],
};

const LOGO: TemplateChecklistItem = { label: "Votre logo", help: "Le fichier de meilleure qualité possible (PNG, SVG, PDF...). Pas de logo ? Dites-le nous dans la messagerie.", kind: "file", category: "logo", due_days: 3 };
const PHOTOS: TemplateChecklistItem = { label: "Vos photos", help: "Photos de vos produits, de votre équipe, de vos locaux. Même prises au téléphone, c'est très bien.", kind: "file", category: "photos", due_days: 5 };
const DOMAINE: TemplateChecklistItem = { label: "Accès à votre nom de domaine (si vous en avez déjà un)", help: "Où il a été acheté et les identifiants. C'est chiffré et seul Impact Tech peut le lire. Sinon, on s'en occupe.", kind: "access", due_days: 5 };

export const DEFAULT_TEMPLATES = [
  {
    pack: "Impact Essentiel",
    title: "Site vitrine",
    delay_days: 14,
    revision_rounds: null,
    support_days: null,
    steps: STEPS(7),
    checklist: [LOGO, PHOTOS, PRESENTATION, COORDONNEES, DOMAINE],
  },
  {
    pack: "Impact Business",
    title: "Site business",
    delay_days: 28,
    revision_rounds: null,
    support_days: 30,
    steps: STEPS(20),
    checklist: [
      LOGO,
      PHOTOS,
      PRESENTATION,
      COORDONNEES,
      { label: "Votre catalogue (produits ou services, avec les prix)", help: "Un fichier Excel, une photo de votre carte, un PDF... tout format convient.", kind: "file", category: "documents", due_days: 6 },
      { label: "Paiements et réservations", kind: "form", category: "textes", due_days: 6, config: [{ q: "Comment vos clients doivent-ils pouvoir payer ?", hint: "Mobile Money, carte, à la livraison..." }, { q: "Voulez-vous des réservations ou commandes en ligne ? Expliquez comment ça se passe aujourd'hui.", long: true }] },
      DOMAINE,
    ],
  },
  {
    pack: "Impact Sur Mesure",
    title: "Projet sur mesure",
    delay_days: null,
    revision_rounds: -1,
    support_days: 60,
    steps: STEPS(30),
    checklist: [
      { label: "Votre besoin en détail", kind: "form", category: "textes", due_days: 4, config: [{ q: "Quel problème le projet doit-il résoudre ?", long: true }, { q: "Qui va l'utiliser et comment ?", long: true }, { q: "Avez-vous des exemples d'applications ou de sites qui vous plaisent ?", long: true }] },
      { label: "Documents existants", help: "Cahier des charges, maquettes, fichiers Excel, process actuels...", kind: "file", category: "documents", due_days: 5 },
      LOGO,
      DOMAINE,
    ],
  },
];

export async function getTemplates(db: any) {
  const { results } = await db.prepare("SELECT * FROM project_templates WHERE active = 1 ORDER BY sort_order, id").all();
  if (results?.length) return results.map(hydrateTemplate);
  return DEFAULT_TEMPLATES.map((t, i) => ({ id: null, sort_order: i, contract_template_id: null, ...t }));
}

export function hydrateTemplate(row: any) {
  return { ...row, steps: parseJson(row.steps, []), checklist: parseJson(row.checklist, []) };
}

export async function getTemplateForPack(db: any, pack: string, templateId?: number | null) {
  const all = await getTemplates(db);
  return (templateId && all.find((t: any) => t.id === templateId)) || all.find((t: any) => t.pack === pack) || all[0];
}

/* Variables disponibles dans les modèles de contrat. */
export function contractVariables(ctx: { client: any; project: any }) {
  const { client, project } = ctx;
  return {
    client_name: client?.name || "",
    client_company: client?.company || client?.name || "",
    client_email: client?.email || "",
    client_phone: client?.phone || "",
    project_title: project?.title || "",
    pack: project?.pack || "",
    amount: project?.amount ? formatMoney(project.amount, project.currency || "XAF") : "",
    delay: project?.due_date ? new Date(project.due_date).toLocaleDateString("fr-FR") : "",
    start_date: project?.start_date ? new Date(project.start_date).toLocaleDateString("fr-FR") : "",
    revisions: project?.revision_rounds == null ? "" : project.revision_rounds < 0 ? "illimitées" : String(project.revision_rounds),
    support: project?.support_days ? `${project.support_days} jours` : "",
    date: new Date().toLocaleDateString("fr-FR"),
  };
}

export const MISSING_VALUE = "[à compléter]";

/* Variable vide -> « [à compléter] » : visible à l'aperçu, et l'envoi au
   client est bloqué tant qu'il en reste (voir POST /documents/:id/send). */
export function fillVariables(content: string, vars: Record<string, string>) {
  return String(content || "").replace(/\{\{\s*([a-z_]+)\s*\}\}/g, (m, k) => (k in vars ? vars[k] || MISSING_VALUE : m));
}

/* Crée un projet complet à partir du modèle de son pack. */
export async function createProjectFromTemplate(
  db: any,
  input: { clientId: number; title: string; pack: string; templateId?: number | null; amount?: number | null; currency?: string; startDate?: string; description?: string }
) {
  const tpl = await getTemplateForPack(db, input.pack, input.templateId);
  const start = input.startDate || todayIso();
  const steps: TemplateStep[] = tpl?.steps?.length ? tpl.steps : STEPS(10);
  const totalDays = steps.reduce((s, x) => s + (x.days || 0), 0);
  const due = tpl?.delay_days ? addDays(start, tpl.delay_days) : totalDays ? addDays(start, totalDays) : null;

  const res = await db
    .prepare(
      `INSERT INTO client_projects (client_id, title, description, status, start_date, due_date, pack, amount, currency, revision_rounds, revision_used, support_days, feedback_key, created_at)
       VALUES (?, ?, ?, 'actif', ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`
    )
    .bind(
      input.clientId,
      input.title,
      input.description || "",
      start,
      due,
      input.pack || tpl?.pack || null,
      input.amount ?? null,
      input.currency || "XAF",
      tpl?.revision_rounds ?? null,
      tpl?.support_days ?? null,
      randomToken(12),
      nowIso()
    )
    .run();
  const projectId = res.meta.last_row_id as number;

  const stmts: any[] = [];
  let cursor = start;
  steps.forEach((s, i) => {
    cursor = s.days ? addDays(cursor, s.days) : cursor;
    stmts.push(
      db
        .prepare("INSERT INTO project_steps (project_id, title, description, status, needs_validation, due_date, started_at, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
        .bind(projectId, s.title, s.description || "", i === 0 ? "in_progress" : "todo", s.needs_validation ? 1 : 0, cursor, i === 0 ? nowIso() : null, i)
    );
  });
  (tpl?.checklist || []).forEach((it: TemplateChecklistItem, i: number) => {
    stmts.push(
      db
        .prepare("INSERT INTO checklist_items (project_id, label, help, kind, category, config, status, due_date, sort_order) VALUES (?, ?, ?, ?, ?, ?, 'todo', ?, ?)")
        .bind(projectId, it.label, it.help || "", it.kind || "file", it.category || null, it.config ? JSON.stringify(it.config) : null, it.due_days ? addDays(start, it.due_days) : null, i)
    );
  });
  if (stmts.length) await db.batch(stmts);

  return { projectId, template: tpl };
}

/* ── Résumé côté client : où en est mon projet / que dois-je faire / quoi de neuf ── */

export interface NextAction {
  type: "sign" | "validate" | "checklist" | "pay" | "accept_quote" | "message" | "review";
  label: string;
  title?: string;
  amount?: string;
  kind?: string;
  target: string; // onglet / identifiant à ouvrir dans le portail
  id?: number;
  due?: string | null;
}

export async function projectSnapshot(db: any, projectId: number) {
  const [steps, checklist, docs, invoices, unread, requests] = await db.batch([
    db.prepare("SELECT * FROM project_steps WHERE project_id = ? ORDER BY sort_order, id").bind(projectId),
    db.prepare("SELECT id, label, help, kind, category, config, answer, status, due_date, sort_order FROM checklist_items WHERE project_id = ? ORDER BY sort_order, id").bind(projectId),
    db.prepare("SELECT id, title, category, status, needs_signature, sent_at, created_at FROM client_documents WHERE project_id = ? AND status != 'draft' ORDER BY created_at DESC").bind(projectId),
    db.prepare("SELECT id, kind, number, title, amount, currency, status, due_date FROM invoices WHERE project_id = ? AND status != 'brouillon' ORDER BY created_at DESC").bind(projectId),
    db.prepare("SELECT COUNT(*) AS n FROM messages WHERE project_id = ? AND author != 'client' AND read_by_client_at IS NULL").bind(projectId),
    db.prepare("SELECT COUNT(*) AS n FROM project_requests WHERE project_id = ? AND status IN ('nouveau','en_cours')").bind(projectId),
  ]);
  return {
    steps: steps.results || [],
    checklist: (checklist.results || []).map((c: any) => ({ ...c, config: parseJson(c.config, []), answer: parseJson(c.answer, null) })),
    documents: docs.results || [],
    invoices: invoices.results || [],
    unreadMessages: unread.results?.[0]?.n || 0,
    openRequests: requests.results?.[0]?.n || 0,
  };
}

export function computeProgress(steps: any[]) {
  if (!steps.length) return { percent: 0, current: null };
  const done = steps.filter((s) => s.status === "done").length;
  const current = steps.find((s) => s.status !== "done") || null;
  const partial = current && (current.status === "in_progress" || current.status === "review") ? 0.5 : 0;
  return { percent: Math.round(((done + partial) / steps.length) * 100), current };
}

export function clientNextActions(snap: Awaited<ReturnType<typeof projectSnapshot>>): NextAction[] {
  const actions: NextAction[] = [];
  for (const d of snap.documents) if (d.needs_signature && d.status === "sent") actions.push({ type: "sign", label: `Signer « ${d.title} »`, title: d.title, target: "documents", id: d.id });
  for (const s of snap.steps) if (s.status === "review" && s.needs_validation) actions.push({ type: "validate", label: `Valider l'étape « ${s.title} »`, title: s.title, target: "home", id: s.id });
  for (const inv of snap.invoices) {
    if (inv.kind === "devis" && inv.status === "envoye") actions.push({ type: "accept_quote", label: `Répondre au devis « ${inv.title} »`, title: inv.title, target: "payments", id: inv.id });
    if (inv.kind === "facture" && inv.status === "envoye") actions.push({ type: "pay", label: `Régler « ${inv.title} » (${formatMoney(inv.amount, inv.currency)})`, title: inv.title, amount: formatMoney(inv.amount, inv.currency), target: "payments", id: inv.id, due: inv.due_date });
  }
  const todo = snap.checklist.filter((c: any) => c.status === "todo").sort((a: any, b: any) => String(a.due_date || "9").localeCompare(String(b.due_date || "9")));
  for (const c of todo) actions.push({ type: "checklist", label: c.label, title: c.label, kind: c.kind, target: "todo", id: c.id, due: c.due_date });
  if (snap.unreadMessages) actions.push({ type: "message", label: `${snap.unreadMessages} nouveau(x) message(s)`, title: String(snap.unreadMessages), target: "messages" });
  return actions;
}

/* ── Tableau « Qui attend qui ? » (admin) ── */
export async function waitingBoard(db: any) {
  const today = todayIso();
  const { results: projects } = await db
    .prepare(
      `SELECT p.id, p.title, p.pack, p.status, p.due_date, p.client_id, p.weekly_update_at, c.name AS client_name, c.company AS client_company, c.phone AS client_phone, c.slug AS client_slug, c.last_seen_at
       FROM client_projects p JOIN clients c ON c.id = p.client_id
       WHERE p.status IN ('actif','pause','livre') ORDER BY p.created_at DESC`
    )
    .all();
  if (!projects?.length) return { projects: [], waitingClient: [], waitingUs: [], late: [] };

  const ids = projects.map((p: any) => p.id);
  const ph = ids.map(() => "?").join(",");
  const [steps, checklist, docs, invoices, msgs, reqs] = await db.batch([
    db.prepare(`SELECT id, project_id, title, status, due_date, needs_validation, sort_order FROM project_steps WHERE project_id IN (${ph}) ORDER BY sort_order`).bind(...ids),
    db.prepare(`SELECT id, project_id, label, status, due_date, sent_at FROM checklist_items WHERE project_id IN (${ph})`).bind(...ids),
    db.prepare(`SELECT id, project_id, title, status, needs_signature, sent_at FROM client_documents WHERE project_id IN (${ph}) AND status = 'sent'`).bind(...ids),
    db.prepare(`SELECT id, project_id, kind, title, status, sent_at, amount, currency FROM invoices WHERE project_id IN (${ph}) AND status IN ('envoye','accepte')`).bind(...ids),
    db.prepare(`SELECT project_id, COUNT(*) AS n, MIN(created_at) AS oldest FROM messages WHERE project_id IN (${ph}) AND author = 'client' AND read_by_admin_at IS NULL GROUP BY project_id`).bind(...ids),
    db.prepare(`SELECT project_id, COUNT(*) AS n, MIN(created_at) AS oldest FROM project_requests WHERE project_id IN (${ph}) AND status = 'nouveau' GROUP BY project_id`).bind(...ids),
  ]);

  const by = (rows: any[]) => {
    const m = new Map<number, any[]>();
    for (const r of rows || []) {
      if (!m.has(r.project_id)) m.set(r.project_id, []);
      m.get(r.project_id)!.push(r);
    }
    return m;
  };
  const S = by(steps.results), C = by(checklist.results), D = by(docs.results), I = by(invoices.results), M = by(msgs.results), R = by(reqs.results);

  const waitingClient: any[] = [];
  const waitingUs: any[] = [];
  const late: any[] = [];
  const enriched = projects.map((p: any) => {
    const st = S.get(p.id) || [];
    const progress = computeProgress(st);
    const items: { client: string[]; us: string[] } = { client: [], us: [] };
    let oldestClient: string | null = null;

    for (const c of C.get(p.id) || []) {
      if (c.status === "todo") {
        items.client.push(c.label);
        if (c.due_date && (!oldestClient || c.due_date < oldestClient)) oldestClient = c.due_date;
      }
      if (c.status === "sent") items.us.push(`Vérifier : ${c.label}`);
    }
    for (const d of D.get(p.id) || []) if (d.needs_signature) items.client.push(`Signature : ${d.title}`);
    for (const inv of I.get(p.id) || []) {
      if (inv.status === "envoye") items.client.push(`${inv.kind === "devis" ? "Réponse au devis" : "Paiement"} : ${inv.title}`);
    }
    for (const s of st) if (s.status === "review") items.client.push(`Validation : ${s.title}`);
    const m = (M.get(p.id) || [])[0];
    if (m) items.us.push(`${m.n} message(s) non lu(s)`);
    const r = (R.get(p.id) || [])[0];
    if (r) items.us.push(`${r.n} retour(s) / demande(s) à traiter`);
    const cur = progress.current;
    const active = p.status === "actif";
    if (active && cur && cur.status === "in_progress") items.us.push(`Étape en cours : ${cur.title}`);

    const isLate = active && ((cur?.due_date && cur.due_date < today) || (p.due_date && p.due_date < today));
    const row = { ...p, progress: progress.percent, current_step: cur?.title || "Terminé", current_status: cur?.status || "done", waiting_client: items.client, waiting_us: items.us, oldest_client_due: oldestClient, late: !!isLate };
    if (items.client.length) waitingClient.push(row);
    if (items.us.length) waitingUs.push(row);
    if (isLate) late.push(row);
    return row;
  });

  return { projects: enriched, waitingClient, waitingUs, late };
}
