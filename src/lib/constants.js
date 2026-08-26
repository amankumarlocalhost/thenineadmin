export const ORDER_STATUSES = [
  "Pending",
  "Payment Pending",
  "Payment Failed",
  "Confirmed",
  "Processing",
  "Packed",
  "Ready to Ship",
  "Shipped",
  "In Transit",
  "Out for Delivery",
  "Delivered",
  "Cancelled",
  "Return Requested",
  "Returned",
  "Refund Pending",
  "Refunded",
];

// Groups status into a semantic tone for badges — every screen that shows an
// order status reuses this instead of re-deriving it.
export function orderStatusTone(status) {
  if (["Delivered"].includes(status)) return "success";
  if (["Cancelled", "Payment Failed", "Returned", "Refunded"].includes(status)) return "danger";
  if (["Return Requested", "Refund Pending"].includes(status)) return "warning";
  if (["Pending", "Payment Pending"].includes(status)) return "neutral";
  return "info"; // Confirmed, Processing, Packed, Ready to Ship, Shipped, In Transit, Out for Delivery
}

export function paymentStatusTone(status) {
  if (status === "Paid") return "success";
  if (status === "Failed") return "danger";
  if (status === "Refunded" || status === "Partially Refunded") return "warning";
  return "neutral"; // Pending
}

export const ROLE_LABELS = {
  super_admin: "Super Admin",
  admin: "Admin",
  manager: "Manager",
  order_manager: "Order Manager",
  product_manager: "Product Manager",
  support_staff: "Support Staff",
  finance_manager: "Finance Manager",
  seller: "Seller",
  customer: "Customer",
};

export const STAFF_ROLES = [
  "super_admin",
  "admin",
  "manager",
  "order_manager",
  "product_manager",
  "support_staff",
  "finance_manager",
];

export const DATE_PRESETS = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "thisMonth", label: "This month" },
  { value: "lastMonth", label: "Last month" },
];

export const CONTENT_SECTIONS = [
  { value: "hero_slide", label: "Hero Slider" },
  { value: "announcement", label: "Announcement Bar" },
  { value: "editorial_card", label: "Editorial Cards" },
  { value: "promo_banner", label: "Promo Banners" },
  { value: "category_circle", label: "Category Circles" },
  { value: "instagram_shot", label: "Instagram Gallery" },
];
