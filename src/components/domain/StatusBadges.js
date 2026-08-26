import { Badge } from "@/components/ui/Badge";
import { orderStatusTone, paymentStatusTone } from "@/lib/constants";

export function OrderStatusBadge({ status }) {
  return <Badge tone={orderStatusTone(status)}>{status}</Badge>;
}

export function PaymentStatusBadge({ status }) {
  return <Badge tone={paymentStatusTone(status)}>{status}</Badge>;
}
