"use client";

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { formatINR, formatDate } from "@/lib/format";

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-line-paper bg-surface px-3.5 py-2.5 shadow-lg">
      <p className="font-mono text-[10.5px] uppercase tracking-wide text-ink/45">{formatDate(label)}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="font-body text-sm font-medium text-ink">
          {p.name}: {p.dataKey === "revenue" ? formatINR(p.value) : p.value}
        </p>
      ))}
    </div>
  );
}

export function RevenueChart({ data, dataKey = "revenue", height = 280 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a67c52" stopOpacity={0.28} />
            <stop offset="100%" stopColor="#a67c52" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#ded7cb" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={(d) => formatDate(d, { year: undefined })}
          tick={{ fontSize: 11, fill: "#0b0b0d99" }}
          axisLine={{ stroke: "#ded7cb" }}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(v) => (dataKey === "revenue" ? `₹${Math.round(v / 1000)}k` : v)}
          tick={{ fontSize: 11, fill: "#0b0b0d99" }}
          axisLine={false}
          tickLine={false}
          width={48}
        />
        <Tooltip content={<ChartTooltip />} />
        <Area type="monotone" dataKey={dataKey} name={dataKey === "revenue" ? "Revenue" : "Orders"} stroke="#a67c52" strokeWidth={2} fill="url(#revenueFill)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
