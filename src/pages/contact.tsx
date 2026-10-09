import Layout from "../layout";
import Header from "../components/Header";
import Footer from "../components/Footer";
import PageHero from "../components/PageHero";
import ContactSection from "../components/ContactSection";
import Faq from "../components/Faq";
import { faqJsonLd, breadcrumbJsonLd } from "../lib/seo";

export default function ContactPage({ content, locale = "fr" }) {
  const en = locale === "en";
  return (
    <Layout
      title={en ? "Contact — Free quote within 48h" : "Contact — Devis gratuit sous 48h"}
      description={en
        ? "Let's talk about your project: free quote within 48h. WhatsApp, phone, email or form — Impact Tech, your African digital partner."
        : "Parlons de votre projet : devis gratuit sous 48h. WhatsApp, téléphone, email ou formulaire — IMPACT TECH, agence web à Douala, Cameroun."}
      canonical={en ? "/en/contact" : "/contact"}
      locale={locale}
      jsonLd={[faqJsonLd(content.faqs), breadcrumbJsonLd([{ name: en ? "Home" : "Accueil", path: en ? "/en" : "/" }, { name: "Contact", path: en ? "/en/contact" : "/contact" }])]}
    >
      <Header current="/contact" locale={locale} frPath="/contact" />
      <main>
        <PageHero
          page="contact"
          locale={locale}
          crumb="Contact"
          badge={en ? "Response within 24h — quote within 48h" : "Réponse sous 24h — devis sous 48h"}
          title={en
            ? [{ t: "Let's talk about" }, { t: "your" }, { t: "project", accent: true }]
            : [{ t: "Parlons de" }, { t: "votre" }, { t: "projet", accent: true }]}
          subtitle={en
            ? "Tell us about your idea in a few lines. Free first conversation, no commitment — we reply fast and without jargon."
            : "Racontez-nous votre idée en quelques lignes. Premier échange gratuit, sans engagement — on vous répond vite et sans jargon."}
          image="/images/process-visual.jpg"
        />
        <ContactSection settings={content.settings} locale={locale} />
        <Faq items={content.faqs} locale={locale} />
      </main>
      <Footer settings={content.settings} locale={locale} />
    </Layout>
  );
}
