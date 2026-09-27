"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePageTitle } from "@/context/PageTitleContext";
import { useToast } from "@/context/ToastContext";
import { useFetch } from "@/lib/useFetch";
import { api, ApiClientError } from "@/lib/api";
import { formatINR, formatDateTime } from "@/lib/format";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Field, Textarea } from "@/components/ui/Field";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/EmptyState";
import { OrderStatusBadge, PaymentStatusBadge, ProofStatusBadge } from "@/components/domain/StatusBadges";

/**
 * The receipt itself. Fetched through the authenticated API as a blob — the
 * file is a private asset with no public URL, and only this one proof's file
 * is loaded, when its page is opened.
 */
function ProofFile({ proofId, mimeType }) {
  const [url, setUrl] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let objectUrl = null;
    let cancelled = false;
    api
      .getBlob(`/payment-proofs/admin/${proofId}/file`)
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch((err) => !cancelled && setError(err.message || "Couldn't load the file"));
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [proofId]);

  if (error) return <p className="font-body text-sm text-danger">{error}</p>;
  if (!url) return <Skeleton className="h-96 w-full" />;

  const isPdf = mimeType === "application/pdf";
  return (
    <div className="flex flex-col gap-3">
      {isPdf ? (
        <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-line-paper font-body text-sm text-ink/55">
          PDF receipt
        </div>
      ) : (
        <a href={url} target="_blank" rel="noopener noreferrer" title="Open full size">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="Customer's payment receipt" className="max-h-[70vh] w-full cursor-zoom-in rounded-xl border border-line-paper object-contain" />
        </a>
      )}
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="self-start font-body text-xs font-semibold uppercase tracking-[0.08em] text-stitch hover:underline"
      >
        Open {isPdf ? "PDF" : "full size"} in a new tab ↗
      </a>
    </div>
  );
}

function Row({ label, children }) {
  return (
    <div className="flex justify-between gap-3 py-1.5">
      <dt className="font-body text-xs text-ink/50">{label}</dt>
      <dd className="text-right font-body text-sm text-ink">{children}</dd>
    </div>
  );
}

export default function ProofDetailClient({ proofId }) {
  usePageTitle(`Payment Proof ${proofId}`);
  const toast = useToast();
  const fetchDetail = useCallback(() => api.get(`/payment-proofs/admin/${proofId}`).then((r) => r.data), [proofId]);
  const { data, loading, error, reload } = useFetch(fetchDetail, [fetchDetail]);

  const [action, setAction] = useState(null); // "approve" | "reject" | null
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  if (error) return <ErrorState message={error.message} onRetry={reload} />;
  if (loading || !data) {
    return (
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_380px]">
        <Skeleton className="h-96 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const { proof, order, customer, history, reusedReference } = data;
  const amountMatches = order && Math.abs(order.total - proof.amount) < 0.01;

  function open(kind) {
    setAction(kind);
    setText("");
    setFormError("");
  }

  async function submit() {
    setFormError("");
    if (action === "reject" && text.trim().length < 5) {
      setFormError("Tell the customer why — they'll see this.");
      return;
    }
    setSaving(true);
    try {
      const res =
        action === "approve"
          ? await api.post(`/payment-proofs/admin/${proofId}/approve`, { note: text.trim() || undefined })
          : await api.post(`/payment-proofs/admin/${proofId}/reject`, { reason: text.trim() });
      toast.success(res.message);
      setAction(null);
      reload();
    } catch (err) {
      setFormError(err instanceof ApiClientError ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <ProofStatusBadge status={proof.status} />
          <span className="font-mono text-xs text-ink/45">Submitted {formatDateTime(proof.submittedAt)}</span>
        </div>
        {proof.status === "pending" && (
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => open("reject")}>
              Reject
            </Button>
            <Button onClick={() => open("approve")}>Approve payment</Button>
          </div>
        )}
      </div>

      {reusedReference?.length > 0 && (
        <p className="rounded-lg bg-danger-bg px-4 py-3 font-body text-sm text-danger">
          This transaction reference was also submitted on{" "}
          {reusedReference.map((r, i) => (
            <span key={r.proofId}>
              {i > 0 && ", "}
              <Link href={`/payment-proofs/${r.proofId}`} className="font-mono underline">
                #{r.orderNumber}
              </Link>{" "}
              ({r.status})
            </span>
          ))}
          . One payment can only pay for one order.
        </p>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_380px]">
        <Card title="Receipt">
          <ProofFile proofId={proof.proofId} mimeType={proof.file?.mimeType} />
        </Card>

        <div className="flex flex-col gap-5">
          <Card title="Payment">
            <dl className="divide-y divide-line-paper">
              <Row label="Expected amount">
                <span className="font-semibold">{formatINR(proof.amount)}</span>
              </Row>
              {order && !amountMatches && (
                <Row label="Order total now">
                  <span className="text-danger">{formatINR(order.total)}</span>
                </Row>
              )}
              <Row label="Reference (UTR)">
                <span className="font-mono">{proof.referenceNumber}</span>
              </Row>
              <Row label="Method">Bank / UPI transfer</Row>
              {proof.customerNote && <Row label="Customer note">{proof.customerNote}</Row>}
              {proof.reviewedAt && (
                <Row label="Reviewed">
                  {proof.reviewedByName || "—"} · {formatDateTime(proof.reviewedAt)}
                </Row>
              )}
              {proof.rejectionReason && <Row label="Rejection reason">{proof.rejectionReason}</Row>}
              {proof.adminNote && <Row label="Reviewer note">{proof.adminNote}</Row>}
            </dl>
            <p className="mt-3 font-body text-xs text-ink/50">
              Approve only once {formatINR(proof.amount)} with this reference is visible in the store&apos;s bank or UPI
              account — the receipt alone isn&apos;t proof the money arrived.
            </p>
          </Card>

          {order && (
            <Card title="Order" action={<Link href={`/orders/${order.orderNumber}`} className="font-body text-xs text-stitch hover:underline">Open order →</Link>}>
              <dl className="divide-y divide-line-paper">
                <Row label="Order">
                  <span className="font-mono">#{order.orderNumber}</span>
                </Row>
                <Row label="Status">
                  <OrderStatusBadge status={order.orderStatus} />
                </Row>
                <Row label="Payment">
                  <PaymentStatusBadge status={order.paymentStatus} />
                </Row>
                <Row label="Items">{order.items?.length ?? 0}</Row>
                <Row label="Placed">{formatDateTime(order.createdAt)}</Row>
              </dl>
            </Card>
          )}

          {customer && (
            <Card
              title="Customer"
              action={<Link href={`/customers/${proof.user}`} className="font-body text-xs text-stitch hover:underline">Open customer →</Link>}
            >
              <dl className="divide-y divide-line-paper">
                <Row label="Name">{customer.name}</Row>
                <Row label="Email">{customer.email}</Row>
                {customer.phone && <Row label="Phone">{customer.phone}</Row>}
                <Row label="Account">{customer.status}</Row>
              </dl>
            </Card>
          )}

          {history?.length > 1 && (
            <Card title="All proofs on this order">
              <ul className="flex flex-col gap-2">
                {history.map((h) => (
                  <li key={h.proofId} className="flex items-center justify-between gap-3">
                    <Link href={`/payment-proofs/${h.proofId}`} className={`font-mono text-xs ${h.proofId === proof.proofId ? "font-semibold text-ink" : "text-ink/60 hover:text-stitch"}`}>
                      {h.proofId}
                    </Link>
                    <span className="font-mono text-[11px] text-ink/45">{formatDateTime(h.submittedAt)}</span>
                    <ProofStatusBadge status={h.status} />
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>

      <Modal
        open={Boolean(action)}
        onClose={() => setAction(null)}
        title={action === "approve" ? "Approve this payment?" : "Reject this payment proof"}
        footer={
          <>
            <Button variant="ghost" onClick={() => setAction(null)}>
              Cancel
            </Button>
            <Button variant={action === "reject" ? "danger" : "primary"} onClick={submit} loading={saving}>
              {action === "approve" ? `Confirm ${formatINR(proof.amount)} received` : "Reject proof"}
            </Button>
          </>
        }
      >
        {action === "approve" ? (
          <div className="flex flex-col gap-4">
            <p className="font-body text-sm text-ink/70">
              Order #{proof.orderNumber} will be marked paid and confirmed, and the customer will be told. This can&apos;t be
              undone from here.
            </p>
            <Field label="Note (optional, internal)" error={formError}>
              <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g. Matched in HDFC statement" />
            </Field>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <p className="font-body text-sm text-ink/70">
              The order stays reserved and the customer can upload a new proof. They&apos;ll receive this reason by email.
            </p>
            <Field label="Reason (sent to the customer)" error={formError}>
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="e.g. The amount on the receipt doesn't match the order total."
              />
            </Field>
          </div>
        )}
      </Modal>
    </div>
  );
}
