import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import BlogList from "@/components/BlogList";
import { JsonLd, breadcrumbJsonLd, SITE_URL } from "@/lib/seo";
import { getContent } from "@/lib/content";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Blog — Conseils digitaux pour entrepreneurs",
  description:
    "Conseils, guides et success stories : tout pour réussir votre passage au digital au Cameroun. Mobile Money, coûts d'un site web, e-commerce local...",
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "Le blog IMPACT TECH",
    description:
      "Des articles concrets pour les entrepreneurs d'ici : sans jargon, avec des exemples locaux.",
    url: "/blog",
  },
};

/* JSON-LD : liste d'articles du blog */
const blogJsonLd = {
  "@context": "https://schema.org",
  "@type": "Blog",
  "@id": `${SITE_URL}/blog#blog`,
  url: `${SITE_URL}/blog`,
  name: "Le blog IMPACT TECH",
  description:
    "Conseils, guides et success stories pour réussir son passage au digital au Cameroun.",
  inLanguage: "fr",
  publisher: { "@id": `${SITE_URL}/#organization` },
};

export default async function BlogPage() {
  const content = await getContent();
  return (
    <>
      <JsonLd data={blogJsonLd} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Accueil", path: "/" },
          { name: "Blog", path: "/blog" },
        ])}
      />
      <Header />
      <main>
        <PageHero
          crumb="Blog"
          badge="Conseils, guides & success stories"
          title={[
            { t: "Le blog" },
            { t: "IMPACT", accent: false },
            { t: "TECH", accent: true },
          ]}
          subtitle="Des articles concrets, écrits pour les entrepreneurs d'ici : sans jargon, avec des exemples locaux et des conseils applicables dès aujourd'hui."
          image="/images/blog-2.jpg"
        />
        <BlogList posts={content.posts} />
      </main>
      <Footer settings={content.settings} />
    </>
  );
}
