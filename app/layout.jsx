import { Space_Grotesk, Inter, Instrument_Serif } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";
import { SITE_URL, SITE_NAME, organizationJsonLd, websiteJsonLd, JsonLd } from "@/lib/seo";

/* ------------------------------------------------------------------
   Typographies (design system IMPACT TECH)
   - Titres  : Space Grotesk
   - Corps   : Inter
   - Accents : Instrument Serif (italique) — signature visuelle
------------------------------------------------------------------- */
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--f-head",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--f-body",
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--f-accent",
  display: "swap",
});

/* ------------------------------------------------------------------
   Métadonnées globales (héritées par toutes les pages)
------------------------------------------------------------------- */
export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "IMPACT TECH — Agence web au Cameroun | Sites & apps à prix juste",
    template: "%s | IMPACT TECH",
  },
  description:
    "Agence web à Douala, Cameroun. Création de sites internet, boutiques e-commerce (Mobile Money), SaaS et applications — packs tout inclus à prix accessible.",
  keywords: [
    "agence web Cameroun",
    "création site internet Douala",
    "site e-commerce Cameroun",
    "Mobile Money site web",
    "développement application Cameroun",
    "agence digitale Douala",
    "création site web pas cher Cameroun",
  ],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: "IMPACT TECH — Un digital qui a de l'impact, à prix juste",
    description:
      "Sites, e-commerce, SaaS et applications depuis le Cameroun. Packs tout inclus : design, dev, domaine, hébergement et sécurité.",
    images: [
      {
        url: "/images/og-cover.png",
        width: 1200,
        height: 630,
        alt: "IMPACT TECH — Agence web au Cameroun",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "IMPACT TECH — Agence web au Cameroun",
    description:
      "Le digital accessible à tous : sites, e-commerce, SaaS et apps à prix juste, depuis Douala.",
    images: ["/images/og-cover.png"],
  },
  icons: {
    icon: "/icon-square.png",
    apple: "/icon-square.png",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport = {
  themeColor: "#0E0E0C",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="fr"
      className={`${spaceGrotesk.variable} ${inter.variable} ${instrumentSerif.variable}`}
    >
      <body>
        {/* Données structurées globales : organisation + site web */}
        <JsonLd data={organizationJsonLd} />
        <JsonLd data={websiteJsonLd} />

        {/* Lenis smooth scroll + sync ScrollTrigger */}
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
