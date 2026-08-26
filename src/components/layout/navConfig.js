// Mirrors the requested nav structure, adjusted to the routes actually
// built. Refunds live inside Orders (filterable by refund status) rather
// than a separate collection — see backend/docs/ADMIN_API.md's "no separate
// Shipment collection" note for the same reasoning applied to shipments.
export const NAV_GROUPS = [
  {
    label: null,
    items: [
      { href: "/", label: "Dashboard", icon: "▦" },
      { href: "/ask", label: "Ask", icon: "✦" },
    ],
  },
  {
    label: "Commerce",
    items: [
      { href: "/orders", label: "Orders", icon: "▤" },
      { href: "/payments", label: "Payments", icon: "◈" },
      { href: "/shipments", label: "Shipments", icon: "➤" },
      { href: "/refunds", label: "Returns & Refunds", icon: "↺" },
    ],
  },
  {
    label: "Catalog",
    items: [
      { href: "/products", label: "Products", icon: "▧" },
      { href: "/categories", label: "Categories", icon: "▥" },
      { href: "/inventory", label: "Inventory", icon: "▩" },
    ],
  },
  {
    label: "Customers",
    items: [{ href: "/customers", label: "All Customers", icon: "◐" }],
  },
  {
    label: "Marketing",
    items: [{ href: "/coupons", label: "Coupons", icon: "%" }],
  },
  {
    label: "Content",
    items: [
      { href: "/hero", label: "Hero Slider", icon: "◧" },
      { href: "/announcements", label: "Announcement Bar", icon: "▭" },
      { href: "/content", label: "Homepage Content", icon: "▨" },
      { href: "/media", label: "Media Library", icon: "▣" },
    ],
  },
  {
    label: "Analytics",
    items: [
      { href: "/analytics/sales", label: "Sales Analytics", icon: "↗" },
      { href: "/analytics/products", label: "Product Analytics", icon: "↗" },
      { href: "/analytics/customers", label: "Customer Analytics", icon: "↗" },
      { href: "/finance", label: "Finance", icon: "₹" },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/notifications", label: "Notifications", icon: "✉" },
      { href: "/activity-logs", label: "Activity Logs", icon: "≡" },
      { href: "/settings", label: "Settings & Team", icon: "⚙" },
    ],
  },
];
