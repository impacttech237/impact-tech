import { useCallback, useEffect, useState } from "react";
import { RESOURCES, TABS } from "./lib/constants";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import LoginScreen from "./components/LoginScreen";
import DashboardPanel from "./components/DashboardPanel";
import RequestsPanel from "./components/RequestsPanel";
import ResourcePanel from "./components/ResourcePanel";
import PaymentsPanel from "./components/PaymentsPanel";
import SubscribersPanel from "./components/SubscribersPanel";
import SettingsPanel from "./components/SettingsPanel";
import SurveyPanel from "./components/SurveyPanel";
import AppointmentsPanel from "./components/AppointmentsPanel";
import PortalPanel from "./components/PortalPanel";
import { LoadingScreen } from "./components/ui";

const TAB_STORAGE_KEY = "adm-last-tab";

function getInitialTab() {
  try { const t = localStorage.getItem(TAB_STORAGE_KEY); if (t && TABS.some((x) => x.key === t)) return t; } catch {}
  return "dashboard";
}

export default function AdminPage() {
  const [state, setState] = useState("loading");
  const [tab, setTab] = useState(getInitialTab);
  const [dbAvailable, setDbAvailable] = useState(true);
  const [mobileMenu, setMobileMenu] = useState(false);

  const changeTab = useCallback((t) => {
    setTab(t);
    try { localStorage.setItem(TAB_STORAGE_KEY, t); } catch {}
  }, []);

  const checkSession = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/me");
      if (res.ok) {
        const data = await res.json();
        setDbAvailable(data.dbAvailable);
        setState("app");
      } else {
        setState("login");
      }
    } catch { setState("login"); }
  }, []);

  useEffect(() => { checkSession(); }, [checkSession]);

  const onUnauthorized = useCallback(() => setState("login"), []);

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    setState("login");
  };

  if (state === "loading") return <LoadingScreen />;
  if (state === "login") return <LoginScreen onLogin={() => checkSession()} />;

  const resource = RESOURCES.find((r) => r.key === tab);

  return (
    <div className="flex min-h-screen bg-adm-bg">
      <Sidebar
        tab={tab}
        onTab={changeTab}
        onLogout={logout}
        mobileOpen={mobileMenu}
        onMobileClose={() => setMobileMenu(false)}
      />

      <div className="flex flex-1 flex-col min-w-0">
        <Header tab={tab} onMenuClick={() => setMobileMenu(true)} />

        <main className="flex-1 p-4 md:p-8">
          {!dbAvailable && (
            <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-400">
              Base de donnees indisponible (mode dev local). Lancez <code className="rounded bg-adm-surface-2 px-1.5 py-0.5 text-xs">npm run preview</code> ou deployez sur Cloudflare.
            </div>
          )}
          {tab === "dashboard" && <DashboardPanel onUnauthorized={onUnauthorized} />}
          {tab === "requests" && <RequestsPanel onUnauthorized={onUnauthorized} />}
          {tab === "surveys" && <SurveyPanel onUnauthorized={onUnauthorized} />}
          {tab === "appointments" && <AppointmentsPanel onUnauthorized={onUnauthorized} />}
          {tab === "portal" && <PortalPanel />}
          {tab === "payments" && <PaymentsPanel onUnauthorized={onUnauthorized} />}
          {tab === "subscribers" && <SubscribersPanel onUnauthorized={onUnauthorized} />}
          {tab === "settings" && <SettingsPanel onUnauthorized={onUnauthorized} />}
          {resource && <ResourcePanel resource={resource} onUnauthorized={onUnauthorized} />}
        </main>
      </div>
    </div>
  );
}
