/* ------------------------------------------------------------------
   Guide du portail (FR/EN) : la visite guidée du premier accès, l'encart
   « Comment ça marche ? » de chaque page et la foire aux questions de
   l'Aide. Un seul endroit pour décrire le but et le fonctionnement de
   chaque page : si une page change, on met ce fichier à jour.
   Langage simple, phrases courtes, toujours « ce que vous faites ici ».
------------------------------------------------------------------- */
import { getLocale } from "./i18n";

export interface PageGuide {
  icon: string;
  title: string; // nom de la page
  purpose: string; // à quoi elle sert, en une phrase
  steps: string[]; // ce que vous y faites
  next: string; // ce qui se passe ensuite
  where?: string; // où la trouver sur téléphone
}

export interface GuideText {
  howItWorks: string;
  gotIt: string;
  youDo: string;
  then: string;
  tourStep: (i: number, n: number) => string;
  tourPrev: string;
  tourNext: string;
  tourStart: string;
  tourSkip: string;
  tourReplay: string;
  tourReplaySub: string;
  pagesTitle: string;
  pagesSub: string;
  faqTitle: string;
  intro: { icon: string; title: string; text: string; bullets: string[] }[];
  outro: { icon: string; title: string; text: string; bullets: string[] };
  pages: Record<string, PageGuide>;
  faq: { q: string; a: string }[];
}

const fr: GuideText = {
  howItWorks: "Comment ça marche ?",
  gotIt: "J'ai compris",
  youDo: "Ce que vous faites ici",
  then: "Et ensuite ?",
  tourStep: (i, n) => `${i} / ${n}`,
  tourPrev: "Précédent",
  tourNext: "Suivant",
  tourStart: "C'est parti !",
  tourSkip: "Passer la visite",
  tourReplay: "Revoir la visite guidée",
  tourReplaySub: "2 minutes pour faire le tour de votre espace, page par page.",
  pagesTitle: "Le guide de chaque page",
  pagesSub: "À quoi sert chaque page, et ce que vous y faites.",
  faqTitle: "Questions fréquentes",
  intro: [
    {
      icon: "home",
      title: "Bienvenue dans votre espace",
      text: "C'est ici que l'on mène votre projet ensemble, du premier échange jusqu'à la livraison. Tout est au même endroit : vos fichiers, nos messages, vos documents, l'avancement et les paiements.",
      bullets: ["Plus besoin de chercher dans WhatsApp ou vos emails", "Tout est enregistré et retrouvable à tout moment", "La visite dure 2 minutes : suivez le guide !"],
    },
    {
      icon: "more",
      title: "Se repérer",
      text: "Le menu vous donne accès à toutes les pages de votre espace.",
      bullets: [
        "Sur téléphone : les pages principales sont en bas de l'écran, les autres dans « Plus »",
        "Sur ordinateur : le menu est à gauche",
        "Une pastille rouge sur une page = quelque chose vous y attend",
      ],
    },
  ],
  outro: {
    icon: "check",
    title: "Vous savez tout !",
    text: "Commencez par l'Accueil : le bouton rouge vous indique toujours la prochaine chose à faire.",
    bullets: ["Chaque page a son bouton « Comment ça marche ? » en haut", "La visite se relance depuis la page Aide", "Une question ? Écrivez-nous dans Messages ou sur WhatsApp"],
  },
  pages: {
    home: {
      icon: "home",
      title: "Accueil",
      purpose: "Le tableau de bord de votre projet : où on en est, et ce qu'on attend de vous maintenant.",
      steps: [
        "Le bouton rouge « À faire maintenant » montre la prochaine action : envoyer un élément, signer, valider, payer ou remplir un questionnaire. Touchez-le, il vous emmène au bon endroit.",
        "La barre d'avancement et la date de livraison prévue vous disent où en est le projet.",
        "Quand une étape passe « À valider », regardez le travail puis touchez « Je valide » ou « Je veux des changements » en expliquant quoi changer.",
        "« Le point de la semaine » résume ce qu'on a fait et ce qui vient. « Quoi de neuf » liste tout ce qui s'est passé.",
      ],
      next: "S'il n'y a rien à faire, c'est que l'on travaille pour vous : vous êtes prévenu dès qu'on a besoin de vous.",
    },
    todo: {
      icon: "todo",
      title: "À faire",
      purpose: "La liste des éléments dont on a besoin pour avancer : logo, photos, textes, accès…",
      steps: [
        "Chaque élément indique ce qu'il faut et la date souhaitée.",
        "Fichiers : touchez « Ajouter des fichiers », envoyez tout, puis « J'ai tout envoyé ».",
        "Questions : répondez directement ; « Enregistrer le brouillon » garde vos réponses pour plus tard.",
        "Accès (nom de domaine, réseaux…) : ils sont chiffrés, seule l'équipe Impact Tech peut les lire.",
      ],
      next: "L'élément passe « Reçu, on vérifie », puis « Validé ✓ ». S'il manque quelque chose, il revient « À envoyer » avec une explication. En cas de retard, un petit rappel vous est envoyé.",
      where: "Sur téléphone : en bas de l'écran.",
    },
    messages: {
      icon: "chat",
      title: "Messages",
      purpose: "La discussion avec l'équipe sur votre projet, gardée au même endroit.",
      steps: [
        "Écrivez votre question ou votre remarque, puis envoyez.",
        "Joignez une photo ou un fichier avec le trombone.",
        "Pas envie d'écrire ? Maintenez le micro pour envoyer une note vocale.",
      ],
      next: "On vous répond rapidement. Le point de la semaine apparaît aussi ici. Pour une urgence, utilisez WhatsApp (page Aide).",
      where: "Sur téléphone : en bas de l'écran.",
    },
    files: {
      icon: "files",
      title: "Fichiers",
      purpose: "Tous les fichiers du projet, les vôtres et les nôtres, rangés par dossier.",
      steps: [
        "Touchez la zone d'envoi (ou glissez vos fichiers sur ordinateur) et choisissez le dossier : Logo, Photos, Vidéos, Musique & audio, Textes, Documents.",
        "Tous les formats sont acceptés, jusqu'à 5 Go par fichier : envoyez les originaux, pas des captures d'écran.",
        "Gardez la page ouverte pendant l'envoi des gros fichiers.",
        "Filtrez par dossier, ouvrez un aperçu ou téléchargez un fichier.",
      ],
      next: "L'équipe est prévenue à chaque envoi. Les fichiers que nous vous transmettons apparaissent ici aussi, avec la mention « De la part d'Impact Tech ».",
      where: "Sur téléphone : en bas de l'écran.",
    },
    documents: {
      icon: "doc",
      title: "Documents",
      purpose: "Vos documents officiels : contrat, cahier des charges, maquettes…",
      steps: [
        "Un document « À signer » ? Ouvrez-le et lisez-le jusqu'en bas.",
        "Écrivez « Lu et approuvé », signez dans le cadre avec le doigt ou la souris, puis touchez « Signer le document ».",
        "Téléchargez à tout moment le document ou sa version signée (PDF).",
      ],
      next: "Votre signature est datée et le PDF signé est conservé ici. Quand Impact Tech signe à son tour, le document passe « Signé par les deux parties ✓ ».",
      where: "Sur téléphone : dans « Plus ».",
    },
    site: {
      icon: "site",
      title: "Mon site",
      purpose: "Votre site en construction, à regarder dès qu'il est visible, pour nous dire ce qu'il faut changer.",
      steps: [
        "Regardez le site en version ordinateur, tablette ou téléphone, ou ouvrez-le dans un nouvel onglet.",
        "Une remarque ? Décrivez ce qu'il faut changer et sur quelle page, puis envoyez.",
        "Suivez vos demandes : Reçue, En cours, Faite ✓.",
      ],
      next: "On regroupe vos demandes en séries de modifications (le nombre inclus est indiqué sur l'Accueil). Une demande hors du projet prévu peut faire l'objet d'un devis, toujours avec votre accord.",
      where: "Sur téléphone : dans « Plus ».",
    },
    kit: {
      icon: "gift",
      title: "Livraison",
      purpose: "Une fois le site livré : tout ce qu'il faut pour le gérer, au même endroit.",
      steps: [
        "Ouvrez votre site et son espace de gestion, retrouvez vos guides et vos accès.",
        "Vérifiez que le site est en ligne : on le surveille chaque jour.",
        "Consultez la fin du support inclus et les dates de renouvellement (hébergement, nom de domaine).",
        "Besoin d'aide ? « Demander de l'aide ». Content de nous ? Laissez un avis ou recommandez-nous.",
      ],
      next: "Avant chaque renouvellement, vous êtes prévenu à l'avance et la facture arrive dans Paiements.",
      where: "Sur téléphone : dans « Plus ».",
    },
    payments: {
      icon: "money",
      title: "Paiements",
      purpose: "Vos devis et vos factures, et le paiement en un clic.",
      steps: [
        "Un devis ? Lisez-le (PDF), puis « Accepter le devis » ou « Refuser » en nous disant pourquoi.",
        "Une facture ? « Payer par Mobile Money » (MTN ou Orange), paiement sécurisé par K-PAY.",
        "Téléchargez vos reçus quand vous voulez.",
      ],
      next: "Le paiement est enregistré automatiquement et la facture passe « Payé ✓ ». Notre garantie : vous ne payez qu'à la livraison, si vous êtes satisfait.",
      where: "Sur téléphone : dans « Plus ».",
    },
    help: {
      icon: "help",
      title: "Aide",
      purpose: "Nous joindre, revoir la visite guidée et confier vos accès en toute sécurité.",
      steps: [
        "Écrivez-nous sur WhatsApp, appelez-nous ou prenez rendez-vous.",
        "Ajoutez votre espace à l'écran d'accueil du téléphone, comme une application.",
        "Coffre d'accès : enregistrez vos codes (nom de domaine, hébergement, réseaux sociaux). Ils sont chiffrés.",
        "Relisez le guide de chaque page et les questions fréquentes.",
      ],
      next: "On répond vite, sur WhatsApp ou dans Messages.",
      where: "Sur téléphone : dans « Plus ».",
    },
  },
  faq: [
    { q: "Je dois me reconnecter à chaque fois ?", a: "Non. Une fois connecté avec votre code, vous restez connecté 90 jours sur cet appareil. Sur un nouvel appareil, demandez un nouveau code (par email ou sur WhatsApp)." },
    { q: "Je n'ai pas reçu mon code de connexion", a: "Par email, regardez aussi dans vos spams. Sinon, touchez « Recevoir mon code sur WhatsApp » et indiquez le numéro que vous nous avez donné : on vous envoie le code sur ce numéro. Pour votre sécurité, l'espace accepte 5 tentatives par heure (demandes de code et codes saisis) : au-delà, patientez quelques minutes." },
    { q: "Puis-je envoyer de grosses vidéos ?", a: "Oui, jusqu'à 5 Go par fichier. Gardez la page ouverte pendant l'envoi ; si la connexion coupe, relancez simplement l'envoi du fichier." },
    { q: "Qui voit mes fichiers et mes accès ?", a: "Seulement vous et l'équipe Impact Tech. Les accès (mots de passe) sont chiffrés." },
    { q: "Comment valider une étape ?", a: "Sur l'Accueil, une étape « À valider » affiche deux boutons : « Je valide » si tout vous convient, ou « Je veux des changements » en expliquant quoi changer." },
    { q: "Combien de modifications puis-je demander ?", a: "Le nombre de séries de modifications incluses est indiqué sur l'Accueil. Envoyez vos remarques depuis « Mon site » : on les regroupe pour aller plus vite." },
    { q: "Comment payer ?", a: "Dans Paiements, touchez « Payer par Mobile Money » (MTN ou Orange). Le paiement est sécurisé et enregistré automatiquement." },
    { q: "Ma signature en ligne est-elle valable ?", a: "Oui : vous écrivez « Lu et approuvé » et signez ; la signature est datée et le PDF signé est conservé dans Documents, téléchargeable à tout moment." },
    { q: "Comment suis-je prévenu ?", a: "Quand on a besoin de vous, le bouton rouge apparaît sur l'Accueil et une pastille sur la page concernée. Vous recevez aussi un message (email ou WhatsApp)." },
    { q: "Je préfère l'anglais", a: "Touchez « English » dans le menu (dans « Plus » sur téléphone) : tout l'espace passe en anglais." },
  ],
};

const en: GuideText = {
  howItWorks: "How does it work?",
  gotIt: "Got it",
  youDo: "What you do here",
  then: "What happens next?",
  tourStep: (i, n) => `${i} / ${n}`,
  tourPrev: "Back",
  tourNext: "Next",
  tourStart: "Let's go!",
  tourSkip: "Skip the tour",
  tourReplay: "Replay the guided tour",
  tourReplaySub: "2 minutes to go through your space, page by page.",
  pagesTitle: "Guide to each page",
  pagesSub: "What each page is for, and what you do there.",
  faqTitle: "Frequently asked questions",
  intro: [
    {
      icon: "home",
      title: "Welcome to your space",
      text: "This is where we run your project together, from the first exchange to delivery. Everything is in one place: your files, our messages, your documents, progress and payments.",
      bullets: ["No more searching through WhatsApp or emails", "Everything is saved and easy to find", "The tour takes 2 minutes: follow the guide!"],
    },
    {
      icon: "more",
      title: "Finding your way",
      text: "The menu gives you access to every page of your space.",
      bullets: ["On a phone: main pages are at the bottom of the screen, the others under “More”", "On a computer: the menu is on the left", "A red dot on a page = something is waiting for you there"],
    },
  ],
  outro: {
    icon: "check",
    title: "You're all set!",
    text: "Start with Home: the red button always shows you the next thing to do.",
    bullets: ["Each page has a “How does it work?” button at the top", "Replay the tour from the Help page", "A question? Write to us in Messages or on WhatsApp"],
  },
  pages: {
    home: {
      icon: "home",
      title: "Home",
      purpose: "Your project dashboard: where things stand, and what we need from you now.",
      steps: [
        "The red “To do now” button shows the next action: send something, sign, approve, pay or fill in a questionnaire. Tap it to go straight there.",
        "The progress bar and planned delivery date show where the project stands.",
        "When a step is “To approve”, look at the work, then tap “I approve” or “I'd like changes” and explain what to change.",
        "“This week's update” sums up what we did and what's next. “What's new” lists everything that happened.",
      ],
      next: "If there's nothing to do, we're working for you: you'll be notified as soon as we need you.",
    },
    todo: {
      icon: "todo",
      title: "To do",
      purpose: "The list of things we need to move forward: logo, photos, texts, access…",
      steps: [
        "Each item says what's needed and by when.",
        "Files: tap “Add files”, send everything, then “I've sent everything”.",
        "Questions: answer directly; “Save draft” keeps your answers for later.",
        "Access (domain name, social media…): encrypted, only the Impact Tech team can read it.",
      ],
      next: "The item becomes “Received, checking”, then “Approved ✓”. If something is missing, it goes back to “To send” with an explanation. If it's late, you'll get a gentle reminder.",
      where: "On a phone: at the bottom of the screen.",
    },
    messages: {
      icon: "chat",
      title: "Messages",
      purpose: "Your conversation with the team about the project, kept in one place.",
      steps: ["Write your question or comment, then send.", "Attach a photo or a file with the paperclip.", "Rather not type? Hold the mic to send a voice note."],
      next: "We reply quickly. This week's update also appears here. For anything urgent, use WhatsApp (Help page).",
      where: "On a phone: at the bottom of the screen.",
    },
    files: {
      icon: "files",
      title: "Files",
      purpose: "All the project files, yours and ours, sorted into folders.",
      steps: [
        "Tap the upload area (or drag your files on a computer) and pick the folder: Logo, Photos, Videos, Music & audio, Texts, Documents.",
        "All formats are accepted, up to 5 GB per file: send originals, not screenshots.",
        "Keep the page open while large files upload.",
        "Filter by folder, preview or download a file.",
      ],
      next: "The team is notified of every upload. Files we send you appear here too, marked “From Impact Tech”.",
      where: "On a phone: at the bottom of the screen.",
    },
    documents: {
      icon: "doc",
      title: "Documents",
      purpose: "Your official documents: contract, specifications, mock-ups…",
      steps: ["A document “To sign”? Open it and read it to the end.", "Write “Read and approved”, sign in the box with your finger or mouse, then tap “Sign the document”.", "Download the document or its signed version (PDF) at any time."],
      next: "Your signature is dated and the signed PDF is kept here. When Impact Tech signs too, the document becomes “Signed by both parties ✓”.",
      where: "On a phone: under “More”.",
    },
    site: {
      icon: "site",
      title: "My website",
      purpose: "Your site under construction, to look at as soon as it's visible and tell us what to change.",
      steps: ["View the site as computer, tablet or phone, or open it in a new tab.", "A comment? Describe what to change and on which page, then send.", "Track your requests: Received, In progress, Done ✓."],
      next: "We group your requests into rounds of changes (the number included is shown on Home). A request outside the planned project may get a quote, always with your agreement.",
      where: "On a phone: under “More”.",
    },
    kit: {
      icon: "gift",
      title: "Delivery",
      purpose: "Once the site is delivered: everything you need to manage it, in one place.",
      steps: [
        "Open your site and its admin, find your guides and access.",
        "Check the site is online: we monitor it every day.",
        "See when included support ends and the renewal dates (hosting, domain name).",
        "Need help? “Ask for help”. Happy with us? Leave a review or recommend us.",
      ],
      next: "Before each renewal, you're notified in advance and the invoice arrives in Payments.",
      where: "On a phone: under “More”.",
    },
    payments: {
      icon: "money",
      title: "Payments",
      purpose: "Your quotes and invoices, and one-tap payment.",
      steps: ["A quote? Read it (PDF), then “Accept the quote” or “Decline” and tell us why.", "An invoice? “Pay with Mobile Money” (MTN or Orange), secured by K-PAY.", "Download your receipts whenever you like."],
      next: "The payment is recorded automatically and the invoice becomes “Paid ✓”. Our guarantee: you only pay on delivery, if you're satisfied.",
      where: "On a phone: under “More”.",
    },
    help: {
      icon: "help",
      title: "Help",
      purpose: "Reach us, replay the guided tour and share your access securely.",
      steps: [
        "Write to us on WhatsApp, call us or book a meeting.",
        "Add your space to your phone's home screen, like an app.",
        "Access vault: save your logins (domain name, hosting, social media). They're encrypted.",
        "Read the guide to each page and the frequently asked questions.",
      ],
      next: "We reply quickly, on WhatsApp or in Messages.",
      where: "On a phone: under “More”.",
    },
  },
  faq: [
    { q: "Do I have to log in every time?", a: "No. Once logged in with your code, you stay logged in for 90 days on this device. On a new device, ask for a new code (by email or on WhatsApp)." },
    { q: "I didn't receive my login code", a: "By email, also check your spam folder. Otherwise, tap “Get my code on WhatsApp” and enter the number you gave us: we send the code to that number. For your security, the space allows 5 attempts per hour (code requests and codes entered): beyond that, wait a few minutes." },
    { q: "Can I send large videos?", a: "Yes, up to 5 GB per file. Keep the page open while it uploads; if the connection drops, just upload the file again." },
    { q: "Who can see my files and access?", a: "Only you and the Impact Tech team. Access details (passwords) are encrypted." },
    { q: "How do I approve a step?", a: "On Home, a step “To approve” shows two buttons: “I approve” if you're happy, or “I'd like changes” with what to change." },
    { q: "How many changes can I ask for?", a: "The number of rounds of changes included is shown on Home. Send your comments from “My website”: we group them to go faster." },
    { q: "How do I pay?", a: "In Payments, tap “Pay with Mobile Money” (MTN or Orange). Payment is secure and recorded automatically." },
    { q: "Is my online signature valid?", a: "Yes: you write “Read and approved” and sign; the signature is dated and the signed PDF is kept in Documents, downloadable at any time." },
    { q: "How am I notified?", a: "When we need you, the red button appears on Home and a dot on the relevant page. You also receive a message (email or WhatsApp)." },
    { q: "I prefer French", a: "Tap “Français” in the menu (under “More” on a phone): the whole space switches language." },
  ],
};

export const guide = (): GuideText => (getLocale() === "en" ? en : fr);

/* Ordre de la visite guidée (« kit » remplace « site » une fois le projet livré). */
export const TOUR_PAGES = (delivered: boolean) => ["home", "todo", "files", "messages", "documents", delivered ? "kit" : "site", "payments", "help"];
