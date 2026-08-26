"use client";

import { useCallback, useState } from "react";
import { usePageTitle } from "@/context/PageTitleContext";
import { useFetch } from "@/lib/useFetch";
import { api } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { Card } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { Drawer } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";

const REASON_LABELS = {
  order_placed: "Order sold",
  order_cancelled: "Order cancelled — restocked",
  order_returned: "Return — restocked",
  restock: "Manual restock",
  manual_adjustment: "Manual adjustment",
};

export default function InventoryPage() {
  usePageTitle("Inventory");
  const { data, loading, error, reload } = useFetch(() => api.get("/admin/inventory").then((r) => r.data), []);
  const [historyProduct, setHistoryProduct] = useState(null);

  const columns = (variant) => [
    {
      key: "product",
      header: "Product",
      render: (p) => (
        <div className="flex items-center gap-3">
          {p.images?.[0] && <img src={p.images[0]} alt="" className="h-10 w-8 shrink-0 rounded-md object-cover" />}
          <div>
            <p className="font-body text-sm text-ink">{p.name}</p>
            <p className="font-mono text-[11px] text-ink/40">{p.productId}</p>
          </div>
        </div>
      ),
    },
    {
      key: "stock",
      header: "Stock",
      render: (p) => <Badge tone={variant === "out" ? "danger" : "warning"}>{p.stock} units</Badge>,
    },
    {
      key: "history",
      header: "",
      render: (p) => (
        <button type="button" onClick={() => setHistoryProduct(p)} className="font-mono text-[11px] uppercase tracking-wide text-stitch hover:underline">
          View history →
        </button>
      ),
    },
  ];

  if (error) return <ErrorState message={error.message} onRetry={reload} />;

  return (
    <div className="flex flex-col gap-5">
      <Card title={`Low Stock (≤ ${data?.threshold ?? 10} units)`} padded={false}>
        <DataTable columns={columns("low")} rows={data?.lowStock} loading={loading} emptyTitle="No low-stock products" />
      </Card>
      <Card title="Out of Stock" padded={false}>
        <DataTable columns={columns("out")} rows={data?.outOfStock} loading={loading} emptyTitle="Nothing is out of stock" />
      </Card>

      <Drawer open={Boolean(historyProduct)} onClose={() => setHistoryProduct(null)} title={historyProduct?.name || "Stock History"}>
        {historyProduct && <InventoryHistory productId={historyProduct._id} />}
      </Drawer>
    </div>
  );
}

function InventoryHistory({ productId }) {
  const fetchHistory = useCallback(() => api.get(`/admin/inventory/${productId}/history`).then((r) => r.data.items), [productId]);
  const { data: items, loading } = useFetch(fetchHistory, [fetchHistory]);

  if (loading) return <Skeleton className="h-40 w-full" />;
  if (!items?.length) return <EmptyState title="No stock movements recorded yet" />;

  return (
    <ol className="flex flex-col gap-4">
      {items.map((log) => (
        <li key={log._id} className="flex gap-3">
          <div className="flex flex-col items-center">
            <span className={`h-2 w-2 rounded-full ${log.change < 0 ? "bg-danger" : "bg-success"}`} />
          </div>
          <div>
            <p className="font-body text-sm text-ink">
              {REASON_LABELS[log.reason] || log.reason} {log.size && `· Size ${log.size}`}
            </p>
            <p className="font-mono text-xs text-ink/50">
              {log.change > 0 ? "+" : ""}
              {log.change} → balance {log.balanceAfter}
              {log.order?.orderNumber && ` · #${log.order.orderNumber}`}
            </p>
            <p className="font-mono text-[11px] text-ink/40">{formatDateTime(log.createdAt)}{log.actor?.name && ` · ${log.actor.name}`}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
