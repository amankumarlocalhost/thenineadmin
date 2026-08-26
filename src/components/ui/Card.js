export function Card({ title, action, children, className = "", padded = true }) {
  return (
    <div className={`rounded-2xl border border-line-paper bg-surface shadow-sm ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between border-b border-line-paper px-5 py-4">
          {title && <h3 className="font-serif text-base text-ink">{title}</h3>}
          {action}
        </div>
      )}
      <div className={padded ? "p-5" : ""}>{children}</div>
    </div>
  );
}

export function KpiCard({ label, value, sub, trend, tone = "default" }) {
  return (
    <div className="rounded-2xl border border-line-paper bg-surface p-5 shadow-sm">
      <p className="font-mono text-[10.5px] uppercase tracking-[0.08em] text-ink/45">{label}</p>
      <p className={`mt-2 font-serif text-[26px] leading-none ${tone === "danger" ? "text-danger" : "text-ink"}`}>
        {value}
      </p>
      {(sub || trend !== undefined) && (
        <div className="mt-2 flex items-center gap-1.5">
          {trend !== undefined && (
            <span className={`font-mono text-[11px] font-medium ${trend >= 0 ? "text-success" : "text-danger"}`}>
              {trend >= 0 ? "▲" : "▼"} {Math.abs(trend).toFixed(1)}%
            </span>
          )}
          {sub && <span className="font-body text-xs text-ink/45">{sub}</span>}
        </div>
      )}
    </div>
  );
}
