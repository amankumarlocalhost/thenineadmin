"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { usePageTitle } from "@/context/PageTitleContext";
import { useToast } from "@/context/ToastContext";
import { useFetch } from "@/lib/useFetch";
import { api } from "@/lib/api";
import { formatINR, formatDateTime } from "@/lib/format";
import { Card } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { SearchInput, Select, Field, Textarea, Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ErrorState } from "@/components/ui/EmptyState";
import { RefundStatusBadge } from "@/components/domain/CustomerStatusBadge";

// Where each state can go next. Encoded here so the UI can't offer a
// transition the backend would reject — `completed` and `rejected` are
// terminal.
const NEXT_STATUSES = {
  requested: ["under_review", "approved", "rejected"],
  under_review: ["approved", "rejected"],
  approved: ["processing", "completed", "rejected"],
  processing: ["completed", "failed"],
  failed: ["processing", "rejected"],
  completed: [],
  rejected: [],
};

const STATUS_LABELS = {
  under_review: "Move to review",
  approved: "Approve",
  rejected: "Reject",
  processing: "Mark processing",
  completed: "Mark completed",
  failed: "Mark failed",
};

export default function RefundsPage() {
  usePageTitle("Returns & Refunds");
  const { show } = useToast();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [active, setActive] = useState(null);

  const fetchRefunds = useCallback(
    () => api.get("/refunds/admin/all", { q: q || undefined, status: status || undefined, page, limit: 20 }),
    [q, status, page]
  );
  const { data: res, loading, error, reload } = useFetch(fetchRefunds, [fetchRefunds]);

  const columns = [
    { key: "refundId", header: "Refund", render: (r) => <span className="font-mono text-xs">{r.refundId}</span> },
    {
      key: "order",
      header: "Order",
      render: (r) => (
        <Link href={`/orders/${r.orderNumber}`} className="font-mono text-xs hover:text-stitch">
          #{r.orderNumber}
        </Link>
      ),
    },
    { key: "customer", header: "Customer", render: (r) => r.userEmail },
    { key: "amount", header: "Amount", render: (r) => formatINR(r.amount) },
    { key: "reason", header: "Reason", render: (r) => <span className="text-xs text-ink/60">{r.reason}</span> },
    { key: "status", header: "Status", render: (r) => <RefundStatusBadge status={r.status} /> },
    {
      key: "requested",
      header: "Requested",
      render: (r) => (
        <span className="whitespace-nowrap text-xs text-ink/55">{formatDateTime(r.requestedAt || r.createdAt)}</span>
      ),
    },
  ];

  if (error) return <ErrorState message={error.message} onRetry={reload} />;

  return (
    <>
      <Card padded={false}>
        <div className="flex flex-wrap items-center gap-3 border-b border-line-paper p-4">
          <SearchInput
            placeholder="Search refund id, order or email…"
            value={q}
            onChange={(e) => {
              setPage(1);
              setQ(e.target.value);
            }}
            className="w-72"
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
            <option value="requested">Requested</option>
            <option value="under_review">Under review</option>
            <option value="approved">Approved</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
            <option value="failed">Failed</option>
          </Select>
        </div>
        <DataTable
          columns={columns}
          rows={res?.data?.items}
          meta={res?.meta}
          loading={loading}
          onPageChange={setPage}
          onRowClick={(r) => setActive(r)}
          rowKey="refundId"
          emptyTitle="No refunds"
          emptyDescription="Refunds requested by customers, or recorded against an order, appear here."
        />
      </Card>

      <RefundModal
        refund={active}
        onClose={() => setActive(null)}
        onDone={async (message) => {
          show(message);
          setActive(null);
          await reload();
        }}
      />
    </>
  );
}

function RefundModal({ refund, onClose, onDone }) {
  const [next, setNext] = useState("");
  const [reason, setReason] = useState("");
  const [gatewayRefundId, setGatewayRefundId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!refund) return null;
  const options = NEXT_STATUSES[refund.status] || [];

  async function submit() {
    setError("");
    if (!next) {
      setError("Pick what happens to this refund.");
      return;
    }
    setSaving(true);
    try {
      const res = await api.patch(`/refunds/admin/${refund.refundId}`, {
        status: next,
        reason: reason || undefined,
        gatewayRefundId: gatewayRefundId || undefined,
      });
      setNext("");
      setReason("");
      setGatewayRefundId("");
      onDone(res.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={Boolean(refund)}
      onClose={onClose}
      title={`Refund ${refund.refundId}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          {options.length > 0 && (
            <Button variant={next === "rejected" ? "danger" : "primary"} onClick={submit} loading={saving}>
              Apply
            </Button>
          )}
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <dl className="grid grid-cols-2 gap-3 font-body text-sm">
          <div>
            <dt className="text-ink/45">Order</dt>
            <dd className="font-mono text-xs text-ink">#{refund.orderNumber}</dd>
          </div>
          <div>
            <dt className="text-ink/45">Amount</dt>
            <dd className="text-ink">{formatINR(refund.amount)}</dd>
          </div>
          <div>
            <dt className="text-ink/45">Customer</dt>
            <dd className="text-ink">{refund.userEmail}</dd>
          </div>
          <div>
            <dt className="text-ink/45">Status</dt>
            <dd>
              <RefundStatusBadge status={refund.status} />
            </dd>
          </div>
          <div className="col-span-2">
            <dt className="text-ink/45">Reason given</dt>
            <dd className="text-ink">{refund.reason}</dd>
          </div>
        </dl>

        {refund.statusHistory?.length > 0 && (
          <div className="rounded-lg border border-line-paper p-3">
            <p className="mb-2 font-mono text-[10.5px] uppercase tracking-wide text-ink/45">History</p>
            <ul className="flex flex-col gap-1.5">
              {refund.statusHistory.map((h, i) => (
                <li key={i} className="font-body text-xs text-ink/65">
                  <span className="font-medium text-ink">{h.status}</span> — {h.byName} · {formatDateTime(h.at)}
                  {h.reason ? ` · ${h.reason}` : ""}
                </li>
              ))}
            </ul>
          </div>
        )}

        {options.length === 0 ? (
          <p className="rounded-lg bg-line-paper/40 px-3 py-2 font-body text-xs text-ink/60">
            This refund is {refund.status} and can&apos;t be changed further.
          </p>
        ) : (
          <>
            <Field label="Next status">
              <Select value={next} onChange={(e) => setNext(e.target.value)}>
                <option value="">Choose…</option>
                {options.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </Select>
            </Field>

            {next === "completed" && (
              <Field label="Razorpay refund id">
                <Input
                  value={gatewayRefundId}
                  onChange={(e) => setGatewayRefundId(e.target.value)}
                  placeholder="rfnd_..."
                />
              </Field>
            )}

            <Field label="Note" error={error}>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Recorded against your admin account"
              />
            </Field>

            {next === "completed" && (
              <p className="rounded-lg bg-warning-bg px-3 py-2 font-body text-xs text-warning">
                Marking this completed updates the order and payment totals. Push the money back on the Razorpay
                dashboard first — this records the refund, it doesn&apos;t move it.
              </p>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
