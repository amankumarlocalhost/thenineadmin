"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { usePageTitle } from "@/context/PageTitleContext";
import { useFetch } from "@/lib/useFetch";
import { api } from "@/lib/api";
import { formatINR, formatDateTime } from "@/lib/format";
import { Card } from "@/components/ui/Card";
import { Select, SearchInput, Input } from "@/components/ui/Field";
import { DataTable } from "@/components/ui/DataTable";
import { PaymentStatusBadge } from "@/components/domain/StatusBadges";
import { ErrorState } from "@/components/ui/EmptyState";

export default function PaymentsPage() {
  usePageTitle("Payments");
  const router = useRouter();

  const [q, setQ] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [amountMin, setAmountMin] = useState("");
  const [amountMax, setAmountMax] = useState("");
  const [page, setPage] = useState(1);

  const fetchOrders = useCallback(
    () =>
      api.get("/orders/admin/all", {
        q: q || undefined,
        paymentStatus: paymentStatus || undefined,
        paymentMethod: paymentMethod || undefined,
        amountMin: amountMin || undefined,
        amountMax: amountMax || undefined,
        page,
        limit: 20,
      }),
    [q, paymentStatus, paymentMethod, amountMin, amountMax, page]
  );
  const { data: res, loading, error, reload } = useFetch(fetchOrders, [fetchOrders]);

  const columns = [
    { key: "order", header: "Order", render: (o) => <span className="font-mono text-xs">#{o.orderNumber}</span> },
    { key: "gatewayId", header: "Gateway Order Id", render: (o) => <span className="font-mono text-[11px] text-ink/60">{o.paymentGatewayOrderId || "—"}</span> },
    { key: "referenceId", header: "Razorpay Payment Id", render: (o) => <span className="font-mono text-[11px] text-ink/60">{o.paymentGatewayReferenceId || "—"}</span> },
    { key: "customer", header: "Customer", render: (o) => o.userEmail },
    { key: "amount", header: "Amount", render: (o) => <span className="font-medium">{formatINR(o.total)}</span> },
    { key: "method", header: "Method", render: (o) => <span className="uppercase text-xs">{o.paymentMethod}</span> },
    { key: "status", header: "Status", render: (o) => <PaymentStatusBadge status={o.paymentStatus} /> },
    { key: "date", header: "Date", render: (o) => <span className="whitespace-nowrap text-xs text-ink/55">{formatDateTime(o.paidAt || o.createdAt)}</span> },
  ];

  if (error) return <ErrorState message={error.message} onRetry={reload} />;

  return (
    <Card padded={false}>
      <div className="flex flex-wrap items-center gap-3 border-b border-line-paper p-4">
        <SearchInput placeholder="Search order # or email…" value={q} onChange={(e) => { setPage(1); setQ(e.target.value); }} className="w-60" />
        <Select value={paymentStatus} onChange={(e) => { setPage(1); setPaymentStatus(e.target.value); }} className="w-44">
          <option value="">All payment states</option>
          {["Pending", "Paid", "Failed", "Refunded", "Partially Refunded"].map((s) => <option key={s} value={s}>{s}</option>)}
        </Select>
        <Select value={paymentMethod} onChange={(e) => { setPage(1); setPaymentMethod(e.target.value); }} className="w-36">
          <option value="">All methods</option>
          {["card", "upi", "cod"].map((m) => <option key={m} value={m}>{m.toUpperCase()}</option>)}
        </Select>
        <Input type="number" placeholder="Min ₹" value={amountMin} onChange={(e) => { setPage(1); setAmountMin(e.target.value); }} className="w-24" />
        <Input type="number" placeholder="Max ₹" value={amountMax} onChange={(e) => { setPage(1); setAmountMax(e.target.value); }} className="w-24" />
      </div>

      <DataTable
        columns={columns}
        rows={res?.data?.items}
        meta={res?.meta}
        loading={loading}
        onPageChange={setPage}
        onRowClick={(o) => router.push(`/orders/${o.orderNumber}`)}
        emptyTitle="No payments match those filters"
      />
    </Card>
  );
}
