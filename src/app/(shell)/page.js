"use client";

import { useCallback, useMemo } from "react";
import Link from "next/link";
import { usePageTitle } from "@/context/PageTitleContext";
import { useFetch } from "@/lib/useFetch";
import { api } from "@/lib/api";
import { formatINR, dateRangeFromPreset } from "@/lib/format";
import { KpiCard } from "@/components/ui/Card";
import { KpiSkeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/EmptyState";
import { RevenueChart } from "@/components/charts/RevenueChart";
import { OrdersRecentList } from "@/components/domain/OrdersRecentList";

export default function DashboardPage() {
  usePageTitle("Dashboard");

  const { data: summary, loading, error, reload } = useFetch(() => api.get("/admin/dashboard").then((r) => r.data), []);

  // Memoized: dateRangeFromPreset() embeds the current millisecond in `from`,
  // so recomputing it each render would change the useFetch dep forever and
  // refetch in an infinite loop.
  const salesRange = useMemo(() => dateRangeFromPreset("30d"), []);
  const { data: sales } = useFetch(() => api.get("/analytics/sales", salesRange).then((r) => r.data), [salesRange.from]);

  const { data: recentOrders } = useFetch(
    () => api.get("/orders/admin/all", { limit: 6, page: 1 }).then((r) => r.data.items),
    []
  );

  if (error) return <ErrorState message={error.message} onRetry={reload} />;

  return (
    <div className="flex flex-col gap-6">
      {loading || !summary ? (
        <KpiSkeleton count={4} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <KpiCard label="Total Revenue" value={formatINR(summary.revenue.total)} sub="all time" />
            <KpiCard label="Today's Revenue" value={formatINR(summary.revenue.today)} sub="since midnight" />
            <KpiCard label="This Week" value={formatINR(summary.revenue.week)} sub="revenue" />
            <KpiCard label="This Month" value={formatINR(summary.revenue.month)} sub="revenue" />
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <KpiCard label="Total Orders" value={summary.orders.total} sub={`${summary.orders.today} today`} />
            <KpiCard label="Pending Orders" value={summary.orders.pending} />
            <KpiCard label="Processing" value={summary.orders.processing} />
            <KpiCard label="Shipped" value={summary.orders.shipped} />
            <KpiCard label="Out for Delivery" value={summary.orders.outForDelivery} />
            <KpiCard label="Delivered" value={summary.orders.delivered} />
            <KpiCard label="Cancelled" value={summary.orders.cancelled} tone={summary.orders.cancelled > 0 ? "danger" : "default"} />
            <KpiCard label="Refunded" value={summary.orders.refunded} />
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <KpiCard label="Total Customers" value={summary.customers.total} />
            <KpiCard label="New This Month" value={summary.customers.newThisMonth} />
            <KpiCard label="Returning Customers" value={summary.customers.returning} />
            <KpiCard label="Total Products" value={summary.products.total} />
            <KpiCard
              label="Low Stock"
              value={summary.products.lowStock}
              tone={summary.products.lowStock > 0 ? "danger" : "default"}
            />
            <KpiCard
              label="Out of Stock"
              value={summary.products.outOfStock}
              tone={summary.products.outOfStock > 0 ? "danger" : "default"}
            />
            <KpiCard label="Pending Payments" value={summary.payments.pending} />
            <KpiCard label="Failed Payments" value={summary.payments.failed} tone={summary.payments.failed > 0 ? "danger" : "default"} />
          </div>
        </>
      )}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.7fr_1fr]">
        <div className="rounded-2xl border border-line-paper bg-surface p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-serif text-base text-ink">Revenue — last 30 days</h3>
            <Link href="/analytics/sales" className="font-mono text-[11px] uppercase tracking-wide text-stitch hover:underline">
              Full report →
            </Link>
          </div>
          {sales ? <RevenueChart data={sales.series} /> : <div className="h-[280px] animate-skeleton rounded-lg bg-line-paper/40" />}
        </div>

        <div className="rounded-2xl border border-line-paper bg-surface p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-serif text-base text-ink">Recent Orders</h3>
            <Link href="/orders" className="font-mono text-[11px] uppercase tracking-wide text-stitch hover:underline">
              View all →
            </Link>
          </div>
          <OrdersRecentList orders={recentOrders} />
        </div>
      </div>
    </div>
  );
}
