"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { usePageTitle } from "@/context/PageTitleContext";
import { useFetch } from "@/lib/useFetch";
import { api } from "@/lib/api";
import { formatINR } from "@/lib/format";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SearchInput, Select } from "@/components/ui/Field";
import { CategoryFilter } from "@/components/domain/CategoryFilter";
import { DataTable } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { ErrorState } from "@/components/ui/EmptyState";

export default function ProductsPage() {
  usePageTitle("Products");
  const router = useRouter();

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [stockFilter, setStockFilter] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);

  // Slug → "Parent › Child" label, so the Categories column reads like the
  // category tree instead of raw slugs.
  const fetchTree = useCallback(() => api.get("/categories/tree").then((r) => r.data.items), []);
  const { data: tree } = useFetch(fetchTree, [fetchTree]);
  const labelBySlug = useMemo(() => {
    const map = new Map();
    (tree || []).forEach((r) => {
      map.set(r.slug, r.label);
      r.children.forEach((c) => map.set(c.slug, `${r.label} › ${c.label}`));
    });
    return map;
  }, [tree]);

  // A product carries both a subcategory's slug and its parent's, so drop
  // the parent from display whenever one of its own children is also
  // present — the "Girl Dress › Small Top" badge already says "Girl Dress".
  const childSlugsByParent = useMemo(() => {
    const map = new Map();
    (tree || []).forEach((r) => map.set(r.slug, r.children.map((c) => c.slug)));
    return map;
  }, [tree]);
  const displayCategories = useCallback(
    (categories) => categories.filter((slug) => !(childSlugsByParent.get(slug) || []).some((c) => categories.includes(c))),
    [childSlugsByParent]
  );

  const fetchProducts = useCallback(
    () =>
      api.get("/products/admin", {
        q: q || undefined,
        status: statusFilter || undefined,
        stock: stockFilter || undefined,
        category: category || undefined,
        page,
        limit: 20,
      }),
    [q, statusFilter, stockFilter, category, page]
  );
  const { data: res, loading, error, reload } = useFetch(fetchProducts, [fetchProducts]);

  const columns = [
    {
      key: "product",
      header: "Product",
      render: (p) => (
        <div className="flex items-center gap-3">
          {p.images?.[0] && <img src={p.images[0]} alt="" className="h-11 w-9 shrink-0 rounded-md object-cover" />}
          <div className="min-w-0">
            <p className="truncate font-body text-sm text-ink">{p.name}</p>
            <p className="font-mono text-[11px] text-ink/40">{p.productId} · {p.slug}</p>
          </div>
        </div>
      ),
    },
    { key: "price", header: "Price", render: (p) => (
        <div>
          <span className="font-medium">{formatINR(p.price)}</span>
          {p.originalPrice && <span className="ml-1.5 text-xs text-ink/40 line-through">{formatINR(p.originalPrice)}</span>}
        </div>
      ) },
    { key: "stock", header: "Stock", render: (p) => (
        <span className={p.stock === 0 ? "text-danger" : p.stock <= 10 ? "text-warning" : "text-ink"}>{p.stock}</span>
      ) },
    {
      key: "categories",
      header: "Categories",
      render: (p) => (
        <div className="flex flex-wrap gap-1">
          {displayCategories(p.categories).length === 0 ? (
            <span className="text-xs text-ink/35">Unfiled</span>
          ) : (
            displayCategories(p.categories).map((slug) => (
              <Badge key={slug} tone="neutral">
                {labelBySlug.get(slug) || slug}
              </Badge>
            ))
          )}
        </div>
      ),
    },
    { key: "status", header: "Status", render: (p) => (
        <div className="flex flex-wrap gap-1.5">
          <Badge tone={p.isActive ? "success" : "neutral"}>{p.isActive ? "Active" : "Inactive"}</Badge>
          {!p.inStock && <Badge tone="danger">Out of stock</Badge>}
          {p.badge && <Badge tone="info">{p.badge}</Badge>}
        </div>
      ) },
  ];

  if (error) return <ErrorState message={error.message} onRetry={reload} />;

  return (
    <Card padded={false}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line-paper p-4">
        <div className="flex flex-wrap items-center gap-3">
          <SearchInput placeholder="Search name, slug, id…" value={q} onChange={(e) => { setPage(1); setQ(e.target.value); }} className="w-60" />
          <Select value={statusFilter} onChange={(e) => { setPage(1); setStatusFilter(e.target.value); }} className="w-36">
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
          <Select value={stockFilter} onChange={(e) => { setPage(1); setStockFilter(e.target.value); }} className="w-40">
            <option value="">All stock levels</option>
            <option value="low">Low stock</option>
            <option value="out">Out of stock</option>
          </Select>
          <CategoryFilter value={category} onChange={(v) => { setPage(1); setCategory(v); }} />
        </div>
        <Button onClick={() => router.push("/products/new")}>+ New Product</Button>
      </div>

      <DataTable
        columns={columns}
        rows={res?.data?.items}
        meta={res?.meta}
        loading={loading}
        onPageChange={setPage}
        onRowClick={(p) => router.push(`/products/${p._id}`)}
        emptyTitle="No products match those filters"
      />
    </Card>
  );
}
