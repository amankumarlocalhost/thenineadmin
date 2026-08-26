"use client";

import { formatDateTime } from "@/lib/format";
import { EmptyState } from "@/components/ui/EmptyState";

// One dot colour per kind of event, so a run of failed payments or a status
// change stands out when scanning the column rather than having to be read.
const TYPE_STYLES = {
  account: { dot: "bg-info", label: "Account" },
  order: { dot: "bg-ink", label: "Order" },
  order_status: { dot: "bg-ink/40", label: "Order" },
  payment: { dot: "bg-success", label: "Payment" },
  payment_failed: { dot: "bg-danger", label: "Payment" },
  refund: { dot: "bg-warning", label: "Refund" },
  coupon: { dot: "bg-info", label: "Coupon" },
  login: { dot: "bg-ink/25", label: "Login" },
  login_failed: { dot: "bg-danger", label: "Login" },
  status: { dot: "bg-warning", label: "Status" },
  review: { dot: "bg-ink/40", label: "Review" },
};

export function CustomerTimeline({ events }) {
  if (!events?.length) return <EmptyState title="No activity yet" />;

  return (
    <ol className="relative flex flex-col gap-0 pl-1">
      {events.map((event, i) => {
        const style = TYPE_STYLES[event.type] || TYPE_STYLES.account;
        const isLast = i === events.length - 1;
        return (
          <li key={`${event.at}-${i}`} className="relative flex gap-3 pb-5 last:pb-0">
            {/* The connecting rail, stopped short on the final entry so the
                line doesn't dangle past the last event. */}
            {!isLast && <span className="absolute left-[5px] top-3 h-full w-px bg-line-paper" aria-hidden="true" />}
            <span className={`relative mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${style.dot}`} aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                <p className="font-body text-sm text-ink">{event.title}</p>
                <time className="shrink-0 font-mono text-[10.5px] uppercase tracking-wide text-ink/40">
                  {formatDateTime(event.at)}
                </time>
              </div>
              {event.detail && <p className="mt-0.5 font-body text-xs text-ink/55">{event.detail}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
