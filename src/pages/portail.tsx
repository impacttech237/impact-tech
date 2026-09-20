/* ------------------------------------------------------------------
   /portail/:token — espace client privé.
   Shell SSR minimal : le rendu interactif se fait côté client (portal.js).
------------------------------------------------------------------- */
import Layout from "../layout";

export default function PortailPage({ accessToken }: { accessToken: string }) {
  return (
    <Layout
      title="Espace Client"
      description="Votre espace client Impact Tech : projets, documents, contrats et signature électronique."
      canonical="/portail"
      noIndex={true}
    >
      <div id="portal-root" data-token={accessToken}></div>
      <script type="module" src="/portal.js"></script>
    </Layout>
  );
}
