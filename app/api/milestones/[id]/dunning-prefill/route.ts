import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// GET /api/milestones/[id]/dunning-prefill
// Build a dunning-template `values` object from an overdue PAYMENT milestone
// and its source contract. Caller (/contracts/new) uses this to skip retyping.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "database not configured" }, { status: 503 });
  }

  const m = await prisma.milestone.findUnique({
    where: { id },
    include: { contract: { select: { values: true, templateId: true } } },
  });
  if (!m) return NextResponse.json({ error: "milestone not found" }, { status: 404 });

  const cv = (m.contract?.values ?? {}) as Record<string, string>;

  // Map source contract roles → dunning roles.
  // For freelance / consign / loan: a=委任方/貸與人 = creditor, b=受任方/借用人 = debtor.
  // Default to a→creditor, b→debtor unless source flips.
  const partyAName = cv.party_a_name || "";
  const partyBName = cv.party_b_name || "";

  // Best-effort label for the original contract: "<date> 簽訂之 <templateId> 第X條"
  const tplName = m.contract?.templateId || "原契約";
  const signDate = cv.sign_date || "";
  const subject = `${signDate ? signDate + " 簽訂之" : ""}${tplName}：${m.title}`;

  const formatDate = (d: Date) =>
    `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;

  const prefilled: Record<string, string> = {
    party_a_name: partyAName,
    party_a_address: cv.party_a_address || "",
    party_b_name: partyBName,
    party_b_address: cv.party_b_address || "",
    contract_subject: subject,
    original_due_date: formatDate(m.dueDate),
    amount_owed: m.amount != null ? String(m.amount) : "",
    interest_rate: "5",
    grace_days: "7",
    sign_date: cv.sign_date || "",
  };

  return NextResponse.json({
    templateId: "dunning",
    values: prefilled,
    source: {
      milestoneId: m.id,
      contractId: m.contractId,
      kind: m.kind,
      status: m.status,
    },
  });
}
