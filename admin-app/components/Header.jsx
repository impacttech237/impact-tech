import { TABS } from "../lib/constants";
import { Menu } from "../lib/icons";

export default function Header({ tab, onMenuClick }) {
  const current = TABS.find((t) => t.key === tab);
  return (
    <header className="sticky top-0 z-30 flex items-center gap-4 border-b border-adm-border bg-adm-bg/80 backdrop-blur-md px-4 py-3 md:px-8 md:py-4">
      <button
        onClick={onMenuClick}
        className="rounded-lg p-2 text-adm-text-2 transition-colors hover:bg-adm-surface-2 md:hidden"
      >
        <Menu size={20} />
      </button>
      <h1 className="font-head text-lg font-semibold text-adm-text md:text-xl">
        {current?.label || "Dashboard"}
      </h1>
    </header>
  );
}
