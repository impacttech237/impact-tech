-- ============================================================
-- Seed : 3 formulaires prospects permanents
-- Usage : wrangler d1 execute impact-tech-db --file=db/seed-surveys.sql
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. Impact Vitrine
-- ────────────────────────────────────────────────────────────
INSERT OR IGNORE INTO survey_forms (id, slug, title, description, redirect_url, active)
VALUES (1, 'impact-vitrine', 'Impact Vitrine — Votre site web professionnel',
  'Répondez à ces quelques questions pour nous aider à comprendre votre projet de site vitrine.',
  NULL, 1);

-- Section 1 : Votre activité
INSERT OR IGNORE INTO survey_sections (id, form_id, title, description, sort_order, condition)
VALUES (1, 1, 'Votre activité', 'Parlez-nous de votre entreprise ou projet.', 1, NULL);

INSERT OR IGNORE INTO survey_questions (id, section_id, type, label, required, sort_order, config)
VALUES
  (1, 1, 'short_text', 'Quel est le nom de votre entreprise ou projet ?', 1, 1, NULL),
  (2, 1, 'single_choice', 'Dans quel secteur exercez-vous ?', 1, 2,
    '{"options":["Commerce / Boutique","Services / Consulting","Restauration / Hôtellerie","Santé / Bien-être","Éducation / Formation","Tech / Startup","Artisanat / Création","Autre"]}'),
  (3, 1, 'short_text', 'Décrivez votre activité en une phrase.', 1, 3, NULL);

-- Section 2 : Vos besoins web
INSERT OR IGNORE INTO survey_sections (id, form_id, title, description, sort_order, condition)
VALUES (2, 1, 'Vos besoins web', 'Ce que vous attendez de votre site.', 2, NULL);

INSERT OR IGNORE INTO survey_questions (id, section_id, type, label, required, sort_order, config)
VALUES
  (4, 2, 'single_choice', 'Avez-vous déjà un site web ?', 1, 1,
    '{"options":["Non, c''est mon premier site","Oui, mais il est obsolète ou mal fait","Oui, je veux le refaire complètement"]}'),
  (5, 2, 'multi_choice', 'Que doit contenir votre site ?', 1, 2,
    '{"options":["Page d''accueil attractive","Présentation des services","Portfolio / Réalisations","Formulaire de contact","Blog / Actualités","Témoignages clients","Carte / Localisation","Autre"]}'),
  (6, 2, 'single_choice', 'Quel est votre objectif principal ?', 1, 3,
    '{"options":["Être trouvé sur Google","Gagner en crédibilité","Générer des contacts / leads","Présenter mes services","Vendre en ligne"]}');

-- Section 3 : Contenu et identité
INSERT OR IGNORE INTO survey_sections (id, form_id, title, description, sort_order, condition)
VALUES (3, 1, 'Contenu et identité visuelle', NULL, 3, NULL);

INSERT OR IGNORE INTO survey_questions (id, section_id, type, label, required, sort_order, config)
VALUES
  (7, 3, 'single_choice', 'Avez-vous déjà un logo ?', 1, 1,
    '{"options":["Oui, il est professionnel","Oui, mais il faut le moderniser","Non, il me faut un logo"]}'),
  (8, 3, 'yes_no', 'Avez-vous des photos professionnelles de votre activité ?', 0, 2, NULL),
  (9, 3, 'long_text', 'Quelles couleurs ou ambiances aimeriez-vous pour votre site ?', 0, 3, NULL),
  (10, 3, 'short_text', 'Citez un site web que vous aimez bien (pour référence).', 0, 4, NULL);

-- Section 4 : Budget et délais
INSERT OR IGNORE INTO survey_sections (id, form_id, title, description, sort_order, condition)
VALUES (4, 1, 'Budget et délais', NULL, 4, NULL);

INSERT OR IGNORE INTO survey_questions (id, section_id, type, label, required, sort_order, config)
VALUES
  (11, 4, 'single_choice', 'Quel est votre budget approximatif ?', 1, 1,
    '{"options":["Moins de 100 000 FCFA","100 000 – 250 000 FCFA","250 000 – 500 000 FCFA","Plus de 500 000 FCFA","Je ne sais pas encore"]}'),
  (12, 4, 'single_choice', 'Quand souhaitez-vous lancer votre site ?', 1, 2,
    '{"options":["Le plus vite possible","Dans 1 à 2 semaines","Dans 1 mois","Pas de date précise"]}'),
  (13, 4, 'long_text', 'Autre chose à nous dire ?', 0, 3, NULL);


-- ────────────────────────────────────────────────────────────
-- 2. Impact Gestion (redirige vers Kombi)
-- ────────────────────────────────────────────────────────────
INSERT OR IGNORE INTO survey_forms (id, slug, title, description, redirect_url, active)
VALUES (2, 'impact-gestion', 'Impact Gestion — Gérez votre activité',
  'Quelques questions rapides pour évaluer vos besoins en gestion, puis découvrez Kombi, notre solution.',
  'https://kombi.fr', 1);

-- Section 1 : Vos besoins de gestion
INSERT OR IGNORE INTO survey_sections (id, form_id, title, description, sort_order, condition)
VALUES (5, 2, 'Vos besoins de gestion', 'Dites-nous comment vous gérez votre activité aujourd''hui.', 1, NULL);

INSERT OR IGNORE INTO survey_questions (id, section_id, type, label, required, sort_order, config)
VALUES
  (14, 5, 'short_text', 'Quel est le nom de votre entreprise ?', 1, 1, NULL),
  (15, 5, 'single_choice', 'Comment gérez-vous actuellement votre comptabilité / facturation ?', 1, 2,
    '{"options":["À la main (cahier, Excel)","Un logiciel gratuit","Un logiciel payant","Je ne gère pas encore","Autre"]}'),
  (16, 5, 'multi_choice', 'Quels outils de gestion vous manquent le plus ?', 1, 3,
    '{"options":["Facturation automatique","Suivi des dépenses","Gestion des stocks","Suivi des clients (CRM)","Tableau de bord / rapports","Devis en ligne","Autre"]}'),
  (17, 5, 'single_choice', 'Combien de personnes travaillent dans votre structure ?', 1, 4,
    '{"options":["Juste moi","2 à 5 personnes","6 à 20 personnes","Plus de 20 personnes"]}');

-- Section 2 : Vos attentes
INSERT OR IGNORE INTO survey_sections (id, form_id, title, description, sort_order, condition)
VALUES (6, 2, 'Vos attentes', NULL, 2, NULL);

INSERT OR IGNORE INTO survey_questions (id, section_id, type, label, required, sort_order, config)
VALUES
  (18, 6, 'scale', 'À quel point la gestion de votre activité est-elle difficile aujourd''hui ?', 1, 1,
    '{"min":1,"max":5,"min_label":"Très facile","max_label":"Très difficile"}'),
  (19, 6, 'single_choice', 'Quel budget mensuel seriez-vous prêt à consacrer à un outil de gestion ?', 0, 2,
    '{"options":["Gratuit uniquement","Moins de 5 000 FCFA/mois","5 000 – 15 000 FCFA/mois","Plus de 15 000 FCFA/mois","Je ne sais pas"]}'),
  (20, 6, 'long_text', 'Décrivez votre plus gros problème de gestion en ce moment.', 0, 3, NULL);


-- ────────────────────────────────────────────────────────────
-- 3. Impact Signature
-- ────────────────────────────────────────────────────────────
INSERT OR IGNORE INTO survey_forms (id, slug, title, description, redirect_url, active)
VALUES (3, 'impact-signature', 'Impact Signature — Votre identité visuelle',
  'Répondez à ces questions pour nous aider à créer une identité visuelle qui vous ressemble.',
  NULL, 1);

-- Section 1 : Votre marque actuelle
INSERT OR IGNORE INTO survey_sections (id, form_id, title, description, sort_order, condition)
VALUES (7, 3, 'Votre marque actuelle', 'Faisons le point sur votre identité visuelle existante.', 1, NULL);

INSERT OR IGNORE INTO survey_questions (id, section_id, type, label, required, sort_order, config)
VALUES
  (21, 7, 'short_text', 'Quel est le nom de votre marque / entreprise ?', 1, 1, NULL),
  (22, 7, 'single_choice', 'Avez-vous déjà une identité visuelle (logo, couleurs, typo) ?', 1, 2,
    '{"options":["Non, tout est à créer","Oui, mais elle est dépassée","Oui, mais je veux la moderniser","Oui, elle est bien mais j''ai besoin de supports supplémentaires"]}'),
  (23, 7, 'long_text', 'Décrivez votre activité et ce qui vous différencie.', 1, 3, NULL);

-- Section 2 : Inspiration et goûts
INSERT OR IGNORE INTO survey_sections (id, form_id, title, description, sort_order, condition)
VALUES (8, 3, 'Inspiration et goûts', 'Aidez-nous à comprendre votre univers visuel.', 2, NULL);

INSERT OR IGNORE INTO survey_questions (id, section_id, type, label, required, sort_order, config)
VALUES
  (24, 8, 'multi_choice', 'Quels adjectifs décrivent le mieux votre marque ?', 1, 1,
    '{"options":["Moderne","Élégant","Audacieux","Minimaliste","Chaleureux","Professionnel","Créatif","Luxueux","Accessible","Dynamique"]}'),
  (25, 8, 'multi_choice', 'Quelles couleurs vous attirent ?', 0, 2,
    '{"options":["Noir / Sombre","Blanc / Épuré","Rouge / Orange","Bleu / Marine","Vert / Nature","Doré / Premium","Pastel / Doux","Couleurs vives"]}'),
  (26, 8, 'long_text', 'Citez des marques ou logos que vous aimez bien (même hors de votre secteur).', 0, 3, NULL);

-- Section 3 : Votre cible
INSERT OR IGNORE INTO survey_sections (id, form_id, title, description, sort_order, condition)
VALUES (9, 3, 'Votre cible', 'À qui s''adresse votre marque ?', 3, NULL);

INSERT OR IGNORE INTO survey_questions (id, section_id, type, label, required, sort_order, config)
VALUES
  (27, 9, 'single_choice', 'Quel est votre public principal ?', 1, 1,
    '{"options":["Particuliers (B2C)","Entreprises (B2B)","Les deux","Autre"]}'),
  (28, 9, 'short_text', 'Décrivez votre client idéal en quelques mots.', 0, 2, NULL),
  (29, 9, 'single_choice', 'Quelle tranche d''âge ciblez-vous principalement ?', 0, 3,
    '{"options":["18 – 25 ans","25 – 35 ans","35 – 50 ans","50 ans et plus","Toutes les tranches"]}');

-- Section 4 : Supports souhaités
INSERT OR IGNORE INTO survey_sections (id, form_id, title, description, sort_order, condition)
VALUES (10, 3, 'Supports souhaités', 'Quels livrables attendez-vous ?', 4, NULL);

INSERT OR IGNORE INTO survey_questions (id, section_id, type, label, required, sort_order, config)
VALUES
  (30, 10, 'multi_choice', 'Quels supports souhaitez-vous ?', 1, 1,
    '{"options":["Logo complet (variantes + déclinaisons)","Charte graphique","Cartes de visite","Papier en-tête / Enveloppes","Flyers / Dépliants","Réseaux sociaux (templates posts, bannières)","Packaging / Étiquettes","Signalétique / Enseigne","Autre"]}'),
  (31, 10, 'single_choice', 'Quel est votre budget pour l''identité visuelle ?', 1, 2,
    '{"options":["Moins de 50 000 FCFA","50 000 – 150 000 FCFA","150 000 – 300 000 FCFA","Plus de 300 000 FCFA","Je ne sais pas encore"]}'),
  (32, 10, 'single_choice', 'Quand avez-vous besoin des livrables ?', 0, 3,
    '{"options":["Urgent (moins d''une semaine)","Dans 2 à 3 semaines","Dans 1 mois","Pas de deadline"]}'),
  (33, 10, 'long_text', 'Autre chose à nous communiquer ?', 0, 4, NULL);
