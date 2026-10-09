/* ------------------------------------------------------------------
   Chargement du contenu du site depuis D1.
   Toutes les pages passent par getContent(env) : une seule requête
   batch, puis mapping vers les formes attendues par les composants.
   Si la BD est indisponible, on renvoie les valeurs par défaut.
------------------------------------------------------------------- */
import { DEFAULTS } from "./defaults";

function parseJson(value, fallback) {
  try {
    const v = JSON.parse(value);
    return Array.isArray(v) || typeof v === "object" ? v : fallback;
  } catch {
    return fallback;
  }
}

/* Bilingue (refonte) : sur les pages /en/*, on préfère la colonne "_en" et
   on retombe sur le FR si elle est vide — jamais de trou de contenu. */
export async function getContent(env, locale = "fr") {
  const db = env?.DB;
  if (!db) return DEFAULTS;
  const en = locale === "en";
  const pick = (enValue, frValue) => (en && enValue ? enValue : frValue);

  try {
    const [settingsQ, statsQ, offersQ, testimonialsQ, faqsQ, postsQ, projectsQ, stepsQ] =
      await db.batch([
        db.prepare("SELECT key, value FROM settings"),
        db.prepare("SELECT * FROM stats WHERE active = 1 ORDER BY sort_order, id"),
        db.prepare("SELECT * FROM offers WHERE active = 1 ORDER BY sort_order, id"),
        db.prepare("SELECT * FROM testimonials WHERE active = 1 ORDER BY sort_order, id"),
        db.prepare("SELECT * FROM faqs WHERE active = 1 ORDER BY sort_order, id"),
        db.prepare("SELECT * FROM posts WHERE active = 1 ORDER BY sort_order, id"),
        db.prepare("SELECT * FROM projects WHERE active = 1 ORDER BY sort_order, id"),
        db.prepare("SELECT * FROM process_steps WHERE active = 1 ORDER BY sort_order, id"),
      ]);

    const settings = { ...DEFAULTS.settings };
    for (const row of settingsQ.results) settings[row.key] = row.value;
    settings.marquee_items = parseJson(settings.marquee_items, DEFAULTS.settings.marquee_items);
    settings.hero_pills = parseJson(settings.hero_pills, DEFAULTS.settings.hero_pills);

    return {
      settings,
      stats: statsQ.results.map((r) => ({
        value: r.value,
        suffix: r.suffix ?? "",
        label: r.label,
        note: r.note ?? "",
      })),
      offers: offersQ.results.map((r) => ({
        tag: pick(r.tag_en, r.tag),
        title: pick(r.title_en, r.title),
        description: pick(r.description_en, r.description) || "",
        price: en ? (r.price_eur || r.price) : r.price,
        currency: en && r.price_eur ? "EUR" : "FCFA",
        // Prix EUR brut, exposé même en FR pour afficher un petit équivalent
        // €/‌FCFA aux prospects internationaux francophones (grille v2).
        priceEur: r.price_eur || "",
        isQuote: !!r.is_quote,
        popular: !!r.popular,
        features: en ? parseJson(r.features_en, parseJson(r.features, [])) : parseJson(r.features, []),
        image: r.image,
        // Colonnes de fusion Services -> Offres (refonte) : chaque pack
        // porte désormais l'accroche, la cible, le délai et le value stack.
        hook: pick(r.hook_en, r.hook) || "",
        ideal: pick(r.ideal_en, r.ideal) || "",
        delay: pick(r.delay_en, r.delay) || "",
        valueStack: en ? parseJson(r.value_stack_en, parseJson(r.value_stack, [])) : parseJson(r.value_stack, []),
        totalValue: pick(r.total_value_en, r.total_value) || "",
      })),
      testimonials: testimonialsQ.results.map((r) => ({
        name: r.name,
        role: r.role,
        text: r.text,
        initials: r.initials,
      })),
      faqs: faqsQ.results.map((r) => ({ q: pick(r.question_en, r.question), a: pick(r.answer_en, r.answer) })),
      posts: postsQ.results.map((r) => ({
        title: r.title,
        category: r.category,
        date: r.date,
        readTime: r.read_time,
        excerpt: r.excerpt,
        image: r.image,
        featured: !!r.featured,
        // Contenu riche de la page article (rédigé depuis le dashboard).
        // Champs vides/absents => hydrateArticle retombe sur les valeurs par défaut.
        eyebrow: r.eyebrow || "",
        lead: r.lead || "",
        secondaryImage: r.secondary_image || "",
        author: r.author || "",
        sections: parseJson(r.sections, null),
      })),
      projects: projectsQ.results.map((r) => ({
        title: r.title,
        category: r.category,
        description: r.description,
        result: r.result,
        image: r.image,
      })),
      processSteps: stepsQ.results.map((r) => ({
        num: r.num,
        title: r.title,
        description: r.description,
      })),
    };
  } catch (e) {
    console.error("getContent: lecture D1 impossible, fallback defaults —", e?.message);
    return DEFAULTS;
  }
}
