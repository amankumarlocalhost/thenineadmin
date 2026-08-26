import OrderDetailClient from "./OrderDetailClient";

export default async function OrderDetailPage({ params }) {
  const { orderNumber } = await params;
  return <OrderDetailClient orderNumber={orderNumber} />;
}
