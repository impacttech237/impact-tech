/* « Qui attend qui ? » — ce qui bloque chaque projet, côté client et côté nous. */
import { Badge, Card, EmptyState, LoadingSpinner, StatsCard } from "../ui";
import { AlertCircle, Briefcase, Clock, CreditCard, FileText, MessageCircle, Users } from "../../lib/icons";
import { ACTION_LABEL, ErrorText, fmtAgo, fmtMoney, useLoad, waLink } from "./shared";

export default function Overview({ openProject }) {
  const { data, error } = useLoad("overview");
  const settings = useLoad("settings");

  if (error) return <ErrorText>{error}</ErrorText>;
  if (!data) return <LoadingSpinner />;
  const s = data.stats;

  return (
    <div className="space-y-6">
      {settings.data && !settings.data.email.configured && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300">
          <AlertCircle size={18} />
          <div>
            <strong>Les emails ne partent pas encore.</strong> Ajoutez la clé Resend (onglet Réglages) pour que les clients reçoivent codes, rappels et
            notifications. En attendant : bouton WhatsApp et « Code manuel » sur chaque client.
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        <StatsCard label="Projets en cours" value={s.activeProjects} icon={Briefcase} />
        <StatsCard label="Clients" value={s.clients} icon={Users} />
        <StatsCard label="Signatures attendues" value={s.toSign} icon={FileText} />
        <StatsCard label="Retours à traiter" value={s.newRequests} icon={MessageCircle} />
        <StatsCard label="Factures impayées" value={s.unpaid} icon={CreditCard} />
        <StatsCard label="Encaissé (portail)" value={fmtMoney(s.cashed)} icon={CreditCard} />
      </div>

      {data.late.length > 0 && (
        <Card padding="p-4" className="border-adm-red/40">
          <h3 className="mb-2 flex items-center gap-2 font-head text-base font-semibold text-adm-red">
            <Clock size={16} /> En retard
          </h3>
          <ul className="space-y-1 text-sm">
            {data.late.map((p) => (
              <li key={p.id}>
                <button type="button" className="cursor-pointer text-adm-text hover:underline" onClick={() => openProject(p.id)}>
                  {p.client_name} — {p.title}
                </button>{" "}
                <span className="text-adm-text-3">({p.current_step})</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {!data.projects.length ? (
        <EmptyState icon={Briefcase} message="Aucun projet en cours. Créez un client (onglet Clients) ou convertissez une demande de devis." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Column title="🛠 On attend NOUS" hint="Ce que l'équipe doit faire" rows={data.waitingUs} field="waiting_us" openProject={openProject} />
          <Column title="⏳ On attend le CLIENT" hint="Relancé automatiquement par email (J0 puis J+4)" rows={data.waitingClient} field="waiting_client" openProject={openProject} showWa />
        </div>
      )}

      <Card padding="p-4">
        <h3 className="mb-3 font-head text-base font-semibold text-adm-text">Activité récente</h3>
        {!data.activity.length ? (
          <p className="text-sm text-adm-text-3">Rien pour l'instant.</p>
        ) : (
          <ul className="divide-y divide-adm-border text-sm">
            {data.activity.map((a) => (
              <li key={a.id} className="flex flex-wrap items-baseline gap-x-2 py-2">
                <Badge variant={a.actor === "client" ? "success" : a.actor === "system" ? "default" : "info"}>{a.actor === "client" ? a.actor_name || "Client" : a.actor === "system" ? "Auto" : "Nous"}</Badge>
                <span className="text-adm-text">{ACTION_LABEL[a.action] || a.action}</span>
                {a.detail && <span className="text-adm-text-2">· {a.detail}</span>}
                <button type="button" className="cursor-pointer text-adm-text-3 hover:text-adm-text" onClick={() => a.project_id && openProject(a.project_id)}>
                  — {a.client_name || ""} {a.project_title ? `(${a.project_title})` : ""}
                </button>
                <span className="ml-auto text-xs text-adm-text-3">{fmtAgo(a.created_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function Column({ title, hint, rows, field, openProject, showWa }) {
  return (
    <Card padding="p-4">
      <h3 className="font-head text-base font-semibold text-adm-text">{title}</h3>
      <p className="mb-3 text-xs text-adm-text-3">{hint}</p>
      {!rows.length ? (
        <p className="py-4 text-center text-sm text-adm-text-3">Rien en attente 🎉</p>
      ) : (
        <ul className="space-y-3">
          {rows.map((p) => (
            <li key={p.id} className="rounded-lg border border-adm-border bg-adm-surface-2 p-3">
              <div className="flex items-start justify-between gap-2">
                <button type="button" className="cursor-pointer text-left" onClick={() => openProject(p.id)}>
                  <div className="text-sm font-semibold text-adm-text hover:underline">{p.client_name}</div>
                  <div className="text-xs text-adm-text-3">
                    {p.title} · {p.progress}% · {p.current_step}
                  </div>
                </button>
                {showWa && p.client_phone && (
                  <a
                    className="shrink-0 rounded-lg bg-emerald-600/20 px-2 py-1 text-xs font-semibold text-emerald-400 hover:bg-emerald-600/30"
                    href={waLink(p.client_phone, `Bonjour ${String(p.client_name).split(" ")[0]}, petit rappel : votre projet attend ${p[field][0]}. Tout se fait depuis votre espace client 🙂`)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    WhatsApp
                  </a>
                )}
              </div>
              <ul className="mt-2 space-y-0.5 text-xs text-adm-text-2">
                {p[field].slice(0, 5).map((w, i) => (
                  <li key={i}>• {w}</li>
                ))}
                {p[field].length > 5 && <li className="text-adm-text-3">+ {p[field].length - 5} autre(s)</li>}
              </ul>
              {showWa && <p className="mt-1 text-[11px] text-adm-text-3">Vu {fmtAgo(p.last_seen_at)}</p>}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
