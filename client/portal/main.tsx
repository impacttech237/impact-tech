/* ------------------------------------------------------------------
   Portail client Impact Tech (Preact) — point d'entrée.
   Connexion -> accueil guidé (1re visite) -> espace du projet.
------------------------------------------------------------------- */
import { render } from "preact";
import { useCallback, useEffect, useState } from "preact/hooks";
import "./portal.css";
import { api, setUnauthorizedHandler } from "./api";
import { getLocale, setLocale, t } from "./i18n";
import { Ctx, PortalCtx, Route, parseHash, store, usePortal, whatsappLink } from "./state";
import { ErrorBox, Icon, Spinner, Toasts } from "./ui";
import { Documents } from "./views/Documents";
import { Files } from "./views/Files";
import { Help } from "./views/Help";
import { PageHelp, Tour } from "./views/Guide";
import { Home } from "./views/Home";
import { Kit } from "./views/Kit";
import { Login } from "./views/Login";
import { Messages } from "./views/Messages";
import { Payments } from "./views/Payments";
import { Site } from "./views/Site";
import { Todo } from "./views/Todo";

const root = document.getElementById("portal-root")!;
const accessKey = root.dataset.key || "";

function App() {
  const [phase, setPhase] = useState<"boot" | "invalid" | "login" | "app" | "error">("boot");
  const [info, setInfo] = useState<any>(null);
  const [me, setMe] = useState<any>(null);
  const [projectId, setProjectIdState] = useState<number | null>(null);
  const [dash, setDash] = useState<any>(null);
  const [route, setRoute] = useState<Route>(parseHash());
  const [onboarding, setOnboarding] = useState(false);
  const [, force] = useState(0);

  const loadMe = useCallback(async () => {
    const r = await api("/me");
    setLocale(r.client.locale);
    setMe(r);
    const saved = parseInt(store.get("project") || "0", 10);
    const pid = r.projects.find((p: any) => p.id === saved)?.id || r.projects[0]?.id || null;
    setProjectIdState(pid);
    setOnboarding(!r.client.onboarded);
    setPhase("app");
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => setPhase("login"));
    if (!accessKey) return setPhase("invalid");
    api(`/lookup?key=${encodeURIComponent(accessKey)}`)
      .then((r) => {
        setInfo(r);
        setLocale(r.locale);
        return r.loggedIn ? loadMe() : setPhase("login");
      })
      .catch((e) => setPhase(e.status === 404 ? "invalid" : "error"));
    const onHash = () => {
      setRoute(parseHash());
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const reloadDash = useCallback(async () => {
    if (!projectId) return;
    try {
      setDash(await api(`/projects/${projectId}`));
    } catch {}
  }, [projectId]);

  useEffect(() => {
    setDash(null);
    reloadDash();
  }, [projectId]);

  // Rafraîchit le tableau de bord au retour sur l'onglet (ex : après avoir payé).
  useEffect(() => {
    const on = () => document.visibilityState === "visible" && reloadDash();
    document.addEventListener("visibilitychange", on);
    return () => document.removeEventListener("visibilitychange", on);
  }, [reloadDash]);

  if (phase === "boot") return <Spinner />;
  if (phase === "error") return <ErrorBox message={t("error_generic")} onRetry={() => location.reload()} />;
  if (phase === "invalid")
    return (
      <main class="pt-login">
        <div class="pt-login__box">
          <div class="pt-logo pt-logo--lg">
            impact<span>.</span>Tech
          </div>
          <p class="pt-muted">{t("login_invalid_link")}</p>
        </div>
      </main>
    );
  if (phase === "login") return <Login accessKey={accessKey} info={info} onLogged={() => loadMe()} />;

  const ctx: PortalCtx = {
    me: me.client,
    person: me.person || { name: me.client.name, role: "", email: me.client.email || "", phone: me.client.phone || "", isMember: false, rights: { decide: true, pay: true, vault: true } },
    settings: me.settings,
    projects: me.projects,
    projectId,
    setProjectId: (id) => {
      store.set("project", String(id));
      setProjectIdState(id);
      location.hash = "#/home";
    },
    dash,
    reloadDash,
    route,
    go: (view, id) => {
      location.hash = `#/${view}${id ? `/${id}` : ""}`;
    },
    logout: async () => {
      await api("/logout", { body: {} }).catch(() => {});
      setPhase("login");
    },
    startTour: () => setOnboarding(true),
    toggleLocale: async () => {
      const next = getLocale() === "en" ? "fr" : "en";
      setLocale(next);
      api("/me/locale", { body: { locale: next } }).catch(() => {});
      force((n) => n + 1);
    },
  };

  return (
    <Ctx.Provider value={ctx}>
      <Shell />
      {onboarding && <Tour onDone={() => setOnboarding(false)} />}
      <Toasts />
    </Ctx.Provider>
  );
}

function Shell() {
  const { me, person, settings, projects, projectId, setProjectId, dash, route, go, logout, toggleLocale } = usePortal();
  const [moreOpen, setMoreOpen] = useState(false);
  useEffect(() => setMoreOpen(false), [route.view, route.id]);
  const p = dash?.project;
  const todoCount = dash ? dash.checklist.filter((c: any) => c.status === "todo").length : 0;
  const delivered = !!p?.delivered_at;

  const nav = [
    { key: "home", icon: "home", label: t("nav_home") },
    { key: "todo", icon: "todo", label: t("nav_todo"), badge: todoCount },
    { key: "messages", icon: "chat", label: t("nav_messages"), badge: dash?.unreadMessages || 0 },
    { key: "files", icon: "files", label: t("nav_files") },
    { key: "documents", icon: "doc", label: t("nav_documents"), badge: dash?.actions?.filter((a: any) => a.type === "sign").length || 0 },
    { key: delivered ? "kit" : "site", icon: delivered ? "gift" : "site", label: delivered ? t("nav_kit") : t("nav_site") },
    { key: "payments", icon: "money", label: t("nav_payments"), badge: dash?.actions?.filter((a: any) => a.type === "pay" || a.type === "accept_quote").length || 0 },
    { key: "help", icon: "help", label: t("nav_help") },
  ];
  const mobileMain = ["home", "todo", "messages", "files"];
  const view = route.view;

  if (!projectId) {
    return (
      <main class="pt-main">
        <div class="pt-page">
          <h1 class="pt-h1">{t("hello", { name: String(person.name).split(" ")[0] })}</h1>
          <p class="pt-muted">{t("all_good_sub")}</p>
          <Help />
        </div>
      </main>
    );
  }

  return (
    <div class="pt-shell">
      <aside class="pt-side" aria-label="Navigation">
        <div class="pt-logo">
          impact<span>.</span>Tech
        </div>
        {projects.length > 1 && <ProjectSwitch projects={projects} projectId={projectId} onChange={setProjectId} />}
        <nav>
          {nav.map((n) => (
            <a key={n.key} href={`#/${n.key}`} class={`pt-navlink ${view === n.key ? "is-on" : ""}`} aria-current={view === n.key ? "page" : undefined}>
              <Icon name={n.icon} />
              <span>{n.label}</span>
              {n.badge ? <em class="pt-count">{n.badge}</em> : null}
            </a>
          ))}
        </nav>
        <div class="pt-side__foot">
          <button type="button" class="pt-navlink" onClick={toggleLocale}>
            <Icon name="globe" />
            <span>{t("language")}</span>
          </button>
          <button type="button" class="pt-navlink" onClick={logout}>
            <Icon name="logout" />
            <span>{t("logout")}</span>
          </button>
        </div>
      </aside>

      <header class="pt-top">
        <div class="pt-logo">
          impact<span>.</span>Tech
        </div>
        {projects.length > 1 && <ProjectSwitch projects={projects} projectId={projectId} onChange={setProjectId} />}
        {settings.whatsapp && (
          <a class="pt-iconbtn" href={whatsappLink(settings.whatsapp, person.isMember ? `Bonjour, c'est ${person.name} (${me.company || me.name}).` : `Bonjour, c'est ${me.name}.`)} target="_blank" rel="noopener noreferrer" aria-label={t("help_whatsapp")}>
            <Icon name="chat" />
          </a>
        )}
      </header>

      <main class="pt-main" id="main">
        {!dash ? (
          <Spinner />
        ) : (
          <>
            <PageHelp page={GUIDED.includes(view) ? view : "home"} />
            <View view={view} />
          </>
        )}
      </main>

      <nav class="pt-tabbar" aria-label="Navigation">
        {nav
          .filter((n) => mobileMain.includes(n.key))
          .map((n) => (
            <a key={n.key} href={`#/${n.key}`} class={view === n.key ? "is-on" : ""} aria-current={view === n.key ? "page" : undefined}>
              <span class="pt-tabbar__icon">
                <Icon name={n.icon} />
                {n.badge ? <em class="pt-count">{n.badge}</em> : null}
              </span>
              <span>{n.label}</span>
            </a>
          ))}
        <button type="button" class={!mobileMain.includes(view) ? "is-on" : ""} onClick={() => setMoreOpen(true)} aria-haspopup="dialog">
          <span class="pt-tabbar__icon">
            <Icon name="more" />
            {nav.filter((n) => !mobileMain.includes(n.key)).some((n) => n.badge) ? <em class="pt-count pt-count--dot" /> : null}
          </span>
          <span>{t("nav_more")}</span>
        </button>
      </nav>

      {moreOpen && (
        <div class="pt-sheet" onClick={() => setMoreOpen(false)}>
          <div class="pt-sheet__panel" role="dialog" aria-modal="true" aria-label={t("nav_more")} onClick={(e) => e.stopPropagation()}>
            {nav
              .filter((n) => !mobileMain.includes(n.key))
              .map((n) => (
                <button
                  key={n.key}
                  type="button"
                  class="pt-navlink"
                  onClick={() => {
                    setMoreOpen(false);
                    go(n.key);
                  }}
                >
                  <Icon name={n.icon} />
                  <span>{n.label}</span>
                  {n.badge ? <em class="pt-count">{n.badge}</em> : null}
                </button>
              ))}
            <button type="button" class="pt-navlink" onClick={() => (setMoreOpen(false), toggleLocale())}>
              <Icon name="globe" />
              <span>{t("language")}</span>
            </button>
            <button type="button" class="pt-navlink" onClick={logout}>
              <Icon name="logout" />
              <span>{t("logout")}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ProjectSwitch({ projects, projectId, onChange }: { projects: any[]; projectId: number; onChange: (id: number) => void }) {
  return (
    <select class="pt-input pt-switch" value={projectId} onChange={(e: any) => onChange(parseInt(e.currentTarget.value, 10))} aria-label="Projet">
      {projects.map((p) => (
        <option key={p.id} value={p.id}>
          {p.title}
        </option>
      ))}
    </select>
  );
}

// Pages qui ont un encart « Comment ça marche ? » (voir guide.ts).
const GUIDED = ["home", "todo", "messages", "files", "documents", "site", "kit", "payments", "help"];

function View({ view }: { view: string }) {
  switch (view) {
    case "todo":
      return <Todo />;
    case "files":
      return <Files />;
    case "documents":
      return <Documents />;
    case "messages":
      return <Messages />;
    case "site":
      return <Site />;
    case "kit":
      return <Kit />;
    case "payments":
      return <Payments />;
    case "help":
      return <Help />;
    default:
      return <Home />;
  }
}

render(<App />, root);
