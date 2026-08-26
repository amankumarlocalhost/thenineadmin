import Link from "next/link";
import { formatINR, formatRelative } from "@/lib/format";
import { OrderStatusBadge } from "./StatusBadges";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";

export function OrdersRecentList({ orders }) {
  if (orders === null || orders === undefined) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-11 w-full" />
        ))}
      </div>
    );
  }

  if (!orders.length) return <EmptyState title="No orders yet" />;

  return (
    <ul className="flex flex-col divide-y divide-line-paper">
      {orders.map((order) => (
        <li key={order._id}>
          <Link href={`/orders/${order.orderNumber}`} className="flex items-center justify-between gap-3 py-3 hover:opacity-80">
            <div className="min-w-0">
              <p className="truncate font-mono text-xs text-ink">#{order.orderNumber}</p>
              <p className="truncate font-body text-xs text-ink/45">{order.userEmail} · {formatRelative(order.createdAt)}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2.5">
              <span className="font-body text-sm font-medium text-ink">{formatINR(order.total)}</span>
              <OrderStatusBadge status={order.orderStatus} />
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
