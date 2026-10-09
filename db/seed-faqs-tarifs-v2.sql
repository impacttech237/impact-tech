-- Remplace la FAQ par les objections traitées de la grille tarifaire v2
-- (plus orientée conversion/pricing que la FAQ "quel pack choisir" précédente).
--   wrangler d1 execute impact-tech-db --remote --file=db/seed-faqs-tarifs-v2.sql

DELETE FROM faqs;

INSERT INTO faqs (question, answer, question_en, answer_en, sort_order, active) VALUES
  ('Pourquoi c''est moins cher qu''en Europe ?',
   'Parce que nos coûts de fonctionnement sont à Douala, pas à Paris ou Stockholm. Notre expertise, nos outils et nos standards de qualité sont les mêmes que ceux d''une agence européenne. Vous payez pour le résultat, pas pour nos bureaux.',
   'Why is it cheaper than European agencies?',
   'Because our operating costs are in Douala, not London or Stockholm. Our expertise, tools, and quality standards match any European agency. You''re paying for results, not our office rent.',
   0, 1),
  ('Vous êtes au Cameroun, comment ça se passe pour la communication ?',
   'On travaille en fuseau horaire compatible (GMT+1, même heure que Paris). Appels en visio, suivi par WhatsApp ou email, points d''étape réguliers. Nos clients européens nous disent souvent qu''on est plus réactif que leur ancien prestataire local.',
   'You''re in Cameroon — how does communication work?',
   'We work in a compatible timezone (GMT+1, same as Paris/Berlin). Video calls, WhatsApp or email updates, regular checkpoints. Our European clients often tell us we''re more responsive than their previous local provider.',
   1, 1),
  ('Et si le résultat ne me plaît pas ?',
   'Vous ne payez rien. C''est notre garantie : paiement à la livraison uniquement. On vous montre le design avant de coder, et vous validez chaque étape. Zéro mauvaise surprise.',
   'What if I don''t like the result?',
   'You don''t pay. That''s our guarantee: pay on delivery only. We show you the design before we code, and you approve every step. Zero surprises.',
   2, 1),
  ('150 000 FCFA / 1 490€ c''est un investissement… ça vaut le coup ?',
   'Un client gagné grâce à votre site rembourse votre investissement. Sans site professionnel, combien de clients vous ratez chaque mois sans le savoir ?',
   'Is it really worth the investment?',
   'One client gained through your website pays for the investment. Without a professional site, how many clients are you losing each month without even knowing?',
   3, 1),
  ('Je n''y connais rien en technique, c''est un problème ?',
   'C''est justement notre métier. Vous nous dites ce que vous voulez, on s''occupe de tout. Et on vous forme pour que vous soyez autonome après la livraison.',
   'I''m not technical at all — is that a problem?',
   'That''s exactly why we exist. Tell us what you need, we handle everything. And we train you so you''re fully autonomous after launch.',
   4, 1),
  ('Combien de temps ça prend ?',
   'Pack Essentiel : 10-14 jours. Pack Business : 3-4 semaines. Pack Sur Mesure : on estime ensemble lors de l''appel découverte.',
   'How long does it take?',
   'Essential: 10-14 days. Business: 3-4 weeks. Custom: estimated together during the discovery call.',
   5, 1);
