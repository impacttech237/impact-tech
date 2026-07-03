import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import PortfolioGrid from "@/components/PortfolioGrid";
import CtaBanner from "@/components/CtaBanner";
import { JsonLd, breadcrumbJsonLd } from "@/lib/seo";
import { getContent } from "@/lib/content";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Réalisations — Nos projets livrés",
  description:
    "Sites, boutiques en ligne, applications et solutions sur-mesure livrés par IMPACT TECH pour des entrepreneurs et entreprises du Cameroun.",
  alternates: { canonical: "/realisations" },
  openGraph: {
    title: "Réalisations — IMPACT TECH",
    description:
      "Découvrez les projets livrés : e-commerce, landing pages, apps et plateformes sur-mesure au Cameroun.",
    url: "/realisations",
  },
};

export default async function RealisationsPage() {
  const content = await getContent();
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Accueil", path: "/" },
          { name: "Réalisations", path: "/realisations" },
        ])}
      />
      <Header />
      <main>
        <PageHero
          crumb="Réalisations"
          badge="Des projets concrets, des clients satisfaits"
          title={[
            { t: "Nos" },
            { t: "réalisations", accent: true },
          ]}
          subtitle="Un aperçu des projets livrés : chaque site, boutique ou application raconte l'histoire d'un entrepreneur qui a franchi le pas du digital."
          image="/images/project-custom.jpg"
        />
        <PortfolioGrid items={content.projects} />
        <CtaBanner settings={content.settings} />
      </main>
      <Footer settings={content.settings} />
    </>
  );
}
