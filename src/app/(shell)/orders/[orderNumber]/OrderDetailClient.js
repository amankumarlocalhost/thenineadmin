"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { usePageTitle } from "@/context/PageTitleContext";
import { useFetch } from "@/lib/useFetch";
import { api, ApiClientError } from "@/lib/api";
import { formatINR, formatDateTime } from "@/lib/format";
import { ORDER_STATUSES } from "@/lib/constants";
import { useToast } from "@/context/ToastContext";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select, Textarea, Input, Field } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { ErrorState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/domain/StatusBadges";

const NON_CANCELLABLE = new Set(["Shipped", "In Transit", "Out for Delivery", "Delivered", "Cancelled", "Returned", "Refunded"]);

export default function OrderDetailClient({ orderNumber }) {
  usePageTitle(`Order #${orderNumber}`);
  const toast = useToast();

  const fetchOrder = useCallback(() => api.get(`/orders/admin/${orderNumber}`).then((r) => r.data.order), [orderNumber]);
  const { data: order, loading, error, reload } = useFetch(fetchOrder, [fetchOrder]);

  const fetchAttempts = useCallback(
    () => (order?.paymentMethod !== "cod" ? api.get(`/payments/admin/${orderNumber}/attempts`).then((r) => r.data.attempts) : Promise.resolve([])),
    [orderNumber, order?.paymentMethod]
  );
  const { data: attempts } = useFetch(fetchAttempts, [fetchAttempts, Boolean(order)]);

  const [statusModal, setStatusModal] = useState(false);
  const [refundModal, setRefundModal] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  if (error) return <ErrorState message={error.message} onRetry={reload} />;
  if (loading || !order) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  async function handleAddNote() {
    if (!noteText.trim()) return;
    setSavingNote(true);
    try {
      await api.post(`/orders/admin/${orderNumber}/notes`, { note: noteText.trim() });
      setNoteText("");
      toast.success("Note added");
      reload();
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Could not add note");
    } finally {
      setSavingNote(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <OrderStatusBadge status={order.orderStatus} />
          <PaymentStatusBadge status={order.paymentStatus} />
          <span className="font-mono text-xs text-ink/45">Placed {formatDateTime(order.createdAt)}</span>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setStatusModal(true)}>
            Update Status
          </Button>
          {order.paymentStatus === "Paid" || order.paymentStatus === "Partially Refunded" ? (
            <Button variant="danger" onClick={() => setRefundModal(true)}>
              Process Refund
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-5">
          <Card title="Items">
            <ul className="flex flex-col divide-y divide-line-paper">
              {order.items.map((item, i) => (
                <li key={i} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  {item.image && <img src={item.image} alt="" className="h-14 w-12 shrink-0 rounded-lg object-cover" />}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-body text-sm text-ink">{item.name}</p>
                    <p className="font-mono text-[11px] text-ink/45">
                      {item.size && `Size ${item.size} · `}Qty {item.qty} · {formatINR(item.price)} each
                    </p>
                  </div>
                  <p className="shrink-0 font-body text-sm font-medium text-ink">{formatINR(item.price * item.qty)}</p>
                </li>
              ))}
            </ul>
            <div className="mt-4 space-y-1.5 border-t border-line-paper pt-4 font-body text-sm">
              <Row label="Subtotal" value={formatINR(order.subtotal)} />
              <Row label="Shipping" value={order.shipping === 0 ? "Free" : formatINR(order.shipping)} />
              {order.discount > 0 && <Row label={`Discount${order.couponCode ? ` (${order.couponCode})` : ""}`} value={`-${formatINR(order.discount)}`} />}
              {order.refundAmount > 0 && <Row label="Refunded" value={`-${formatINR(order.refundAmount)}`} />}
              <Row label="Total" value={formatINR(order.total)} strong />
            </div>
          </Card>

          <Card title="Order Timeline">
            <ol className="flex flex-col gap-4">
              {order.statusHistory.map((h, i) => (
                <li key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span className="h-2 w-2 rounded-full bg-stitch" />
                    {i < order.statusHistory.length - 1 && <span className="mt-1 w-px flex-1 bg-line-paper" />}
                  </div>
                  <div className="pb-1">
                    <p className="font-body text-sm text-ink">{h.status}</p>
                    {h.note && <p className="font-body text-xs text-ink/50">{h.note}</p>}
                    <p className="font-mono text-[11px] text-ink/40">{formatDateTime(h.at)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Card>

          <Card title="Payment Transaction History">
            {order.paymentMethod === "cod" ? (
              <p className="font-body text-sm text-ink/50">Cash on Delivery — no online payment gateway transaction.</p>
            ) : !attempts ? (
              <Skeleton className="h-16 w-full" />
            ) : attempts.length === 0 ? (
              <p className="font-body text-sm text-ink/50">No payment attempts recorded by Razorpay yet.</p>
            ) : (
              <ul className="flex flex-col divide-y divide-line-paper">
                {attempts.map((a) => (
                  <li key={a.cf_payment_id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <div>
                      <p className="font-mono text-xs text-ink">{a.cf_payment_id}</p>
                      <p className="font-body text-xs text-ink/45">
                        {a.payment_method ? Object.keys(a.payment_method)[0] : "—"} · {formatDateTime(a.payment_time)}
                      </p>
                      {a.payment_message && <p className="font-body text-xs text-danger">{a.payment_message}</p>}
                    </div>
                    <div className="text-right">
                      <p className="font-body text-sm font-medium text-ink">{formatINR(a.payment_amount)}</p>
                      <span className={`font-mono text-[10.5px] uppercase ${a.payment_status === "SUCCESS" ? "text-success" : "text-danger"}`}>
                        {a.payment_status}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Internal Notes">
            <div className="flex flex-col gap-2.5">
              <Textarea placeholder="Add a note visible only to staff…" value={noteText} onChange={(e) => setNoteText(e.target.value)} />
              <Button variant="secondary" size="sm" className="self-end" onClick={handleAddNote} loading={savingNote}>
                Add Note
              </Button>
            </div>
            {order.adminNotes?.length > 0 && (
              <ul className="mt-4 flex flex-col gap-3 border-t border-line-paper pt-4">
                {[...order.adminNotes].reverse().map((n, i) => (
                  <li key={i} className="font-body text-sm">
                    <p className="text-ink">{n.note}</p>
                    <p className="font-mono text-[11px] text-ink/40">{n.authorName} · {formatDateTime(n.at)}</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="flex flex-col gap-5">
          <Card title="Customer">
            <p className="font-body text-sm text-ink">{order.shippingInfo.name}</p>
            <p className="font-body text-sm text-ink/60">{order.shippingInfo.email}</p>
            <p className="font-body text-sm text-ink/60">{order.shippingInfo.phone}</p>
            {order.user?._id && (
              <Link href={`/customers/${order.user._id}`} className="mt-2 inline-block font-mono text-[11px] uppercase tracking-wide text-stitch hover:underline">
                View customer profile →
              </Link>
            )}
          </Card>

          <Card title="Shipping Address">
            <p className="font-body text-sm text-ink/75">
              {order.shippingInfo.address}, {order.shippingInfo.city}, {order.shippingInfo.state} — {order.shippingInfo.pincode}
            </p>
          </Card>

          <Card title="Shipping & Tracking">
            <dl className="flex flex-col gap-2 font-body text-sm">
              <div className="flex justify-between"><dt className="text-ink/50">Carrier</dt><dd className="text-ink">{order.trackingCarrier || "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-ink/50">Tracking #</dt><dd className="font-mono text-xs text-ink">{order.trackingNumber || "—"}</dd></div>
              {order.trackingUrl && (
                <a href={order.trackingUrl} target="_blank" rel="noreferrer" className="font-mono text-[11px] uppercase tracking-wide text-stitch hover:underline">
                  Track shipment →
                </a>
              )}
            </dl>
          </Card>

          <Card title="Payment">
            <dl className="flex flex-col gap-2 font-body text-sm">
              <div className="flex justify-between"><dt className="text-ink/50">Method</dt><dd className="uppercase text-ink">{order.paymentMethod}</dd></div>
              <div className="flex justify-between"><dt className="text-ink/50">Provider</dt><dd className="text-ink">{order.paymentProvider || "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-ink/50">Gateway Order Id</dt><dd className="font-mono text-xs text-ink">{order.paymentGatewayOrderId || "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-ink/50">Reference Id</dt><dd className="font-mono text-xs text-ink">{order.paymentGatewayReferenceId || "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-ink/50">Paid At</dt><dd className="text-ink">{formatDateTime(order.paidAt)}</dd></div>
              {order.refundStatus !== "None" && (
                <>
                  <div className="flex justify-between"><dt className="text-ink/50">Refund Status</dt><dd className="text-danger">{order.refundStatus}</dd></div>
                  <div className="flex justify-between"><dt className="text-ink/50">Refund Amount</dt><dd className="text-ink">{formatINR(order.refundAmount)}</dd></div>
                </>
              )}
            </dl>
          </Card>
        </div>
      </div>

      <StatusUpdateModal open={statusModal} onClose={() => setStatusModal(false)} order={order} onSaved={reload} />
      <RefundModal open={refundModal} onClose={() => setRefundModal(false)} order={order} onSaved={reload} />
    </div>
  );
}

function Row({ label, value, strong }) {
  return (
    <div className={`flex justify-between ${strong ? "border-t border-line-paper pt-2 font-semibold text-ink" : "text-ink/65"}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function StatusUpdateModal({ open, onClose, order, onSaved }) {
  const toast = useToast();
  const [status, setStatus] = useState(order.orderStatus);
  const [note, setNote] = useState("");
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber || "");
  const [trackingCarrier, setTrackingCarrier] = useState(order.trackingCarrier || "");
  const [trackingUrl, setTrackingUrl] = useState(order.trackingUrl || "");
  const [saving, setSaving] = useState(false);
  const cancellable = !NON_CANCELLABLE.has(order.orderStatus);

  async function save() {
    setSaving(true);
    try {
      await api.patch(`/orders/admin/${order.orderNumber}/status`, {
        status,
        note: note || undefined,
        trackingNumber: trackingNumber || undefined,
        trackingCarrier: trackingCarrier || undefined,
        trackingUrl: trackingUrl || undefined,
      });
      toast.success("Order status updated");
      onClose();
      onSaved();
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Could not update status");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Update Order Status"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={save} loading={saving} disabled={status === "Cancelled" && !cancellable}>Save</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Field label="Status">
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
        </Field>
        <Field label="Note (optional, appears in the order timeline)">
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Tracking Number" className="col-span-2">
            <Input value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} />
          </Field>
          <Field label="Carrier">
            <Input value={trackingCarrier} onChange={(e) => setTrackingCarrier(e.target.value)} placeholder="e.g. Delhivery" />
          </Field>
          <Field label="Tracking URL">
            <Input value={trackingUrl} onChange={(e) => setTrackingUrl(e.target.value)} />
          </Field>
        </div>
      </div>
    </Modal>
  );
}

function RefundModal({ open, onClose, order, onSaved }) {
  const toast = useToast();
  const maxRefundable = order.total - (order.refundAmount || 0);
  const [amount, setAmount] = useState(maxRefundable);
  const [reason, setReason] = useState("");
  const [gatewayReferenceId, setGatewayReferenceId] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!reason.trim()) return toast.error("A refund reason is required");
    setSaving(true);
    try {
      await api.post(`/orders/admin/${order.orderNumber}/refund`, {
        amount: Number(amount),
        reason: reason.trim(),
        gatewayReferenceId: gatewayReferenceId || undefined,
      });
      toast.success("Refund recorded");
      onClose();
      onSaved();
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Could not process refund");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Process Refund"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="danger" onClick={save} loading={saving}>Record Refund</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <p className="rounded-lg bg-warning-bg px-3 py-2.5 font-body text-xs text-warning">
          This records a refund already processed on the Razorpay dashboard (or your payment processor). It does not itself
          move money.
        </p>
        <Field label={`Amount (max ${formatINR(maxRefundable)})`}>
          <Input type="number" min={0} max={maxRefundable} value={amount} onChange={(e) => setAmount(e.target.value)} />
        </Field>
        <Field label="Reason">
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Customer returned item, damaged in transit…" />
        </Field>
        <Field label="Gateway Reference Id (optional)">
          <Input value={gatewayReferenceId} onChange={(e) => setGatewayReferenceId(e.target.value)} placeholder="Razorpay refund id (rfnd_...)" />
        </Field>
      </div>
    </Modal>
  );
}
