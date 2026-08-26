"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { usePageTitle } from "@/context/PageTitleContext";
import { useFetch } from "@/lib/useFetch";
import { api } from "@/lib/api";
import { formatINR } from "@/lib/format";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SearchInput, Select } from "@/components/ui/Field";
import { DataTable } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { ErrorState } from "@/components/ui/EmptyState";

export default function ProductsPage() {
  usePageTitle("Products");
  const router = useRouter();

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [stockFilter, setStockFilter] = useState("");
  const [page, setPage] = useState(1);

  const fetchProducts = useCallback(
    () => api.get("/products/admin", { q: q || undefined, status: statusFilter || undefined, stock: stockFilter || undefined, page, limit: 20 }),
    [q, statusFilter, stockFilter, page]
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
    { key: "categories", header: "Categories", render: (p) => <span className="text-xs text-ink/55">{p.categories.slice(0, 3).join(", ")}</span> },
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
