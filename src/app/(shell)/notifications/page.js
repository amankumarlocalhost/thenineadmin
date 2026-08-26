"use client";

import { useCallback, useState } from "react";
import { usePageTitle } from "@/context/PageTitleContext";
import { useFetch } from "@/lib/useFetch";
import { api } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Field";
import { DataTable } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { ErrorState } from "@/components/ui/EmptyState";

const STATUS_TONE = { sent: "info", delivered: "success", failed: "danger", undelivered: "danger", skipped: "neutral" };

export default function NotificationsPage() {
  usePageTitle("Notifications");
  const [channel, setChannel] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const fetchLogs = useCallback(
    () => api.get("/admin/notifications", { channel: channel || undefined, status: status || undefined, page, limit: 30 }),
    [channel, status, page]
  );
  const { data: res, loading, error, reload } = useFetch(fetchLogs, [fetchLogs]);

  const columns = [
    { key: "channel", header: "Channel", render: (n) => <span className="uppercase text-xs">{n.channel}</span> },
    { key: "template", header: "Template", render: (n) => <span className="font-mono text-xs">{n.template}</span> },
    { key: "to", header: "To", render: (n) => n.to },
    { key: "subject", header: "Subject", render: (n) => n.subject || "—" },
    { key: "status", header: "Status", render: (n) => <Badge tone={STATUS_TONE[n.status] || "neutral"}>{n.status}</Badge> },
    { key: "error", header: "Error", render: (n) => (n.errorReason ? <span className="text-xs text-danger">{n.errorReason}</span> : "—") },
    { key: "date", header: "Sent", render: (n) => <span className="whitespace-nowrap text-xs text-ink/55">{formatDateTime(n.createdAt)}</span> },
  ];

  if (error) return <ErrorState message={error.message} onRetry={reload} />;

  return (
    <Card padded={false}>
      <div className="flex flex-wrap items-center gap-3 border-b border-line-paper p-4">
        <Select value={channel} onChange={(e) => { setPage(1); setChannel(e.target.value); }} className="w-36">
          <option value="">All channels</option>
          <option value="email">Email</option>
          <option value="sms">SMS</option>
        </Select>
        <Select value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }} className="w-40">
          <option value="">All statuses</option>
          {["sent", "delivered", "failed", "undelivered", "skipped"].map((s) => <option key={s} value={s}>{s}</option>)}
        </Select>
      </div>
      <DataTable columns={columns} rows={res?.data?.items} meta={res?.meta} loading={loading} onPageChange={setPage} emptyTitle="No notifications sent yet" />
    </Card>
  );
}
