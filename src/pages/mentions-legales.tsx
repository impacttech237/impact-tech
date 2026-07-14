import Layout from "../layout";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { breadcrumbJsonLd } from "../lib/seo";

export default function MentionsLegalesPage({ content }) {
  const s = content.settings;
  return (
    <Layout
      title="Mentions légales"
      description="Mentions légales du site IMPACT TECH."
      canonical="/mentions-legales"
      jsonLd={[breadcrumbJsonLd([{ name: "Accueil", path: "/" }, { name: "Mentions légales", path: "/mentions-legales" }])]}
    >
      <Header />
      <main>
        <section className="section-pad">
          <div className="container-it max-w-3xl">
            <h1 className="text-3xl font-bold text-ink mb-6">Mentions légales</h1>

            <div className="prose prose-sm max-w-none space-y-6 text-body">
              <div>
                <h2 className="text-lg font-semibold text-ink mb-2">Éditeur du site</h2>
                <p>
                  IMPACT TECH — agence web basée à {s.address}.<br />
                  Structure en cours de formalisation juridique (immatriculation SARL en cours) : les
                  informations d'immatriculation (RCCM, NIU) seront ajoutées ici dès leur délivrance.
                </p>
                <p className="mt-2">
                  Contact : <a href={`mailto:${s.email}`} className="text-red hover:underline">{s.email}</a>
                  {" · "}
                  <a href={`tel:${s.phone_link}`} className="text-red hover:underline">{s.phone_display}</a>
                </p>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-ink mb-2">Hébergement</h2>
                <p>
                  Cloudflare, Inc.<br />
                  101 Townsend St, San Francisco, CA 94107, États-Unis
                </p>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-ink mb-2">Propriété intellectuelle</h2>
                <p>
                  L'ensemble des contenus de ce site (textes, visuels, code) est la propriété d'IMPACT TECH,
                  sauf mention contraire, et ne peut être reproduit sans autorisation préalable.
                </p>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-ink mb-2">Données personnelles</h2>
                <p>
                  Le traitement des données personnelles collectées sur ce site est détaillé dans notre{" "}
                  <a href="/confidentialite" className="text-red hover:underline">politique de confidentialité</a>.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer settings={content.settings} />
    </Layout>
  );
}
