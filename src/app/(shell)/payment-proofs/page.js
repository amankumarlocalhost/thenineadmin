"use client";

import { Suspense, useCallback, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { usePageTitle } from "@/context/PageTitleContext";
import { useFetch } from "@/lib/useFetch";
import { api } from "@/lib/api";
import { formatINR, formatDateTime } from "@/lib/format";
import { Card } from "@/components/ui/Card";
import { Input, Select, SearchInput } from "@/components/ui/Field";
import { DataTable } from "@/components/ui/DataTable";
import { ErrorState } from "@/components/ui/EmptyState";
import { ProofStatusBadge } from "@/components/domain/StatusBadges";

// The review queue for bank / UPI transfer receipts. Opens on "pending" —
// that's the work — and every filter is applied server-side; only one page of
// metadata is loaded here, never the files themselves.
export default function PaymentProofsPage() {
  // useSearchParams needs a Suspense boundary to prerender.
  return (
    <Suspense fallback={null}>
      <PaymentProofsQueue />
    </Suspense>
  );
}

function PaymentProofsQueue() {
  usePageTitle("Payment Proofs");
  const router = useRouter();
  const params = useSearchParams();

  const [q, setQ] = useState(params.get("q") || "");
  const [status, setStatus] = useState(params.get("q") ? "" : "pending");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);

  const fetchProofs = useCallback(
    () =>
      api.get("/payment-proofs/admin", {
        q: q || undefined,
        status: status || undefined,
        from: from || undefined,
        // Inclusive of the whole "to" day.
        to: to ? `${to}T23:59:59` : undefined,
        page,
        limit: 20,
      }),
    [q, status, from, to, page]
  );
  const { data: res, loading, error, reload } = useFetch(fetchProofs, [fetchProofs]);

  const columns = [
    { key: "proofId", header: "Proof", render: (p) => <span className="font-mono text-xs">{p.proofId}</span> },
    { key: "order", header: "Order", render: (p) => <span className="font-mono text-xs">#{p.orderNumber}</span> },
    { key: "customer", header: "Customer", render: (p) => p.userEmail },
    { key: "amount", header: "Amount", render: (p) => <span className="font-medium">{formatINR(p.amount)}</span> },
    { key: "reference", header: "Reference", render: (p) => <span className="font-mono text-[11px]">{p.referenceNumber}</span> },
    { key: "submitted", header: "Submitted", render: (p) => <span className="whitespace-nowrap text-xs text-ink/55">{formatDateTime(p.submittedAt)}</span> },
    { key: "status", header: "Status", render: (p) => <ProofStatusBadge status={p.status} /> },
    {
      key: "reviewer",
      header: "Reviewed",
      render: (p) =>
        p.reviewedAt ? (
          <span className="text-xs text-ink/55">
            {p.reviewedByName || "—"} · {formatDateTime(p.reviewedAt)}
          </span>
        ) : (
          "—"
        ),
    },
  ];

  if (error) return <ErrorState message={error.message} onRetry={reload} />;

  const reset = (setter) => (e) => {
    setPage(1);
    setter(e.target.value);
  };

  return (
    <Card padded={false}>
      <div className="flex flex-wrap items-center gap-3 border-b border-line-paper p-4">
        <SearchInput placeholder="Order #, email, reference or proof id…" value={q} onChange={reset(setQ)} className="w-72" />
        <Select value={status} onChange={reset(setStatus)} className="w-44">
          <option value="">All statuses</option>
          <option value="pending">Awaiting review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </Select>
        <Input type="date" value={from} onChange={reset(setFrom)} className="w-40" aria-label="Submitted from" />
        <Input type="date" value={to} onChange={reset(setTo)} className="w-40" aria-label="Submitted to" />
      </div>
      <DataTable
        columns={columns}
        rows={res?.data?.items}
        meta={res?.meta}
        loading={loading}
        onPageChange={setPage}
        onRowClick={(p) => router.push(`/payment-proofs/${p.proofId}`)}
        rowKey="proofId"
        emptyTitle={status === "pending" ? "Nothing waiting for review" : "No payment proofs match those filters"}
        emptyDescription="Customers paying by bank / UPI transfer upload their receipts here."
      />
    </Card>
  );
}
