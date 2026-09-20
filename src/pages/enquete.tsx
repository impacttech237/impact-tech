/* ------------------------------------------------------------------
   /enquete/:slug — page formulaire prospect.
   Shell SSR minimal : la structure du formulaire est embarquée
   en JSON et le rendu interactif se fait côté client (survey.js).
------------------------------------------------------------------- */
import Layout from "../layout";
import type { SurveyForm } from "../lib/surveys";

export default function EnquetePage({ form }: { form: SurveyForm }) {
  return (
    <Layout
      title={`${form.title} — Questionnaire`}
      description={form.description || `Questionnaire ${form.title} — Impact Tech`}
      canonical={`/enquete/${form.slug}`}
    >
      <div id="survey-root" data-slug={form.slug}></div>
      <script
        id="survey-data"
        type="application/json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(form) }}
      />
      <script type="module" src="/survey.js"></script>
    </Layout>
  );
}
