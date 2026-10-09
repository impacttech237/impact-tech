/* ------------------------------------------------------------------
   Registre des ressources gérables depuis le dashboard admin.
   Chaque entrée décrit la table D1 et les colonnes modifiables —
   les routes API génériques /api/admin/[resource] s'appuient dessus.
------------------------------------------------------------------- */

export const RESOURCES = {
  // "services" fusionnée dans "offers" (refonte) : chaque pack EST le service.
  // Table conservée en base (dépréciée) mais retirée du dashboard admin.
  offers: {
    table: "offers",
    orderBy: "sort_order, id",
    columns: [
      "tag", "title", "description", "price", "is_quote", "popular", "features", "image", "sort_order", "active",
      "hook", "ideal", "delay", "value_stack", "total_value",
      // Bilingue EN (refonte)
      "title_en", "description_en", "hook_en", "ideal_en", "delay_en", "features_en", "value_stack_en", "total_value_en", "price_eur",
    ],
  },
  testimonials: {
    table: "testimonials",
    orderBy: "sort_order, id",
    columns: ["name", "role", "text", "initials", "sort_order", "active"],
  },
  stats: {
    table: "stats",
    orderBy: "sort_order, id",
    columns: ["value", "suffix", "label", "note", "sort_order", "active"],
  },
  faqs: {
    table: "faqs",
    orderBy: "sort_order, id",
    columns: ["question", "answer", "sort_order", "active", "question_en", "answer_en"],
  },
  posts: {
    table: "posts",
    orderBy: "sort_order, id",
    columns: ["title", "category", "date", "read_time", "excerpt", "image", "featured", "sort_order", "active", "eyebrow", "lead", "secondary_image", "author", "sections"],
  },
  projects: {
    table: "projects",
    orderBy: "sort_order, id",
    columns: ["title", "category", "description", "result", "image", "sort_order", "active"],
  },
  "process-steps": {
    table: "process_steps",
    orderBy: "sort_order, id",
    columns: ["num", "title", "description", "sort_order", "active"],
  },
  requests: {
    table: "contact_requests",
    orderBy: "id DESC",
    columns: ["status"], // seule la mise à jour du statut est autorisée
    noCreate: true,
  },
  subscribers: {
    table: "newsletter_subscribers",
    orderBy: "id DESC",
    columns: [],
    noCreate: true,
  },
  payments: {
    // Lecture seule : le statut est mis à jour uniquement par le webhook K-PAY
    // (source d'autorité), jamais modifié à la main depuis le dashboard.
    table: "payments",
    orderBy: "id DESC",
    columns: [],
    noCreate: true,
  },
};
