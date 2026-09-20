/* ------------------------------------------------------------------
   Helpers D1 pour les formulaires prospects (enquêtes permanentes).
------------------------------------------------------------------- */

interface Env {
  DB: D1Database;
}

export interface SurveyQuestion {
  id: number;
  type: string;
  label: string;
  description: string | null;
  required: number;
  sort_order: number;
  config: any;
}

export interface SurveySection {
  id: number;
  title: string;
  description: string | null;
  sort_order: number;
  condition: any;
  questions: SurveyQuestion[];
}

export interface SurveyForm {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  redirect_url: string | null;
  active: number;
  sections: SurveySection[];
}

export async function getFormBySlug(db: D1Database, slug: string): Promise<SurveyForm | null> {
  const form = await db.prepare("SELECT * FROM survey_forms WHERE slug = ? AND active = 1").bind(slug).first();
  if (!form) return null;

  const sections = await db
    .prepare("SELECT * FROM survey_sections WHERE form_id = ? ORDER BY sort_order, id")
    .bind(form.id)
    .all();

  const questions = await db
    .prepare(
      `SELECT q.* FROM survey_questions q
       JOIN survey_sections s ON q.section_id = s.id
       WHERE s.form_id = ?
       ORDER BY q.sort_order, q.id`
    )
    .bind(form.id)
    .all();

  const questionsBySection = new Map<number, SurveyQuestion[]>();
  for (const q of questions.results) {
    const parsed: SurveyQuestion = {
      id: q.id as number,
      type: q.type as string,
      label: q.label as string,
      description: q.description as string | null,
      required: q.required as number,
      sort_order: q.sort_order as number,
      config: q.config ? JSON.parse(q.config as string) : null,
    };
    const list = questionsBySection.get(q.section_id as number) || [];
    list.push(parsed);
    questionsBySection.set(q.section_id as number, list);
  }

  const result: SurveyForm = {
    id: form.id as number,
    slug: form.slug as string,
    title: form.title as string,
    description: form.description as string | null,
    redirect_url: form.redirect_url as string | null,
    active: form.active as number,
    sections: sections.results.map((s) => ({
      id: s.id as number,
      title: s.title as string,
      description: s.description as string | null,
      sort_order: s.sort_order as number,
      condition: s.condition ? JSON.parse(s.condition as string) : null,
      questions: questionsBySection.get(s.id as number) || [],
    })),
  };

  return result;
}

export async function getFormStructureForAdmin(db: D1Database, formId: number): Promise<SurveyForm | null> {
  const form = await db.prepare("SELECT * FROM survey_forms WHERE id = ?").bind(formId).first();
  if (!form) return null;

  const sections = await db
    .prepare("SELECT * FROM survey_sections WHERE form_id = ? ORDER BY sort_order, id")
    .bind(formId)
    .all();

  const questions = await db
    .prepare(
      `SELECT q.* FROM survey_questions q
       JOIN survey_sections s ON q.section_id = s.id
       WHERE s.form_id = ?
       ORDER BY q.sort_order, q.id`
    )
    .bind(formId)
    .all();

  const questionsBySection = new Map<number, SurveyQuestion[]>();
  for (const q of questions.results) {
    const parsed: SurveyQuestion = {
      id: q.id as number,
      type: q.type as string,
      label: q.label as string,
      description: q.description as string | null,
      required: q.required as number,
      sort_order: q.sort_order as number,
      config: q.config ? JSON.parse(q.config as string) : null,
    };
    const list = questionsBySection.get(q.section_id as number) || [];
    list.push(parsed);
    questionsBySection.set(q.section_id as number, list);
  }

  return {
    id: form.id as number,
    slug: form.slug as string,
    title: form.title as string,
    description: form.description as string | null,
    redirect_url: form.redirect_url as string | null,
    active: form.active as number,
    sections: sections.results.map((s) => ({
      id: s.id as number,
      title: s.title as string,
      description: s.description as string | null,
      sort_order: s.sort_order as number,
      condition: s.condition ? JSON.parse(s.condition as string) : null,
      questions: questionsBySection.get(s.id as number) || [],
    })),
  };
}

export async function createResponse(
  db: D1Database,
  formId: number,
  ip: string,
  userAgent: string
): Promise<number> {
  const result = await db
    .prepare("INSERT INTO survey_responses (form_id, ip_address, user_agent) VALUES (?, ?, ?)")
    .bind(formId, ip, userAgent)
    .run();
  return result.meta.last_row_id as number;
}

export async function saveAnswers(
  db: D1Database,
  responseId: number,
  answers: { question_id: number; value: string }[]
): Promise<void> {
  if (!answers.length) return;
  const stmt = db.prepare(
    "INSERT INTO survey_answers (response_id, question_id, value) VALUES (?, ?, ?)"
  );
  const batch = answers.map((a) => stmt.bind(responseId, a.question_id, a.value));
  await db.batch(batch);
}

export async function completeResponse(
  db: D1Database,
  responseId: number,
  contact: { name?: string; email?: string; phone?: string; company?: string }
): Promise<void> {
  await db
    .prepare(
      `UPDATE survey_responses
       SET completed_at = CURRENT_TIMESTAMP,
           respondent_name = ?, respondent_email = ?, respondent_phone = ?, respondent_company = ?
       WHERE id = ?`
    )
    .bind(
      contact.name || null,
      contact.email || null,
      contact.phone || null,
      contact.company || null,
      responseId
    )
    .run();
}

export async function getResponses(
  db: D1Database,
  formId: number,
  opts: { page?: number; search?: string; completed?: boolean } = {}
): Promise<{ responses: any[]; total: number }> {
  const limit = 25;
  const offset = ((opts.page || 1) - 1) * limit;
  let where = "WHERE form_id = ?";
  const binds: any[] = [formId];

  if (opts.completed !== undefined) {
    where += opts.completed ? " AND completed_at IS NOT NULL" : " AND completed_at IS NULL";
  }
  if (opts.search) {
    where += " AND (respondent_name LIKE ? OR respondent_email LIKE ? OR respondent_phone LIKE ?)";
    const s = `%${opts.search}%`;
    binds.push(s, s, s);
  }

  const [countResult, rows] = await db.batch([
    db.prepare(`SELECT COUNT(*) as total FROM survey_responses ${where}`).bind(...binds),
    db
      .prepare(`SELECT * FROM survey_responses ${where} ORDER BY id DESC LIMIT ? OFFSET ?`)
      .bind(...binds, limit, offset),
  ]);

  return {
    total: (countResult.results[0] as any).total,
    responses: rows.results,
  };
}

export async function getResponseDetail(db: D1Database, responseId: number) {
  const [response, answers] = await db.batch([
    db.prepare("SELECT * FROM survey_responses WHERE id = ?").bind(responseId),
    db
      .prepare(
        `SELECT a.*, q.label, q.type, q.config
         FROM survey_answers a
         JOIN survey_questions q ON a.question_id = q.id
         WHERE a.response_id = ?
         ORDER BY q.sort_order, q.id`
      )
      .bind(responseId),
  ]);

  return {
    response: response.results[0] || null,
    answers: answers.results,
  };
}

export async function getFormStats(db: D1Database, formId: number) {
  const [totalResult, completedResult, questions] = await db.batch([
    db.prepare("SELECT COUNT(*) as total FROM survey_responses WHERE form_id = ?").bind(formId),
    db
      .prepare("SELECT COUNT(*) as total FROM survey_responses WHERE form_id = ? AND completed_at IS NOT NULL")
      .bind(formId),
    db
      .prepare(
        `SELECT q.id, q.label, q.type, q.config
         FROM survey_questions q
         JOIN survey_sections s ON q.section_id = s.id
         WHERE s.form_id = ? AND q.type IN ('single_choice', 'multi_choice', 'yes_no', 'scale')
         ORDER BY q.sort_order, q.id`
      )
      .bind(formId),
  ]);

  const total = (totalResult.results[0] as any).total;
  const completed = (completedResult.results[0] as any).total;

  const questionStats = [];
  for (const q of questions.results) {
    const answers = await db
      .prepare("SELECT value, COUNT(*) as count FROM survey_answers WHERE question_id = ? GROUP BY value")
      .bind(q.id)
      .all();
    questionStats.push({
      id: q.id,
      label: q.label,
      type: q.type,
      config: q.config ? JSON.parse(q.config as string) : null,
      distribution: answers.results,
    });
  }

  return { total, completed, completionRate: total ? Math.round((completed / total) * 100) : 0, questionStats };
}

export async function exportResponsesCsv(db: D1Database, formId: number): Promise<string> {
  const questions = await db
    .prepare(
      `SELECT q.id, q.label FROM survey_questions q
       JOIN survey_sections s ON q.section_id = s.id
       WHERE s.form_id = ?
       ORDER BY s.sort_order, s.id, q.sort_order, q.id`
    )
    .bind(formId)
    .all();

  const responses = await db
    .prepare("SELECT * FROM survey_responses WHERE form_id = ? ORDER BY id")
    .bind(formId)
    .all();

  const allAnswers = await db
    .prepare(
      `SELECT a.response_id, a.question_id, a.value
       FROM survey_answers a
       JOIN survey_responses r ON a.response_id = r.id
       WHERE r.form_id = ?`
    )
    .bind(formId)
    .all();

  const answerMap = new Map<string, string>();
  for (const a of allAnswers.results) {
    answerMap.set(`${a.response_id}-${a.question_id}`, (a.value as string) || "");
  }

  const csvEscape = (v: string) => {
    if (v.includes(",") || v.includes('"') || v.includes("\n")) return `"${v.replace(/"/g, '""')}"`;
    return v;
  };

  const headers = ["ID", "Nom", "Email", "Téléphone", "Entreprise", "Date", "Complété", ...questions.results.map((q) => q.label as string)];
  const rows = [headers.map(csvEscape).join(",")];

  for (const r of responses.results) {
    const row = [
      String(r.id),
      (r.respondent_name as string) || "",
      (r.respondent_email as string) || "",
      (r.respondent_phone as string) || "",
      (r.respondent_company as string) || "",
      (r.started_at as string) || "",
      (r.completed_at as string) || "",
      ...questions.results.map((q) => answerMap.get(`${r.id}-${q.id}`) || ""),
    ];
    rows.push(row.map(csvEscape).join(","));
  }

  return rows.join("\n");
}
