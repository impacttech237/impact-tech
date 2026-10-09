/* Tableau des projets : une colonne par étape en cours (vue Kanban). */
import { Badge, Card, EmptyState, LoadingSpinner } from "../ui";
import { Briefcase } from "../../lib/icons";
import { ErrorText, fmtDate, useLoad } from "./shared";

export default function Board({ openProject }) {
  const { data, error } = useLoad("overview");
  if (error) return <ErrorText>{error}</ErrorText>;
  if (!data) return <LoadingSpinner />;
  if (!data.projects.length) return <EmptyState icon={Briefcase} message="Aucun projet en cours." />;

  const columns = [];
  const byCol = new Map();
  const add = (col, p) => {
    if (!byCol.has(col)) {
      byCol.set(col, []);
      columns.push(col);
    }
    byCol.get(col).push(p);
  };
  const order = ["Appel découverte", "Proposition + maquette", "Développement", "Livraison + paiement"];
  [...data.projects]
    .sort((a, b) => order.indexOf(a.current_step) - order.indexOf(b.current_step))
    .forEach((p) => add(p.status === "livre" ? "Livré" : p.status === "pause" ? "En pause" : p.current_step, p));

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map((col) => (
        <div key={col} className="w-72 shrink-0">
          <div className="mb-2 flex items-center justify-between px-1">
            <h3 className="font-head text-sm font-semibold text-adm-text">{col}</h3>
            <span className="text-xs text-adm-text-3">{byCol.get(col).length}</span>
          </div>
          <div className="space-y-2">
            {byCol.get(col).map((p) => (
              <Card key={p.id} padding="p-3" hover className={`cursor-pointer ${p.late ? "border-adm-red/50" : ""}`}>
                <button type="button" className="w-full cursor-pointer text-left" onClick={() => openProject(p.id)}>
                  <div className="text-sm font-semibold text-adm-text">{p.client_name}</div>
                  <div className="truncate text-xs text-adm-text-3">{p.title}</div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-adm-surface-3">
                    <div className="h-full rounded-full bg-adm-red" style={{ width: `${p.progress}%` }} />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {p.current_status === "review" && <Badge variant="warning">Validation client</Badge>}
                    {p.waiting_client.length > 0 && <Badge variant="danger">{p.waiting_client.length} attendu(s)</Badge>}
                    {p.waiting_us.length > 0 && <Badge variant="info">{p.waiting_us.length} pour nous</Badge>}
                    {p.late && <Badge variant="danger">En retard</Badge>}
                  </div>
                  {p.due_date && <p className="mt-1 text-[11px] text-adm-text-3">Livraison : {fmtDate(p.due_date)}</p>}
                </button>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
