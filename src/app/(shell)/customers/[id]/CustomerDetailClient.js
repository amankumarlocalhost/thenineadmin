"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { usePageTitle } from "@/context/PageTitleContext";
import { useToast } from "@/context/ToastContext";
import { useFetch } from "@/lib/useFetch";
import { api } from "@/lib/api";
import { formatINR, formatDate, formatDateTime } from "@/lib/format";
import { Card, KpiCard } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState, EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Field, Select, Textarea } from "@/components/ui/Field";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/domain/StatusBadges";
import {
  AccountStatusBadge,
  AttemptStatusBadge,
  LedgerStatusBadge,
  RedemptionStatusBadge,
  RefundStatusBadge,
} from "@/components/domain/CustomerStatusBadge";
import { CustomerTimeline } from "@/components/domain/CustomerTimeline";

const TABS = [
  "Timeline",
  "Orders",
  "Payments",
  "Refunds",
  "Coupons",
  "Addresses",
  "Login Activity",
  "Account History",
];

const STATUS_OPTIONS = [
  { value: "active", label: "Active — normal account" },
  { value: "suspended", label: "Suspended — temporary restriction" },
  { value: "blocked", label: "Blocked — cannot sign in or order" },
  { value: "deactivated", label: "Deactivated — account closed" },
];

export default function CustomerDetailClient({ id }) {
  const { show } = useToast();
  const fetchCustomer = useCallback(() => api.get(`/users/${id}`).then((r) => r.data), [id]);
  const { data, loading, error, reload } = useFetch(fetchCustomer, [fetchCustomer]);

  const fetchTimeline = useCallback(() => api.get(`/users/${id}/timeline`).then((r) => r.data.events), [id]);
  const { data: events, reload: reloadTimeline } = useFetch(fetchTimeline, [fetchTimeline]);

  const [tab, setTab] = useState("Timeline");
  const [statusOpen, setStatusOpen] = useState(false);

  usePageTitle(data ? data.user.name : "Customer");

  if (error) return <ErrorState message={error.message} onRetry={reload} />;
  if (loading || !data) return <Skeleton className="h-96 w-full" />;

  const { user, stats, orders, payments, attempts, refunds, redemptions, logins, statusHistory } = data;

  return (
    <div className="flex flex-col gap-5">
      {/* Identity header — who this is and whether they're in good standing. */}
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="font-body text-lg font-semibold text-ink">{user.name}</h2>
              <AccountStatusBadge status={user.status} />
            </div>
            <p className="mt-1 font-body text-sm text-ink/55">
              {user.email}
              {user.phone ? ` · ${user.phone}` : ""}
            </p>
            <p className="mt-1 font-mono text-[10.5px] uppercase tracking-wide text-ink/40">
              ID {user.id} · joined {formatDate(user.createdAt)} · {stats.accountAgeDays}d old · last seen{" "}
              {user.lastLoginAt ? formatDateTime(user.lastLoginAt) : "never"}
            </p>
            {user.status !== "active" && user.statusReason && (
              <p className="mt-2 rounded-lg bg-warning-bg px-3 py-2 font-body text-xs text-warning">
                {user.statusReason}
              </p>
            )}
          </div>
          <Button variant="secondary" onClick={() => setStatusOpen(true)}>
            Change account status
          </Button>
        </div>
      </Card>

      {/* Commerce summary. Net spent is what the business actually kept —
          gross minus completed refunds — so a heavy returner doesn't read as a
          high-value customer. */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-7">
        <KpiCard label="Orders" value={stats.totalOrders} sub={`${stats.completedOrders} delivered`} />
        <KpiCard label="Cancelled" value={stats.cancelledOrders} />
        <KpiCard label="Gross Spent" value={formatINR(stats.grossSpent)} />
        <KpiCard label="Refunded" value={formatINR(stats.totalRefunded)} />
        <KpiCard label="Net Spent" value={formatINR(stats.netSpent)} />
        <KpiCard label="Avg Order" value={formatINR(stats.averageOrderValue)} />
        <KpiCard
          label="Failed Payments"
          value={stats.failedPayments}
          tone={stats.failedPayments > 2 ? "danger" : "default"}
        />
      </div>

      <div className="flex flex-wrap gap-1.5 border-b border-line-paper">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`relative px-3 pb-2.5 pt-1 font-body text-xs font-medium transition-colors ${
              tab === t ? "text-ink" : "text-ink/45 hover:text-ink/70"
            }`}
          >
            {t}
            {tab === t && <span className="absolute -bottom-px left-0 h-[2px] w-full bg-ink" aria-hidden="true" />}
          </button>
        ))}
      </div>

      {tab === "Timeline" && (
        <Card title="Activity Timeline">
          <CustomerTimeline events={events} />
        </Card>
      )}

      {tab === "Orders" && (
        <Card title={`Orders (${orders.length})`} padded={false}>
          {orders.length === 0 ? (
            <EmptyState title="No orders yet" />
          ) : (
            <ul className="flex flex-col divide-y divide-line-paper">
              {orders.map((order) => (
                <li key={order._id}>
                  <Link
                    href={`/orders/${order.orderNumber}`}
                    className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 hover:bg-surface-sunken"
                  >
                    <div>
                      <p className="font-mono text-xs text-ink">#{order.orderNumber}</p>
                      <p className="font-body text-xs text-ink/45">
                        {formatDateTime(order.createdAt)} · {order.items.length} items
                        {order.couponCode ? ` · ${order.couponCode}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="font-body text-sm font-medium text-ink">{formatINR(order.total)}</span>
                      <PaymentStatusBadge status={order.paymentStatus} />
                      <OrderStatusBadge status={order.orderStatus} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {tab === "Payments" && (
        <div className="flex flex-col gap-5">
          <Card title={`Payments (${payments.length})`} padded={false}>
            {payments.length === 0 ? (
              <EmptyState title="No payments recorded" />
            ) : (
              <ul className="flex flex-col divide-y divide-line-paper">
                {payments.map((p) => (
                  <li key={p._id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
                    <div>
                      <p className="font-mono text-xs text-ink">{p.paymentId}</p>
                      <p className="font-body text-xs text-ink/45">
                        <Link href={`/orders/${p.orderNumber}`} className="hover:text-ink">
                          #{p.orderNumber}
                        </Link>{" "}
                        · {p.provider} · {p.method}
                        {p.gatewayOrderId ? ` · ${p.gatewayOrderId}` : ""}
                      </p>
                      {p.failureReason && <p className="mt-0.5 font-body text-xs text-danger">{p.failureReason}</p>}
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="font-body text-sm font-medium text-ink">{formatINR(p.amount)}</span>
                      {p.amountRefunded > 0 && (
                        <span className="font-body text-xs text-warning">−{formatINR(p.amountRefunded)}</span>
                      )}
                      <LedgerStatusBadge status={p.status} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Every try, not just the one that worked. Failed attempts are kept
              deliberately — they're the evidence in a "money left my account"
              conversation. */}
          <Card title={`Payment Attempts (${attempts.length})`} padded={false}>
            {attempts.length === 0 ? (
              <EmptyState title="No gateway attempts" description="COD orders never reach the payment gateway." />
            ) : (
              <ul className="flex flex-col divide-y divide-line-paper">
                {attempts.map((a) => (
                  <li key={a._id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
                    <div>
                      <p className="font-mono text-xs text-ink">
                        #{a.attemptNumber} · {a.gatewayPaymentId || "—"}
                      </p>
                      <p className="font-body text-xs text-ink/45">
                        {a.orderNumber} · {a.method || "—"}
                        {a.vpa ? ` · ${a.vpa}` : ""} · {formatDateTime(a.gatewayCreatedAt || a.createdAt)}
                      </p>
                      {a.errorDescription && (
                        <p className="mt-0.5 font-body text-xs text-danger">
                          {a.errorDescription}
                          {a.errorStep ? ` (${a.errorStep})` : ""}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="font-body text-sm text-ink">{formatINR(a.amount)}</span>
                      <AttemptStatusBadge status={a.status} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}

      {tab === "Refunds" && (
        <Card title={`Refunds (${refunds.length})`} padded={false}>
          {refunds.length === 0 ? (
            <EmptyState title="No refunds" />
          ) : (
            <ul className="flex flex-col divide-y divide-line-paper">
              {refunds.map((r) => (
                <li key={r._id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
                  <div>
                    <p className="font-mono text-xs text-ink">{r.refundId}</p>
                    <p className="font-body text-xs text-ink/45">
                      <Link href={`/orders/${r.orderNumber}`} className="hover:text-ink">
                        #{r.orderNumber}
                      </Link>{" "}
                      · {r.reason}
                    </p>
                    <p className="mt-0.5 font-body text-xs text-ink/40">
                      requested {formatDateTime(r.requestedAt)}
                      {r.processedAt ? ` · settled ${formatDateTime(r.processedAt)}` : ""}
                      {r.gatewayRefundId ? ` · ${r.gatewayRefundId}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="font-body text-sm font-medium text-ink">{formatINR(r.amount)}</span>
                    <RefundStatusBadge status={r.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {tab === "Coupons" && (
        <Card title={`Coupon Redemptions (${redemptions.length})`} padded={false}>
          {redemptions.length === 0 ? (
            <EmptyState title="No coupons used" />
          ) : (
            <ul className="flex flex-col divide-y divide-line-paper">
              {redemptions.map((r) => (
                <li key={r._id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
                  <div>
                    <p className="font-mono text-xs text-ink">{r.code}</p>
                    <p className="font-body text-xs text-ink/45">
                      <Link href={`/orders/${r.orderNumber}`} className="hover:text-ink">
                        #{r.orderNumber}
                      </Link>{" "}
                      · reserved {formatDateTime(r.reservedAt)}
                      {r.usedAt ? ` · used ${formatDateTime(r.usedAt)}` : ""}
                    </p>
                    {r.releaseReason && (
                      <p className="mt-0.5 font-body text-xs text-ink/40">returned — {r.releaseReason}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="font-body text-sm font-medium text-ink">−{formatINR(r.discountAmount)}</span>
                    <RedemptionStatusBadge status={r.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {tab === "Addresses" && (
        <Card title={`Saved Addresses (${user.addresses?.length || 0})`}>
          {!user.addresses?.length ? (
            <EmptyState title="No saved addresses" />
          ) : (
            <ul className="flex flex-col gap-3">
              {user.addresses.map((a) => (
                <li key={a._id} className="rounded-lg border border-line-paper p-3.5">
                  <p className="font-body text-sm text-ink">
                    {a.label && <span className="font-medium">{a.label} · </span>}
                    {a.line1}
                    {a.line2 ? `, ${a.line2}` : ""}, {a.city}, {a.state} — {a.pincode}
                  </p>
                  {a.phone && <p className="mt-0.5 font-body text-xs text-ink/45">{a.phone}</p>}
                  {a.isDefault && (
                    <p className="mt-1 font-mono text-[10px] uppercase tracking-wide text-ink/40">Default</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {tab === "Login Activity" && (
        <Card title={`Login Activity (${logins.length})`} padded={false}>
          {logins.length === 0 ? (
            <EmptyState title="No sign-ins recorded" />
          ) : (
            <ul className="flex flex-col divide-y divide-line-paper">
              {logins.map((l) => (
                <li key={l._id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="font-body text-sm text-ink">
                      {l.success ? "Signed in" : "Failed sign-in"}
                      <span className="ml-2 font-mono text-[10.5px] uppercase tracking-wide text-ink/40">
                        {l.surface}
                      </span>
                    </p>
                    <p className="truncate font-body text-xs text-ink/45">
                      {l.ip || "unknown ip"}
                      {l.reason ? ` · ${l.reason}` : ""}
                      {l.userAgent ? ` · ${l.userAgent.slice(0, 60)}` : ""}
                    </p>
                  </div>
                  <time className="shrink-0 font-mono text-[10.5px] uppercase tracking-wide text-ink/40">
                    {formatDateTime(l.createdAt)}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {tab === "Account History" && (
        <Card title={`Account Status History (${statusHistory.length})`} padded={false}>
          {statusHistory.length === 0 ? (
            <EmptyState title="No status changes" description="This account has been active since it was created." />
          ) : (
            <ul className="flex flex-col divide-y divide-line-paper">
              {statusHistory.map((h) => (
                <li key={h._id} className="px-5 py-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-body text-sm text-ink">
                      {h.oldStatus} → <span className="font-medium">{h.newStatus}</span>
                    </p>
                    <time className="font-mono text-[10.5px] uppercase tracking-wide text-ink/40">
                      {formatDateTime(h.createdAt)}
                    </time>
                  </div>
                  <p className="mt-1 font-body text-xs text-ink/55">{h.reason}</p>
                  <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wide text-ink/40">
                    by {h.changedByName}
                    {h.ip ? ` · ${h.ip}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      <StatusModal
        open={statusOpen}
        onClose={() => setStatusOpen(false)}
        user={user}
        onChanged={async (message) => {
          show(message);
          setStatusOpen(false);
          await Promise.all([reload(), reloadTimeline()]);
        }}
      />
    </div>
  );
}

function StatusModal({ open, onClose, user, onChanged }) {
  const [status, setStatus] = useState(user.status === "active" ? "suspended" : "active");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    setError("");
    if (!reason.trim()) {
      setError("A reason is required — it's recorded against your admin account.");
      return;
    }
    setSaving(true);
    try {
      const res = await api.patch(`/users/${user.id}/status`, { status, reason });
      setReason("");
      onChanged(res.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Change account status"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant={status === "blocked" ? "danger" : "primary"} onClick={submit} loading={saving}>
            Apply
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <p className="font-body text-xs text-ink/55">
          The account is never deleted — only its status changes, and the full order, payment and refund history stays
          intact.
        </p>

        <Field label="New status">
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUS_OPTIONS.filter((o) => o.value !== user.status).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Reason" error={error}>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Multiple suspicious payment attempts"
          />
        </Field>

        {status !== "active" && (
          <p className="rounded-lg bg-warning-bg px-3 py-2 font-body text-xs text-warning">
            This signs the customer out everywhere and blocks new orders until the account is set back to active.
          </p>
        )}
      </div>
    </Modal>
  );
}
