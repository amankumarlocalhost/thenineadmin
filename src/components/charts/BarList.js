// A ranked horizontal bar list — used for "top products", "top categories",
// "top customers" — deliberately not a recharts bar chart, since a labeled
// ranked list reads faster than axes for this kind of top-N data.
export function BarList({ items, labelKey = "label", valueKey = "value", formatValue = (v) => v }) {
  const max = Math.max(...items.map((i) => i[valueKey]), 1);
  return (
    <div className="flex flex-col gap-3">
      {items.map((item, i) => (
        <div key={item[labelKey] + i} className="flex items-center gap-3">
          <span className="w-6 shrink-0 font-mono text-[11px] text-ink/35">{i + 1}</span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate font-body text-sm text-ink">{item[labelKey]}</span>
              <span className="shrink-0 font-mono text-xs font-medium text-ink/70">{formatValue(item[valueKey])}</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-line-paper/50">
              <div className="h-full rounded-full bg-stitch" style={{ width: `${(item[valueKey] / max) * 100}%` }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
