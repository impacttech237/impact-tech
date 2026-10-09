/* Journal horodaté du projet : la preuve de qui a fait quoi, et quand. */
import { Badge, Card, EmptyState } from "../../ui";
import { Activity } from "../../../lib/icons";
import { ACTION_LABEL, fmtDateTime } from "../shared";

export default function ActivityTab({ activity }) {
  if (!activity.length) return <EmptyState icon={Activity} message="Aucune activité." />;
  return (
    <Card padding="p-0">
      <ul className="divide-y divide-adm-border text-sm">
        {activity.map((a) => (
          <li key={a.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-4 py-2.5">
            <span className="w-36 shrink-0 text-xs text-adm-text-3">{fmtDateTime(a.created_at)}</span>
            <Badge variant={a.actor === "client" ? "success" : a.actor === "system" ? "default" : "info"}>{a.actor === "client" ? "Client" : a.actor === "system" ? "Auto" : "Nous"}</Badge>
            <span className="text-adm-text">{ACTION_LABEL[a.action] || a.action}</span>
            {a.detail && <span className="text-adm-text-2">— {a.detail}</span>}
            {a.ip && <span className="ml-auto text-[11px] text-adm-text-3">IP {a.ip}</span>}
            {!a.visible && <span className="text-[11px] text-adm-text-3">(interne)</span>}
          </li>
        ))}
      </ul>
    </Card>
  );
}
