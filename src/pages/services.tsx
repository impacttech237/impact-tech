import Layout from "../layout";
import Header from "../components/Header";
import Footer from "../components/Footer";
import PageHero from "../components/PageHero";
import ServicesDetail from "../components/ServicesDetail";
import Faq from "../components/Faq";
import CtaBanner from "../components/CtaBanner";
import { servicesJsonLd, faqJsonLd, breadcrumbJsonLd } from "../lib/seo";

export default function ServicesPage({ content }) {
  return (
    <Layout
      title="Nos services — Sites, e-commerce, SaaS & apps"
      description="Landing page dès 200 000 FCFA, e-commerce avec Mobile Money dès 500 000 FCFA, SaaS, applications et solutions sur-mesure. Packs tout inclus."
      canonical="/services"
      jsonLd={[servicesJsonLd, faqJsonLd, breadcrumbJsonLd([{ name: "Accueil", path: "/" }, { name: "Services", path: "/services" }])]}
    >
      <Header />
      <main>
        <PageHero
          crumb="Services"
          badge="6 façons de digitaliser votre activité"
          title={[{ t: "Des services" }, { t: "pensés", accent: true }, { t: "pour vous" }]}
          subtitle="Chaque offre est un pack complet : design, développement, domaine, hébergement et sécurité inclus. Vous choisissez, on s'occupe de tout."
        />
        <ServicesDetail items={content.services} />
        <Faq items={content.faqs} />
        <CtaBanner settings={content.settings} />
      </main>
      <Footer settings={content.settings} />
    </Layout>
  );
}
