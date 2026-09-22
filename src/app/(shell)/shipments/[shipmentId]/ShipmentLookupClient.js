"use client";

import { useCallback } from "react";
import Link from "next/link";
import { usePageTitle } from "@/context/PageTitleContext";
import { useFetch } from "@/lib/useFetch";
import { api } from "@/lib/api";
import { formatINR } from "@/lib/format";
import { Card } from "@/components/ui/Card";
import { ErrorState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { OrderStatusBadge } from "@/components/domain/StatusBadges";

// What a shipping label's QR code resolves to (see the backend's
// shipment.routes.js `GET /shipments/:shipmentId`). This route sits behind
// the same admin auth as the rest of `(shell)`, so scanning the QR never
// exposes customer data to anyone who isn't signed in as staff.
export default function ShipmentLookupClient({ shipmentId }) {
  usePageTitle(`Shipment ${shipmentId}`);

  const fetchLabel = useCallback(() => api.get(`/shipments/${shipmentId}`).then((r) => r.data.label), [shipmentId]);
  const { data: label, loading, error, reload } = useFetch(fetchLabel, [fetchLabel]);

  if (error) return <ErrorState message={error.message} onRetry={reload} />;
  if (loading || !label) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="flex max-w-xl flex-col gap-5">
      <div className="flex items-center gap-3">
        <OrderStatusBadge status={label.status} />
        <span className="font-mono text-xs text-ink/45">Shipment {label.shipmentId}</span>
      </div>

      <Card title="Shipment">
        <dl className="flex flex-col gap-2 font-body text-sm">
          <Row label="Order" value={`#${label.orderNumber}`} />
          <Row label="From" value={`${label.from.city}, ${label.from.state}`} />
          <Row label="To" value={`${label.to.city}, ${label.to.state}`} />
          <Row label="Customer" value={label.to.name} />
          <Row label="Payment" value={label.paymentMethod} />
          <Row label="Amount" value={formatINR(label.amount)} />
          <Row label="Tracking Number" value={label.trackingNumber} />
        </dl>
      </Card>

      <Card title="Product(s)">
        <ul className="flex flex-col gap-2 font-body text-sm text-ink">
          {label.items.map((item, i) => (
            <li key={i}>
              {item.name}
              {item.size ? ` · Size ${item.size}` : ""} · Qty {item.qty}
            </li>
          ))}
        </ul>
      </Card>

      <Link href={`/orders/${label.orderNumber}`} className="font-mono text-[11px] uppercase tracking-wide text-stitch hover:underline">
        View full order →
      </Link>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between">
      <dt className="text-ink/50">{label}</dt>
      <dd className="text-ink">{value}</dd>
    </div>
  );
}
