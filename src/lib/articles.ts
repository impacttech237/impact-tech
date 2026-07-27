export function articleSlug(title = "") {
  return title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const RICH_ARTICLES = {
  "mobile-money-sur-votre-site-pourquoi-c-est-indispensable-au-cameroun": {
    eyebrow: "Paiement local, conversion réelle",
    lead: "Au Cameroun, proposer Mobile Money n’est pas un bonus. C’est souvent la différence entre un panier abandonné et une vente finalisée.",
    secondaryImage: "/images/project-ecommerce.jpg",
    sections: [
      {
        title: "Vos clients ont déjà leur moyen de paiement en poche",
        paragraphs: [
          "Une grande partie des acheteurs locaux utilise quotidiennement MTN MoMo ou Orange Money. Leur demander une carte bancaire introduit une friction inutile au moment le plus sensible du parcours : le paiement.",
          "Le bon réflexe consiste à afficher les options locales dès la fiche produit, puis à rendre le règlement aussi court que possible sur mobile.",
        ],
        bullets: ["Un numéro de téléphone suffit", "Validation immédiate depuis le mobile", "Parcours familier et rassurant"],
      },
      {
        title: "L’intégration doit rester simple et sécurisée",
        paragraphs: [
          "Une intégration professionnelle connecte votre boutique à un prestataire de paiement fiable, confirme automatiquement la transaction et associe chaque règlement à la bonne commande.",
          "Évitez les validations manuelles par capture d’écran : elles ralentissent le traitement et augmentent les risques d’erreur.",
        ],
        quote: "Le meilleur paiement est celui que le client comprend sans avoir besoin de poser une question.",
      },
      {
        title: "Mesurez ce qui se passe après le clic",
        paragraphs: [
          "Suivez le taux de paiement réussi, les abandons et les moyens de paiement préférés. Ces données permettent d’améliorer le tunnel sans refaire toute la boutique.",
          "Commencez avec un parcours clair, testez-le sur plusieurs téléphones et prévoyez toujours un message précis lorsque la transaction échoue.",
        ],
        callout: "À retenir : Mobile Money doit être visible, rapide et confirmé automatiquement.",
      },
    ],
  },
  "combien-coute-vraiment-un-site-web-professionnel-en-2026": {
    eyebrow: "Budget clair, décisions sereines",
    lead: "Le prix d’un site ne correspond pas seulement au nombre de pages. Il reflète surtout le niveau de stratégie, de design, de technologie et d’accompagnement nécessaire.",
    secondaryImage: "/images/project-custom.jpg",
    sections: [
      {
        title: "Ce que vous payez réellement",
        paragraphs: [
          "Un projet sérieux commence par la compréhension de vos objectifs. Viennent ensuite l’architecture des contenus, le design, le développement, les tests et la mise en ligne.",
          "Un devis très bas oublie souvent l’hébergement, la sécurité, le référencement ou l’accompagnement après livraison.",
        ],
        bullets: ["Cadrage et stratégie", "Design responsive", "Développement et tests", "Domaine, hébergement et sécurité"],
      },
      {
        title: "Choisir le bon niveau d’investissement",
        paragraphs: [
          "Une landing page convient à une offre unique. Un site vitrine structure une marque. Une boutique en ligne ajoute catalogue, paiement et gestion des commandes.",
          "Le budget doit suivre l’objectif économique du projet, pas une liste de fonctionnalités copiée chez un concurrent.",
        ],
        quote: "Un site rentable n’est pas forcément le plus cher : c’est celui qui résout le bon problème.",
      },
      {
        title: "Les coûts à anticiper après la livraison",
        paragraphs: [
          "Prévoyez le renouvellement du domaine, de l’hébergement et éventuellement un forfait de maintenance. Ces dépenses doivent être annoncées avant le lancement.",
          "Demandez toujours ce qui est inclus, ce qui vous appartient et comment vous pourrez modifier le contenu.",
        ],
        callout: "Un devis lisible doit séparer création, fonctionnement annuel et évolutions futures.",
      },
    ],
  },
  "de-la-boutique-de-quartier-a-100-commandes-en-ligne-par-mois": {
    eyebrow: "Success story — commerce local",
    lead: "Une petite boutique de Douala n’avait pas besoin d’une usine à gaz. Elle avait besoin d’un parcours simple pour montrer ses produits et recevoir des commandes fiables.",
    secondaryImage: "/images/blog-3.jpg",
    sections: [
      {
        title: "Partir des habitudes réelles des clients",
        paragraphs: [
          "Les commandes arrivaient déjà par WhatsApp, mais les photos, prix et disponibilités étaient dispersés. La première étape a été de structurer un catalogue clair.",
          "Nous avons conservé WhatsApp comme canal de proximité tout en ajoutant une boutique capable de centraliser les commandes.",
        ],
        bullets: ["Catalogue lisible sur mobile", "Stocks faciles à mettre à jour", "Paiement Mobile Money", "Confirmation automatique"],
      },
      {
        title: "Lancer petit, mesurer vite",
        paragraphs: [
          "La boutique a commencé avec ses meilleures références. Les données des premières semaines ont montré les produits les plus consultés et les points de blocage.",
          "Chaque amélioration répondait à un comportement observé : recherche plus visible, livraison mieux expliquée et relances simplifiées.",
        ],
        quote: "La croissance est venue de petits ajustements réguliers, pas d’une fonctionnalité miracle.",
      },
      {
        title: "Transformer le site en outil quotidien",
        paragraphs: [
          "Le site n’est plus une simple vitrine. Il sert à présenter, vendre, rassurer et organiser le travail de l’équipe.",
          "Le résultat le plus important reste l’autonomie : la commerçante peut gérer ses produits sans attendre un développeur.",
        ],
        callout: "100 commandes mensuelles deviennent possibles quand le parcours est simple pour le client et pour l’équipe.",
      },
    ],
  },
  "5-signes-que-votre-entreprise-a-besoin-d-un-site-web-maintenant": {
    eyebrow: "Visibilité et crédibilité",
    lead: "Si vos clients vous cherchent en ligne et ne trouvent qu’un numéro perdu dans une publication, votre entreprise laisse déjà des opportunités à ses concurrents.",
    secondaryImage: "/images/service-blog.jpg",
    sections: [
      {
        title: "On vous pose toujours les mêmes questions",
        paragraphs: [
          "Prix, horaires, localisation, services : un site répond immédiatement aux questions répétitives et permet à votre équipe de se concentrer sur les échanges importants.",
        ],
        bullets: ["Votre activité dépend uniquement des réseaux sociaux", "Vos offres sont difficiles à comparer", "Votre crédibilité doit être expliquée à chaque prospect"],
      },
      {
        title: "Vos concurrents occupent Google à votre place",
        paragraphs: [
          "Les réseaux sociaux créent de l’attention, mais un site construit une présence durable. Il rassemble vos contenus et donne à Google une source fiable à référencer.",
          "Même un site court peut devenir un avantage s’il répond précisément aux recherches de vos clients.",
        ],
        quote: "Ne pas être trouvé en ligne revient souvent à ne pas être considéré.",
      },
      {
        title: "Vous perdez du temps dans des tâches manuelles",
        paragraphs: [
          "Demandes de devis, réservations et inscriptions peuvent être structurées automatiquement. Le site devient alors un outil de travail, pas une brochure.",
        ],
        callout: "Commencez par le besoin le plus coûteux en temps ou en opportunités.",
      },
    ],
  },
  "saas-application-site-web-quelle-solution-pour-votre-idee": {
    eyebrow: "Choisir avant de construire",
    lead: "Site, application et SaaS répondent à des problèmes différents. Le bon choix dépend moins de la mode que de l’usage attendu.",
    secondaryImage: "/images/service-saas.jpg",
    sections: [
      {
        title: "Le site informe et convertit",
        paragraphs: [
          "Un site présente une offre, rassure et transforme des visiteurs en prospects ou clients. Il reste le meilleur point de départ pour de nombreuses entreprises.",
        ],
        bullets: ["Landing page pour une campagne", "Site vitrine pour une marque", "E-commerce pour vendre directement"],
      },
      {
        title: "L’application accompagne un usage fréquent",
        paragraphs: [
          "Une application devient pertinente lorsque l’utilisateur revient souvent, utilise des fonctions liées au téléphone ou doit travailler hors connexion.",
          "Un SaaS, lui, organise un métier ou un processus récurrent avec des comptes, des données et souvent un abonnement.",
        ],
        quote: "Ne construisez pas une application si un site mobile bien pensé résout déjà le problème.",
      },
      {
        title: "Valider avant d’investir lourdement",
        paragraphs: [
          "Un prototype ou un MVP permet de tester la proposition de valeur avec de vrais utilisateurs. Les retours guident ensuite les fonctionnalités prioritaires.",
        ],
        callout: "La meilleure technologie est celle qui permet de vérifier rapidement votre hypothèse.",
      },
    ],
  },
  "tok-tok-livraison-une-app-pensee-pour-les-rues-de-douala": {
    eyebrow: "Success story — mobilité",
    lead: "Concevoir pour Douala exige de tenir compte de la connexion, des adresses informelles et des habitudes de paiement locales.",
    secondaryImage: "/images/project-delivery.jpg",
    sections: [
      {
        title: "Le terrain avant l’interface",
        paragraphs: [
          "Nous avons observé le travail des livreurs, des opérateurs et des clients avant de dessiner les écrans. Les difficultés ne venaient pas seulement de la carte, mais aussi de la transmission des repères.",
        ],
        bullets: ["Repères textuels et vocaux", "Fonctionnement en connexion faible", "Statuts simples pour chaque livraison"],
      },
      {
        title: "Une expérience pensée pour l’urgence",
        paragraphs: [
          "Les actions principales restent accessibles d’une main. Les informations importantes utilisent des contrastes forts et les changements de statut sont immédiatement visibles.",
          "Le mode hors ligne conserve les actions puis les synchronise dès que le réseau revient.",
        ],
        quote: "Une application locale performante commence par accepter la réalité du terrain.",
      },
      {
        title: "Relier clients, livreurs et opérations",
        paragraphs: [
          "Le tableau de bord centralise les courses, les paiements et les incidents. Chaque équipe voit uniquement ce dont elle a besoin.",
        ],
        callout: "Le design utile réduit les appels, les erreurs et le temps perdu entre deux livraisons.",
      },
    ],
  },
  "landing-page-7-elements-qui-font-vraiment-convertir": {
    eyebrow: "Conversion sans manipulation",
    lead: "Une landing page efficace guide le visiteur vers une seule décision. Chaque bloc doit répondre à une question précise et réduire une hésitation.",
    secondaryImage: "/images/service-landing.jpg",
    sections: [
      {
        title: "Une promesse comprise en quelques secondes",
        paragraphs: [
          "Le titre doit expliquer le résultat offert, pas seulement présenter le nom du produit. Le sous-titre précise pour qui l’offre existe et comment elle fonctionne.",
        ],
        bullets: ["Un titre orienté résultat", "Un appel à l’action visible", "Une preuve sociale crédible", "Un visuel qui montre le produit"],
      },
      {
        title: "Répondre aux objections dans le bon ordre",
        paragraphs: [
          "Prix, délai, fonctionnement et garanties doivent apparaître avant que le doute ne devienne un abandon. Une FAQ courte peut lever les dernières hésitations.",
          "Sur mobile, les informations décisives doivent arriver rapidement et le bouton principal rester facile à trouver.",
        ],
        quote: "La conversion vient de la clarté, pas de la pression.",
      },
      {
        title: "Mesurer puis améliorer",
        paragraphs: [
          "Analysez les clics, les formulaires commencés et les abandons. Changez une variable importante à la fois afin de comprendre ce qui améliore réellement les résultats.",
        ],
        callout: "Une bonne landing page n’est jamais figée : elle apprend de ses visiteurs.",
      },
    ],
  },
};

function genericSections(post) {
  return [
    {
      title: "Comprendre l’enjeu",
      paragraphs: [
        post.excerpt,
        "Dans cet article, l’équipe IMPACT TECH rassemble les points essentiels pour transformer cette question en décisions simples, adaptées au contexte camerounais.",
      ],
    },
    {
      title: "Passer de l’idée à l’action",
      paragraphs: [
        "Commencez par clarifier votre objectif, les personnes concernées et le résultat attendu. Une solution digitale efficace reste volontairement simple lors de sa première version.",
      ],
      bullets: ["Définir un objectif mesurable", "Prioriser les usages essentiels", "Tester avec de vrais utilisateurs"],
    },
    {
      title: "Construire une solution durable",
      paragraphs: [
        "Mesurez les résultats, écoutez les utilisateurs et faites évoluer l’outil progressivement. C’est cette discipline qui transforme un projet numérique en investissement utile.",
      ],
      callout: "Besoin d’un avis concret ? Présentez-nous votre projet : le premier échange est gratuit.",
    },
  ];
}

/* Nettoie les sections rédigées depuis le dashboard vers la forme exacte
   attendue par la page article (src/pages/article.tsx) — jamais modifiée. */
function normalizeSections(sections) {
  if (!Array.isArray(sections)) return null;
  const clean = sections
    .map((s) => {
      const title = typeof s?.title === "string" ? s.title.trim() : "";
      const paragraphs = Array.isArray(s?.paragraphs)
        ? s.paragraphs.map((p) => String(p).trim()).filter(Boolean)
        : [];
      const bullets = Array.isArray(s?.bullets)
        ? s.bullets.map((b) => String(b).trim()).filter(Boolean)
        : [];
      const quote = typeof s?.quote === "string" ? s.quote.trim() : "";
      const callout = typeof s?.callout === "string" ? s.callout.trim() : "";
      return { title, paragraphs, bullets, quote, callout };
    })
    .filter((s) => s.title || s.paragraphs.length || s.bullets.length || s.quote || s.callout);
  return clean.length ? clean : null;
}

export function hydrateArticle(post) {
  const slug = articleSlug(post.title);
  const rich = RICH_ARTICLES[slug] || {};
  // Priorité au contenu rédigé dans le dashboard (D1) ; à défaut, contenu riche
  // codé en dur ; en dernier recours, sections génériques dérivées de l'extrait.
  const ownSections = normalizeSections(post.sections);
  return {
    ...post,
    slug,
    eyebrow: post.eyebrow || rich.eyebrow || post.category,
    lead: post.lead || rich.lead || post.excerpt,
    secondaryImage: post.secondaryImage || rich.secondaryImage || post.image,
    sections: ownSections || rich.sections || genericSections(post),
    author: post.author || "L’équipe IMPACT TECH",
  };
}

export function getArticleBySlug(posts, slug) {
  const post = posts.find((item) => articleSlug(item.title) === slug);
  return post ? hydrateArticle(post) : null;
}

export function getRelatedArticles(posts, currentSlug, limit = 3) {
  return posts
    .map(hydrateArticle)
    .filter((item) => item.slug !== currentSlug)
    .slice(0, limit);
}
