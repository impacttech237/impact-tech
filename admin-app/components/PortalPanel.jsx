/* ------------------------------------------------------------------
   Portail client — espace de pilotage admin.
   Vue d'ensemble (« Qui attend qui ? ») · Projets (tableau) · Clients
   · Modèles (packs + contrats) · Réglages (emails, WhatsApp, avis).
------------------------------------------------------------------- */
import { useState } from "react";
import { Columns, FileText, Home, Settings, Users } from "../lib/icons";
import Overview from "./portal/Overview";
import Board from "./portal/Board";
import Clients from "./portal/Clients";
import Templates from "./portal/Templates";
import PortalSettings from "./portal/PortalSettings";
import ProjectWorkspace from "./portal/ProjectWorkspace";
import { SubTabs } from "./portal/shared";

const TABS = [
  { key: "overview", label: "Qui attend qui ?", Icon: Home },
  { key: "board", label: "Projets", Icon: Columns },
  { key: "clients", label: "Clients", Icon: Users },
  { key: "templates", label: "Modèles", Icon: FileText },
  { key: "settings", label: "Réglages", Icon: Settings },
];

export default function PortalPanel() {
  const [tab, setTab] = useState("overview");
  const [projectId, setProjectId] = useState(null);

  if (projectId) return <ProjectWorkspace projectId={projectId} onBack={() => setProjectId(null)} />;

  return (
    <div>
      <SubTabs tabs={TABS} value={tab} onChange={setTab} />
      {tab === "overview" && <Overview openProject={setProjectId} />}
      {tab === "board" && <Board openProject={setProjectId} />}
      {tab === "clients" && <Clients openProject={setProjectId} />}
      {tab === "templates" && <Templates />}
      {tab === "settings" && <PortalSettings />}
    </div>
  );
}

