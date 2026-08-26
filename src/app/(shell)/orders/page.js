"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { usePageTitle } from "@/context/PageTitleContext";
import { useFetch } from "@/lib/useFetch";
import { api } from "@/lib/api";
import { formatINR, formatDateTime } from "@/lib/format";
import { ORDER_STATUSES } from "@/lib/constants";
import { Card } from "@/components/ui/Card";
import { SearchInput, Select } from "@/components/ui/Field";
import { DataTable } from "@/components/ui/DataTable";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/domain/StatusBadges";
import { ErrorState } from "@/components/ui/EmptyState";

export default function OrdersPage() {
  usePageTitle("Orders");
  const router = useRouter();

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [page, setPage] = useState(1);

  const fetchOrders = useCallback(
    () =>
      api
        .get("/orders/admin/all", { q: q || undefined, status: status || undefined, paymentStatus: paymentStatus || undefined, page, limit: 20 })
        .then((r) => r),
    [q, status, paymentStatus, page]
  );
  const { data: res, loading, error, reload } = useFetch(fetchOrders, [fetchOrders]);

  const columns = [
    { key: "orderNumber", header: "Order", render: (o) => <span className="font-mono text-xs">#{o.orderNumber}</span> },
    { key: "customer", header: "Customer", render: (o) => <span className="text-sm">{o.userEmail}</span> },
    { key: "items", header: "Items", render: (o) => `${o.items.length} item${o.items.length === 1 ? "" : "s"}` },
    { key: "total", header: "Total", render: (o) => <span className="font-medium">{formatINR(o.total)}</span> },
    { key: "payment", header: "Payment", render: (o) => <PaymentStatusBadge status={o.paymentStatus} /> },
    { key: "status", header: "Status", render: (o) => <OrderStatusBadge status={o.orderStatus} /> },
    { key: "date", header: "Placed", render: (o) => <span className="whitespace-nowrap text-xs text-ink/55">{formatDateTime(o.createdAt)}</span> },
  ];

  if (error) return <ErrorState message={error.message} onRetry={reload} />;

  return (
    <Card padded={false}>
      <div className="flex flex-wrap items-center gap-3 border-b border-line-paper p-4">
        <SearchInput
          placeholder="Search order # or email…"
          value={q}
          onChange={(e) => {
            setPage(1);
            setQ(e.target.value);
          }}
          className="w-64"
        />
        <Select
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value);
          }}
          className="w-48"
        >
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
        <Select
          value={paymentStatus}
          onChange={(e) => {
            setPage(1);
            setPaymentStatus(e.target.value);
          }}
          className="w-44"
        >
          <option value="">All payment states</option>
          {["Pending", "Paid", "Failed", "Refunded", "Partially Refunded"].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </div>

      <DataTable
        columns={columns}
        rows={res?.data?.items}
        meta={res?.meta}
        loading={loading}
        onPageChange={setPage}
        onRowClick={(o) => router.push(`/orders/${o.orderNumber}`)}
        emptyTitle="No orders match those filters"
      />
    </Card>
  );
}
