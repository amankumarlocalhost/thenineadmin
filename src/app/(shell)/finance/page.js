"use client";

import { useCallback, useMemo, useState } from "react";
import { usePageTitle } from "@/context/PageTitleContext";
import { useFetch } from "@/lib/useFetch";
import { api } from "@/lib/api";
import { dateRangeFromPreset, formatINR } from "@/lib/format";
import { Card, KpiCard } from "@/components/ui/Card";
import { DateRangeSelect } from "@/components/ui/DateRangeSelect";
import { RevenueChart } from "@/components/charts/RevenueChart";
import { BarList } from "@/components/charts/BarList";
import { ErrorState, EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";

// The money-flow ladder from the brief, rendered literally so the admin can
// see where a rupee is in its lifecycle without reading a table.
const FLOW_STEPS = [
  "Customer Order",
  "Payment Created",
  "Payment Processing",
  "Payment Successful / Failed",
  "Order Confirmed",
  "Product Shipped",
  "Order Delivered",
  "Revenue Recorded",
  "Refund / Cancellation Adjustment",
];

export default function FinancePage() {
  usePageTitle("Finance");
  const [preset, setPreset] = useState("30d");
  // Memoized so `from`/`to` stay stable across renders (they contain the
  // current millisecond) and useFetch only refetches when the preset changes.
  const range = useMemo(() => dateRangeFromPreset(preset), [preset]);

  const fetchData = useCallback(() => api.get("/admin/finance", range).then((r) => r.data), [range]);
  const { data, loading, error, reload } = useFetch(fetchData, [fetchData]);

  if (error) return <ErrorState message={error.message} onRetry={reload} />;

  return (
    <div className="flex flex-col gap-5">
      <DateRangeSelect value={preset} onChange={setPreset} />

      <Card title="Money Flow" className="overflow-visible">
        <div className="admin-scroll flex items-center gap-1 overflow-x-auto pb-1">
          {FLOW_STEPS.map((step, i) => (
            <div key={step} className="flex shrink-0 items-center gap-1">
              <span className="whitespace-nowrap rounded-full border border-line-paper bg-surface-sunken px-3.5 py-2 font-mono text-[10.5px] font-medium text-ink/70">
                {step}
              </span>
              {i < FLOW_STEPS.length - 1 && <span className="text-ink/25">→</span>}
            </div>
          ))}
        </div>
      </Card>

      {loading || !data ? (
        <Skeleton className="h-24 w-full" />
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <KpiCard label="Gross Revenue" value={formatINR(data.grossRevenue)} />
          <KpiCard label="Net Revenue" value={formatINR(data.netRevenue)} sub="after refunds" />
          <KpiCard label="Total Sales" value={data.totalSales} sub="paid orders" />
          <KpiCard label="Average Order Value" value={formatINR(data.averageOrderValue)} />
          <KpiCard label="Successful Payments" value={data.payments.successful} sub={formatINR(data.payments.successfulAmount)} />
          <KpiCard label="Failed Payments" value={data.payments.failed} tone={data.payments.failed > 0 ? "danger" : "default"} />
          <KpiCard label="Pending Payments" value={formatINR(data.payments.pendingAmount)} />
          <KpiCard label="Refunded Amount" value={formatINR(data.refundedAmount)} tone={data.refundedAmount > 0 ? "danger" : "default"} />
        </div>
      )}

      <Card title="Revenue Trend">
        {data ? <RevenueChart data={data.revenueByDay} /> : <Skeleton className="h-[280px] w-full" />}
      </Card>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card title="Revenue by Product">
          {loading || !data ? <Skeleton className="h-56 w-full" /> : data.revenueByProduct.length ? (
            <BarList items={data.revenueByProduct} labelKey="name" valueKey="revenue" formatValue={formatINR} />
          ) : <EmptyState title="No revenue in this range" />}
        </Card>
        <Card title="Revenue by Category">
          {loading || !data ? <Skeleton className="h-56 w-full" /> : data.revenueByCategory.length ? (
            <BarList items={data.revenueByCategory} labelKey="category" valueKey="revenue" formatValue={formatINR} />
          ) : <EmptyState title="No revenue in this range" />}
        </Card>
      </div>
    </div>
  );
}
