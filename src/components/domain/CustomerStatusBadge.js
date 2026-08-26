import { Badge } from "@/components/ui/Badge";

const STATUS_TONES = {
  active: "success",
  suspended: "warning",
  blocked: "danger",
  deactivated: "neutral",
};

export function AccountStatusBadge({ status }) {
  return <Badge tone={STATUS_TONES[status] || "neutral"}>{status}</Badge>;
}

const REDEMPTION_TONES = {
  used: "success",
  reserved: "warning",
  released: "neutral",
};

export function RedemptionStatusBadge({ status }) {
  return <Badge tone={REDEMPTION_TONES[status] || "neutral"}>{status}</Badge>;
}

const PAYMENT_LEDGER_TONES = {
  successful: "success",
  processing: "info",
  pending: "warning",
  created: "neutral",
  failed: "danger",
  cancelled: "neutral",
  partially_refunded: "warning",
  refunded: "info",
};

export function LedgerStatusBadge({ status }) {
  return <Badge tone={PAYMENT_LEDGER_TONES[status] || "neutral"}>{String(status).replace(/_/g, " ")}</Badge>;
}

const REFUND_TONES = {
  requested: "warning",
  under_review: "warning",
  approved: "info",
  processing: "info",
  completed: "success",
  rejected: "danger",
  failed: "danger",
};

export function RefundStatusBadge({ status }) {
  return <Badge tone={REFUND_TONES[status] || "neutral"}>{String(status).replace(/_/g, " ")}</Badge>;
}

const ATTEMPT_TONES = {
  captured: "success",
  authorized: "info",
  created: "neutral",
  failed: "danger",
  refunded: "warning",
};

export function AttemptStatusBadge({ status }) {
  return <Badge tone={ATTEMPT_TONES[status] || "neutral"}>{status}</Badge>;
}
