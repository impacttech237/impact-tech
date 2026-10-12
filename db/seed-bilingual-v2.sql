-- Traductions EN du contenu déjà en production (chiffres clés, témoignages,
-- méthode, réalisations). Mise à jour par libellé FR, pas par id, pour ne
-- rien toucher si le contenu a changé entre-temps.
--   wrangler d1 execute impact-tech-db --remote --file=db/seed-bilingual-v2.sql

-- Chiffres clés
UPDATE stats SET label_en = 'Projects delivered', note_en = 'websites, apps and platforms' WHERE label = 'Projets livrés';
UPDATE stats SET label_en = 'Clients supported', note_en = 'in Cameroon and beyond' WHERE label = 'Clients accompagnés';
UPDATE stats SET label_en = 'Average turnaround', note_en = 'for a landing page', suffix_en = ' days' WHERE label = 'Délai moyen';
UPDATE stats SET label_en = 'Would recommend us', note_en = 'satisfied clients' WHERE label = 'Recommandation';

-- Méthode
UPDATE process_steps SET title_en = 'Discovery call', description_en = 'We listen to your needs and recommend the right plan (free, no commitment). 30 minutes.' WHERE title = 'Appel découverte';
UPDATE process_steps SET title_en = 'Proposal + mockup', description_en = 'You see your website''s design before we start building — approve it or we adjust. Within 48h.' WHERE title = 'Proposition + maquette';
UPDATE process_steps SET title_en = 'Development', description_en = 'We build your website with regular check-ins — you can follow the progress.' WHERE title = 'Développement';
UPDATE process_steps SET title_en = 'Delivery + payment', description_en = 'Your website goes live, you test everything, and you only pay if you''re satisfied.' WHERE title = 'Livraison + paiement';

-- Témoignages
UPDATE testimonials SET role_en = 'Founder, fashion boutique — Douala', text_en = 'My online store was delivered in 3 weeks, with Mobile Money payments included. My sales doubled by the second month.' WHERE name = 'Aïcha N.';
UPDATE testimonials SET role_en = 'Restaurant manager — Bonapriso', text_en = 'Finally an agency that speaks plainly! The quoted price is the price you pay. My page gets bookings every day.' WHERE name = 'Serge M.';
UPDATE testimonials SET role_en = 'Independent consultant — Yaoundé', text_en = 'An elegant showcase website, delivered fast, and the team stays available on WhatsApp whenever I have a question. Highly recommended.' WHERE name = 'Clarisse T.';
UPDATE testimonials SET role_en = 'Director, logistics SME — Douala', text_en = 'Our custom tracking tool replaced three Excel files. The team really understood our business before writing a line of code.' WHERE name = 'Jean-Paul K.';
UPDATE testimonials SET role_en = 'Coach & trainer — Bafoussam', text_en = 'I had a small budget and they found the right plan without cutting corners on quality. Accessible digital really exists.' WHERE name = 'Mireille B.';
UPDATE testimonials SET role_en = 'Fintech startup — Douala', text_en = 'Our SaaS MVP shipped in 6 weeks. Clean code, solid architecture — we raised our first funds with that demo.' WHERE name = 'Éric F.';
UPDATE testimonials SET role_en = 'Local NGO — Limbé', text_en = 'Multilingual website, online donations, training for our team: everything was included. A real partner, not just a supplier.' WHERE name = 'Nadège E.';
UPDATE testimonials SET role_en = 'Real estate agency — Bonamoussadi', text_en = 'Our listings go online in two clicks and clients find us on Google. Best investment of the year.' WHERE name = 'Boris A.';
UPDATE testimonials SET role_en = 'Artisan pastry shop — Akwa', text_en = 'They created a brand that feels like me and a website as tempting as my cakes. Orders now come in through the site!' WHERE name = 'Sandrine P.';

-- Réalisations
UPDATE projects SET title_en = 'Saveurs du Wouri — restaurant', description_en = 'Booking landing page with daily menu and direct WhatsApp.', result_en = '+40 bookings / month' WHERE title = 'Saveurs du Wouri — restaurant';
UPDATE projects SET title_en = 'Artisanat Bafoussam — export', description_en = 'Bilingual FR/EN online store selling Cameroonian crafts worldwide.', result_en = 'Clients in 12 countries' WHERE title = 'Artisanat Bafoussam — export';

-- Correction d'un caractère corrompu dans la description FR (« à »).
UPDATE projects SET description = 'Boutique bilingue FR/EN pour vendre l''artisanat camerounais à l''international.' WHERE title = 'Artisanat Bafoussam — export';
