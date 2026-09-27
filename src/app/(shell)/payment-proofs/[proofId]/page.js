import ProofDetailClient from "./ProofDetailClient";

export default async function ProofDetailPage({ params }) {
  const { proofId } = await params;
  return <ProofDetailClient proofId={proofId} />;
}
