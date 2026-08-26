"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { usePageTitle } from "@/context/PageTitleContext";
import { useFetch } from "@/lib/useFetch";
import { api, ApiClientError } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/Modal";
import { ErrorState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { ProductForm } from "@/components/domain/ProductForm";
import { MediaManager } from "@/components/domain/MediaManager";

export default function ProductEditClient({ id }) {
  const router = useRouter();
  const toast = useToast();

  const fetchOne = useCallback(() => api.get(`/products/admin/${id}`).then((r) => r.data.product), [id]);
  const { data: product, loading, error, reload } = useFetch(fetchOne, [fetchOne]);

  usePageTitle(product ? product.name : "Edit Product");

  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSubmit(payload) {
    setSaving(true);
    try {
      await api.patch(`/products/${id}`, payload);
      toast.success("Product updated");
      reload();
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Could not save product");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await api.delete(`/products/${id}`);
      toast.success("Product deactivated");
      router.push("/products");
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Could not deactivate product");
      setDeleting(false);
    }
  }

  if (error) return <ErrorState message={error.message} onRetry={reload} />;
  if (loading || !product) return <Skeleton className="h-96 w-full max-w-3xl" />;

  return (
    <div className="flex max-w-3xl flex-col gap-5">
      <Card title="Media">
        <MediaManager productId={id} media={product.media || []} onChange={() => reload()} />
      </Card>

      <ProductForm initial={product} onSubmit={handleSubmit} submitLabel="Save Changes" saving={saving} />

      <Card title="Danger Zone">
        <div className="flex items-center justify-between">
          <p className="font-body text-sm text-ink/60">Deactivating removes this product from the storefront while preserving its order history.</p>
          <Button variant="danger" onClick={() => setConfirmDelete(true)}>Deactivate Product</Button>
        </div>
      </Card>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        title="Deactivate this product?"
        description="It will be hidden from the storefront immediately. This can be reversed by re-activating it later."
        confirmLabel="Deactivate"
        danger
        loading={deleting}
      />
    </div>
  );
}
