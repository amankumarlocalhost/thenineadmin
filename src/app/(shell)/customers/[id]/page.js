import CustomerDetailClient from "./CustomerDetailClient";

export default async function CustomerDetailPage({ params }) {
  const { id } = await params;
  return <CustomerDetailClient id={id} />;
}
