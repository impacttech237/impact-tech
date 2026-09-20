export function Table({ columns, data, emptyMessage = "Aucun élément." }) {
  if (!data || data.length === 0) {
    return <p className="rounded-xl border border-adm-border bg-adm-surface p-6 text-sm text-adm-text-3">{emptyMessage}</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-adm-border">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-adm-border bg-adm-surface-2">
            {columns.map((col) => (
              <th key={col.key} className="whitespace-nowrap px-4 py-3 text-xs font-medium uppercase tracking-wide text-adm-text-3">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-adm-surface">
          {data.map((row, i) => (
            <tr key={row.id ?? i} className="border-b border-adm-border last:border-0 transition-colors hover:bg-adm-surface-2">
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 text-adm-text">
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
