"use client";

import { useCallback, useState } from "react";
import { usePageTitle } from "@/context/PageTitleContext";
import { useFetch } from "@/lib/useFetch";
import { api, ApiClientError } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { formatDateTime } from "@/lib/format";
import { Card } from "@/components/ui/Card";
import { Button, IconButton } from "@/components/ui/Button";
import { SearchInput, Select, Field, Input, Textarea } from "@/components/ui/Field";
import { DataTable } from "@/components/ui/DataTable";
import { Drawer, Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";

const REASON_LABELS = {
  order_placed: "Order sold",
  order_cancelled: "Order cancelled — restocked",
  order_returned: "Return — restocked",
  restock: "Manual restock",
  manual_adjustment: "Manual adjustment",
};

function stockStatus(product, threshold) {
  if (product.stock <= 0 || !product.inStock) return { label: "Out of Stock", tone: "danger" };
  if (product.stock <= threshold) return { label: "Low Stock", tone: "warning" };
  return { label: "In Stock", tone: "success" };
}

export default function InventoryPage() {
  usePageTitle("Inventory");
  const { show } = useToast();

  const [q, setQ] = useState("");
  const [stockFilter, setStockFilter] = useState("");
  const [page, setPage] = useState(1);
  const [historyProduct, setHistoryProduct] = useState(null);
  const [adjustTarget, setAdjustTarget] = useState(null); // { product, mode: "sell" | "restock" | "set" }

  const fetchProducts = useCallback(
    () => api.get("/products/admin", { q: q || undefined, stock: stockFilter || undefined, page, limit: 20 }),
    [q, stockFilter, page]
  );
  const { data: res, loading, error, reload } = useFetch(fetchProducts, [fetchProducts]);
  const threshold = 10;

  const columns = [
    {
      key: "product",
      header: "Product",
      render: (p) => (
        <div className="flex items-center gap-3">
          {p.images?.[0] && <img src={p.images[0]} alt="" className="h-10 w-8 shrink-0 rounded-md object-cover" />}
          <div>
            <p className="font-body text-sm text-ink">{p.name}</p>
            <p className="font-mono text-[11px] text-ink/40">{p.productId}</p>
          </div>
        </div>
      ),
    },
    {
      key: "stock",
      header: "Stock",
      render: (p) => <span className="font-mono text-sm text-ink">{p.stock} units</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (p) => {
        const status = stockStatus(p, threshold);
        return <Badge tone={status.tone}>{status.label}</Badge>;
      },
    },
    {
      key: "actions",
      header: "",
      render: (p) => (
        <div className="flex items-center justify-end gap-1.5">
          <IconButton title="Increase stock / restock" onClick={() => setAdjustTarget({ product: p, mode: "restock" })}>
            +
          </IconButton>
          <IconButton title="Sell offline / reduce stock" onClick={() => setAdjustTarget({ product: p, mode: "sell" })} disabled={p.stock <= 0}>
            −
          </IconButton>
          <button
            type="button"
            onClick={() => setAdjustTarget({ product: p, mode: "set" })}
            className="font-mono text-[11px] uppercase tracking-wide text-ink/50 hover:underline"
          >
            Set
          </button>
          <button
            type="button"
            onClick={() => setHistoryProduct(p)}
            className="font-mono text-[11px] uppercase tracking-wide text-stitch hover:underline"
          >
            History
          </button>
        </div>
      ),
    },
  ];

  if (error) return <ErrorState message={error.message} onRetry={reload} />;

  return (
    <div className="flex flex-col gap-5">
      <Card padded={false}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line-paper p-4">
          <div className="flex flex-wrap items-center gap-3">
            <SearchInput
              placeholder="Search name, slug, id…"
              value={q}
              onChange={(e) => {
                setPage(1);
                setQ(e.target.value);
              }}
              className="w-60"
            />
            <Select
              value={stockFilter}
              onChange={(e) => {
                setPage(1);
                setStockFilter(e.target.value);
              }}
              className="w-44"
            >
              <option value="">All stock levels</option>
              <option value="low">Low stock</option>
              <option value="out">Out of stock</option>
            </Select>
          </div>
          <p className="font-mono text-[11px] text-ink/45">Low stock threshold: {threshold} units</p>
        </div>

        <DataTable columns={columns} rows={res?.data?.items} meta={res?.meta} loading={loading} onPageChange={setPage} emptyTitle="No products match those filters" />
      </Card>

      <Drawer open={Boolean(historyProduct)} onClose={() => setHistoryProduct(null)} title={historyProduct?.name || "Stock History"}>
        {historyProduct && <InventoryHistory productId={historyProduct._id} />}
      </Drawer>

      <StockAdjustModal
        key={adjustTarget ? `${adjustTarget.product._id}-${adjustTarget.mode}` : "none"}
        target={adjustTarget}
        onClose={() => setAdjustTarget(null)}
        onDone={() => {
          setAdjustTarget(null);
          reload();
        }}
        showToast={show}
      />
    </div>
  );
}

function InventoryHistory({ productId }) {
  const fetchHistory = useCallback(() => api.get(`/admin/inventory/${productId}/history`).then((r) => r.data.items), [productId]);
  const { data: items, loading } = useFetch(fetchHistory, [fetchHistory]);

  if (loading) return <Skeleton className="h-40 w-full" />;
  if (!items?.length) return <EmptyState title="No stock movements recorded yet" />;

  return (
    <ol className="flex flex-col gap-4">
      {items.map((log) => (
        <li key={log._id} className="flex gap-3">
          <div className="flex flex-col items-center">
            <span className={`h-2 w-2 rounded-full ${log.change < 0 ? "bg-danger" : "bg-success"}`} />
          </div>
          <div>
            <p className="font-body text-sm text-ink">
              {REASON_LABELS[log.reason] || log.reason} {log.size && `· Size ${log.size}`}
            </p>
            <p className="font-mono text-xs text-ink/50">
              {log.change > 0 ? "+" : ""}
              {log.change} → balance {log.balanceAfter}
              {log.order?.orderNumber && ` · #${log.order.orderNumber}`}
              {log.note && ` · ${log.note}`}
            </p>
            <p className="font-mono text-[11px] text-ink/40">
              {formatDateTime(log.createdAt)}
              {log.actor?.name && ` · ${log.actor.name}`}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}

const MODE_COPY = {
  sell: { title: "Sell Offline / Reduce Stock", qtyLabel: "Quantity Sold Offline", reason: "manual_adjustment", sign: -1 },
  restock: { title: "Increase Stock", qtyLabel: "Quantity Received", reason: "restock", sign: 1 },
  set: { title: "Set Exact Stock", qtyLabel: "New Stock Count", reason: "manual_adjustment", sign: 0 },
};

function StockAdjustModal({ target, onClose, onDone, showToast }) {
  const [qty, setQty] = useState(() => (target?.mode === "set" ? String(target.product.stock) : "1"));
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  if (!target) return null;
  const { product, mode } = target;
  const copy = MODE_COPY[mode];
  const isSet = mode === "set";
  const parsedQty = Number(qty);
  const newStock = isSet ? parsedQty : Number.isFinite(parsedQty) ? product.stock + copy.sign * parsedQty : product.stock;

  async function handleSubmit() {
    if (!Number.isInteger(parsedQty) || parsedQty < (isSet ? 0 : 1)) {
      showToast(isSet ? "Enter a whole number of 0 or more" : "Enter a whole number greater than 0");
      return;
    }
    if (!isSet && copy.sign < 0 && parsedQty > product.stock) {
      showToast(`Only ${product.stock} in stock — can't reduce by ${parsedQty}`);
      return;
    }
    setSaving(true);
    try {
      await api.patch(`/products/${product._id}/stock`, {
        ...(isSet ? { stock: parsedQty } : { delta: copy.sign * parsedQty }),
        reason: copy.reason,
        note: note || (mode === "sell" ? "Offline sale" : undefined),
      });
      showToast(`${product.name}: stock updated to ${newStock}`);
      onDone();
    } catch (err) {
      showToast(err instanceof ApiClientError ? err.message : "Failed to update stock");
      setSaving(false);
    }
  }

  return (
    <Modal
      open={Boolean(target)}
      onClose={onClose}
      title={copy.title}
      width="max-w-sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant={mode === "sell" ? "danger" : "primary"} onClick={handleSubmit} loading={saving}>
            {mode === "sell" ? "Reduce Stock" : mode === "restock" ? "Add Stock" : "Update Stock"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div>
          <p className="font-body text-sm text-ink">{product.name}</p>
          <p className="font-mono text-xs text-ink/50">Current Stock: {product.stock}</p>
        </div>
        <Field label={copy.qtyLabel}>
          <Input type="number" min={isSet ? "0" : "1"} step="1" value={qty} onChange={(e) => setQty(e.target.value)} autoFocus />
        </Field>
        <Field label="Note (optional)">
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder={mode === "sell" ? "e.g. Sold in-store" : "e.g. New shipment received"} />
        </Field>
        <p className="font-mono text-xs text-ink/50">
          New Stock: <span className={newStock <= 0 ? "text-danger" : "text-ink"}>{Number.isFinite(newStock) ? Math.max(0, newStock) : product.stock}</span>
        </p>
      </div>
    </Modal>
  );
}
