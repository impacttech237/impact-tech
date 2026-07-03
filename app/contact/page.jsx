import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import ContactSection from "@/components/ContactSection";
import Faq from "@/components/Faq";
import { JsonLd, faqJsonLd, breadcrumbJsonLd } from "@/lib/seo";
import { getContent } from "@/lib/content";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Contact — Devis gratuit sous 48h",
  description:
    "Parlons de votre projet : devis gratuit sous 48h. WhatsApp, téléphone, email ou formulaire — IMPACT TECH, agence web à Douala, Cameroun.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Contactez IMPACT TECH — Devis gratuit sous 48h",
    description:
      "WhatsApp, appel, email ou formulaire : racontez-nous votre projet, on vous répond sous 24h.",
    url: "/contact",
  },
};

export default async function ContactPage() {
  const content = await getContent();
  return (
    <>
      <JsonLd data={faqJsonLd} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Accueil", path: "/" },
          { name: "Contact", path: "/contact" },
        ])}
      />
      <Header />
      <main>
        <PageHero
          crumb="Contact"
          badge="Réponse sous 24h — devis sous 48h"
          title={[
            { t: "Parlons de" },
            { t: "votre", accent: false },
            { t: "projet", accent: true },
          ]}
          subtitle="Racontez-nous votre idée en quelques lignes. Premier échange gratuit, sans engagement — on vous répond vite et sans jargon."
          image="/images/process-visual.jpg"
        />
        <ContactSection settings={content.settings} />
        <Faq items={content.faqs} />
      </main>
      <Footer settings={content.settings} />
    </>
  );
}
