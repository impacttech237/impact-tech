import Layout from "../layout";
import Header from "../components/Header";
import Footer from "../components/Footer";
import PageHero from "../components/PageHero";
import ContactSection from "../components/ContactSection";
import Faq from "../components/Faq";
import { faqJsonLd, breadcrumbJsonLd } from "../lib/seo";

export default function ContactPage({ content }) {
  return (
    <Layout
      title="Contact — Devis gratuit sous 48h"
      description="Parlons de votre projet : devis gratuit sous 48h. WhatsApp, téléphone, email ou formulaire — IMPACT TECH, agence web à Douala, Cameroun."
      canonical="/contact"
      jsonLd={[faqJsonLd, breadcrumbJsonLd([{ name: "Accueil", path: "/" }, { name: "Contact", path: "/contact" }])]}
    >
      <Header />
      <main>
        <PageHero
          crumb="Contact"
          badge="Réponse sous 24h — devis sous 48h"
          title={[{ t: "Parlons de" }, { t: "votre" }, { t: "projet", accent: true }]}
          subtitle="Racontez-nous votre idée en quelques lignes. Premier échange gratuit, sans engagement — on vous répond vite et sans jargon."
          image="/images/process-visual.jpg"
        />
        <ContactSection settings={content.settings} />
        <Faq items={content.faqs} />
      </main>
      <Footer settings={content.settings} />
    </Layout>
  );
}
