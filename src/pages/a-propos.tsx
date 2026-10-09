import Layout from "../layout";
import Header from "../components/Header";
import Footer from "../components/Footer";
import PageHero from "../components/PageHero";
import AboutSection from "../components/AboutSection";
import Stats from "../components/Stats";
import CtaBanner from "../components/CtaBanner";
import { breadcrumbJsonLd } from "../lib/seo";

export default function AboutPage({ content, locale = "fr" }) {
  const en = locale === "en";
  return (
    <Layout
      title={en ? "About — Behind every project, there's Roberto" : "À propos — Derrière chaque projet, il y a Roberto"}
      description={en
        ? "Impact Tech, Africa's trusted digital partner. Pay on delivery, a founder who oversees every project, the same rigor for Cameroon and Northern Europe."
        : "Impact Tech, le partenaire digital africain de confiance. Paiement à la livraison, un fondateur qui supervise chaque projet, la même exigence pour le Cameroun et l'Europe du Nord."}
      canonical={en ? "/en/a-propos" : "/a-propos"}
      locale={locale}
      ogImage="/images/about-team.jpg"
      jsonLd={[breadcrumbJsonLd([{ name: en ? "Home" : "Accueil", path: en ? "/en" : "/" }, { name: en ? "About" : "À propos", path: en ? "/en/a-propos" : "/a-propos" }])]}
    >
      <Header current="/a-propos" locale={locale} frPath="/a-propos" />
      <main>
        <PageHero
          page="a-propos"
          locale={locale}
          crumb={en ? "About" : "À propos"}
          badge={en ? "Behind every project, there's Roberto" : "Derrière chaque projet, il y a Roberto"}
          title={en
            ? [{ t: "Africa's trusted" }, { t: "digital", accent: true }, { t: "partner" }]
            : [{ t: "Le partenaire" }, { t: "digital", accent: true }, { t: "africain de confiance" }]}
          subtitle={en
            ? "We build first, you pay after. If you're not satisfied, you don't pay. Period."
            : "On construit d'abord, vous payez après. Si vous n'êtes pas satisfait, vous ne payez pas. Point."}
          image="/images/about-team.jpg"
        />
        <AboutSection locale={locale} />
        <Stats items={content.stats} locale={locale} />
        <CtaBanner settings={content.settings} locale={locale} />
      </main>
      <Footer settings={content.settings} locale={locale} />
    </Layout>
  );
}
