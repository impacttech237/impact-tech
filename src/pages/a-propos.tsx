import Layout from "../layout";
import Header from "../components/Header";
import Footer from "../components/Footer";
import PageHero from "../components/PageHero";
import AboutSection from "../components/AboutSection";
import Stats from "../components/Stats";
import CtaBanner from "../components/CtaBanner";
import { breadcrumbJsonLd } from "../lib/seo";

export default function AboutPage({ content }) {
  return (
    <Layout
      title="À propos — Notre mission : le digital pour tous"
      description="IMPACT TECH, agence web camerounaise basée à Douala. Notre mission : rendre le digital accessible à tous les entrepreneurs et entreprises, au prix juste."
      canonical="/a-propos"
      ogImage="/images/about-team.jpg"
      jsonLd={[breadcrumbJsonLd([{ name: "Accueil", path: "/" }, { name: "À propos", path: "/a-propos" }])]}
    >
      <Header />
      <main>
        <PageHero
          crumb="À propos"
          badge="Agence web — Douala, Cameroun"
          title={[{ t: "Le digital pour" }, { t: "tous,", accent: true }, { t: "vraiment" }]}
          subtitle="On a créé IMPACT TECH avec une conviction : un bon site web ne devrait pas être un luxe réservé aux grandes entreprises."
          image="/images/about-team.jpg"
        />
        <AboutSection />
        <Stats items={content.stats} />
        <CtaBanner settings={content.settings} />
      </main>
      <Footer settings={content.settings} />
    </Layout>
  );
}
