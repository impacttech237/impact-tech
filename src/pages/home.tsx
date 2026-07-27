import Layout from "../layout";
import Header from "../components/Header";
import Hero from "../components/Hero";
import Services from "../components/Services";
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
import { servicesJsonLd, breadcrumbJsonLd } from "../lib/seo";

export default function HomePage({ content }) {
  return (
    <Layout
      title="Créer un site web au Cameroun — Agence web à Douala | IMPACT TECH"
      description="Vous voulez créer un site web au Cameroun ? On fait des sites internet, des boutiques en ligne (paiement MTN MoMo et Orange Money), des applications et des logiciels (SaaS), à prix clair. Agence web à Douala."
      canonical="/"
      jsonLd={[servicesJsonLd, breadcrumbJsonLd([{ name: "Accueil", path: "/" }])]}
    >
      <Header />
      <main>
        <Hero pills={content.settings.hero_pills} />
        <Services items={content.services} />
        <PromiseSection />
        <Offers items={content.offers} />
        <CtaBanner settings={content.settings} />
        <Marquee items={content.settings.marquee_items} />
        <Process steps={content.processSteps} />
        <Stats items={content.stats} />
        <Testimonials items={content.testimonials} />
        <BigTitle />
        <Blog posts={content.posts} />
      </main>
      <Footer settings={content.settings} />
    </Layout>
  );
}
