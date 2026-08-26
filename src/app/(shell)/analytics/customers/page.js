"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { usePageTitle } from "@/context/PageTitleContext";
import { useFetch } from "@/lib/useFetch";
import { api } from "@/lib/api";
import { dateRangeFromPreset, formatINR } from "@/lib/format";
import { Card, KpiCard } from "@/components/ui/Card";
import { DateRangeSelect } from "@/components/ui/DateRangeSelect";
import { RevenueChart } from "@/components/charts/RevenueChart";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";

export default function CustomerAnalyticsPage() {
  usePageTitle("Customer Analytics");
  const [preset, setPreset] = useState("30d");
  // Memoized so `from`/`to` stay stable across renders (they contain the
  // current millisecond) and useFetch only refetches when the preset changes.
  const range = useMemo(() => dateRangeFromPreset(preset), [preset]);

  const fetchData = useCallback(() => api.get("/analytics/customers", range).then((r) => r.data), [range]);
  const { data, loading, error, reload } = useFetch(fetchData, [fetchData]);

  if (error) return <ErrorState message={error.message} onRetry={reload} />;

  return (
    <div className="flex flex-col gap-5">
      <DateRangeSelect value={preset} onChange={setPreset} />

      {loading || !data ? (
        <Skeleton className="h-24 w-full" />
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <KpiCard label="New Customers" value={data.newVsReturning.new} sub="one-time buyers" />
          <KpiCard label="Returning Customers" value={data.newVsReturning.returning} sub="2+ orders" />
        </div>
      )}

      <Card title="New Sign-ups Over Time">
        {data ? (
          <RevenueChart data={data.newCustomersSeries.map((s) => ({ date: s.date, revenue: s.count }))} dataKey="revenue" height={240} />
        ) : (
          <Skeleton className="h-60 w-full" />
        )}
      </Card>

      <Card title="Top Customers by Lifetime Spend" padded={false}>
        {loading || !data ? (
          <Skeleton className="h-40 w-full" />
        ) : !data.topCustomers.length ? (
          <EmptyState title="No customer spend data yet" />
        ) : (
          <ul className="flex flex-col divide-y divide-line-paper">
            {data.topCustomers.map((c, i) => (
              <li key={c.userId}>
                <Link href={`/customers/${c.userId}`} className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-surface-sunken">
                  <div className="flex items-center gap-3">
                    <span className="w-5 font-mono text-xs text-ink/35">{i + 1}</span>
                    <div>
                      <p className="font-body text-sm text-ink">{c.name}</p>
                      <p className="font-body text-xs text-ink/45">{c.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-body text-sm font-medium text-ink">{formatINR(c.totalSpent)}</p>
                    <p className="font-mono text-[11px] text-ink/45">{c.orders} orders</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
