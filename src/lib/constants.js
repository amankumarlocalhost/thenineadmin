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
  { value: "announcement", label: "Announcement Bar" },
  { value: "editorial_card", label: "Editorial Cards" },
  { value: "promo_banner", label: "Promo Banners" },
  { value: "category_circle", label: "Category Circles" },
  { value: "instagram_shot", label: "Instagram Gallery" },
  { value: "home_hero", label: "Homepage Hero" },
  { value: "home_poster", label: "Heritage Poster" },
  { value: "store_info", label: "Store Details" },
];

// What each field means for the homepage blocks that reuse the generic
// content form. Shown above the form so an editor knows where text lands.
export const CONTENT_SECTION_HINTS = {
  home_hero:
    "Eyebrow = small line above the headline. Title = headline. Subtitle = italic second line. Body = short description. Button 1 / Button 2 = the two actions. Left photo / Right photo = the two side images.",
  home_poster:
    "Eyebrow = small label (e.g. THE HERITAGE EDIT). Title = headline — use \" | \" to split it around the script word (e.g. Tradition | Today.). Subtitle = the script word (e.g. meets). Body = paragraph. Button = main action.",
  store_info:
    "Title = store name. Body = address, one line per row. Subtitle = contact email. Eyebrow = small label (e.g. FIND US IN JIND). Button Link = Google Maps directions URL.",
};

// Sections whose blocks use the eyebrow line and a second button.
export const SECTIONS_WITH_EXTRAS = new Set(["hero_slide", "home_hero", "home_poster", "store_info"]);
