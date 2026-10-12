/* État partagé du portail (client connecté, projet affiché, navigation). */
import { createContext } from "preact";
import { useContext } from "preact/hooks";

export type Route = { view: string; id?: number };

export interface PortalCtx {
  me: any;
  settings: any;
  projects: any[];
  projectId: number | null;
  setProjectId: (id: number) => void;
  dash: any | null; // GET /projects/:id
  reloadDash: () => Promise<void>;
  route: Route;
  go: (view: string, id?: number) => void;
  logout: () => void;
  toggleLocale: () => void;
  startTour: () => void; // relance la visite guidée (page Aide)
}

export const Ctx = createContext<PortalCtx>(null as any);
export const usePortal = () => useContext(Ctx);

export function parseHash(): Route {
  const [view, id] = location.hash.replace(/^#\/?/, "").split("/");
  return { view: view || "home", id: id ? parseInt(id, 10) : undefined };
}

export function whatsappLink(phone: string, text: string) {
  const digits = String(phone || "").replace(/[^\d]/g, "");
  return digits ? `https://wa.me/${digits}?text=${encodeURIComponent(text)}` : `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export const store = {
  get(key: string) {
    try {
      return localStorage.getItem(`pt-${key}`);
    } catch {
      return null;
    }
  },
  set(key: string, value: string) {
    try {
      localStorage.setItem(`pt-${key}`, value);
    } catch {}
  },
};
