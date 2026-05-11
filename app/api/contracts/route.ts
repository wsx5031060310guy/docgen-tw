import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { buildContractDocument } from "@/lib/templates";
import { persistSignaturePng } from "@/lib/services/signing_service";
import { createContract } from "@/lib/contract-store";
import { parseMilestonesFromValues } from "@/lib/milestone-parser";
import { prisma } from "@/lib/prisma";

interface CreateContractPayload {
  templateId: string;
  values: Record<string, string>;
  partyASignature: string;
  recipientName?: string;
  recipientEmail?: string;
  autoMilestones?: boolean;
}

export async function POST(req: Request) {
  let body: CreateContractPayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { templateId, values, partyASignature, recipientName, recipientEmail, autoMilestones } = body;
  if (!templateId || !values || !partyASignature) {
    return NextResponse.json({ error: "缺少必要欄位（範本/欄位/甲方簽名）" }, { status: 400 });
  }

  let document;
  try {
    document = buildContractDocument(templateId, values);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }

  // Persist sender signature image, hash for audit
  const tempId = crypto.randomBytes(8).toString("hex");
  const sigRecord = await persistSignaturePng(tempId, partyASignature);

  const stored = await createContract({
    templateId,
    values,
    client: values.party_a_name || values.party_b_name || "",
    content: [
      document.title,
      ...document.clauses.map((c) => `第 ${c.n} 條  ${c.title}\n${c.body}`),
      document.footer,
    ].join("\n\n"),
    senderSignatureUrl: sigRecord.url,
    senderSignatureHash: sigRecord.sha256,
    senderIp: req.headers.get("x-forwarded-for") ?? "unknown",
    recipientName: recipientName ?? null,
    recipientEmail: recipientEmail ?? null,
  });

  const origin =
    req.headers.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const recipientSignUrl = `${origin}/contracts/${stored.id}/sign?token=${stored.signingToken}`;

  // Auto-generate milestones if the template has payment_terms-style fields
  // and the caller opted in (default: yes for freelance/consign/loan/sale).
  const shouldAuto =
    autoMilestones ??
    ["freelance", "consign", "loan", "sale", "employ", "lease"].includes(templateId);
  let milestonesCreated = 0;
  if (shouldAuto && process.env.DATABASE_URL) {
    try {
      const drafts = parseMilestonesFromValues(values);
      if (drafts.length > 0) {
        await prisma.milestone.createMany({
          data: drafts.map((d) => ({
            contractId: stored.id,
            kind: d.kind,
            title: d.title,
            amount: d.amount ?? null,
            dueDate: d.dueDate,
            note: d.note ?? null,
          })),
        });
        milestonesCreated = drafts.length;
      }
    } catch (err) {
      // Non-fatal: contract is created, just no auto-milestones
      console.error("auto-milestone create failed:", err);
    }
  }

  return NextResponse.json(
    {
      id: stored.id,
      document,
      signingStatus: stored.signingStatus,
      signingToken: stored.signingToken,
      recipientSignUrl,
      milestonesCreated,
    },
    { status: 201 }
  );
}
