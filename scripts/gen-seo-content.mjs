/* Génère db/seo-content.sql : 12 articles de blog optimisés SEO/AEO + 10 FAQ,
   à insérer dans D1 (append, idempotent : DELETE par titre/question avant INSERT).
   Contenu 100% éditable ensuite depuis /admin.
   Usage: node scripts/gen-seo-content.mjs
          wrangler d1 execute impact-tech-db --remote --file db/seo-content.sql */
import { writeFileSync } from "fs";
import path from "path";

const AUTHOR = "L’équipe IMPACT TECH";

/* --------------------------- ARTICLES --------------------------- */
const articles = [
  {
    title: "Comment créer un site web professionnel au Cameroun : le guide complet (2026)",
    category: "Guide",
    date: "24 juillet 2026",
    readTime: "9 min",
    image: "/images/service-blog.jpg",
    secondaryImage: "/images/process-visual.jpg",
    eyebrow: "Le point de départ de tout projet digital",
    excerpt: "Nom de domaine, hébergement, design, contenu, mise en ligne : voici toutes les étapes pour créer un site web professionnel au Cameroun, avec un budget clair et sans jargon.",
    lead: "Créer un site professionnel au Cameroun tient en cinq étapes : définir un objectif, réserver un nom de domaine, choisir un hébergement fiable, concevoir un site clair et rapide sur mobile, puis le mettre en ligne avec le référencement de base. Comptez 2 à 6 semaines selon l’ampleur du projet.",
    sections: [
      {
        title: "Commencez par l’objectif, pas par le design",
        paragraphs: [
          "Avant toute chose, répondez à une question simple : que doit faire ce site pour votre activité ? Recevoir des demandes de devis, vendre des produits, rassurer des prospects, prendre des rendez-vous… L’objectif détermine tout le reste, du type de site au budget.",
          "Un site qui veut « tout faire » finit souvent par ne rien faire correctement. Une seule priorité claire vaut mieux que dix fonctionnalités confuses.",
        ],
        bullets: [
          "Générer des contacts → site vitrine + formulaire + WhatsApp",
          "Vendre directement → boutique e-commerce avec Mobile Money",
          "Tester une offre → une landing page unique et percutante",
        ],
      },
      {
        title: "Nom de domaine et hébergement : les fondations",
        paragraphs: [
          "Le nom de domaine est votre adresse (ex : votreentreprise.com). Choisissez-le court, facile à dicter au téléphone, et sans fautes possibles. Le .com reste le plus universel ; le .cm renforce l’ancrage local mais coûte plus cher.",
          "L’hébergement, lui, est l’endroit où vit votre site. Un bon hébergement rend le site rapide même en 3G et le garde en ligne 24h/24. Fuyez les offres « gratuites » qui affichent des publicités ou disparaissent du jour au lendemain.",
        ],
        quote: "Un site professionnel repose sur trois fondations invisibles mais décisives : un bon domaine, un hébergement fiable et un certificat SSL (le cadenas https).",
      },
      {
        title: "Un contenu clair et un design mobile d’abord",
        paragraphs: [
          "Au Cameroun, la grande majorité des visiteurs arrivent depuis un téléphone. Votre site doit donc être pensé « mobile d’abord » : boutons accessibles au pouce, textes lisibles, images légères qui se chargent vite.",
          "Côté contenu, allez à l’essentiel : qui vous êtes, ce que vous proposez, la preuve que vous êtes fiable (avis, réalisations), et comment vous contacter. Chaque page doit répondre à une intention précise du visiteur.",
        ],
        callout: "À retenir : un site rapide et clair sur mobile convertit toujours mieux qu’un site « beau » mais lent. La vitesse et la clarté priment sur les effets.",
      },
      {
        title: "Mise en ligne, référencement et suivi",
        paragraphs: [
          "Avant la mise en ligne, on vérifie les titres et descriptions de chaque page (ce que Google affiche dans les résultats), on soumet le site à Google Search Console et on crée la fiche Google Business Profile pour ressortir sur Maps.",
          "Un site n’est pas figé : on mesure ce qui marche (pages vues, demandes reçues) et on ajuste. Publier régulièrement des articles utiles, comme celui-ci, renforce durablement votre visibilité.",
        ],
      },
    ],
  },
  {
    title: "SEO au Cameroun : comment apparaître en première page de Google",
    category: "Guide",
    date: "21 juillet 2026",
    readTime: "8 min",
    image: "/images/service-landing.jpg",
    secondaryImage: "/images/blog-2.jpg",
    eyebrow: "Être trouvé quand vos clients cherchent",
    excerpt: "Le référencement naturel (SEO) permet d’apparaître gratuitement dans Google quand vos clients cherchent vos services. Voici la méthode concrète, adaptée au marché camerounais.",
    lead: "Pour apparaître en première page de Google au Cameroun, il faut trois choses : un site techniquement sain (rapide, mobile, sécurisé), des pages qui répondent précisément aux questions de vos clients, et une présence locale forte (Google Business Profile, avis, cohérence des coordonnées).",
    sections: [
      {
        title: "Le SEO, c’est répondre à une intention de recherche",
        paragraphs: [
          "Les gens ne tapent pas des mots au hasard : ils cherchent une réponse. « Créer un site e-commerce Douala », « prix logo entreprise Cameroun », « meilleure agence web »… Chaque recherche cache un besoin. Votre travail est d’avoir, sur votre site, la meilleure réponse à ce besoin.",
          "C’est pour cela qu’un blog est un moteur de référencement : chaque article bien écrit devient une porte d’entrée sur votre site depuis Google.",
        ],
        bullets: [
          "Identifiez les questions réelles de vos clients",
          "Créez une page ou un article par grande question",
          "Répondez clairement, dès les premières lignes",
        ],
      },
      {
        title: "Le SEO local : votre plus gros levier au Cameroun",
        paragraphs: [
          "Pour une entreprise locale, le « pack local » (les résultats avec la carte Google Maps) est souvent plus rentable que le référencement classique. Il se travaille avec Google Business Profile : catégorie exacte, photos, horaires, description et surtout des avis clients réguliers.",
          "La cohérence NAP (Nom, Adresse, Téléphone) identiques partout — site, Google, réseaux sociaux, annuaires — renforce votre crédibilité aux yeux de Google.",
        ],
        quote: "Un client qui cherche « site web Douala » et vous trouve sur Maps, avec des avis 5 étoiles et des photos, vous choisira avant un concurrent invisible.",
      },
      {
        title: "La technique qui compte vraiment",
        paragraphs: [
          "Pas besoin d’être ingénieur, mais quelques bases sont non négociables : un site rapide, lisible sur mobile, en https, avec des titres et descriptions uniques par page et des images légères dotées d’un texte alternatif.",
          "Les données structurées (le code que Google lit pour comprendre votre entreprise, vos articles et vos FAQ) aident vos pages à obtenir des « résultats enrichis » plus visibles.",
        ],
        callout: "À retenir : le SEO est un marathon, pas un sprint. Les premiers résultats arrivent souvent en 2 à 4 mois, puis s’accumulent. La régularité bat l’intensité ponctuelle.",
      },
    ],
  },
  {
    title: "Pourquoi mon site n’apparaît pas sur Google ? 8 causes fréquentes",
    category: "Conseils",
    date: "17 juillet 2026",
    readTime: "6 min",
    image: "/images/blog-2.jpg",
    secondaryImage: "/images/service-landing.jpg",
    eyebrow: "Diagnostic express",
    excerpt: "Votre site existe mais reste introuvable sur Google ? Voici les 8 raisons les plus courantes, et comment les corriger une par une.",
    lead: "Si votre site n’apparaît pas sur Google, la cause est presque toujours l’une de ces huit : le site est trop récent, il n’est pas indexé, il bloque les robots, il est trop lent, son contenu est trop mince, il n’a pas de mots-clés clairs, il manque de notoriété, ou vous cherchez le mauvais terme.",
    sections: [
      {
        title: "Les causes techniques les plus fréquentes",
        paragraphs: [
          "Un site tout neuf met quelques jours à quelques semaines à être exploré par Google. C’est normal. Mais parfois, un réglage bloque carrément l’indexation : une balise « noindex » oubliée, un fichier robots.txt trop restrictif, ou l’absence de sitemap soumis dans Google Search Console.",
          "Autre grand classique : la lenteur. Un site qui met plus de 3 secondes à s’afficher sur mobile est pénalisé, surtout en connexion 3G.",
        ],
        bullets: [
          "Site non soumis à Google Search Console",
          "Balise « noindex » ou robots.txt bloquant",
          "Sitemap absent ou invalide",
          "Site trop lent sur mobile",
        ],
      },
      {
        title: "Les causes de contenu",
        paragraphs: [
          "Google classe des pages, pas des entreprises. Si vos pages ne contiennent presque pas de texte, ou n’emploient jamais les mots que vos clients tapent, elles n’ont rien à quoi se rattacher. Un site « joli mais vide » reste invisible.",
          "À l’inverse, une page qui répond clairement à une question précise, avec un titre explicite, a toutes ses chances — même pour un petit site.",
        ],
        quote: "Google ne peut vous montrer que si vous lui donnez quelque chose à lire. Un site sans contenu, c’est une boutique sans enseigne.",
      },
      {
        title: "Vérifiez avant de paniquer",
        paragraphs: [
          "Tapez site:votredomaine.com dans Google : s’il affiche vos pages, vous êtes indexé (le problème est alors le classement, pas l’indexation). Sinon, direction Search Console pour demander l’indexation.",
          "Enfin, testez avec les vrais mots de vos clients, pas le nom exact de votre entreprise : c’est là que se joue la vraie visibilité.",
        ],
        callout: "À retenir : 90 % des cas « invisible sur Google » se règlent avec Search Console + un contenu clair + un peu de patience. Rarement une fatalité.",
      },
    ],
  },
  {
    title: "Comment vendre en ligne au Cameroun quand on débute",
    category: "Guide",
    date: "12 juillet 2026",
    readTime: "7 min",
    image: "/images/service-ecommerce.jpg",
    secondaryImage: "/images/project-ecommerce.jpg",
    eyebrow: "Du premier produit à la première vente",
    excerpt: "Pas besoin d’un gros budget pour vendre en ligne au Cameroun. Voici comment démarrer intelligemment, avec le paiement Mobile Money et la livraison locale.",
    lead: "Pour vendre en ligne au Cameroun quand on débute : commencez avec vos meilleurs produits, une boutique simple et lisible sur mobile, le paiement Mobile Money (MTN MoMo, Orange Money), et une logistique de livraison claire. Lancez petit, mesurez, puis élargissez.",
    sections: [
      {
        title: "Lancez petit, mais lancez pour de vrai",
        paragraphs: [
          "L’erreur classique est de vouloir tout mettre en ligne dès le premier jour. Commencez avec 10 à 20 produits phares, bien photographiés, avec des prix clairs. Vous compléterez le catalogue une fois les premières ventes réalisées.",
          "Une boutique en ligne ne remplace pas WhatsApp : elle le complète. Gardez WhatsApp comme canal de proximité et laissez la boutique centraliser catalogue, prix et commandes.",
        ],
        bullets: [
          "Photos nettes sur fond neutre",
          "Prix affichés sans ambiguïté",
          "Description courte orientée bénéfice",
          "Bouton de commande visible sur mobile",
        ],
      },
      {
        title: "Le paiement et la livraison : les deux points sensibles",
        paragraphs: [
          "Au Cameroun, proposer Mobile Money n’est pas une option, c’est la norme. Intégrez MTN Mobile Money et Orange Money, avec une confirmation automatique de la transaction rattachée à la bonne commande — évitez les validations par capture d’écran.",
          "Pour la livraison, soyez transparent : zones desservies, délais, frais. Un client rassuré sur la livraison va au bout de sa commande.",
        ],
        quote: "Le panier abandonné n’est pas un problème de produit, mais presque toujours un problème de confiance : paiement, livraison, ou clarté du prix.",
      },
      {
        title: "Mesurez ce qui se passe après le clic",
        paragraphs: [
          "Suivez trois chiffres simples : combien de visiteurs, combien ajoutent au panier, combien paient. L’écart entre ces étapes vous dit exactement où se perdent vos ventes.",
          "Améliorez une chose à la fois : une photo, un prix, un délai de livraison. C’est cette discipline qui transforme une petite boutique en machine à commandes.",
        ],
        callout: "À retenir : Mobile Money visible + livraison claire + une boutique rapide sur mobile = la base incontournable du e-commerce local rentable.",
      },
    ],
  },
  {
    title: "Nom de domaine, hébergement et SSL : tout comprendre simplement",
    category: "Guide",
    date: "8 juillet 2026",
    readTime: "6 min",
    image: "/images/service-custom.jpg",
    secondaryImage: "/images/process-visual.jpg",
    eyebrow: "Les mots techniques, enfin clairs",
    excerpt: "Domaine, hébergement, SSL, DNS : ces mots techniques cachent des idées simples. On vous explique tout avec des images du quotidien, sans jargon.",
    lead: "Le nom de domaine est l’adresse de votre site, l’hébergement est le terrain où il est construit, et le SSL (le cadenas https) est la serrure qui sécurise les échanges. Ces trois éléments sont indispensables à tout site professionnel.",
    sections: [
      {
        title: "Le domaine : votre adresse sur le web",
        paragraphs: [
          "Le nom de domaine, c’est comme l’adresse de votre boutique : votreentreprise.com. On le « loue » chaque année auprès d’un registrar. Personne d’autre ne peut l’utiliser tant que vous le renouvelez.",
          "Choisissez-le court, mémorisable et dictable au téléphone. Le .com est universel ; le .cm affiche fièrement l’ancrage camerounais.",
        ],
      },
      {
        title: "L’hébergement : le terrain où vit le site",
        paragraphs: [
          "Si le domaine est l’adresse, l’hébergement est le terrain et les fondations. C’est là que sont stockés vos pages, images et données. Un bon hébergement garde le site en ligne 24h/24 et le sert rapidement, même en connexion faible.",
          "Aujourd’hui, les meilleurs hébergements utilisent un réseau mondial (CDN) qui rapproche votre site de chaque visiteur — un site servi depuis un serveur proche s’affiche bien plus vite.",
        ],
        quote: "Un hébergement bon marché mais lent vous coûte des clients chaque jour, silencieusement. La rapidité est un investissement, pas une dépense.",
      },
      {
        title: "Le SSL : la serrure qui rassure et référence",
        paragraphs: [
          "Le certificat SSL active le fameux cadenas et le « https ». Il chiffre les échanges entre le visiteur et votre site : un mot de passe ou un numéro de commande ne circulent plus en clair.",
          "Sans SSL, les navigateurs affichent « Site non sécurisé » et Google vous pénalise. La bonne nouvelle : chez un hébergeur sérieux, il est aujourd’hui inclus et automatique.",
        ],
        callout: "À retenir : domaine (adresse) + hébergement (terrain) + SSL (serrure). Ces trois-là ne sont pas des options : ce sont les fondations d’un site crédible.",
      },
    ],
  },
  {
    title: "Site web ou page Facebook : que choisir pour votre entreprise ?",
    category: "Conseils",
    date: "3 juillet 2026",
    readTime: "6 min",
    image: "/images/blog-1.jpg",
    secondaryImage: "/images/service-blog.jpg",
    eyebrow: "Le faux débat qui coûte cher",
    excerpt: "Faut-il un site web quand on a déjà une page Facebook active ? La réponse honnête : les deux jouent des rôles différents et complémentaires. Voici comment décider.",
    lead: "Une page Facebook attire l’attention ; un site web construit une présence durable que vous possédez. Les réseaux sociaux vous rendent visible aujourd’hui, le site vous rend crédible et trouvable pour toujours. Idéalement, on combine les deux — mais si vous devez choisir, le site est le socle.",
    sections: [
      {
        title: "Ce que Facebook fait bien… et ses limites",
        paragraphs: [
          "Les réseaux sociaux sont excellents pour créer de l’attention, montrer votre quotidien et dialoguer. Mais vous ne les possédez pas : l’algorithme décide qui voit vos publications, un compte peut être bloqué, et vos contenus disparaissent dans le flux en quelques heures.",
          "Surtout, une page sociale n’apparaît quasiment pas dans Google quand quelqu’un cherche vos services.",
        ],
        bullets: [
          "Vous ne contrôlez pas la portée (algorithme)",
          "Risque de blocage ou de suspension du compte",
          "Peu ou pas de visibilité sur Google",
          "Contenu éphémère, vite enterré",
        ],
      },
      {
        title: "Ce que seul un site web vous apporte",
        paragraphs: [
          "Un site est un actif que vous possédez à 100 %. Il travaille pour vous 24h/24, apparaît sur Google, structure votre offre, et inspire confiance : un prospect vérifie souvent votre site avant de vous contacter.",
          "C’est aussi le seul endroit où vous maîtrisez totalement le message, le parcours et la collecte de contacts.",
        ],
        quote: "Bâtir uniquement sur les réseaux sociaux, c’est construire sa maison sur un terrain qu’on ne possède pas — pratique, jusqu’au jour où le propriétaire change les règles.",
      },
      {
        title: "La vraie réponse : les deux, en synergie",
        paragraphs: [
          "Le combo gagnant : les réseaux sociaux pour attirer et animer, le site pour convertir et rassurer. Vos publications ramènent les gens vers votre site, où ils passent à l’action (achat, devis, rendez-vous).",
          "Si votre budget est serré, commencez par le site : c’est la fondation. Vous brancherez les réseaux dessus ensuite.",
        ],
        callout: "À retenir : réseaux sociaux = attention (loué). Site web = crédibilité et trouvabilité (possédé). Le premier alimente le second.",
      },
    ],
  },
  {
    title: "Google Business Profile : apparaître sur Google Maps à Douala",
    category: "Guide",
    date: "27 juin 2026",
    readTime: "6 min",
    image: "/images/about-team.jpg",
    secondaryImage: "/images/service-blog.jpg",
    eyebrow: "Le SEO local, gratuit et puissant",
    excerpt: "Une fiche Google Business Profile bien remplie vous fait apparaître sur Google Maps et dans le « pack local ». C’est souvent le levier de visibilité le plus rentable pour une entreprise locale.",
    lead: "Google Business Profile est une fiche gratuite qui place votre entreprise sur Google Maps et dans les résultats locaux. Pour en tirer profit : renseignez la bonne catégorie, ajoutez photos et horaires, décrivez précisément vos services, et collectez des avis clients régulièrement.",
    sections: [
      {
        title: "Pourquoi c’est si rentable",
        paragraphs: [
          "Quand quelqu’un cherche « agence web Douala » ou « couturier Bonapriso », Google affiche d’abord une carte avec trois entreprises locales. Y figurer, c’est capter des clients à intention d’achat immédiate, gratuitement.",
          "Pour beaucoup de PME, cette fiche génère plus de contacts que le site lui-même, surtout au démarrage.",
        ],
      },
      {
        title: "Comment bien la remplir",
        paragraphs: [
          "Une fiche complète est récompensée par Google. Prenez le temps de tout renseigner : nom exact, catégorie précise, zone desservie, téléphone, site, horaires, et une description riche en mots que vos clients utilisent.",
          "Les photos comptent énormément : logo, devanture, réalisations, équipe. Une fiche avec de belles photos inspire confiance et se démarque dans la carte.",
        ],
        bullets: [
          "Catégorie principale exacte (+ catégories secondaires)",
          "Horaires à jour, y compris jours fériés",
          "10 photos minimum, de bonne qualité",
          "Description avec vos services et votre ville",
        ],
      },
      {
        title: "Les avis : votre carburant",
        paragraphs: [
          "Les avis sont le facteur numéro un du classement local, et le premier réflexe de confiance des clients. Prenez l’habitude d’en demander après chaque prestation réussie, avec un lien direct partagé sur WhatsApp.",
          "Répondez à tous les avis, positifs comme négatifs : cela montre que vous êtes actif et à l’écoute.",
        ],
        callout: "À retenir : cohérence des coordonnées + fiche complète + avis réguliers = le trio qui vous fait grimper sur Google Maps. Et c’est 100 % gratuit.",
      },
    ],
  },
  {
    title: "Accepter les paiements en ligne au Cameroun : le guide 2026",
    category: "Guide",
    date: "22 juin 2026",
    readTime: "7 min",
    image: "/images/project-ecommerce.jpg",
    secondaryImage: "/images/service-ecommerce.jpg",
    eyebrow: "Encaisser sans friction",
    excerpt: "Mobile Money, cartes bancaires, virements : quelles solutions pour encaisser en ligne au Cameroun, comment les intégrer proprement et à quoi faire attention.",
    lead: "Au Cameroun, accepter les paiements en ligne passe d’abord par le Mobile Money (MTN MoMo, Orange Money), complété par les cartes bancaires (Visa/Mastercard) pour la clientèle internationale. L’essentiel : une transaction confirmée automatiquement et rattachée à la bonne commande.",
    sections: [
      {
        title: "Mobile Money : la priorité absolue",
        paragraphs: [
          "La majorité des acheteurs locaux paient avec leur téléphone. Proposer MTN Mobile Money et Orange Money supprime la principale friction du paiement : plus besoin de carte bancaire, un simple numéro suffit.",
          "L’intégration se fait via un agrégateur de paiement qui gère les différents opérateurs, confirme la transaction et notifie votre boutique en temps réel.",
        ],
        bullets: [
          "MTN Mobile Money & Orange Money en priorité",
          "Cartes Visa/Mastercard pour l’international",
          "Confirmation automatique rattachée à la commande",
          "Message clair en cas d’échec de paiement",
        ],
      },
      {
        title: "Éviter les pièges du paiement manuel",
        paragraphs: [
          "Beaucoup de commerçants demandent encore une capture d’écran du transfert. C’est lent, source d’erreurs et de fraudes, et ça décourage l’acheteur au pire moment.",
          "Un paiement bien intégré est instantané, traçable et sans intervention humaine : le statut de la commande passe tout seul de « en attente » à « payée ».",
        ],
        quote: "Le meilleur paiement est celui que le client comprend sans poser de question et qui se confirme sans que vous ayez à lever le petit doigt.",
      },
      {
        title: "Sécurité et frais",
        paragraphs: [
          "Chaque solution prélève une commission par transaction : intégrez-la dans vos prix plutôt que de la subir. Comparez aussi les délais de reversement sur votre compte.",
          "Côté sécurité, exigez le https (SSL) sur toute la boutique et ne stockez jamais vous-même les données sensibles : laissez l’agrégateur, spécialisé et certifié, gérer la partie paiement.",
        ],
        callout: "À retenir : Mobile Money d’abord, confirmation automatique toujours, capture d’écran jamais. C’est la règle d’or de l’encaissement en ligne au Cameroun.",
      },
    ],
  },
  {
    title: "WhatsApp Business : transformer vos conversations en ventes",
    category: "Conseils",
    date: "18 juin 2026",
    readTime: "5 min",
    image: "/images/project-delivery.jpg",
    secondaryImage: "/images/blog-1.jpg",
    eyebrow: "Le canal préféré de vos clients",
    excerpt: "WhatsApp est déjà là où sont vos clients. Bien utilisé — catalogue, réponses rapides, lien depuis le site — il devient un véritable canal de vente, pas juste une messagerie.",
    lead: "WhatsApp Business transforme vos discussions en ventes grâce à trois outils : un catalogue de produits intégré, des réponses rapides pré-enregistrées, et des liens « cliquer pour discuter » depuis votre site et vos publicités. L’objectif : répondre vite, cadrer la conversation, et conclure.",
    sections: [
      {
        title: "Structurez au lieu d’improviser",
        paragraphs: [
          "Un profil WhatsApp Business complet (nom, logo, adresse, horaires, catalogue) inspire immédiatement plus confiance qu’un numéro anonyme. Le catalogue permet de présenter vos produits avec prix et photos, sans renvoyer sans cesse les mêmes images.",
          "Les messages d’accueil et les réponses rapides vous font gagner un temps précieux et donnent une image professionnelle et réactive.",
        ],
        bullets: [
          "Profil complet avec logo et catalogue",
          "Message d’accueil automatique",
          "Réponses rapides aux questions fréquentes",
          "Étiquettes pour suivre chaque prospect",
        ],
      },
      {
        title: "Reliez WhatsApp à votre site",
        paragraphs: [
          "Un bouton « Discuter sur WhatsApp » bien placé sur votre site (et dans vos pubs) capte les clients au moment exact où ils hésitent. Le lien wa.me ouvre la conversation en un clic, souvent avec un message pré-rempli.",
          "Ainsi, votre site travaille la crédibilité et le référencement, et WhatsApp prend le relais pour la conversation et la vente.",
        ],
        quote: "Vos clients n’ont pas envie de remplir un formulaire compliqué : ils veulent parler. WhatsApp supprime la distance entre l’intérêt et l’achat.",
      },
      {
        title: "Cadrez la conversation vers la vente",
        paragraphs: [
          "Répondre vite est la moitié du travail. L’autre moitié : guider poliment vers l’étape suivante — proposer un produit précis, envoyer un lien de paiement, confirmer une livraison. Une conversation sans direction ne se transforme pas en vente.",
        ],
        callout: "À retenir : WhatsApp n’est pas qu’une messagerie, c’est un tunnel de vente. Profil pro + catalogue + lien depuis le site + réponse rapide = plus de ventes.",
      },
    ],
  },
  {
    title: "Combien de temps faut-il pour créer un site web ?",
    category: "Conseils",
    date: "11 juin 2026",
    readTime: "5 min",
    image: "/images/process-visual.jpg",
    secondaryImage: "/images/service-custom.jpg",
    eyebrow: "Des délais réalistes, sans mauvaise surprise",
    excerpt: "Une landing page en 2 semaines, un site vitrine en 3, un e-commerce en 4 à 6 : voici les délais réalistes pour créer un site, et ce qui les fait varier.",
    lead: "Le délai dépend du type de site : environ 2 semaines pour une landing page, 3 semaines pour un site vitrine, 4 à 6 semaines pour un e-commerce, et 8 semaines ou plus pour une application ou un SaaS. Le principal facteur de retard n’est pas la technique, mais la disponibilité des contenus (textes, photos, validations).",
    sections: [
      {
        title: "Des repères par type de projet",
        paragraphs: [
          "Chaque projet a son rythme. Une page unique se conçoit vite ; une boutique avec paiement et catalogue demande davantage de tests. Ces délais supposent un cadrage clair au départ et des retours rapides à chaque étape.",
        ],
        bullets: [
          "Landing page : ≈ 2 semaines",
          "Site vitrine : ≈ 3 semaines",
          "E-commerce : ≈ 4 à 6 semaines",
          "Application / SaaS : ≈ 8 semaines et plus",
        ],
      },
      {
        title: "Ce qui accélère (ou ralentit) le projet",
        paragraphs: [
          "Le facteur numéro un est le contenu. Un projet où textes, photos et informations sont prêts avance deux fois plus vite qu’un projet où l’on attend ces éléments semaine après semaine.",
          "La rapidité de validation compte aussi : des retours groupés et clairs à chaque étape évitent les allers-retours interminables.",
        ],
        quote: "Un site prend rarement du retard à cause du code. Il prend du retard quand les contenus et les validations tardent à arriver.",
      },
      {
        title: "Mieux vaut bien fait que vite bâclé",
        paragraphs: [
          "On peut « livrer » un site en 48h. Mais un site pensé pour convertir, rapide et bien référencé, mérite quelques jours de plus. La différence se voit sur les résultats, pas le jour de la mise en ligne.",
        ],
        callout: "À retenir : préparez vos contenus en amont et validez vite. C’est le plus sûr moyen d’avoir votre site en ligne dans les délais annoncés.",
      },
    ],
  },
  {
    title: "Refonte de site web : 7 signes qu’il est temps de le refaire",
    category: "Conseils",
    date: "5 juin 2026",
    readTime: "6 min",
    image: "/images/service-custom.jpg",
    secondaryImage: "/images/blog-2.jpg",
    eyebrow: "Quand votre site vous freine",
    excerpt: "Un vieux site peut coûter des clients sans que vous le sachiez. Voici 7 signes clairs qu’une refonte s’impose, et ce qu’elle doit corriger en priorité.",
    lead: "Il est temps de refaire votre site s’il est lent, illisible sur mobile, difficile à mettre à jour, non sécurisé, invisible sur Google, visuellement daté, ou s’il ne reflète plus votre offre. Un seul de ces signes vous fait perdre des clients ; plusieurs justifient une refonte immédiate.",
    sections: [
      {
        title: "Les signaux qui ne trompent pas",
        paragraphs: [
          "Certains problèmes se voient tout de suite, d’autres agissent en silence. Dans les deux cas, ils sabotent votre crédibilité et vos ventes. Faites le test honnêtement sur votre propre site, depuis votre téléphone.",
        ],
        bullets: [
          "Il met plus de 3 secondes à s’afficher",
          "Il est difficile à lire ou à utiliser sur mobile",
          "Vous ne pouvez pas le modifier vous-même",
          "Il affiche « non sécurisé » (pas de https)",
          "Il n’apparaît nulle part sur Google",
          "Son design fait « années 2010 »",
          "Il ne parle plus de votre offre actuelle",
        ],
      },
      {
        title: "Refonte ne veut pas dire tout jeter",
        paragraphs: [
          "Une bonne refonte conserve ce qui marche (votre contenu utile, vos pages bien référencées) et corrige le reste. On garde le nom de domaine et l’historique SEO — les perdre reviendrait à repartir de zéro aux yeux de Google.",
          "L’objectif n’est pas d’avoir « un nouveau site », mais un site qui travaille mieux : plus rapide, plus clair, plus vendeur.",
        ],
        quote: "Un site daté envoie un message que vous ne diriez jamais à voix haute à un client : « nous ne sommes plus vraiment à jour ».",
      },
      {
        title: "Préserver le référencement pendant la refonte",
        paragraphs: [
          "Le piège d’une refonte mal menée, c’est de chuter dans Google du jour au lendemain. On l’évite en conservant les adresses des pages ou en mettant des redirections propres, et en gardant les contenus qui rankaient déjà.",
        ],
        callout: "À retenir : refaire un site, c’est réparer une machine à clients, pas repartir de zéro. On garde le domaine, l’historique SEO et ce qui fonctionne.",
      },
    ],
  },
  {
    title: "Comment digitaliser sa PME au Cameroun, étape par étape",
    category: "Guide",
    date: "30 mai 2026",
    readTime: "8 min",
    image: "/images/project-school.jpg",
    secondaryImage: "/images/service-saas.jpg",
    eyebrow: "Une feuille de route concrète",
    excerpt: "Digitaliser sa PME ne veut pas dire tout informatiser d’un coup. Voici une feuille de route progressive et réaliste, adaptée aux moyens des entreprises camerounaises.",
    lead: "Digitaliser une PME au Cameroun se fait par étapes : d’abord la présence en ligne (site + Google), puis l’encaissement digital (Mobile Money), puis l’outillage interne (gestion des ventes, stocks, clients). On commence par le besoin le plus coûteux en temps ou en opportunités perdues.",
    sections: [
      {
        title: "Étape 1 — Exister et être trouvé",
        paragraphs: [
          "La première marche est la visibilité : un site clair, une fiche Google Business Profile et une présence cohérente sur les réseaux. Sans cela, vos futurs clients ne vous trouvent tout simplement pas.",
          "C’est aussi l’étape qui construit la confiance : un prospect vérifie votre existence en ligne avant de vous confier son argent.",
        ],
      },
      {
        title: "Étape 2 — Vendre et encaisser en ligne",
        paragraphs: [
          "Une fois visible, on fluidifie la vente : prise de commande en ligne ou par WhatsApp, paiement Mobile Money, confirmation automatique. Vous encaissez plus vite et avec moins d’erreurs.",
          "Cette étape a souvent le retour sur investissement le plus rapide, car elle agit directement sur le chiffre d’affaires.",
        ],
        bullets: [
          "Prise de commande simplifiée",
          "Paiement Mobile Money intégré",
          "Suivi clair des commandes",
        ],
      },
      {
        title: "Étape 3 — Outiller l’interne",
        paragraphs: [
          "Vient ensuite l’organisation : remplacer les fichiers Excel dispersés et les cahiers par un outil qui centralise stocks, ventes, clients et rapports. C’est là qu’une solution sur-mesure ou un SaaS métier prend tout son sens.",
          "L’objectif est l’autonomie et la clarté : chaque équipe voit ce dont elle a besoin, et le dirigeant pilote avec des chiffres fiables.",
        ],
        quote: "La digitalisation réussie n’est pas la plus technologique, c’est la plus progressive : une étape à la fois, chacune rentabilisée avant la suivante.",
      },
      {
        title: "Le bon rythme : petit, utile, mesuré",
        paragraphs: [
          "N’essayez pas de tout faire en même temps. Choisissez le point qui vous coûte le plus (temps perdu, ventes ratées, erreurs) et réglez-le d’abord. Mesurez le gain, puis passez à l’étape suivante.",
        ],
        callout: "À retenir : visibilité → encaissement → outillage interne. Commencez par ce qui vous fait le plus mal, mesurez, avancez. La digitalisation est un chemin, pas un big-bang.",
      },
    ],
  },
];

/* ----------------------------- FAQ ------------------------------ */
const faqs = [
  { q: "Ai-je vraiment besoin d’un site web si j’ai déjà une page Facebook ou Instagram active ?", a: "Oui. Les réseaux sociaux créent de l’attention mais vous ne les possédez pas : l’algorithme décide de votre portée et un compte peut être bloqué. Un site vous appartient à 100 %, apparaît sur Google et rassure les prospects qui vérifient votre sérieux avant d’acheter. L’idéal est de combiner les deux, le site servant de socle." },
  { q: "Mon site fonctionnera-t-il bien sur mobile et en connexion lente ?", a: "Oui, c’est une priorité absolue chez nous. Nous concevons chaque site « mobile d’abord », avec des images légères et un chargement rapide même en 3G. La majorité de vos visiteurs étant sur téléphone, un site rapide sur mobile est la condition numéro un pour convertir." },
  { q: "Combien coûte le renouvellement annuel (nom de domaine + hébergement) ?", a: "La première année est incluse dans nos packs. À partir de la 2e année, seul le renouvellement du domaine et de l’hébergement reste à payer — un montant modéré, annoncé clairement dès le devis. Aucune mauvaise surprise." },
  { q: "Puis-je vendre en ligne sans boutique physique ni gros stock ?", a: "Absolument. Beaucoup de nos clients démarrent avec quelques produits phares, une boutique simple, le paiement Mobile Money et une livraison locale. On lance petit, on mesure les premières ventes, puis on élargit le catalogue en fonction de la demande réelle." },
  { q: "Comment mon site va-t-il apparaître sur Google ?", a: "Nous intégrons le référencement de base dès la création : titres et descriptions optimisés, site rapide et sécurisé, sitemap soumis à Google Search Console et fiche Google Business Profile pour le local. Les premiers résultats arrivent généralement en 2 à 4 mois, puis se renforcent, surtout si vous publiez régulièrement des articles." },
  { q: "À qui appartient le site une fois payé ? Ai-je accès aux comptes ?", a: "Le site vous appartient entièrement. Le nom de domaine et les accès (hébergement, administration) sont à votre nom : vous n’êtes jamais prisonnier d’un prestataire. Nous vous formons pour être autonome et restons disponibles si vous avez besoin d’aide." },
  { q: "Que se passe-t-il si mon site tombe en panne ou est piraté ?", a: "Nos hébergements incluent des sauvegardes automatiques et le certificat SSL. En cas de problème, on peut restaurer une version saine rapidement. Pour les sites sensibles, nous proposons une maintenance mensuelle qui surveille, met à jour et sécurise le site en continu." },
  { q: "Puis-je commencer avec un petit site et le faire évoluer plus tard ?", a: "Oui, c’est même recommandé. On construit une base solide (une landing page ou un site vitrine), puis on ajoute des pages, un blog, une boutique ou des fonctionnalités au fur et à mesure de votre croissance, sans tout reconstruire." },
  { q: "Travaillez-vous avec des clients hors de Douala ou hors du Cameroun ?", a: "Oui. Nous accompagnons des clients partout au Cameroun et à l’international, en visio. Toute la collaboration (échanges, validations, formation, support WhatsApp) se fait à distance aussi facilement qu’en présentiel." },
  { q: "Proposez-vous aussi le logo, les textes et les photos, ou dois-je les fournir ?", a: "Les deux sont possibles. Vous pouvez fournir vos éléments, ou nous confier la rédaction des textes orientés conversion, la création ou l’amélioration du logo, et la retouche de vos photos. On s’adapte à ce que vous avez déjà et à votre budget." },
];

/* --------------------------- SQL gen ---------------------------- */
const q = (v) => `'${String(v ?? "").replace(/'/g, "''")}'`;
const j = (v) => q(JSON.stringify(v ?? []));

let sql = "-- Généré par scripts/gen-seo-content.mjs — contenu SEO/AEO (articles + FAQ).\n";
sql += "-- Idempotent : on supprime d'abord par titre/question, puis on réinsère.\n\n";

// Articles : DELETE par titre puis INSERT (sort_order 20+ pour passer après l'existant)
const titles = articles.map((a) => q(a.title)).join(", ");
sql += `DELETE FROM posts WHERE title IN (${titles});\n`;
sql += "INSERT INTO posts (title, category, date, read_time, excerpt, image, featured, sort_order, active, eyebrow, lead, secondary_image, author, sections) VALUES\n";
sql += articles
  .map((a, i) =>
    `(${q(a.title)}, ${q(a.category)}, ${q(a.date)}, ${q(a.readTime)}, ${q(a.excerpt)}, ${q(a.image)}, 0, ${20 + i}, 1, ${q(a.eyebrow)}, ${q(a.lead)}, ${q(a.secondaryImage)}, ${q(AUTHOR)}, ${j(a.sections)})`)
  .join(",\n") + ";\n\n";

// FAQ : DELETE par question puis INSERT (sort_order 20+ pour passer après l'existant)
const questions = faqs.map((f) => q(f.q)).join(", ");
sql += `DELETE FROM faqs WHERE question IN (${questions});\n`;
sql += "INSERT INTO faqs (question, answer, sort_order, active) VALUES\n";
sql += faqs.map((f, i) => `(${q(f.q)}, ${q(f.a)}, ${20 + i}, 1)`).join(",\n") + ";\n";

writeFileSync(path.resolve("db/seo-content.sql"), sql);
console.log(`db/seo-content.sql généré : ${articles.length} articles + ${faqs.length} FAQ, ${sql.length} octets`);
