"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { usePageTitle } from "@/context/PageTitleContext";
import { api, ApiClientError } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { ProductForm } from "@/components/domain/ProductForm";

export default function NewProductPage() {
  usePageTitle("New Product");
  const router = useRouter();
  const toast = useToast();
  const [saving, setSaving] = useState(false);

  async function handleSubmit(payload) {
    setSaving(true);
    try {
      const res = await api.post("/products", payload);
      toast.success("Product created — now add photos");
      router.push(`/products/${res.data.product._id}`);
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Could not create product");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <ProductForm onSubmit={handleSubmit} submitLabel="Create Product" saving={saving} />
    </div>
  );
}
