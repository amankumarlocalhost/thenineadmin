import { Badge } from "@/components/ui/Badge";
import { orderStatusTone, paymentStatusTone } from "@/lib/constants";

export function OrderStatusBadge({ status }) {
  return <Badge tone={orderStatusTone(status)}>{status}</Badge>;
}

export function PaymentStatusBadge({ status }) {
  return <Badge tone={paymentStatusTone(status)}>{status}</Badge>;
}

const PROOF_TONES = { pending: "warning", approved: "success", rejected: "danger" };
const PROOF_LABELS = { pending: "Awaiting review", approved: "Approved", rejected: "Rejected" };

export function ProofStatusBadge({ status }) {
  return <Badge tone={PROOF_TONES[status] || "neutral"}>{PROOF_LABELS[status] || status}</Badge>;
}
