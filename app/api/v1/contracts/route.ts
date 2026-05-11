import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { buildContractDocument } from "@/lib/templates";
import { persistSignaturePng } from "@/lib/services/signing_service";
import { createContract } from "@/lib/contract-store";
import { resolveBearer } from "@/lib/api-keys";
import { getBillingStatus, incrementUsage } from "@/lib/billing";
import { parseMilestonesFromValues } from "@/lib/milestone-parser";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// Public API: POST /api/v1/contracts
// Headers: Authorization: Bearer dk_<key>
// Body: { templateId, values, partyASignature (base64 PNG data URL),
//         recipientName?, recipientEmail?, autoMilestones? }
//
// Same flow as the internal POST /api/contracts, but:
//   - Identity comes from API key (uid resolved server-side), not cookie
//   - Same FREE/PRO quota gating
//   - No cookies set on the response
export async function POST(req: Request) {
  const auth = req.headers.get("authorization") || "";
  const m = auth.match(/^Bearer\s+(\S+)$/i);
  if (!m) return NextResponse.json({ error: "missing bearer token" }, { status: 401 });
  const resolved = await resolveBearer(m[1]);
  if (!resolved) return NextResponse.json({ error: "invalid or revoked key" }, { status: 401 });
  const { uid } = resolved;

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const { templateId, values, partyASignature, recipientName, recipientEmail, autoMilestones } =
    body as {
      templateId?: string; values?: Record<string, string>;
      partyASignature?: string; recipientName?: string;
      recipientEmail?: string; autoMilestones?: boolean;
    };
  if (!templateId || !values || !partyASignature) {
    return NextResponse.json({ error: "templateId / values / partyASignature required" }, { status: 400 });
  }

  // Quota check (same as internal route)
  const status = await getBillingStatus(uid);
  if (status.quotaExceeded) {
    return NextResponse.json(
      { error: "monthly free quota exceeded", quotaExceeded: true, plan: status.plan, usedThisMonth: status.usedThisMonth },
      { status: 402 },
    );
  }

  let document;
  try {
    document = buildContractDocument(templateId, values);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }

  const tempId = crypto.randomBytes(8).toString("hex");
  const sigRecord = await persistSignaturePng(tempId, partyASignature);

  const stored = await createContract({
    templateId,
    values,
    client: values.party_a_name || values.party_b_name || "",
    content: [document.title, ...document.clauses.map((c) => `第 ${c.n} 條  ${c.title}\n${c.body}`), document.footer].join("\n\n"),
    senderSignatureUrl: sigRecord.url,
    senderSignatureHash: sigRecord.sha256,
    senderIp: req.headers.get("x-forwarded-for") ?? "api",
    recipientName: recipientName ?? null,
    recipientEmail: recipientEmail ?? null,
    uid,
  });

  const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;
  const recipientSignUrl = `${origin}/contracts/${stored.id}/sign?token=${stored.signingToken}`;

  const shouldAuto =
    autoMilestones ?? ["freelance", "consign", "loan", "sale", "employ", "lease"].includes(templateId);
  let milestonesCreated = 0;
  if (shouldAuto && process.env.DATABASE_URL) {
    try {
      const drafts = parseMilestonesFromValues(values);
      if (drafts.length > 0) {
        await prisma.milestone.createMany({
          data: drafts.map((d) => ({
            contractId: stored.id, kind: d.kind, title: d.title,
            amount: d.amount ?? null, dueDate: d.dueDate, note: d.note ?? null,
          })),
        });
        milestonesCreated = drafts.length;
      }
    } catch (err) {
      console.error("[v1/contracts] auto-milestone err", err);
    }
  }

  try { await incrementUsage(uid); } catch (err) { console.error("[v1/contracts] usage err", err); }

  return NextResponse.json(
    {
      id: stored.id,
      signingStatus: stored.signingStatus,
      recipientSignUrl,
      milestonesCreated,
      document: { title: document.title, clauses: document.clauses.length, legalBasis: document.legalBasis },
    },
    { status: 201 },
  );
}
