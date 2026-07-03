/* Layout du dashboard admin — non indexé par les moteurs de recherche */
export const metadata = {
  title: "Dashboard Admin — IMPACT TECH",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }) {
  return <div className="min-h-screen bg-[#F4F1E9]">{children}</div>;
}
