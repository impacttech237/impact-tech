-- Contenu initial du portail client v2 : un modèle de contrat de prestation
-- (variables remplies automatiquement depuis le client et le projet).
-- ⚠️ Modèle de départ : à faire relire par un juriste avant usage réel.
--   wrangler d1 execute impact-tech-db --remote --file=db/seed-portal-v2.sql

INSERT INTO contract_templates (title, pack, active, created_at, content)
SELECT 'Contrat de prestation — {{pack}}', NULL, 1, datetime('now'),
'# CONTRAT DE PRESTATION DE SERVICES

Entre les soussignés :

IMPACT TECH, agence de création de sites internet et de solutions digitales, basée à Douala (Cameroun), joignable sur impacttech237.com, ci-après « le Prestataire »,

et

{{client_company}}, représenté(e) par {{client_name}} ({{client_email}} — {{client_phone}}), ci-après « le Client ».

# ARTICLE 1 — OBJET

Le présent contrat a pour objet la réalisation du projet « {{project_title}} » dans le cadre du pack {{pack}}, tel que décrit dans l''offre consultée par le Client sur impacttech237.com et précisé lors de l''appel découverte.

# ARTICLE 2 — DÉROULEMENT

Le projet se déroule en quatre étapes, suivies par le Client depuis son espace client :
1. Appel découverte : recueil du besoin.
2. Proposition et maquette : le Client voit le design avant le développement et le valide (ou demande des ajustements).
3. Développement : le Client peut consulter le site en construction et faire ses retours.
4. Livraison : mise en ligne, tests par le Client, formation à la gestion du site.

Chaque validation du Client est horodatée dans son espace client.

# ARTICLE 3 — ÉLÉMENTS FOURNIS PAR LE CLIENT

Le Client s''engage à fournir les éléments nécessaires (logo, textes, photos, accès éventuels) via son espace client. Les délais de réalisation courent à compter de la réception de ces éléments. Un retard dans leur transmission décale d''autant la date de livraison.

# ARTICLE 4 — DÉLAIS

Le démarrage est fixé au {{start_date}}. La livraison est prévue au {{delay}}, sous réserve du respect de l''article 3.

# ARTICLE 5 — MODIFICATIONS

Les séries de modifications incluses dans le pack : {{revisions}}. Toute demande sortant du périmètre initial fait l''objet d''un devis complémentaire, que le Client est libre d''accepter ou non.

# ARTICLE 6 — PRIX ET PAIEMENT

Le prix de la prestation est de {{amount}}.
Paiement à la livraison uniquement : le Client ne règle la prestation qu''une fois le site livré et validé. Le paiement peut s''effectuer par Mobile Money (MTN, Orange) depuis l''espace client, ou par tout autre moyen convenu.

# ARTICLE 7 — PROPRIÉTÉ

Après paiement complet, le Client devient propriétaire du site réalisé, de ses contenus et de son nom de domaine. Le Prestataire peut mentionner la réalisation dans ses références, sauf opposition écrite du Client.

# ARTICLE 8 — HÉBERGEMENT, SUPPORT ET MAINTENANCE

L''hébergement et le nom de domaine sont inclus la première année lorsque le pack le prévoit. Support après livraison : {{support}}. Le renouvellement annuel est proposé au Client avant échéance.

# ARTICLE 9 — CONFIDENTIALITÉ

Chaque partie s''engage à garder confidentielles les informations communiquées par l''autre, notamment les accès confiés via le coffre sécurisé de l''espace client.

# ARTICLE 10 — LITIGES

En cas de désaccord, les parties rechercheront d''abord une solution amiable. À défaut, le litige sera porté devant les juridictions compétentes de Douala (Cameroun).

Fait le {{date}}, en version électronique.
Signature précédée de la mention « Lu et approuvé ».'
WHERE NOT EXISTS (SELECT 1 FROM contract_templates WHERE title = 'Contrat de prestation — {{pack}}');
