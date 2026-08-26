import ProductEditClient from "./ProductEditClient";

export default async function ProductEditPage({ params }) {
  const { id } = await params;
  return <ProductEditClient id={id} />;
}
