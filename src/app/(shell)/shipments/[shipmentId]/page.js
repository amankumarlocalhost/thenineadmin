import ShipmentLookupClient from "./ShipmentLookupClient";

export default async function ShipmentLookupPage({ params }) {
  const { shipmentId } = await params;
  return <ShipmentLookupClient shipmentId={shipmentId} />;
}
