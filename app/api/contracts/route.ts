import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { buildContractDocument } from "@/lib/templates";
import { persistSignaturePng } from "@/lib/services/signing_service";
import { createContract } from "@/lib/contract-store";
import { parseMilestonesFromValues } from "@/lib/milestone-parser";
import { prisma } from "@/lib/prisma";
import {
  getBillingStatus,
  incrementUsage,
  newUid,
  readUidFromRequest,
  UID_COOKIE,
  UID_COOKIE_MAX_AGE,
} from "@/lib/billing";

interface CreateContractPayload {
  templateId: string;
  values: Record<string, string>;
  partyASignature: string;
  recipientName?: string;
  recipientEmail?: string;
  autoMilestones?: boolean;
}

// GET /api/contracts?status=&template=&q=
// List recent contracts with optional filters. Open endpoint; UI is the only
// listing surface (would gate behind auth in a real multi-tenant build).
export async function GET(req: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ contracts: [], note: "database not configured" });
  }
  const url = new URL(req.url);
  const status = url.searchParams.get("status") || undefined;
  const template = url.searchParams.get("template") || undefined;
  const q = (url.searchParams.get("q") || "").trim();

  const where: Record<string, unknown> = {};
  if (status) where.signingStatus = status;
  if (template) where.templateId = template;
  if (q) {
    where.OR = [
      { client: { contains: q, mode: "insensitive" } },
      { recipientName: { contains: q, mode: "insensitive" } },
      { recipientEmail: { contains: q, mode: "insensitive" } },
    ];
  }
  const rows = await prisma.contract.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      templateId: true,
      client: true,
      recipientName: true,
      recipientEmail: true,
      signingStatus: true,
      caseId: true,
      expiryDate: true,
      createdAt: true,
      case: { select: { id: true, title: true } },
      milestones: { select: { id: true, status: true } },
    },
  });
  return NextResponse.json({ contracts: rows });
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

  // Identity + monthly quota gate (FREE = 3 / month).
  let uid = readUidFromRequest(req as unknown as Request);
  const setUidCookie = !uid;
  if (!uid) uid = newUid();
  const status = await getBillingStatus(uid);
  if (status.quotaExceeded) {
    return NextResponse.json(
      {
        error: "本月免費額度已用完",
        quotaExceeded: true,
        usedThisMonth: status.usedThisMonth,
        upgradeUrl: "/checkout",
      },
      { status: 402 },
    );
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

  // Best-effort usage increment (only counts successful creates).
  try {
    await incrementUsage(uid);
  } catch (err) {
    console.error("usage increment failed", err);
  }

  const res = NextResponse.json(
    {
      id: stored.id,
      document,
      signingStatus: stored.signingStatus,
      signingToken: stored.signingToken,
      recipientSignUrl,
      milestonesCreated,
      uid,
    },
    { status: 201 },
  );
  if (setUidCookie) {
    res.cookies.set(UID_COOKIE, uid, {
      httpOnly: false, sameSite: "lax", maxAge: UID_COOKIE_MAX_AGE, path: "/",
    });
  }
  return res;
}
