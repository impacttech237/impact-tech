/* ------------------------------------------------------------------
   Chargement du contenu du site depuis D1.
   Toutes les pages passent par getContent() : une seule requête
   batch, puis mapping vers les formes attendues par les composants.
   Si la BD est indisponible, on renvoie les valeurs par défaut.
------------------------------------------------------------------- */
import { getDB } from "./db";
import { DEFAULTS } from "./defaults";

function parseJson(value, fallback) {
  try {
    const v = JSON.parse(value);
    return Array.isArray(v) || typeof v === "object" ? v : fallback;
  } catch {
    return fallback;
  }
}

export async function getContent() {
  const db = await getDB();
  if (!db) return DEFAULTS;

  try {
    const [settingsQ, statsQ, servicesQ, offersQ, testimonialsQ, faqsQ, postsQ, projectsQ, stepsQ] =
      await db.batch([
        db.prepare("SELECT key, value FROM settings"),
        db.prepare("SELECT * FROM stats WHERE active = 1 ORDER BY sort_order, id"),
        db.prepare("SELECT * FROM services WHERE active = 1 ORDER BY sort_order, id"),
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
      services: servicesQ.results.map((r) => ({
        slug: r.slug,
        tag: r.tag,
        title: r.title,
        shortDesc: r.short_desc,
        headline: r.headline,
        accent: r.accent,
        description: r.description,
        features: parseJson(r.features, []),
        ideal: r.ideal,
        price: r.price,
        delay: r.delay,
        image: r.image,
      })),
      offers: offersQ.results.map((r) => ({
        tag: r.tag,
        title: r.title,
        price: r.price,
        isQuote: !!r.is_quote,
        popular: !!r.popular,
        features: parseJson(r.features, []),
        image: r.image,
      })),
      testimonials: testimonialsQ.results.map((r) => ({
        name: r.name,
        role: r.role,
        text: r.text,
        initials: r.initials,
      })),
      faqs: faqsQ.results.map((r) => ({ q: r.question, a: r.answer })),
      posts: postsQ.results.map((r) => ({
        title: r.title,
        category: r.category,
        date: r.date,
        readTime: r.read_time,
        excerpt: r.excerpt,
        image: r.image,
        featured: !!r.featured,
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
