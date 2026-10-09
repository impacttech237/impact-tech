-- Aligne les 4 étapes du process sur la formulation de la grille tarifaire v2
-- (identique pour les 3 packs). Pas de colonnes _en sur process_steps —
-- reste affiché en FR même sur /en/* (limitation déjà documentée).
--   wrangler d1 execute impact-tech-db --remote --file=db/seed-process-tarifs-v2.sql

UPDATE process_steps SET title = 'Appel découverte', description = 'On écoute votre besoin, on vous conseille le bon pack (gratuit, sans engagement). 30 minutes.' WHERE num = '01';
UPDATE process_steps SET title = 'Proposition + maquette', description = 'Vous voyez le design de votre site avant qu''on commence — vous validez ou on ajuste. Sous 48h.' WHERE num = '02';
UPDATE process_steps SET title = 'Développement', description = 'On construit votre site avec des points d''étape réguliers — vous voyez l''avancement.' WHERE num = '03';
UPDATE process_steps SET title = 'Livraison + paiement', description = 'Votre site est en ligne, vous testez tout, et vous ne payez que si vous êtes satisfait.' WHERE num = '04';
