import { useState, useEffect } from "react";
import { TABS } from "../lib/constants";
import { getIcon, LogOut, ExternalLink, PanelLeftClose, PanelLeftOpen, X as XIcon } from "../lib/icons";

const STORAGE_KEY = "adm-sidebar-collapsed";

function getInitialCollapsed() {
  try { return localStorage.getItem(STORAGE_KEY) === "1"; } catch { return false; }
}

export default function Sidebar({ tab, onTab, onLogout, mobileOpen, onMobileClose }) {
  const [collapsed, setCollapsed] = useState(getInitialCollapsed);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0"); } catch {}
  }, [collapsed]);

  const sections = [];
  let currentSection = null;
  for (const t of TABS) {
    if (t.section !== currentSection) {
      currentSection = t.section;
      sections.push({ label: t.section, items: [] });
    }
    sections[sections.length - 1].items.push(t);
  }

  const nav = (
    <>
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 ${collapsed ? "justify-center" : ""}`}>
        {collapsed ? (
          <span className="text-xl font-bold font-head text-adm-text">i<span className="text-adm-red">.</span></span>
        ) : (
          <span className="text-xl font-bold font-head text-adm-text">
            impact<span className="text-adm-red">.</span>Tech
            <span className="ml-2 rounded bg-adm-red/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-adm-red">admin</span>
          </span>
        )}
      </div>

      {/* Nav sections */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-5">
        {sections.map((section) => (
          <div key={section.label}>
            {!collapsed && (
              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-adm-text-3">
                {section.label}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((t) => {
                const Icon = getIcon(t.icon);
                const active = tab === t.key;
                return (
                  <button
                    key={t.key}
                    onClick={() => { onTab(t.key); onMobileClose?.(); }}
                    title={collapsed ? t.label : undefined}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      active
                        ? "bg-adm-red/10 text-adm-red border-l-[3px] border-adm-red pl-[9px]"
                        : "text-adm-text-2 hover:bg-adm-surface-2 hover:text-adm-text"
                    } ${collapsed ? "justify-center" : ""}`}
                  >
                    <Icon size={18} />
                    {!collapsed && <span className="truncate">{t.label}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-adm-border px-3 py-3 space-y-1">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-adm-text-3 transition-colors hover:bg-adm-surface-2 hover:text-adm-text ${collapsed ? "justify-center" : ""}`}
        >
          <ExternalLink size={16} />
          {!collapsed && "Voir le site"}
        </a>
        <button
          onClick={onLogout}
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-adm-red transition-colors hover:bg-adm-red/10 ${collapsed ? "justify-center" : ""}`}
        >
          <LogOut size={16} />
          {!collapsed && "Déconnexion"}
        </button>

        {/* Collapse toggle — desktop only */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="hidden md:flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-adm-text-3 transition-colors hover:bg-adm-surface-2 hover:text-adm-text justify-center"
        >
          {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`hidden md:flex flex-col shrink-0 border-r border-adm-border bg-adm-bg min-h-screen transition-[width] duration-200 ${
          collapsed ? "w-[72px]" : "w-64"
        }`}
      >
        {nav}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onMobileClose} />
          <aside className="absolute left-0 top-0 flex h-full w-64 flex-col bg-adm-bg border-r border-adm-border shadow-xl">
            <button
              onClick={onMobileClose}
              className="absolute right-3 top-4 rounded-lg p-1.5 text-adm-text-3 hover:bg-adm-surface-2"
            >
              <XIcon size={18} />
            </button>
            {nav}
          </aside>
        </div>
      )}
    </>
  );
}
