"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { usePageTitle } from "@/context/PageTitleContext";
import { useFetch } from "@/lib/useFetch";
import { api } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Field";
import { DataTable } from "@/components/ui/DataTable";
import { OrderStatusBadge } from "@/components/domain/StatusBadges";
import { ErrorState } from "@/components/ui/EmptyState";

const SHIP_STATUSES = ["Packed", "Ready to Ship", "Shipped", "In Transit", "Out for Delivery"];

export default function ShipmentsPage() {
  usePageTitle("Shipments");
  const router = useRouter();
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const fetchOrders = useCallback(
    () => api.get("/orders/admin/all", { shippingOnly: status ? undefined : "true", status: status || undefined, page, limit: 20 }),
    [status, page]
  );
  const { data: res, loading, error, reload } = useFetch(fetchOrders, [fetchOrders]);

  const columns = [
    { key: "order", header: "Order", render: (o) => <span className="font-mono text-xs">#{o.orderNumber}</span> },
    { key: "customer", header: "Customer", render: (o) => o.shippingInfo.name },
    { key: "destination", header: "Destination", render: (o) => `${o.shippingInfo.city}, ${o.shippingInfo.state}` },
    { key: "carrier", header: "Carrier", render: (o) => o.trackingCarrier || "—" },
    { key: "tracking", header: "Tracking #", render: (o) => <span className="font-mono text-xs">{o.trackingNumber || "—"}</span> },
    { key: "status", header: "Status", render: (o) => <OrderStatusBadge status={o.orderStatus} /> },
    { key: "since", header: "Updated", render: (o) => <span className="whitespace-nowrap text-xs text-ink/55">{formatDateTime(o.updatedAt)}</span> },
  ];

  if (error) return <ErrorState message={error.message} onRetry={reload} />;

  return (
    <Card padded={false}>
      <div className="flex flex-wrap items-center gap-3 border-b border-line-paper p-4">
        <Select value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }} className="w-52">
          <option value="">All shipping stages</option>
          {SHIP_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </Select>
      </div>

      <DataTable
        columns={columns}
        rows={res?.data?.items}
        meta={res?.meta}
        loading={loading}
        onPageChange={setPage}
        onRowClick={(o) => router.push(`/orders/${o.orderNumber}`)}
        emptyTitle="Nothing currently in the shipping pipeline"
        emptyDescription="Orders appear here once they're marked Packed and stay until Delivered."
      />
    </Card>
  );
}
