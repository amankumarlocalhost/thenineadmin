"use client";

import { useCallback, useMemo, useState } from "react";
import { usePageTitle } from "@/context/PageTitleContext";
import { useFetch } from "@/lib/useFetch";
import { api } from "@/lib/api";
import { dateRangeFromPreset, formatINR } from "@/lib/format";
import { Card } from "@/components/ui/Card";
import { DateRangeSelect } from "@/components/ui/DateRangeSelect";
import { BarList } from "@/components/charts/BarList";
import { Badge } from "@/components/ui/Badge";
import { ErrorState, EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";

export default function ProductAnalyticsPage() {
  usePageTitle("Product Analytics");
  const [preset, setPreset] = useState("30d");
  // Memoized so `from`/`to` stay stable across renders (they contain the
  // current millisecond) and useFetch only refetches when the preset changes.
  const range = useMemo(() => dateRangeFromPreset(preset), [preset]);

  const fetchData = useCallback(() => api.get("/analytics/products", range).then((r) => r.data), [range]);
  const { data, loading, error, reload } = useFetch(fetchData, [fetchData]);

  if (error) return <ErrorState message={error.message} onRetry={reload} />;

  return (
    <div className="flex flex-col gap-5">
      <DateRangeSelect value={preset} onChange={setPreset} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card title="Best Sellers (by units sold)">
          {loading || !data ? <Skeleton className="h-56 w-full" /> : data.bestSellers.length ? (
            <BarList items={data.bestSellers} labelKey="name" valueKey="unitsSold" formatValue={(v) => `${v} sold`} />
          ) : <EmptyState title="No sales in this range" />}
        </Card>

        <Card title="Highest Revenue Products">
          {loading || !data ? <Skeleton className="h-56 w-full" /> : data.highestRevenue.length ? (
            <BarList items={data.highestRevenue} labelKey="name" valueKey="revenue" formatValue={formatINR} />
          ) : <EmptyState title="No sales in this range" />}
        </Card>

        <Card title="Lowest Sellers">
          {loading || !data ? <Skeleton className="h-56 w-full" /> : data.lowestSellers.length ? (
            <BarList items={data.lowestSellers} labelKey="name" valueKey="unitsSold" formatValue={(v) => `${v} sold`} />
          ) : <EmptyState title="No sales in this range" />}
        </Card>

        <Card title="Category Performance">
          {loading || !data ? <Skeleton className="h-56 w-full" /> : data.categoryPerformance.length ? (
            <BarList items={data.categoryPerformance} labelKey="category" valueKey="revenue" formatValue={formatINR} />
          ) : <EmptyState title="No sales in this range" />}
        </Card>
      </div>

      <Card title="Products with High Returns">
        {loading || !data ? <Skeleton className="h-24 w-full" /> : !data.highReturns.length ? (
          <EmptyState title="No products with notable returns" />
        ) : (
          <ul className="flex flex-col divide-y divide-line-paper">
            {data.highReturns.map((p) => (
              <li key={p.productId} className="flex items-center justify-between py-2.5">
                <span className="font-body text-sm text-ink">{p.name}</span>
                <Badge tone="danger">{p.returns} returned</Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Low Stock">
        {loading || !data ? <Skeleton className="h-24 w-full" /> : !data.lowStock.length ? (
          <EmptyState title="Nothing low on stock right now" />
        ) : (
          <ul className="flex flex-col divide-y divide-line-paper">
            {data.lowStock.map((p) => (
              <li key={p._id} className="flex items-center justify-between py-2.5">
                <span className="font-body text-sm text-ink">{p.name}</span>
                <Badge tone="warning">{p.stock} left</Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
