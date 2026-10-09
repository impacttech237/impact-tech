-- Contenu de la nouvelle grille tarifaire v2 : renommage des 3 packs,
-- double tarification FCFA/EUR non-convertie (pricing de marché EU distinct),
-- copy "bénéfice concret" (remplace le value stack chiffré FCFA/ligne).
--   wrangler d1 execute impact-tech-db --remote --file=db/seed-tarifs-v2.sql

UPDATE offers SET
  tag = 'Impact Essentiel',
  tag_en = 'Essential',
  title = 'Votre vitrine professionnelle sur internet',
  title_en = 'Your professional online presence',
  hook = 'Vous perdez des clients chaque jour où votre entreprise n''a pas de site professionnel. Vos concurrents en ont un. Vos prospects cherchent sur Google. Ils ne vous trouvent pas.',
  hook_en = 'You lose customers every day your business doesn''t have a professional website. Your competitors have one. Your prospects search on Google. They don''t find you.',
  ideal = 'L''entrepreneur ou la PME qui veut enfin être trouvé sur Google et inspirer confiance dès le premier clic.',
  ideal_en = 'The startup or SME that needs a professional online presence — without the €5K+ agency price tag.',
  description = 'Un site professionnel qui travaille pour vous 24h/24. Même quand vous dormez, vos prospects vous trouvent.',
  description_en = 'A professional website that works for you 24/7. Even while you sleep, your prospects find you.',
  price = '150 000',
  price_eur = '1 490',
  delay = '10-14 jours',
  delay_en = '10-14 days',
  is_quote = 0,
  popular = 0,
  features = '[
    "Design unique à votre image, pas un template générique",
    "Jusqu''à 5 pages, adapté mobile/tablette/PC",
    "Visible sur Google + bouton WhatsApp direct",
    "Hébergement 1 an + nom de domaine inclus"
  ]',
  features_en = '[
    "Custom design tailored to you, not a template",
    "Up to 5 pages, fully responsive",
    "Google-visible + WhatsApp button",
    "1-year hosting + domain included"
  ]',
  value_stack = '[
    "Design unique à votre image — pas un template copié-collé, votre marque et vos couleurs",
    "Jusqu''à 5 pages — Accueil + Services + À propos + Contact + 1 page au choix",
    "Adapté à tous les écrans — parfait sur mobile, tablette et ordinateur",
    "Visible sur Google — les bases pour que vos clients vous trouvent",
    "Formulaire de contact intelligent — email + notification dès qu''un prospect écrit",
    "Bouton WhatsApp — vos visiteurs vous contactent en 1 clic",
    "Hébergement 1 an + nom de domaine — votre site en ligne avec votre propre adresse web",
    "Formation pour gérer votre site — 1h pour modifier vos textes et images vous-même",
    "Renouvellement annuel : 25 000 FCFA (domaine + hébergement)"
  ]',
  value_stack_en = '[
    "Custom design tailored to your brand — not a copy-paste template, your identity, your colors",
    "Up to 5 pages — Home + Services + About + Contact + 1 page of your choice",
    "Fully responsive — perfect on mobile, tablet and desktop",
    "Visible on Google — the basics so clients find you when they search",
    "Smart contact form — email + notification the moment a prospect reaches out",
    "WhatsApp button — visitors contact you in 1 click, directly on WhatsApp",
    "1-year hosting + domain name — your site live with its own web address",
    "Training to manage your site — 1h to learn to edit your texts and images yourself",
    "Annual renewal: €38 (domain + hosting)"
  ]',
  total_value = '385 000 FCFA',
  total_value_en = '€3,500+'
WHERE tag = 'Impact Vitrine';

UPDATE offers SET
  tag = 'Impact Business',
  tag_en = 'Business',
  title = 'Votre site devient un outil de vente',
  title_en = 'Your website becomes a selling tool',
  hook = 'Vous gérez vos commandes par WhatsApp et vos paiements en espèces ? Pendant ce temps, vos concurrents encaissent en ligne 24h/24 via Mobile Money. Il est temps de rattraper — et de dépasser.',
  hook_en = 'Managing orders via WhatsApp and cash payments? Meanwhile your competitors are cashing in online 24/7. Time to catch up — and overtake.',
  ideal = 'L''entreprise qui veut vendre en ligne, prendre des rendez-vous, ou gérer ses clients depuis son téléphone.',
  ideal_en = 'The business ready to sell online, take bookings, and manage everything from one dashboard.',
  description = 'Transformez votre site en machine à vendre. Vos clients paient, réservent, et commandent — vous gérez tout depuis votre tableau de bord.',
  description_en = 'Turn your website into a selling machine. Your clients pay, book, and order — you manage everything from your dashboard.',
  price = '400 000',
  price_eur = '3 490',
  delay = '3-4 semaines',
  delay_en = '3-4 weeks',
  is_quote = 0,
  popular = 1,
  features = '[
    "Tout l''Essentiel inclus",
    "Catalogue + paiement en ligne (Mobile Money, carte)",
    "Tableau de bord privé + réservation en ligne",
    "Formation 2h + support 30 jours"
  ]',
  features_en = '[
    "Everything in Essential",
    "Catalog + online payments (Stripe, PayPal, cards)",
    "Private dashboard + online booking",
    "2h training + 30-day support"
  ]',
  value_stack = '[
    "Tout le pack Essentiel inclus — design unique, 5 pages, mobile, SEO, WhatsApp, hébergement",
    "Pages supplémentaires (jusqu''à 10) — plus de place pour vos produits, services et témoignages",
    "Catalogue en ligne — vos clients voient vos produits avec prix, photos et descriptions",
    "Paiement en ligne intégré — Mobile Money (MTN MoMo + Orange Money) + carte bancaire",
    "Tableau de bord privé — commandes, clients et chiffres en temps réel depuis votre téléphone",
    "Réservation en ligne — vos clients prennent rendez-vous sans vous appeler",
    "Notifications automatiques — confirmations par email et WhatsApp",
    "Espace client sécurisé — vos clients suivent leurs commandes et leur historique",
    "Formation complète (2h) + support 30 jours après livraison"
  ]',
  value_stack_en = '[
    "Everything in the Essential plan — custom design, 5 pages, mobile, SEO, WhatsApp, hosting",
    "Extra pages (up to 10) — more room for your products, services and testimonials",
    "Online catalog — clients see your products with prices, photos and descriptions",
    "Integrated online payment — Stripe + PayPal + card",
    "Private dashboard — orders, clients and numbers in real time from your phone",
    "Online booking — clients book directly, no phone call needed",
    "Automated notifications — confirmations by email and WhatsApp",
    "Secure client area — clients track orders and order history",
    "Full training (2h) + 30-day support after launch"
  ]',
  total_value = '945 000 FCFA',
  total_value_en = '€8,000+'
WHERE tag = 'Impact Gestion';

UPDATE offers SET
  tag = 'Impact Sur Mesure',
  tag_en = 'Custom',
  title = 'L''outil digital que votre business mérite',
  title_en = 'The digital tool your business deserves',
  hook = 'Vous avez un problème spécifique que les solutions génériques ne règlent pas. Vous avez besoin d''un outil conçu pour VOTRE réalité — pas un template adapté.',
  hook_en = 'You have a specific problem that generic solutions don''t solve. You need a tool designed for YOUR reality — not an adapted template.',
  ideal = 'L''entreprise ou le porteur de projet qui a besoin d''un outil unique : appli mobile, logiciel de gestion, plateforme de réservation.',
  ideal_en = 'The business that needs a custom digital tool: mobile app, booking platform, SaaS, management software.',
  description = 'On construit l''outil exact dont votre business a besoin. Pas un template adapté — une solution conçue pour VOTRE problème.',
  description_en = 'We build the exact tool your business needs. Not an adapted template — a solution designed for YOUR problem.',
  price = 'dès 600 000 FCFA',
  price_eur = 'from €4,990',
  delay = 'Selon le projet (estimé lors de l''appel découverte)',
  delay_en = 'Based on scope (estimated during the discovery call)',
  is_quote = 1,
  popular = 0,
  features = '[
    "Audit + maquettes validées avant développement",
    "Développement 100% sur mesure",
    "Support prioritaire 60 jours"
  ]',
  features_en = '[
    "Audit + approved mockups before build",
    "100% custom development",
    "60-day priority support"
  ]',
  value_stack = '[
    "Audit complet de vos besoins — on comprend votre business avant d''écrire une ligne de code",
    "Maquettes validées avant développement — vous voyez et approuvez le design avant qu''on construise",
    "Développement 100% sur mesure — front-end + back-end, exactement comme vous le voulez",
    "Connexion à vos outils existants — paiement, CRM, gestion de stock, API",
    "Tests complets avant livraison — chaque fonctionnalité testée",
    "Mise en ligne clé en main — déploiement, configuration serveur",
    "Formation de votre équipe — documentation + formation pour être autonome",
    "Support prioritaire 60 jours — on reste disponible après le lancement",
    "Révisions illimitées pendant le projet — on ajuste jusqu''à satisfaction"
  ]',
  value_stack_en = '[
    "Full needs audit — we understand your business before writing a line of code",
    "Approved mockups before development — you see and approve the design first",
    "100% custom development — front-end + back-end, exactly as you want it",
    "Integration with your existing tools — payment, CRM, stock management, API",
    "Full testing before delivery — every feature tested",
    "Turnkey launch — deployment, server setup, everything ready",
    "Team training — documentation + training for full autonomy",
    "60-day priority support — available after launch",
    "Unlimited revisions during the project — we adjust until you''re satisfied"
  ]',
  total_value = NULL,
  total_value_en = NULL
WHERE tag = 'Impact Signature';
