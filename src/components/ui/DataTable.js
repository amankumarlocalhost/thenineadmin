import { TableSkeleton } from "./Skeleton";
import { EmptyState } from "./EmptyState";
import { Button } from "./Button";

/**
 * A display table driven entirely by props — search/filter/sort/pagination
 * state lives in the parent page and is sent to the real backend endpoint
 * (see docs on "No Fake or Static Admin System": pagination here reflects
 * actual server-side paging, not a client-side slice of a fake full list).
 *
 * columns: [{ key, header, render?(row), width? }]
 * meta: { page, limit, total, pages } from the API response envelope
 */
export function DataTable({ columns, rows, loading, emptyTitle, emptyDescription, meta, onPageChange, rowKey = "id", onRowClick }) {
  if (loading) return <TableSkeleton cols={columns.length} />;
  if (!rows?.length) return <EmptyState title={emptyTitle} description={emptyDescription} />;

  return (
    <div>
      <div className="admin-scroll overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-line-paper text-left">
              {columns.map((col) => (
                <th key={col.key} className="whitespace-nowrap px-5 py-3 font-mono text-[10.5px] font-medium uppercase tracking-wide text-ink/45" style={{ width: col.width }}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line-paper">
            {rows.map((row) => (
              <tr
                key={row[rowKey] || row._id || row.id}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={`transition-colors ${onRowClick ? "cursor-pointer hover:bg-surface-sunken" : ""}`}
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-5 py-3.5 align-middle font-body text-ink/80">
                    {col.render ? col.render(row) : (row[col.key] ?? "—")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {meta && meta.pages > 1 && (
        <div className="flex items-center justify-between border-t border-line-paper px-5 py-3.5">
          <p className="font-mono text-[11px] text-ink/45">
            Page {meta.page} of {meta.pages} · {meta.total} total
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" disabled={meta.page <= 1} onClick={() => onPageChange(meta.page - 1)}>
              Previous
            </Button>
            <Button variant="secondary" size="sm" disabled={meta.page >= meta.pages} onClick={() => onPageChange(meta.page + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
