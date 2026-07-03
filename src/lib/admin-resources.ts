/* ------------------------------------------------------------------
   Registre des ressources gérables depuis le dashboard admin.
   Chaque entrée décrit la table D1 et les colonnes modifiables —
   les routes API génériques /api/admin/[resource] s'appuient dessus.
------------------------------------------------------------------- */

export const RESOURCES = {
  services: {
    table: "services",
    orderBy: "sort_order, id",
    columns: ["slug", "tag", "title", "short_desc", "headline", "accent", "description", "features", "ideal", "price", "delay", "image", "sort_order", "active"],
  },
  offers: {
    table: "offers",
    orderBy: "sort_order, id",
    columns: ["tag", "title", "price", "is_quote", "popular", "features", "image", "sort_order", "active"],
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
    columns: ["question", "answer", "sort_order", "active"],
  },
  posts: {
    table: "posts",
    orderBy: "sort_order, id",
    columns: ["title", "category", "date", "read_time", "excerpt", "image", "featured", "sort_order", "active"],
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
};
