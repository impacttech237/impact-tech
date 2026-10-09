import Layout from "../layout";
import Header from "../components/Header";
import Hero from "../components/Hero";
import PromiseSection from "../components/Promise";
import Offers from "../components/Offers";
import CtaBanner from "../components/CtaBanner";
import Marquee from "../components/Marquee";
import Process from "../components/Process";
import Stats from "../components/Stats";
import Testimonials from "../components/Testimonials";
import BigTitle from "../components/BigTitle";
import Blog from "../components/Blog";
import Footer from "../components/Footer";
import { offersJsonLd, breadcrumbJsonLd } from "../lib/seo";

export default function HomePage({ content, locale = "fr" }) {
  const en = locale === "en";
  return (
    <Layout
      title={en ? "Web agency in Cameroon — Websites, e-commerce, apps | IMPACT TECH" : "Créer un site web au Cameroun — Agence web à Douala | IMPACT TECH"}
      description={en
        ? "Impact Tech builds websites, online stores (Mobile Money), applications and custom software for African and Northern European businesses. Pay only on delivery."
        : "Vous voulez créer un site web au Cameroun ? On fait des sites internet, des boutiques en ligne (paiement MTN MoMo et Orange Money), des applications et des logiciels (SaaS), à prix clair. Paiement à la livraison uniquement."}
      canonical={en ? "/en" : "/"}
      locale={locale}
      jsonLd={[offersJsonLd(content.offers), breadcrumbJsonLd([{ name: en ? "Home" : "Accueil", path: en ? "/en" : "/" }])]}
    >
      <Header current="/" locale={locale} frPath="/" />
      <main>
        {/* Ordre du funnel imposé par les mémos : Hero -> 3 Offres -> Garantie
            -> Témoignages -> Process -> CTA Final (qui clôt la page). */}
        <Hero pills={content.settings.hero_pills} locale={locale} />
        <Offers items={content.offers} locale={locale} />
        <PromiseSection locale={locale} />
        <Marquee items={content.settings.marquee_items} locale={locale} />
        <Stats items={content.stats} locale={locale} />
        <Testimonials items={content.testimonials} locale={locale} />
        <Process steps={content.processSteps} locale={locale} />
        <BigTitle locale={locale} />
        {!en && <Blog posts={content.posts} />}
        <CtaBanner settings={content.settings} locale={locale} />
      </main>
      <Footer settings={content.settings} locale={locale} />
    </Layout>
  );
}
