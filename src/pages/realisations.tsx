import Layout from "../layout";
import Header from "../components/Header";
import Footer from "../components/Footer";
import PageHero from "../components/PageHero";
import PortfolioGrid from "../components/PortfolioGrid";
import FeaturedTestimonial from "../components/FeaturedTestimonial";
import CtaBanner from "../components/CtaBanner";
import { breadcrumbJsonLd } from "../lib/seo";

export default function RealisationsPage({ content, locale = "fr" }) {
  const en = locale === "en";
  return (
    <Layout
      title={en ? "Our Work — Delivered projects" : "Réalisations — Nos projets livrés"}
      description={en
        ? "Websites, online stores, applications and custom solutions delivered by Impact Tech for businesses in Cameroon and Northern Europe."
        : "Sites, boutiques en ligne, applications et solutions sur-mesure livrés par IMPACT TECH pour des entrepreneurs et entreprises du Cameroun."}
      canonical={en ? "/en/realisations" : "/realisations"}
      locale={locale}
      jsonLd={[breadcrumbJsonLd([{ name: en ? "Home" : "Accueil", path: en ? "/en" : "/" }, { name: en ? "Work" : "Réalisations", path: en ? "/en/realisations" : "/realisations" }])]}
    >
      <Header current="/realisations" locale={locale} frPath="/realisations" />
      <main>
        <PageHero
          page="realisations"
          locale={locale}
          crumb={en ? "Work" : "Réalisations"}
          badge={en ? "Real projects, satisfied clients" : "Des projets concrets, des clients satisfaits"}
          title={en ? [{ t: "Our" }, { t: "work", accent: true }] : [{ t: "Nos" }, { t: "réalisations", accent: true }]}
          subtitle={en
            ? "A look at delivered projects: every website, store or app tells the story of an entrepreneur who took the digital leap."
            : "Un aperçu des projets livrés : chaque site, boutique ou application raconte l'histoire d'un entrepreneur qui a franchi le pas du digital."}
          image="/images/project-custom.jpg"
        />
        <PortfolioGrid items={content.projects} locale={locale} />
        <FeaturedTestimonial items={content.testimonials} locale={locale} />
        <CtaBanner settings={content.settings} locale={locale} />
      </main>
      <Footer settings={content.settings} locale={locale} />
    </Layout>
  );
}
