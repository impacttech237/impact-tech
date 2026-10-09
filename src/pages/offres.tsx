import Layout from "../layout";
import Header from "../components/Header";
import Footer from "../components/Footer";
import PageHero from "../components/PageHero";
import OffersComparison from "../components/OffersComparison";
import OfferDetail from "../components/OfferDetail";
import Offers from "../components/Offers";
import Faq from "../components/Faq";
import CtaBanner from "../components/CtaBanner";
import { offersJsonLd, faqJsonLd, breadcrumbJsonLd } from "../lib/seo";

/* Page "Nos Offres" — fusion Services + Offres (refonte) : chaque pack EST
   le service. Remplace l'ancienne page /services (redirection 301 en place
   dans src/worker.tsx). */
export default function OffresPage({ content, locale = "fr" }) {
  const en = locale === "en";
  return (
    <Layout
      title={en ? "Our plans — 3 packages, pay on delivery" : "Nos offres — 3 packs, paiement à la livraison"}
      description={en
        ? "Essential, Business, Custom: 3 clear all-inclusive plans. Design, development, hosting and training included. You pay only on delivery."
        : "Impact Essentiel, Impact Business, Impact Sur Mesure : 3 formules claires, tout inclus. Design, développement, hébergement et formation compris. Vous ne payez qu'à la livraison."}
      canonical={en ? "/en/offres" : "/offres"}
      locale={locale}
      jsonLd={[offersJsonLd(content.offers), faqJsonLd(content.faqs), breadcrumbJsonLd([{ name: en ? "Home" : "Accueil", path: en ? "/en" : "/" }, { name: en ? "Our Plans" : "Nos Offres", path: en ? "/en/offres" : "/offres" }])]}
    >
      <Header current="/offres" locale={locale} frPath="/offres" />
      <main>
        <PageHero
          page="offres"
          locale={locale}
          crumb={en ? "Our Plans" : "Nos Offres"}
          badge={en ? "3 clear, all-inclusive plans" : "3 formules claires, tout inclus"}
          title={en
            ? [{ t: "Choose the" }, { t: "result", accent: true }, { t: "you want" }]
            : [{ t: "Choisissez le" }, { t: "résultat", accent: true }, { t: "que vous voulez" }]}
          subtitle={en
            ? "Every plan is a complete offer: design, development, hosting, training. You only pay on delivery."
            : "Chaque pack est une offre complète : design, développement, hébergement, formation. Vous ne payez qu'à la livraison."}
        />
        <OffersComparison items={content.offers} locale={locale} />
        <OfferDetail items={content.offers} locale={locale} />
        <Offers items={content.offers} locale={locale} />
        <Faq items={content.faqs} locale={locale} />
        <CtaBanner settings={content.settings} locale={locale} />
      </main>
      <Footer settings={content.settings} locale={locale} />
    </Layout>
  );
}
