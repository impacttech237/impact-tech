/* ------------------------------------------------------------------
   CONTENU PAR DÉFAUT — filet de sécurité
   Utilisé uniquement si la base de données D1 est indisponible
   (ex : `next dev` local sans wrangler). En production, tout le
   contenu vient de la base D1 et se gère depuis /admin.
------------------------------------------------------------------- */

export const DEFAULTS = {
  settings: {
    site_name: "IMPACT TECH",
    phone_display: "+237 6 53 39 56 94",
    phone_link: "+237653395694",
    email: "impacttech237@gmail.com",
    address: "Douala, Cameroun 🇨🇲",
    hours: "Lundi – Samedi : 8h – 18h",
    location_note: "Rendez-vous en présentiel à Douala ou en visio partout ailleurs.",
    hours_note: "Urgence sur un site en production ? WhatsApp, 7j/7.",
    facebook: "https://web.facebook.com/profile.php?id=61592459664276",
    linkedin: "https://www.linkedin.com/company/impact-tech-cm",
    instagram: "https://www.instagram.com/impacttech_237/",
    tiktok: "https://www.tiktok.com/@impact.tech92",
    marquee_items: ["Impact Essentiel", "Impact Business", "Impact Sur Mesure", "Paiement à la livraison", "Mobile Money"],
    hero_pills: ["Paiement à la livraison uniquement", "Cameroun & Europe", "Réponse sous 24h"],
  },

  stats: [
    { value: 60, suffix: "+", label: "Projets livrés", note: "sites, apps et plateformes" },
    { value: 40, suffix: "+", label: "Clients accompagnés", note: "au Cameroun et ailleurs" },
    { value: 14, suffix: " jours", label: "Délai moyen", note: "pour une landing page" },
    { value: 98, suffix: "%", label: "Recommandation", note: "de clients satisfaits" },
  ],

  // "services" (6 expertises séparées) fusionné dans "offers" (3 packs) —
  // chaque pack EST le service, cf. refonte impacttech237.com.
  // Grille tarifaire v2 : double prix FCFA/EUR (pricing de marché EU
  // distinct, pas une simple conversion), renommage des 3 packs.
  offers: [
    {
      tag: "Impact Essentiel",
      title: "Votre vitrine professionnelle sur internet",
      hook: "Vous perdez des clients chaque jour où votre entreprise n'a pas de site professionnel. Vos concurrents en ont un. Vos prospects cherchent sur Google. Ils ne vous trouvent pas.",
      ideal: "L'entrepreneur ou la PME qui veut enfin être trouvé sur Google et inspirer confiance dès le premier clic.",
      description: "Un site professionnel qui travaille pour vous 24h/24. Même quand vous dormez, vos prospects vous trouvent.",
      price: "150 000",
      priceEur: "1 490",
      currency: "FCFA",
      isQuote: false,
      popular: false,
      delay: "10-14 jours",
      features: [
        "Design unique à votre image, pas un template générique",
        "Jusqu'à 5 pages, adapté mobile/tablette/PC",
        "Visible sur Google + bouton WhatsApp direct",
        "Hébergement 1 an + nom de domaine inclus",
      ],
      valueStack: [
        "Design unique à votre image — pas un template copié-collé, votre marque et vos couleurs",
        "Jusqu'à 5 pages — Accueil + Services + À propos + Contact + 1 page au choix",
        "Adapté à tous les écrans — parfait sur mobile, tablette et ordinateur",
        "Visible sur Google — les bases pour que vos clients vous trouvent",
        "Formulaire de contact intelligent — email + notification dès qu'un prospect écrit",
        "Bouton WhatsApp — vos visiteurs vous contactent en 1 clic",
        "Hébergement 1 an + nom de domaine — votre site en ligne avec votre propre adresse web",
        "Formation pour gérer votre site — 1h pour modifier vos textes et images vous-même",
        "Renouvellement annuel : 25 000 FCFA (domaine + hébergement)",
      ],
      totalValue: "385 000 FCFA",
      image: "/images/service-landing.jpg",
    },
    {
      tag: "Impact Business",
      title: "Votre site devient un outil de vente",
      hook: "Vous gérez vos commandes par WhatsApp et vos paiements en espèces ? Pendant ce temps, vos concurrents encaissent en ligne 24h/24 via Mobile Money. Il est temps de rattraper — et de dépasser.",
      ideal: "L'entreprise qui veut vendre en ligne, prendre des rendez-vous, ou gérer ses clients depuis son téléphone.",
      description: "Transformez votre site en machine à vendre. Vos clients paient, réservent, et commandent — vous gérez tout depuis votre tableau de bord.",
      price: "400 000",
      priceEur: "3 490",
      currency: "FCFA",
      isQuote: false,
      popular: true,
      delay: "3-4 semaines",
      features: [
        "Tout l'Essentiel inclus",
        "Catalogue + paiement en ligne (Mobile Money, carte)",
        "Tableau de bord privé + réservation en ligne",
        "Formation 2h + support 30 jours",
      ],
      valueStack: [
        "Tout le pack Essentiel inclus — design unique, 5 pages, mobile, SEO, WhatsApp, hébergement",
        "Pages supplémentaires (jusqu'à 10) — plus de place pour vos produits, services et témoignages",
        "Catalogue en ligne — vos clients voient vos produits avec prix, photos et descriptions",
        "Paiement en ligne intégré — Mobile Money (MTN MoMo + Orange Money) + carte bancaire",
        "Tableau de bord privé — commandes, clients et chiffres en temps réel depuis votre téléphone",
        "Réservation en ligne — vos clients prennent rendez-vous sans vous appeler",
        "Notifications automatiques — confirmations par email et WhatsApp",
        "Espace client sécurisé — vos clients suivent leurs commandes et leur historique",
        "Formation complète (2h) + support 30 jours après livraison",
      ],
      totalValue: "945 000 FCFA",
      image: "/images/service-saas.jpg",
    },
    {
      tag: "Impact Sur Mesure",
      title: "L'outil digital que votre business mérite",
      hook: "Vous avez un problème spécifique que les solutions génériques ne règlent pas. Vous avez besoin d'un outil conçu pour VOTRE réalité — pas un template adapté.",
      ideal: "L'entreprise ou le porteur de projet qui a besoin d'un outil unique : appli mobile, logiciel de gestion, plateforme de réservation.",
      description: "On construit l'outil exact dont votre business a besoin. Pas un template adapté — une solution conçue pour VOTRE problème.",
      price: "dès 600 000 FCFA",
      priceEur: "",
      currency: "FCFA",
      isQuote: true,
      popular: false,
      delay: "Selon le projet (estimé lors de l'appel découverte)",
      features: [
        "Audit + maquettes validées avant développement",
        "Développement 100% sur mesure",
        "Support prioritaire 60 jours",
      ],
      valueStack: [
        "Audit complet de vos besoins — on comprend votre business avant d'écrire une ligne de code",
        "Maquettes validées avant développement — vous voyez et approuvez le design avant qu'on construise",
        "Développement 100% sur mesure — front-end + back-end, exactement comme vous le voulez",
        "Connexion à vos outils existants — paiement, CRM, gestion de stock, API",
        "Tests complets avant livraison — chaque fonctionnalité testée",
        "Mise en ligne clé en main — déploiement, configuration serveur",
        "Formation de votre équipe — documentation + formation pour être autonome",
        "Support prioritaire 60 jours — on reste disponible après le lancement",
        "Révisions illimitées pendant le projet — on ajuste jusqu'à satisfaction",
      ],
      totalValue: "",
      image: "/images/service-custom.jpg",
    },
  ],

  testimonials: [
    { name: "Aïcha N.", role: "Fondatrice, boutique de mode — Douala", text: "Ma boutique en ligne a été livrée en 3 semaines, paiement Mobile Money inclus. Mes ventes ont doublé dès le deuxième mois.", initials: "AN" },
    { name: "Serge M.", role: "Gérant de restaurant — Bonapriso", text: "Enfin une agence qui parle simplement ! Prix annoncé = prix payé. Ma page reçoit des réservations tous les jours.", initials: "SM" },
    { name: "Clarisse T.", role: "Consultante indépendante — Yaoundé", text: "Site vitrine élégant, livré rapidement, et l'équipe reste disponible sur WhatsApp quand j'ai une question. Je recommande.", initials: "CT" },
    { name: "Jean-Paul K.", role: "Directeur, PME logistique — Douala", text: "Notre outil de suivi sur-mesure a remplacé trois fichiers Excel. L'équipe a vraiment compris notre métier avant de coder.", initials: "JK" },
    { name: "Mireille B.", role: "Coach & formatrice — Bafoussam", text: "J'avais un petit budget, ils ont trouvé une formule adaptée sans sacrifier la qualité. Le digital accessible, c'est vrai.", initials: "MB" },
    { name: "Éric F.", role: "Startup fintech — Douala", text: "Le MVP de notre SaaS est sorti en 6 semaines. Code propre, bonne archi, on a levé nos premiers fonds avec cette démo.", initials: "EF" },
    { name: "Nadège E.", role: "ONG locale — Limbé", text: "Site multilingue, don en ligne, formation de notre équipe : tout était compris. Un vrai partenaire, pas juste un prestataire.", initials: "NE" },
    { name: "Boris A.", role: "Agence immobilière — Bonamoussadi", text: "Nos annonces sont en ligne en deux clics et les clients nous trouvent sur Google. Meilleur investissement de l'année.", initials: "BA" },
    { name: "Sandrine P.", role: "Pâtisserie artisanale — Akwa", text: "Ils ont créé une identité qui me ressemble et un site aussi gourmand que mes gâteaux. Les commandes arrivent via le site !", initials: "SP" },
  ],

  faqs: [
    { q: "Pourquoi c'est moins cher qu'en Europe ?", a: "Parce que nos coûts de fonctionnement sont à Douala, pas à Paris ou Stockholm. Notre expertise, nos outils et nos standards de qualité sont les mêmes que ceux d'une agence européenne. Vous payez pour le résultat, pas pour nos bureaux." },
    { q: "Vous êtes au Cameroun, comment ça se passe pour la communication ?", a: "On travaille en fuseau horaire compatible (GMT+1, même heure que Paris). Appels en visio, suivi par WhatsApp ou email, points d'étape réguliers." },
    { q: "Et si le résultat ne me plaît pas ?", a: "Vous ne payez rien. C'est notre garantie : paiement à la livraison uniquement. On vous montre le design avant de coder, et vous validez chaque étape. Zéro mauvaise surprise." },
    { q: "150 000 FCFA / 1 490€ c'est un investissement… ça vaut le coup ?", a: "Un client gagné grâce à votre site rembourse votre investissement. Sans site professionnel, combien de clients vous ratez chaque mois sans le savoir ?" },
    { q: "Je n'y connais rien en technique, c'est un problème ?", a: "C'est justement notre métier. Vous nous dites ce que vous voulez, on s'occupe de tout. Et on vous forme pour que vous soyez autonome après la livraison." },
    { q: "Combien de temps ça prend ?", a: "Pack Essentiel : 10-14 jours. Pack Business : 3-4 semaines. Pack Sur Mesure : on estime ensemble lors de l'appel découverte." },
  ],

  posts: [
    { title: "Mobile Money sur votre site : pourquoi c'est indispensable au Cameroun", category: "Conseils", date: "28 juin 2026", readTime: "5 min", excerpt: "MTN MoMo et Orange Money représentent l'écrasante majorité des paiements en ligne au Cameroun. Si votre boutique n'accepte que la carte bancaire, vous perdez des ventes chaque jour. Voici comment intégrer le paiement mobile, combien ça coûte et les pièges à éviter.", image: "/images/blog-1.jpg", featured: true },
    { title: "Combien coûte vraiment un site web professionnel en 2026 ?", category: "Guide", date: "15 juin 2026", readTime: "7 min", excerpt: "Domaine, hébergement, design, maintenance : on décompose tout, sans langue de bois.", image: "/images/blog-2.jpg", featured: false },
    { title: "De la boutique de quartier à 100 commandes en ligne par mois", category: "Success story", date: "2 juin 2026", readTime: "4 min", excerpt: "Comment un commerçant de Douala a digitalisé son activité avec un simple pack e-commerce.", image: "/images/blog-3.jpg", featured: false },
    { title: "5 signes que votre entreprise a besoin d'un site web (maintenant)", category: "Conseils", date: "20 mai 2026", readTime: "6 min", excerpt: "Vos clients vous cherchent sur Google et trouvent... vos concurrents. On fait le point.", image: "/images/service-blog.jpg", featured: false },
    { title: "SaaS, application, site web : quelle solution pour votre idée ?", category: "Guide", date: "8 mai 2026", readTime: "8 min", excerpt: "Les différences expliquées simplement, avec des exemples et des budgets réalistes.", image: "/images/service-saas.jpg", featured: false },
    { title: "Tok Tok Livraison : une app pensée pour les rues de Douala", category: "Success story", date: "25 avril 2026", readTime: "5 min", excerpt: "Suivi en temps réel, paiement mobile, mode hors-ligne : les coulisses d'une app locale.", image: "/images/project-delivery.jpg", featured: false },
    { title: "Landing page : 7 éléments qui font (vraiment) convertir", category: "Conseils", date: "10 avril 2026", readTime: "4 min", excerpt: "Titre, preuve sociale, appel à l'action... la checklist qu'on applique sur chaque projet.", image: "/images/service-landing.jpg", featured: false },
  ],

  // Catégories alignées sur les 3 packs (refonte) pour que le filtre de
  // /realisations corresponde exactement aux offres de /offres.
  projects: [
    { title: "Saveurs du Wouri — restaurant", category: "Impact Essentiel", description: "Landing de réservation avec menu du jour et WhatsApp direct.", result: "+40 réservations / mois", image: "/images/project-landing.jpg" },
    { title: "Kmer Style — mode & wax", category: "Impact Business", description: "Boutique en ligne avec paiement MTN MoMo et Orange Money.", result: "Ventes x2 en 2 mois", image: "/images/project-ecommerce.jpg" },
    { title: "Cabinet Nkotti — conseil juridique", category: "Impact Essentiel", description: "Site vitrine sobre et crédible, avec blog d'actualités juridiques.", result: "1er sur Google local", image: "/images/service-blog.jpg" },
    { title: "GestiStock — SaaS de gestion", category: "Impact Sur Mesure", description: "MVP SaaS de gestion de stock pour commerces, multi-boutiques.", result: "MVP livré en 8 semaines", image: "/images/service-saas.jpg" },
    { title: "Tok Tok Livraison — app mobile", category: "Impact Sur Mesure", description: "Application de livraison avec suivi en temps réel et paiement mobile.", result: "5 000+ livraisons suivies", image: "/images/project-delivery.jpg" },
    { title: "Collège Les Bâtisseurs — plateforme", category: "Impact Sur Mesure", description: "Portail notes & scolarité : parents, élèves et administration connectés.", result: "800 familles utilisatrices", image: "/images/project-school.jpg" },
    { title: "Immo Littoral — programme neuf", category: "Impact Essentiel", description: "Page de captation de prospects pour un programme immobilier.", result: "120 prospects qualifiés", image: "/images/service-landing.jpg" },
    { title: "TransCam Logistics — outil interne", category: "Impact Sur Mesure", description: "Suivi de flotte et des expéditions, tableaux de bord dirigeants.", result: "-30% de temps administratif", image: "/images/project-custom.jpg" },
    { title: "Artisanat Bafoussam — export", category: "Impact Business", description: "Boutique bilingue FR/EN pour vendre l'artisanat camerounais à l'international.", result: "Clients dans 12 pays", image: "/images/blog-3.jpg" },
  ],

  processSteps: [
    { num: "01", title: "Appel découverte", description: "On écoute votre besoin, on vous conseille le bon pack (gratuit, sans engagement). 30 minutes." },
    { num: "02", title: "Proposition + maquette", description: "Vous voyez le design de votre site avant qu'on commence — vous validez ou on ajuste. Sous 48h." },
    { num: "03", title: "Développement", description: "On construit votre site avec des points d'étape réguliers — vous voyez l'avancement." },
    { num: "04", title: "Livraison + paiement", description: "Votre site est en ligne, vous testez tout, et vous ne payez que si vous êtes satisfait." },
  ],
};
