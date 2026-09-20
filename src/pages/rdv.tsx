/* ------------------------------------------------------------------
   /rdv — page de prise de rendez-vous.
   Shell SSR minimal : le rendu interactif se fait côté client (booking.js).
------------------------------------------------------------------- */
import Layout from "../layout";

export default function RdvPage() {
  return (
    <Layout
      title="Prendre rendez-vous"
      description="Réservez un créneau pour discuter de votre projet avec Impact Tech. Choisissez le type de RDV, la date et l'heure qui vous conviennent."
      canonical="/rdv"
    >
      <div id="booking-root"></div>
      <script type="module" src="/booking.js"></script>
    </Layout>
  );
}
