"use client";

import { useCallback, useState } from "react";
import { usePageTitle } from "@/context/PageTitleContext";
import { useFetch } from "@/lib/useFetch";
import { api } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Field";
import { DataTable } from "@/components/ui/DataTable";
import { ErrorState } from "@/components/ui/EmptyState";

const ENTITY_TYPES = ["Product", "Order", "Coupon", "User", "HomepageContent"];

export default function ActivityLogsPage() {
  usePageTitle("Activity Logs");
  const [entityType, setEntityType] = useState("");
  const [page, setPage] = useState(1);

  const fetchLogs = useCallback(
    () => api.get("/admin/activity-logs", { entityType: entityType || undefined, page, limit: 40 }),
    [entityType, page]
  );
  const { data: res, loading, error, reload } = useFetch(fetchLogs, [fetchLogs]);

  const columns = [
    { key: "actor", header: "By", render: (l) => <span className="font-body text-sm">{l.actorName}</span> },
    { key: "action", header: "Action", render: (l) => <span className="font-mono text-xs text-stitch">{l.action}</span> },
    { key: "entity", header: "On", render: (l) => (
        <span className="text-sm text-ink/70">
          {l.entityType}
          {l.entityLabel && <span className="text-ink/45"> · {l.entityLabel}</span>}
        </span>
      ) },
    { key: "note", header: "Note", render: (l) => l.note || "—" },
    { key: "date", header: "When", render: (l) => <span className="whitespace-nowrap text-xs text-ink/55">{formatDateTime(l.createdAt)}</span> },
  ];

  if (error) return <ErrorState message={error.message} onRetry={reload} />;

  return (
    <Card padded={false}>
      <div className="flex flex-wrap items-center gap-3 border-b border-line-paper p-4">
        <Select value={entityType} onChange={(e) => { setPage(1); setEntityType(e.target.value); }} className="w-52">
          <option value="">All entity types</option>
          {ENTITY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </Select>
      </div>
      <DataTable columns={columns} rows={res?.data?.items} meta={res?.meta} loading={loading} onPageChange={setPage} emptyTitle="No activity recorded yet" />
    </Card>
  );
}
