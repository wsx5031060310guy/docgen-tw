"use client";
import { useSearchParams } from "next/navigation";
import { LawyerReferralForm } from "@/components/LawyerReferralForm";

export function ReferralFormSection() {
  const params = useSearchParams();
  const topic = params.get("topic") || undefined;
  const contractId = params.get("contract") || undefined;
  return <LawyerReferralForm defaultTopic={topic} contractId={contractId} />;
}
