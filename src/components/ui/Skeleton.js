export function Skeleton({ className = "" }) {
  return <div className={`animate-skeleton rounded-md bg-line-paper/60 ${className}`} />;
}

export function TableSkeleton({ rows = 6, cols = 5 }) {
  return (
    <div className="divide-y divide-line-paper">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-6 px-5 py-3.5">
          {Array.from({ length: cols }).map((__, c) => (
            <Skeleton key={c} className={`h-3.5 ${c === 0 ? "w-1/4" : "flex-1"}`} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function KpiSkeleton({ count = 4 }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-line-paper bg-surface p-5">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="mt-3 h-7 w-24" />
        </div>
      ))}
    </div>
  );
}
