# Guide — Portail client Impact Tech

Le portail client est l'espace privé où chaque client suit son projet, envoie ses
fichiers, signe ses documents, échange avec nous et paie. Côté admin, tout se
pilote dans **/admin → Portail Client**.

## 1. À faire une seule fois

1. **Activer les emails** (codes de connexion, rappels, notifications) :
   - créer un compte gratuit sur [resend.com](https://resend.com) (3 000 emails/mois) ;
   - *Domains → Add domain* → `impacttech237.com`, puis ajouter les enregistrements
     DNS proposés dans Cloudflare (onglet DNS) ;
   - *API Keys → Create* → copier la clé, puis :
     ```bash
     npx wrangler secret put RESEND_API_KEY
     ```
   - vérifier dans *Portail Client → Réglages → Envoyer un email de test*.
   Tant que ce n'est pas fait, les clients se connectent avec le **code manuel**
   (bouton « Partager l'accès » → « Générer un code ») envoyé par WhatsApp.
2. **Réglages → WhatsApp & parrainage** : numéro WhatsApp du portail et texte de
   la récompense de parrainage.
3. **Modèles → Modèles de projet** : ouvrir chaque pack, ajuster étapes, délais,
   éléments demandés au client et **séries de modifications** (vide = non affiché,
   -1 = illimitées), puis enregistrer.
4. **Modèles → Modèles de contrat** : un contrat de prestation de départ est fourni
   (à faire relire par un juriste). Vous pouvez aussi uploader votre propre fichier.

## 2. Un nouveau client, pas à pas

1. **Demandes** → « Créer le client + projet » (ou *Portail Client → Clients →
   Nouveau client*). Le projet est créé avec ses étapes et la liste de ce qu'on
   attend du client (logo, photos, textes guidés, accès…).
2. **Partager l'accès** : lien personnel `impacttech237.com/espace/nom-du-client`,
   par WhatsApp (message prêt) ou par email.
3. **Documents** : uploader le contrat (PDF/Word) ou le créer depuis un modèle
   (les variables `{{client_name}}`, `{{amount}}`… se remplissent seules ; un champ
   vide apparaît « [à compléter] » et bloque l'envoi). « Envoyer au client » → il
   signe au doigt → vous **contresignez** → PDF final avec certificat.
4. **Étapes** : « Demander la validation au client » quand la maquette est prête.
   Le client valide (horodaté, IP) ou demande des changements.
5. **URL du site en développement** (réglages du projet) : le client voit son site
   sur ordinateur / tablette / téléphone. Pour des retours précis, collez le
   **widget « Commenter »** (onglet *Retours*) dans le site en dev.
6. **Point de la semaine** : 2-3 lignes chaque semaine, publiées sur l'accueil du
   client + email.
7. **Devis & factures** : la facture finale se crée à la livraison ; le client
   paie par Mobile Money (K-PAY) depuis son espace, le reçu est automatique.
8. **Livraison** : renseigner le kit (adresse du site, back-office, guides, accès
   dans l'onglet *Accès*), puis « Marquer comme livré ». Demander un avis.

## 3. Ce qui tourne tout seul (chaque jour à 8 h, heure de Douala)

- relance du client pour les éléments manquants (à l'échéance, puis 4 jours après) ;
- relance des documents non signés (3 jours) et des factures échues ;
- rappels de renouvellement hébergement / domaine (J-30 et J-7) ;
- vérification que les sites livrés sont en ligne (alerte si un site tombe) ;
- le lundi : récapitulatif « Qui attend qui ? » par email.

## 4. Sécurité, en bref

- Connexion par code à usage unique (5 essais max, 8 codes par jour max), session 90 jours.
- Fichiers privés, servis uniquement au client concerné ; mots de passe du coffre chiffrés (AES-256).
- Chaque action importante est journalisée (onglet *Journal*) : c'est votre preuve.
