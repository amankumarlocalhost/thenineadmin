"use client";

import { useCallback, useMemo, useState } from "react";
import { usePageTitle } from "@/context/PageTitleContext";
import { useFetch } from "@/lib/useFetch";
import { api } from "@/lib/api";
import { dateRangeFromPreset, formatPercent } from "@/lib/format";
import { Card, KpiCard } from "@/components/ui/Card";
import { DateRangeSelect } from "@/components/ui/DateRangeSelect";
import { RevenueChart } from "@/components/charts/RevenueChart";
import { ErrorState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";

export default function SalesAnalyticsPage() {
  usePageTitle("Sales Analytics");
  const [preset, setPreset] = useState("30d");
  // Memoized so `from`/`to` stay stable across renders (they contain the
  // current millisecond) and useFetch only refetches when the preset changes.
  const range = useMemo(() => dateRangeFromPreset(preset), [preset]);

  const fetchData = useCallback(() => api.get("/analytics/sales", range).then((r) => r.data), [range]);
  const { data, loading, error, reload } = useFetch(fetchData, [fetchData]);

  if (error) return <ErrorState message={error.message} onRetry={reload} />;

  return (
    <div className="flex flex-col gap-5">
      <DateRangeSelect value={preset} onChange={setPreset} />

      {loading || !data ? (
        <Skeleton className="h-24 w-full" />
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <KpiCard label="Cancellation Rate" value={formatPercent(data.cancellationRate)} />
          <KpiCard label="Return Rate" value={formatPercent(data.returnRate)} />
          <KpiCard label="Delivery Rate" value={formatPercent(data.deliveryRate)} />
        </div>
      )}

      <Card title="Revenue & Orders Over Time">
        {data ? <RevenueChart data={data.series} /> : <Skeleton className="h-[280px] w-full" />}
      </Card>

      <Card title="Order Status Distribution">
        {!data ? (
          <Skeleton className="h-32 w-full" />
        ) : (
          <div className="flex flex-wrap gap-4">
            {data.statusDistribution.map((s) => (
              <div key={s.status} className="rounded-xl border border-line-paper px-4 py-3">
                <p className="font-mono text-[10px] uppercase tracking-wide text-ink/45">{s.status}</p>
                <p className="mt-1 font-serif text-xl text-ink">{s.count}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
