/* ------------------------------------------------------------------
   Détection de langue par pays (refonte, bilingue FR/EN).
   Cloudflare Workers expose le pays du visiteur nativement sur chaque
   requête (request.cf.country, code ISO 3166-1 alpha-2) — aucun service
   tiers, aucune configuration, ça marche dès le déploiement.
   Voir usage dans src/worker.tsx (redirection /  -> /en au premier passage).
------------------------------------------------------------------- */

// Pays où le français est la langue la plus probable du visiteur :
// Cameroun (marché local historique) + France/Belgique/Suisse + le reste
// de l'Afrique francophone (CEMAC et au-delà). Tout le reste -> anglais,
// cohérent avec le positionnement "Cameroun & Europe du Nord" bilingue.
const FRENCH_COUNTRIES = new Set([
  "CM", // Cameroun
  "FR", "BE", "CH", "LU", "MC", // France & voisins francophones
  "SN", "CI", "ML", "BF", "NE", "TG", "BJ", "GA", "CG", "CD", "TD", "GN",
  "MG", "RW", "BI", "DJ", "KM", "MR", "MU", "SC", "GQ", "CF", "GW",
]);

/** Déduit la locale ("fr" | "en") à partir d'un code pays ISO alpha-2.
 *  Pays inconnu/absent (ex : dev local sans Cloudflare) -> "fr" par défaut,
 *  le marché premier d'Impact Tech restant le Cameroun. */
export function localeForCountry(countryCode) {
  if (!countryCode) return "fr";
  return FRENCH_COUNTRIES.has(countryCode.toUpperCase()) ? "fr" : "en";
}

/** Lit le pays du visiteur depuis l'objet `cf` que Cloudflare attache à
 *  chaque Request (absent en dev local hors `wrangler dev --remote`). */
export function countryFromRequest(rawRequest) {
  return rawRequest?.cf?.country || null;
}
