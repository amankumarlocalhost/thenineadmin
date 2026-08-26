"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { usePageTitle } from "@/context/PageTitleContext";
import { useFetch } from "@/lib/useFetch";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { Card } from "@/components/ui/Card";
import { SearchInput, Select } from "@/components/ui/Field";
import { DataTable } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { ErrorState } from "@/components/ui/EmptyState";
import { AccountStatusBadge } from "@/components/domain/CustomerStatusBadge";

export default function CustomersPage() {
  usePageTitle("Customers");
  const router = useRouter();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const fetchCustomers = useCallback(
    () => api.get("/users", { role: "customer", q: q || undefined, status: status || undefined, page, limit: 20 }),
    [q, status, page]
  );
  const { data: res, loading, error, reload } = useFetch(fetchCustomers, [fetchCustomers]);

  const columns = [
    { key: "name", header: "Name", render: (u) => <span className="font-medium">{u.name}</span> },
    { key: "email", header: "Email" },
    { key: "phone", header: "Phone", render: (u) => u.phone || "—" },
    { key: "verified", header: "Verified", render: (u) => (
        <div className="flex gap-1.5">
          {u.isEmailVerified && <Badge tone="success">Email</Badge>}
          {u.isPhoneVerified && <Badge tone="success">Phone</Badge>}
          {!u.isEmailVerified && !u.isPhoneVerified && <Badge tone="neutral">Unverified</Badge>}
        </div>
      ) },
    { key: "status", header: "Status", render: (u) => <AccountStatusBadge status={u.status} /> },
    { key: "joined", header: "Joined", render: (u) => formatDate(u.createdAt) },
  ];

  if (error) return <ErrorState message={error.message} onRetry={reload} />;

  return (
    <Card padded={false}>
      <div className="flex items-center gap-3 border-b border-line-paper p-4">
        <SearchInput placeholder="Search name or email…" value={q} onChange={(e) => { setPage(1); setQ(e.target.value); }} className="w-72" />
        <Select value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }} className="w-48">
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="blocked">Blocked</option>
          <option value="deactivated">Deactivated</option>
        </Select>
      </div>
      <DataTable
        columns={columns}
        rows={res?.data?.items}
        meta={res?.meta}
        loading={loading}
        onPageChange={setPage}
        onRowClick={(u) => router.push(`/customers/${u.id}`)}
        emptyTitle="No customers found"
      />
    </Card>
  );
}
