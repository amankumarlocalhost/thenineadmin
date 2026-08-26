export function formatINR(amount) {
  const n = Number(amount || 0);
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export function formatDate(value, opts = {}) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...opts,
  });
}

export function formatDateTime(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatRelative(value) {
  if (!value) return "—";
  const diffMs = Date.now() - new Date(value).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(value);
}

export function formatPercent(value, digits = 1) {
  return `${Number(value || 0).toFixed(digits)}%`;
}

// Last N days as { from, to } ISO strings — the vocabulary the date-range
// selector and every analytics endpoint share.
export function dateRangeFromPreset(preset) {
  const now = new Date();
  const to = now.toISOString();
  const start = new Date(now);

  switch (preset) {
    case "today":
      start.setHours(0, 0, 0, 0);
      break;
    case "yesterday": {
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setHours(23, 59, 59, 999);
      return { from: start.toISOString(), to: end.toISOString() };
    }
    case "7d":
      start.setDate(start.getDate() - 7);
      break;
    case "30d":
      start.setDate(start.getDate() - 30);
      break;
    case "thisMonth":
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      break;
    case "lastMonth": {
      const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const last = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      return { from: first.toISOString(), to: last.toISOString() };
    }
    default:
      start.setDate(start.getDate() - 30);
  }
  return { from: start.toISOString(), to };
}
