-- Contenu EN (traduction fidèle du FR déjà en prod + copy EN fournie dans
-- les mémos stratégiques pour les sections où elle était donnée texto).
--   wrangler d1 execute impact-tech-db --remote --file=db/seed-bilingual.sql

UPDATE offers SET
  title_en = 'Your online presence, professional and reassuring.',
  hook_en = 'You lose customers every day your business doesn''t have a professional website. Your competitors have one. Your prospects search on Google. They don''t find you.',
  ideal_en = 'The business owner or SME that doesn''t have a professional online presence yet — or whose current site is driving customers away.',
  delay_en = '10-14 days',
  price_eur = '230',
  total_value_en = '€590+',
  features_en = '[
    "Professional showcase website (home, about, services, contact)",
    "Domain name + 1 year hosting included",
    "SSL certificate (https) + responsive design",
    "Annual renewal: €38/year (domain + hosting)"
  ]',
  value_stack_en = '[
    "Custom design tailored to your brand (not a generic template) — 120,000 FCFA",
    "Up to 7 optimized pages (home, services, about, contact...) — 80,000 FCFA",
    "Native mobile responsive — 50,000 FCFA",
    "Basic SEO optimization — 40,000 FCFA",
    "Smart contact form with notifications — 20,000 FCFA",
    "WhatsApp Business integration (floating button) — 15,000 FCFA",
    "1 year hosting included + domain name — 35,000 FCFA",
    "1h training so you can manage your site yourself — 25,000 FCFA"
  ]'
WHERE tag = 'Impact Vitrine';

UPDATE offers SET
  title_en = 'Your business, managed — even without an internet connection.',
  hook_en = 'Managing orders via WhatsApp and cash payments? Meanwhile your competitors are cashing in online 24/7 via Mobile Money. Time to catch up — and overtake.',
  ideal_en = 'The business that wants to sell online, take bookings, or manage clients from a dashboard.',
  delay_en = '3-4 weeks',
  price_eur = '610',
  total_value_en = '€1,440+',
  features_en = '[
    "Works even without an internet connection (offline mode)",
    "Client, stock and sales management from a single tool",
    "Automatic sync as soon as the connection returns",
    "Annual renewal: €53/year (hosting + support)"
  ]',
  value_stack_en = '[
    "Everything in the Impact Vitrine plan — 385,000 FCFA",
    "Online product / service catalogue — 80,000 FCFA",
    "Integrated payment: MTN MoMo + Orange Money + card — 120,000 FCFA",
    "Admin dashboard (orders, clients, statistics) — 100,000 FCFA",
    "Online booking system — 60,000 FCFA",
    "Automatic notifications (email + WhatsApp) — 50,000 FCFA",
    "Secure client area — 45,000 FCFA",
    "2h training + 30-day priority support — 60,000 FCFA",
    "1 year hosting + domain + SSL — 45,000 FCFA"
  ]'
WHERE tag = 'Impact Gestion';

UPDATE offers SET
  title_en = 'The 100% custom solution for your business.',
  hook_en = 'You have a specific problem that generic solutions don''t solve. You need a tool designed for YOUR reality — not an adapted template.',
  ideal_en = 'The business or project owner that needs a custom digital tool: mobile app, SaaS platform, management software, internal tool.',
  delay_en = 'Depends on complexity (estimated during the discovery call)',
  price_eur = 'Custom quote',
  total_value_en = NULL,
  features_en = '[
    "Solution tailored to your business, not generic software",
    "Architecture designed to scale without rebuilding",
    "Dedicated support and maintenance"
  ]',
  value_stack_en = '[
    "Full needs audit + detailed specification — 150,000 FCFA",
    "Custom technical architecture (tech stack, database, API) — 200,000 FCFA",
    "Full front-end + back-end development — depends on complexity",
    "Professional UX/UI design (mockups approved before development) — 250,000 FCFA",
    "Third-party integrations (payment, API, CRM, ERP) — depends on needs",
    "Full testing + bug fixing — 100,000 FCFA",
    "Deployment + go-live — 80,000 FCFA",
    "Team training + technical documentation — 100,000 FCFA",
    "60-day priority post-launch support — 120,000 FCFA",
    "Unlimited revisions during development — priceless"
  ]'
WHERE tag = 'Impact Signature';

UPDATE faqs SET
  question_en = 'How do I know which plan is right for me?',
  answer_en = 'If you just want to be visible online → Impact Vitrine. If you want to sell or manage bookings → Impact Gestion. If you have a specific need (app, SaaS, software) → Impact Signature. The free discovery call helps you choose.'
WHERE question = 'Comment savoir quel pack me convient ?';

UPDATE faqs SET
  question_en = 'Why "pay on delivery"? Is it really free upfront?',
  answer_en = 'Yes. We build your project in full. You test the result. You only pay once you''re satisfied — no deposit required.'
WHERE question = 'Pourquoi « paiement à la livraison » ? C''est vraiment gratuit au départ ?';

UPDATE faqs SET
  question_en = 'What are the timelines?',
  answer_en = 'Impact Vitrine: 10-14 days. Impact Gestion: 3-4 weeks. Impact Signature: depends on complexity (estimated during the discovery call).'
WHERE question = 'Quels sont les délais ?';

UPDATE faqs SET
  question_en = 'Do you work with clients in Europe?',
  answer_en = 'Yes. We have clients in Cameroon and Northern Europe. We communicate via video call, WhatsApp and email. Same quality, same responsiveness, pricing adjusted to value.'
WHERE question = 'Est-ce que vous travaillez avec des clients en Europe ?';

UPDATE faqs SET
  question_en = 'What happens after delivery?',
  answer_en = 'You''re trained to manage your site. Hosting is included for 1 year. Post-launch support is included (duration depends on the plan). Hosting renewal starts at €38/year.'
WHERE question = 'Que se passe-t-il après la livraison ?';

UPDATE faqs SET
  question_en = 'Do you use WordPress?',
  answer_en = 'Not systematically. We choose the technology that fits your needs. WordPress for some showcase sites, custom solutions for the rest. The goal: performance, security, scalability.'
WHERE question = 'Vous utilisez WordPress ?';
