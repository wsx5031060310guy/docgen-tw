import type { Metadata } from "next";
import { cache } from "react";
import SignClient from "@/app/contracts/[id]/sign/SignClient";
import { findContractByToken } from "@/lib/contract-store";
import { buildSignFetchPayload } from "@/lib/sign-fetch";
import { contractTitle } from "@/lib/templates";

export const dynamic = "force-dynamic";

const findSignContract = cache(findContractByToken);

type SignPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string | string[] }>;
};

function readToken(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : value?.[0] ?? "";
}

export async function generateMetadata({ params, searchParams }: SignPageProps): Promise<Metadata> {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const token = readToken(query.token);
  const contract = token ? await findSignContract(id, token) : undefined;

  return {
    title: contract
      ? `${contractTitle(contract.templateId, contract.values)} · 電子簽署`
      : "合約不存在 · DocGen TW",
    robots: { index: false },
  };
}

export default async function SignPage({ params, searchParams }: SignPageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const token = readToken(query.token);

  if (!token) {
    return <SignClient id={id} token="" initial={{ error: "missing token", status: 400 }} />;
  }

  const contract = await findSignContract(id, token);
  const initial = contract
    ? buildSignFetchPayload(contract)
    : { error: "invalid token or contract" as const, status: 404 as const };

  return <SignClient id={id} token={token} initial={initial} />;
}
