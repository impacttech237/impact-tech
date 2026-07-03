import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Services from "@/components/Services";
import Promise from "@/components/Promise";
import Offers from "@/components/Offers";
import CtaBanner from "@/components/CtaBanner";
import Marquee from "@/components/Marquee";
import Process from "@/components/Process";
import Stats from "@/components/Stats";
import Testimonials from "@/components/Testimonials";
import BigTitle from "@/components/BigTitle";
import Blog from "@/components/Blog";
import Footer from "@/components/Footer";
import { JsonLd, servicesJsonLd, breadcrumbJsonLd } from "@/lib/seo";
import { getContent } from "@/lib/content";

/* ------------------------------------------------------------------
   Page d'accueil IMPACT TECH — 13 sections ✓
   Contenu chargé depuis la base D1 (dashboard /admin).
------------------------------------------------------------------- */
export const dynamic = "force-dynamic";

export const metadata = {
  alternates: { canonical: "/" },
};

export default async function Home() {
  const content = await getContent();
  return (
    <>
      <JsonLd data={servicesJsonLd} />
      <JsonLd data={breadcrumbJsonLd([{ name: "Accueil", path: "/" }])} />
      <Header />
      <main>
        <Hero pills={content.settings.hero_pills} />
        <Services items={content.services} />
        <Promise />
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
    </>
  );
}
