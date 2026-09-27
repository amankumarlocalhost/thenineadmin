"use client";

import { useState } from "react";
import { usePageTitle } from "@/context/PageTitleContext";
import { useToast } from "@/context/ToastContext";
import { useFetch } from "@/lib/useFetch";
import { api, ApiClientError } from "@/lib/api";
import { formatINR } from "@/lib/format";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/EmptyState";

function Toggle({ checked, onChange, label }) {
  return (
    <label className="flex cursor-pointer items-center gap-3">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-stitch" />
      <span className="font-body text-sm text-ink">{label}</span>
    </label>
  );
}

// Business settings the storefront and checkout read live: shipping charges
// and the bank / UPI transfer details. The backend validates every field and
// is what actually prices orders — nothing here is duplicated in the shop.
export default function StoreSettingsPage() {
  usePageTitle("Store Settings");
  const { data, loading, error, reload } = useFetch(() => api.get("/settings/admin").then((r) => r.data.settings), []);
  if (error) return <ErrorState message={error.message} onRetry={reload} />;
  if (loading || !data) return <Skeleton className="h-96 w-full" />;
  return <SettingsForm initial={data} onSaved={reload} />;
}

function SettingsForm({ initial, onSaved }) {
  const toast = useToast();
  const [shipping, setShipping] = useState(initial.shipping);
  const [manual, setManual] = useState(initial.manualPayment);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const setShip = (field) => (e) => setShipping((s) => ({ ...s, [field]: e.target.value }));
  const setMan = (field) => (e) => setManual((m) => ({ ...m, [field]: e.target.value }));

  async function save() {
    setSaving(true);
    setErrors({});
    try {
      await api.patch("/settings/admin", {
        shipping: {
          chargeShipping: shipping.chargeShipping,
          freeShippingThreshold: Number(shipping.freeShippingThreshold),
          standardFee: Number(shipping.standardFee),
        },
        manualPayment: {
          enabled: manual.enabled,
          label: manual.label,
          upiId: manual.upiId,
          payeeName: manual.payeeName,
          bankName: manual.bankName,
          accountNumber: manual.accountNumber,
          ifsc: manual.ifsc,
          instructions: manual.instructions,
          holdHours: Number(manual.holdHours),
        },
      });
      toast.success("Settings saved");
      onSaved();
    } catch (err) {
      if (err instanceof ApiClientError && Array.isArray(err.details)) {
        setErrors(Object.fromEntries(err.details.map((d) => [d.path, d.message])));
      }
      toast.error(err instanceof ApiClientError ? err.message : "Could not save settings");
    } finally {
      setSaving(false);
    }
  }

  const threshold = Number(shipping.freeShippingThreshold) || 0;
  const fee = Number(shipping.standardFee) || 0;
  const summary = !shipping.chargeShipping
    ? "Every order ships free."
    : threshold > 0
      ? `Orders under ${formatINR(threshold)} pay ${formatINR(fee)} shipping; ${formatINR(threshold)} and above ship free.`
      : `Every order pays ${formatINR(fee)} shipping.`;

  return (
    <div className="flex max-w-3xl flex-col gap-5">
      <Card title="Shipping">
        <div className="flex flex-col gap-4">
          <Toggle
            checked={shipping.chargeShipping}
            onChange={(v) => setShipping((s) => ({ ...s, chargeShipping: v }))}
            label="Charge for shipping"
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Free shipping from (₹, 0 = never free)" error={errors["shipping.freeShippingThreshold"]}>
              <Input type="number" min={0} value={shipping.freeShippingThreshold} onChange={setShip("freeShippingThreshold")} disabled={!shipping.chargeShipping} />
            </Field>
            <Field label="Standard shipping fee (₹)" error={errors["shipping.standardFee"]}>
              <Input type="number" min={0} value={shipping.standardFee} onChange={setShip("standardFee")} disabled={!shipping.chargeShipping} />
            </Field>
          </div>
          <p className="rounded-lg bg-surface-sunken px-3 py-2 font-body text-xs text-ink/60">{summary} Applies to new orders.</p>
        </div>
      </Card>

      <Card title="Bank / UPI transfer">
        <div className="flex flex-col gap-4">
          <Toggle checked={manual.enabled} onChange={(v) => setManual((m) => ({ ...m, enabled: v }))} label="Offer bank / UPI transfer at checkout" />
          <p className="font-body text-xs text-ink/50">
            Customers pay you directly and upload a receipt; orders are confirmed once someone in Finance approves it under
            Payment Proofs. Needs a UPI id, or an account number and IFSC. These details are shown to shoppers.
          </p>
          <Field label="Name shown at checkout" error={errors["manualPayment.label"]}>
            <Input value={manual.label} onChange={setMan("label")} maxLength={60} />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="UPI id" error={errors["manualPayment.upiId"]}>
              <Input value={manual.upiId} onChange={setMan("upiId")} placeholder="store@bank" />
            </Field>
            <Field label="Account holder name" error={errors["manualPayment.payeeName"]}>
              <Input value={manual.payeeName} onChange={setMan("payeeName")} />
            </Field>
            <Field label="Bank name" error={errors["manualPayment.bankName"]}>
              <Input value={manual.bankName} onChange={setMan("bankName")} />
            </Field>
            <Field label="Account number" error={errors["manualPayment.accountNumber"]}>
              <Input value={manual.accountNumber} onChange={setMan("accountNumber")} inputMode="numeric" />
            </Field>
            <Field label="IFSC" error={errors["manualPayment.ifsc"]}>
              <Input value={manual.ifsc} onChange={setMan("ifsc")} className="uppercase" />
            </Field>
          </div>
          <Field
            label="Hold stock for unpaid transfers (hours, 0 = never cancel automatically)"
            error={errors["manualPayment.holdHours"]}
          >
            <Input type="number" min={0} max={720} value={manual.holdHours ?? 48} onChange={setMan("holdHours")} className="sm:w-48" />
          </Field>
          <p className="-mt-2 font-body text-xs text-ink/50">
            An order with no payment proof by then is cancelled and its items go back on sale. The clock restarts when a
            proof is rejected, and stops while one is waiting for review.
          </p>
          <Field label="Extra instructions (optional)" error={errors["manualPayment.instructions"]}>
            <Textarea value={manual.instructions} onChange={setMan("instructions")} placeholder="e.g. Use your order number as the payment note." />
          </Field>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={save} loading={saving}>
          Save settings
        </Button>
      </div>
    </div>
  );
}
