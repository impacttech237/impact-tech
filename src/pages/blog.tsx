import Layout from "../layout";
import Header from "../components/Header";
import Footer from "../components/Footer";
import PageHero from "../components/PageHero";
import BlogList from "../components/BlogList";
import { breadcrumbJsonLd, SITE_URL } from "../lib/seo";

export default function BlogPage({ content }) {
  const blogJsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "@id": `${SITE_URL}/blog#blog`,
    url: `${SITE_URL}/blog`,
    name: "Le blog IMPACT TECH",
    description: "Conseils, guides et success stories pour réussir son passage au digital au Cameroun.",
    inLanguage: "fr",
    publisher: { "@id": `${SITE_URL}/#organization` },
  };

  return (
    <Layout
      title="Blog — Conseils digitaux pour entrepreneurs"
      description="Conseils, guides et success stories : tout pour réussir votre passage au digital au Cameroun. Mobile Money, coûts d'un site web, e-commerce local..."
      canonical="/blog"
      ogImage="/images/blog-2.jpg"
      jsonLd={[blogJsonLd, breadcrumbJsonLd([{ name: "Accueil", path: "/" }, { name: "Blog", path: "/blog" }])]}
    >
      <Header />
      <main>
        <PageHero
          crumb="Blog"
          badge="Conseils, guides & success stories"
          title={[{ t: "Le blog" }, { t: "IMPACT" }, { t: "TECH", accent: true }]}
          subtitle="Des articles concrets, écrits pour les entrepreneurs d'ici : sans jargon, avec des exemples locaux et des conseils applicables dès aujourd'hui."
          image="/images/blog-2.jpg"
        />
        <BlogList posts={content.posts} />
      </main>
      <Footer settings={content.settings} />
    </Layout>
  );
}
