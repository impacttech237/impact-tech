/* ------------------------------------------------------------------
   Sitemap XML — généré automatiquement par Next.js à /sitemap.xml
------------------------------------------------------------------- */
import { SITE_URL } from "@/lib/seo";

export default function sitemap() {
  const lastModified = new Date();

  return [
    { url: `${SITE_URL}/`, lastModified, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/services`, lastModified, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE_URL}/realisations`, lastModified, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/contact`, lastModified, changeFrequency: "yearly", priority: 0.8 },
    { url: `${SITE_URL}/a-propos`, lastModified, changeFrequency: "yearly", priority: 0.6 },
    { url: `${SITE_URL}/blog`, lastModified, changeFrequency: "weekly", priority: 0.7 },
  ];
}
