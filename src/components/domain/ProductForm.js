"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { CategoryPicker } from "@/components/domain/CategoryPicker";

function toCsv(arr) {
  return (arr || []).join(", ");
}
function fromCsv(str) {
  return str.split(",").map((s) => s.trim()).filter(Boolean);
}

const EMPTY = {
  name: "",
  slug: "",
  description: "",
  categories: [],
  price: "",
  originalPrice: "",
  sizes: "",
  tone: "#6d1930",
  tint: "#f3e2d3",
  colorName: "",
  isFeatured: false,
  isActive: true,
  inStock: true,
};

export function ProductForm({ initial, onSubmit, submitLabel = "Save", saving }) {
  const [form, setForm] = useState(() => ({
    ...EMPTY,
    ...(initial
      ? {
          ...initial,
          categories: initial.categories || [],
          sizes: toCsv(initial.sizes),
          price: initial.price,
          originalPrice: initial.originalPrice ?? "",
        }
      : {}),
  }));
  const [variants, setVariants] = useState(() => {
    const sizeList = initial?.sizes || [];
    const existing = new Map((initial?.variants || []).map((v) => [v.size, v.stock]));
    return sizeList.map((size) => ({ size, stock: existing.get(size) ?? 0 }));
  });

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function syncVariantsFromSizes(sizesCsv) {
    const sizeList = fromCsv(sizesCsv);
    setVariants((current) => {
      const existing = new Map(current.map((v) => [v.size, v.stock]));
      return sizeList.map((size) => ({ size, stock: existing.get(size) ?? 0 }));
    });
  }

  function updateVariantStock(size, stock) {
    setVariants((current) => current.map((v) => (v.size === size ? { ...v, stock: Number(stock) || 0 } : v)));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const totalStock = variants.reduce((sum, v) => sum + v.stock, 0);
    onSubmit({
      name: form.name.trim(),
      slug: form.slug.trim().toLowerCase().replace(/\s+/g, "-"),
      description: form.description,
      categories: form.categories,
      price: Number(form.price),
      originalPrice: form.originalPrice ? Number(form.originalPrice) : null,
      sizes: fromCsv(form.sizes),
      variants: variants.map((v) => ({ size: v.size, color: form.colorName || null, stock: v.stock })),
      stock: totalStock || Number(form.price ? 0 : 0),
      tone: form.tone,
      tint: form.tint,
      colorName: form.colorName || null,
      isFeatured: form.isFeatured,
      isActive: form.isActive,
      inStock: variants.length ? totalStock > 0 : form.inStock,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <Card title="Basics">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Name" className="sm:col-span-2">
            <Input required value={form.name} onChange={(e) => update("name", e.target.value)} />
          </Field>
          <Field label="Slug" className="sm:col-span-2">
            <Input required value={form.slug} onChange={(e) => update("slug", e.target.value)} placeholder="floral-print-wrap-dress" />
          </Field>
          <Field label="Description" className="sm:col-span-2">
            <Textarea rows={4} value={form.description} onChange={(e) => update("description", e.target.value)} />
          </Field>
        </div>
      </Card>

      <Card title="Categories">
        <CategoryPicker value={form.categories} onChange={(next) => update("categories", next)} />
      </Card>

      <Card title="Pricing & Stock">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Price (₹)">
            <Input required type="number" min={0} value={form.price} onChange={(e) => update("price", e.target.value)} />
          </Field>
          <Field label="Original / Sale-from Price (₹, optional)">
            <Input type="number" min={0} value={form.originalPrice} onChange={(e) => update("originalPrice", e.target.value)} />
          </Field>
          <Field label="Sizes (comma-separated)" className="sm:col-span-2">
            <Input
              value={form.sizes}
              onChange={(e) => {
                update("sizes", e.target.value);
                syncVariantsFromSizes(e.target.value);
              }}
              placeholder="XS, S, M, L, XL"
            />
          </Field>
        </div>

        {variants.length > 0 && (
          <div className="mt-4 border-t border-line-paper pt-4">
            <p className="mb-2 font-mono text-[10.5px] uppercase tracking-wide text-ink/45">Stock by size</p>
            <div className="flex flex-wrap gap-3">
              {variants.map((v) => (
                <label key={v.size} className="flex items-center gap-2 rounded-lg border border-line-paper px-3 py-2">
                  <span className="font-mono text-xs text-ink/60">{v.size}</span>
                  <input
                    type="number"
                    min={0}
                    value={v.stock}
                    onChange={(e) => updateVariantStock(v.size, e.target.value)}
                    className="w-16 border-0 bg-transparent p-0 text-right font-body text-sm text-ink outline-none"
                  />
                </label>
              ))}
            </div>
          </div>
        )}
      </Card>

      <Card title="Appearance">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Color Name">
            <Input value={form.colorName} onChange={(e) => update("colorName", e.target.value)} placeholder="Maroon" />
          </Field>
          <Field label="Tone (hex)">
            <Input value={form.tone} onChange={(e) => update("tone", e.target.value)} />
          </Field>
          <Field label="Tint (hex)">
            <Input value={form.tint} onChange={(e) => update("tint", e.target.value)} />
          </Field>
        </div>
      </Card>

      <Card title="Visibility">
        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 font-body text-sm text-ink">
            <input type="checkbox" checked={form.isActive} onChange={(e) => update("isActive", e.target.checked)} className="h-4 w-4 accent-stitch" />
            Active (visible on storefront)
          </label>
          <label className="flex items-center gap-2 font-body text-sm text-ink">
            <input type="checkbox" checked={form.isFeatured} onChange={(e) => update("isFeatured", e.target.checked)} className="h-4 w-4 accent-stitch" />
            Featured
          </label>
        </div>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="submit" loading={saving}>{submitLabel}</Button>
      </div>
    </form>
  );
}
