import Layout from "../layout";
import Header from "../components/Header";
import Footer from "../components/Footer";
import PageHero from "../components/PageHero";
import PortfolioGrid from "../components/PortfolioGrid";
import CtaBanner from "../components/CtaBanner";
import { breadcrumbJsonLd } from "../lib/seo";

export default function RealisationsPage({ content }) {
  return (
    <Layout
      title="Réalisations — Nos projets livrés"
      description="Sites, boutiques en ligne, applications et solutions sur-mesure livrés par IMPACT TECH pour des entrepreneurs et entreprises du Cameroun."
      canonical="/realisations"
      jsonLd={[breadcrumbJsonLd([{ name: "Accueil", path: "/" }, { name: "Réalisations", path: "/realisations" }])]}
    >
      <Header />
      <main>
        <PageHero
          crumb="Réalisations"
          badge="Des projets concrets, des clients satisfaits"
          title={[{ t: "Nos" }, { t: "réalisations", accent: true }]}
          subtitle="Un aperçu des projets livrés : chaque site, boutique ou application raconte l'histoire d'un entrepreneur qui a franchi le pas du digital."
          image="/images/project-custom.jpg"
        />
        <PortfolioGrid items={content.projects} />
        <CtaBanner settings={content.settings} />
      </main>
      <Footer settings={content.settings} />
    </Layout>
  );
}
