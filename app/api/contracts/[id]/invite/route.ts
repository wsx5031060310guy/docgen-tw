import { NextResponse } from "next/server";
import { readUidFromRequest } from "@/lib/billing";
import {
  findContractById,
  setRecipientEmail,
} from "@/lib/contract-store";
import { buildSignUrl, checkInviteRateLimit } from "@/lib/contract-invite";
import { renderInviteEmail } from "@/lib/email-templates";
import { isValidEmail } from "@/lib/email";
import { mailgunConfigured, sendEmail } from "@/lib/mailgun";
import { contractTitle } from "@/lib/templates";

export const runtime = "nodejs";

type InvitePayload = {
  email?: string;
  dryRun?: boolean;
};

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const uid = readUidFromRequest(req);
  if (!uid) return NextResponse.json({ error: "no identity" }, { status: 401 });

  const contract = await findContractById(id);
  if (!contract) return NextResponse.json({ error: "not found" }, { status: 404 });
  // This route reveals the signing token, so ownership is strict: a contract
  // without an owner uid is only reachable in the DB-less dev store.
  const ownerless = !contract.uid && !process.env.DATABASE_URL;
  if (!ownerless && contract.uid !== uid) {
    return NextResponse.json({ error: "not your contract" }, { status: 403 });
  }
  if (contract.signingStatus === "FULLY_SIGNED") {
    return NextResponse.json({ error: "已雙方簽署" }, { status: 409 });
  }

  const body = (await req.json().catch(() => null)) as InvitePayload | null;
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const requestOrigin = new URL(req.url).origin;
  const appOrigin = process.env.NEXT_PUBLIC_APP_URL?.trim() || requestOrigin;
  const signUrl = buildSignUrl(appOrigin, id, contract.signingToken);
  if (body.dryRun === true) return NextResponse.json({ signUrl });

  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ error: "電子郵件格式不正確" }, { status: 400 });
  }
  if (!mailgunConfigured()) {
    return NextResponse.json(
      { error: "此環境未設定 Email 寄送" },
      { status: 503 },
    );
  }

  const rateLimit = checkInviteRateLimit(id);
  if (!rateLimit.ok) {
    return NextResponse.json(
      { error: "寄送次數已達上限，請稍後再試" },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(rateLimit.resetMs / 1000)) },
      },
    );
  }

  const title = contractTitle(contract.templateId, contract.values);
  const senderName = contract.values?.party_a_name || contract.client || "合約建立者";
  const invite = renderInviteEmail({
    title,
    senderName,
    recipientName: contract.recipientName || "簽署人",
    signUrl,
    expiresNote: contract.expiryDate
      ? `簽署期限：${contract.expiryDate.toLocaleDateString("zh-Hant", { timeZone: "Asia/Taipei" })}`
      : undefined,
  });

  let sent;
  try {
    sent = await sendEmail({
      to: email,
      subject: invite.subject,
      text: invite.text,
      html: invite.html,
    });
  } catch (error) {
    console.error("[contract-invite] send threw:", error);
    return NextResponse.json({ error: "Email 寄送失敗" }, { status: 502 });
  }
  if (!sent.ok) {
    console.error(`[contract-invite] mailgun failed: ${sent.reason}`);
    return NextResponse.json({ error: "Email 寄送失敗" }, { status: 502 });
  }

  if (!contract.recipientEmail) await setRecipientEmail(id, email);
  const sentAt = new Date().toISOString();
  return NextResponse.json({ ok: true, signUrl, sentTo: email, sentAt });
}
