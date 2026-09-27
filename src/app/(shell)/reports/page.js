"use client";

import { useCallback, useState } from "react";
import { usePageTitle } from "@/context/PageTitleContext";
import { useToast } from "@/context/ToastContext";
import { useFetch } from "@/lib/useFetch";
import { api } from "@/lib/api";
import { formatINR, formatDate, formatDateTime, dateRangeFromPreset } from "@/lib/format";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Field, Input } from "@/components/ui/Field";
import { DataTable } from "@/components/ui/DataTable";
import { ErrorState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";

const RUN_TONE = { sent: "success", sending: "warning", failed: "danger", skipped: "neutral" };

// Ranges the backend doesn't hand us, built in the browser's own time zone.
const QUICK_RANGES = [
  { value: "30d", label: "Last 30 days" },
  { value: "thisMonth", label: "This month" },
  { value: "lastMonth", label: "Last month" },
];

const localDay = (d) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
};

// The API's Content-Disposition header isn't readable cross-origin, so the
// file is named here instead.
async function downloadReport({ from, to }) {
  const blob = await api.getBlob("/reports/payments/pdf", { from: new Date(from).toISOString(), to: new Date(to).toISOString() });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `payments-report_${localDay(from)}_to_${localDay(to)}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  usePageTitle("Payment Reports");
  const toast = useToast();

  const fetchRuns = useCallback(() => api.get("/reports/payments/runs").then((r) => r.data), []);
  const { data, loading, error, reload } = useFetch(fetchRuns, [fetchRuns]);

  const [busy, setBusy] = useState(null); // which button is working
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  async function download(key, range) {
    setBusy(key);
    try {
      await downloadReport(range);
    } catch (err) {
      toast.error(err.message || "Could not build the report.");
    } finally {
      setBusy(null);
    }
  }

  function downloadCustom() {
    if (!customFrom || !customTo) return toast.error("Pick both a start and an end date.");
    const from = new Date(`${customFrom}T00:00:00`);
    const to = new Date(`${customTo}T00:00:00`);
    to.setDate(to.getDate() + 1); // the end date is included in full
    if (from >= to) return toast.error("The start date must be on or before the end date.");
    download("custom", { from, to });
  }

  async function resend(run) {
    setBusy(`resend-${run._id}`);
    try {
      const res = await api.post(`/reports/payments/runs/${run._id}/resend`);
      if (res.data.run.status === "sent") toast.success("Report emailed again.");
      else toast.error(res.message);
      reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(null);
    }
  }

  if (error) return <ErrorState message={error.message} onRetry={reload} />;

  const columns = [
    {
      key: "week",
      header: "Week",
      render: (r) => (
        <span className="whitespace-nowrap">
          {formatDate(r.periodStart, { year: undefined })} – {formatDate(r.periodEnd)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Email",
      render: (r) => (
        <div className="flex flex-col gap-1">
          <Badge tone={RUN_TONE[r.status]}>{r.status}</Badge>
          {r.error && <span className="max-w-[220px] font-body text-[11px] leading-snug text-danger">{r.error}</span>}
        </div>
      ),
    },
    { key: "sentAt", header: "Sent", render: (r) => <span className="whitespace-nowrap text-xs text-ink/55">{r.sentAt ? formatDateTime(r.sentAt) : "—"}</span> },
    { key: "to", header: "To", render: (r) => <span className="text-xs text-ink/60">{r.recipients?.length ? r.recipients.join(", ") : "—"}</span> },
    { key: "collected", header: "Collected", render: (r) => (r.summary ? formatINR(r.summary.collected) : "—") },
    { key: "refunded", header: "Refunded", render: (r) => (r.summary ? formatINR(r.summary.refunded) : "—") },
    { key: "net", header: "Net", render: (r) => <span className="font-medium">{r.summary ? formatINR(r.summary.net) : "—"}</span> },
    {
      key: "attention",
      header: "Needed attention",
      render: (r) => (r.summary ? <span className={r.summary.attentionCount ? "font-medium text-danger" : "text-ink/50"}>{r.summary.attentionCount}</span> : "—"),
    },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="secondary" loading={busy === `pdf-${r._id}`} disabled={Boolean(busy)} onClick={() => download(`pdf-${r._id}`, { from: r.periodStart, to: r.periodEnd })}>
            PDF
          </Button>
          <Button size="sm" variant="ghost" loading={busy === `resend-${r._id}`} disabled={Boolean(busy) || r.status === "sending"} onClick={() => resend(r)}>
            Email again
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <Card title="Download a report">
        <p className="font-body text-sm text-ink/60">
          A PDF of every payment, refund and bank-transfer proof in the range, with the customer&apos;s name, phone and email on each line, plus
          everything still waiting on you. It&apos;s built from live data, so a refund approved today shows as approved.
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-2.5">
          <Button loading={busy === "lastWeek"} disabled={!data || Boolean(busy)} onClick={() => download("lastWeek", data.lastWeek)}>
            Last week
          </Button>
          <Button variant="secondary" loading={busy === "thisWeek"} disabled={!data || Boolean(busy)} onClick={() => download("thisWeek", { from: data.thisWeek.from, to: new Date() })}>
            This week so far
          </Button>
          {QUICK_RANGES.map((r) => (
            <Button key={r.value} variant="secondary" loading={busy === r.value} disabled={Boolean(busy)} onClick={() => download(r.value, dateRangeFromPreset(r.value))}>
              {r.label}
            </Button>
          ))}
        </div>
        {data && (
          <p className="mt-2 font-mono text-[11px] text-ink/45">
            A week runs Sunday 9 pm to Sunday 9 pm. Last week = {formatDateTime(data.lastWeek.from)} – {formatDateTime(data.lastWeek.to)}
          </p>
        )}

        <div className="mt-6 flex flex-wrap items-end gap-3 border-t border-line-paper pt-5">
          <Field label="From">
            <Input type="date" value={customFrom} max={customTo || undefined} onChange={(e) => setCustomFrom(e.target.value)} className="w-44" />
          </Field>
          <Field label="To (included)">
            <Input type="date" value={customTo} min={customFrom || undefined} onChange={(e) => setCustomTo(e.target.value)} className="w-44" />
          </Field>
          <Button variant="secondary" loading={busy === "custom"} disabled={Boolean(busy)} onClick={downloadCustom}>
            Download custom range
          </Button>
        </div>
      </Card>

      <Card title="Weekly email">
        {loading || !data ? (
          <Skeleton className="h-12 w-full" />
        ) : (
          <div className="grid gap-4 font-body text-sm text-ink/70 md:grid-cols-2">
            <div>
              <p className="font-mono text-[10.5px] uppercase tracking-[0.08em] text-ink/45">Next report</p>
              <p className="mt-1.5 font-serif text-lg text-ink">{formatDateTime(data.nextSendAt)}</p>
              <p className="mt-1 text-xs text-ink/50">Every Sunday at 9 pm, with the PDF attached. If the server was asleep at 9 pm, it goes out as soon as it wakes.</p>
            </div>
            <div>
              <p className="font-mono text-[10.5px] uppercase tracking-[0.08em] text-ink/45">Sent to</p>
              <p className="mt-1.5 text-sm text-ink">
                {data.recipientsConfigured ? "The addresses in REPORT_RECIPIENTS" : "Every active super admin, admin and finance manager"}
              </p>
              <p className="mt-1 text-xs text-ink/50">
                {data.recipientsConfigured
                  ? "Change REPORT_RECIPIENTS on the server to add or remove someone."
                  : "To send it somewhere specific instead, set REPORT_RECIPIENTS on the server (comma-separated emails)."}
              </p>
            </div>
          </div>
        )}
      </Card>

      <Card title="Sent reports" padded={false}>
        <DataTable
          columns={columns}
          rows={data?.runs}
          rowKey="_id"
          loading={loading}
          emptyTitle="No weekly report has gone out yet"
          emptyDescription={data ? `The first one is sent on ${formatDateTime(data.nextSendAt)}.` : undefined}
        />
      </Card>
    </div>
  );
}
