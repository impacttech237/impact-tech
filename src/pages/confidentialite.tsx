import Layout from "../layout";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { breadcrumbJsonLd } from "../lib/seo";

export default function ConfidentialitePage({ content }) {
  const s = content.settings;
  return (
    <Layout
      title="Politique de confidentialité"
      description="Politique de confidentialité et protection des données du site IMPACT TECH."
      canonical="/confidentialite"
      jsonLd={[breadcrumbJsonLd([{ name: "Accueil", path: "/" }, { name: "Confidentialité", path: "/confidentialite" }])]}
    >
      <Header />
      <main>
        <section className="section-pad">
          <div className="container-it max-w-3xl">
            <h1 className="text-3xl font-bold text-ink mb-6">Politique de confidentialité</h1>

            <div className="prose prose-sm max-w-none space-y-6 text-body">
              <div>
                <h2 className="text-lg font-semibold text-ink mb-2">Données collectées</h2>
                <p>Nous collectons uniquement les données que vous nous transmettez volontairement :</p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Formulaire de contact / demande de devis : nom, téléphone, e-mail, entreprise, type de projet, budget, message.</li>
                  <li>Inscription newsletter : adresse e-mail.</li>
                </ul>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-ink mb-2">Utilisation des données</h2>
                <p>
                  Ces données servent uniquement à répondre à votre demande (devis, question) et, si vous vous
                  y êtes inscrit, à vous envoyer notre newsletter. Elles ne sont ni vendues, ni partagées avec
                  des tiers à des fins commerciales.
                </p>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-ink mb-2">Stockage et sécurité</h2>
                <p>
                  Les données sont stockées de façon sécurisée dans une base de données Cloudflare D1, hébergée
                  par Cloudflare, Inc., et ne sont accessibles qu'à l'équipe IMPACT TECH via un accès protégé
                  par mot de passe.
                </p>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-ink mb-2">Vos droits</h2>
                <p>
                  Vous pouvez à tout moment demander l'accès, la correction ou la suppression de vos données, ou
                  vous désinscrire de la newsletter, en nous écrivant à{" "}
                  <a href={`mailto:${s.email}`} className="text-red hover:underline">{s.email}</a>.
                </p>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-ink mb-2">Cookies</h2>
                <p>
                  Ce site n'utilise pas de cookies de suivi publicitaire. Seuls des éléments techniques
                  strictement nécessaires à son fonctionnement peuvent être utilisés.
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
