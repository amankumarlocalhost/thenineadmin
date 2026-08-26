"use client";

import { useCallback, useState } from "react";
import { usePageTitle } from "@/context/PageTitleContext";
import { useFetch } from "@/lib/useFetch";
import { api, ApiClientError } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { formatINR, formatDate, formatDateTime } from "@/lib/format";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import { Modal, Drawer } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/ui/DataTable";
import { ErrorState, EmptyState } from "@/components/ui/EmptyState";
import { OrderStatusBadge } from "@/components/domain/StatusBadges";

const EMPTY = { code: "", description: "", type: "percentage", value: "", maxDiscount: "", minOrderValue: 0, expiresAt: "", usageLimit: "", usageLimitPerUser: 1 };

export default function CouponsPage() {
  usePageTitle("Coupons");
  const toast = useToast();
  const { data: coupons, loading, error, reload } = useFetch(() => api.get("/coupons").then((r) => r.data.items), []);

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [drawerCoupon, setDrawerCoupon] = useState(null);

  function openCreate() {
    setForm(EMPTY);
    setModalOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await api.post("/coupons", {
        code: form.code.trim().toUpperCase(),
        description: form.description,
        type: form.type,
        value: Number(form.value),
        maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : null,
        minOrderValue: Number(form.minOrderValue) || 0,
        expiresAt: form.expiresAt || null,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
        usageLimitPerUser: Number(form.usageLimitPerUser) || 1,
      });
      toast.success("Coupon created");
      setModalOpen(false);
      reload();
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Could not create coupon");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(coupon) {
    try {
      await api.patch(`/coupons/${coupon._id}`, { isActive: !coupon.isActive });
      toast.success(coupon.isActive ? "Coupon disabled" : "Coupon enabled");
      reload();
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Could not update coupon");
    }
  }

  const columns = [
    { key: "code", header: "Code", render: (c) => <span className="font-mono text-sm font-semibold text-stitch">{c.code}</span> },
    { key: "discount", header: "Discount", render: (c) => (c.type === "percentage" ? `${c.value}%` : formatINR(c.value)) },
    { key: "min", header: "Min Order", render: (c) => (c.minOrderValue ? formatINR(c.minOrderValue) : "—") },
    { key: "usage", header: "Used", render: (c) => `${c.usedCount}${c.usageLimit ? ` / ${c.usageLimit}` : ""}` },
    { key: "expires", header: "Expires", render: (c) => (c.expiresAt ? formatDate(c.expiresAt) : "Never") },
    { key: "status", header: "Status", render: (c) => <Badge tone={c.isActive ? "success" : "neutral"}>{c.isActive ? "Active" : "Disabled"}</Badge> },
    {
      key: "actions",
      header: "",
      render: (c) => (
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="secondary" onClick={() => setDrawerCoupon(c)}>Orders</Button>
          <Button size="sm" variant="ghost" onClick={() => handleToggle(c)}>{c.isActive ? "Disable" : "Enable"}</Button>
        </div>
      ),
    },
  ];

  if (error) return <ErrorState message={error.message} onRetry={reload} />;

  return (
    <>
      <Card padded={false} title="Coupons" action={<Button size="sm" onClick={openCreate}>+ New Coupon</Button>}>
        <DataTable columns={columns} rows={coupons} loading={loading} emptyTitle="No coupons yet" />
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="New Coupon"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>Create</Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Field label="Code"><Input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} placeholder="WELCOME10" /></Field>
          <Field label="Description (optional)"><Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Type">
              <Select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed Amount</option>
              </Select>
            </Field>
            <Field label={form.type === "percentage" ? "Value (%)" : "Value (₹)"}>
              <Input type="number" value={form.value} onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))} />
            </Field>
          </div>
          {form.type === "percentage" && (
            <Field label="Max Discount (₹, optional)"><Input type="number" value={form.maxDiscount} onChange={(e) => setForm((f) => ({ ...f, maxDiscount: e.target.value }))} /></Field>
          )}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Min Order Value (₹)"><Input type="number" value={form.minOrderValue} onChange={(e) => setForm((f) => ({ ...f, minOrderValue: e.target.value }))} /></Field>
            <Field label="Expires On (optional)"><Input type="date" value={form.expiresAt} onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Total Usage Limit (optional)"><Input type="number" value={form.usageLimit} onChange={(e) => setForm((f) => ({ ...f, usageLimit: e.target.value }))} /></Field>
            <Field label="Per-Customer Limit"><Input type="number" value={form.usageLimitPerUser} onChange={(e) => setForm((f) => ({ ...f, usageLimitPerUser: e.target.value }))} /></Field>
          </div>
        </div>
      </Modal>

      <Drawer open={Boolean(drawerCoupon)} onClose={() => setDrawerCoupon(null)} title={`Orders using ${drawerCoupon?.code || ""}`}>
        {drawerCoupon && <CouponOrders couponId={drawerCoupon._id} />}
      </Drawer>
    </>
  );
}

function CouponOrders({ couponId }) {
  const fetchOrders = useCallback(() => api.get(`/coupons/${couponId}/orders`).then((r) => r.data.orders), [couponId]);
  const { data: orders, loading } = useFetch(fetchOrders, [fetchOrders]);

  if (loading) return null;
  if (!orders?.length) return <EmptyState title="No orders have used this coupon yet" />;

  return (
    <ul className="flex flex-col divide-y divide-line-paper">
      {orders.map((o) => (
        <li key={o._id} className="flex items-center justify-between py-3 first:pt-0">
          <div>
            <p className="font-mono text-xs text-ink">#{o.orderNumber}</p>
            <p className="font-body text-xs text-ink/45">{o.userEmail} · {formatDateTime(o.createdAt)}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-body text-sm font-medium text-ink">{formatINR(o.total)}</span>
            <OrderStatusBadge status={o.orderStatus} />
          </div>
        </li>
      ))}
    </ul>
  );
}
