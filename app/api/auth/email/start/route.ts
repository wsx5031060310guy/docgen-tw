import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import {
  readUidFromRequest, newUid, UID_COOKIE, UID_COOKIE_MAX_AGE,
} from "@/lib/billing";
import { sendEmail } from "@/lib/mailgun";

export const runtime = "nodejs";

const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://docgen-tw.vercel.app";

function tokenHash(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

// POST /api/auth/email/start  { email }
// Issues a 15-minute magic link. Idempotent: if the email already has a
// BillingProfile, we bind to that uid; otherwise we use the caller's current
// cookie uid (or mint a new one), so clicking the link from a different
// browser still re-binds back to the same uid.
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { email?: string };
  const email = (body.email || "").trim().toLowerCase();
  if (!email || !RE_EMAIL.test(email)) {
    return NextResponse.json({ error: "email invalid" }, { status: 400 });
  }
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "database not configured" }, { status: 503 });
  }

  let uid = readUidFromRequest(req);
  // If this email already has a profile, ALWAYS bind future logins to that uid.
  const existing = await prisma.billingProfile.findFirst({
    where: { email },
    orderBy: { updatedAt: "desc" },
  });
  if (existing) {
    uid = existing.uid;
  } else if (!uid) {
    uid = newUid();
  }

  const raw = crypto.randomBytes(24).toString("base64url");
  const expiresAt = new Date(Date.now() + 15 * 60_000);
  await prisma.magicLink.create({
    data: { email, uid, tokenHash: tokenHash(raw), expiresAt },
  });

  const link = `${APP_URL}/api/auth/email/verify?token=${raw}`;
  const text =
    `您好，\n\n` +
    `點擊以下連結登入 DocGen TW（15 分鐘內有效，僅可使用一次）：\n\n${link}\n\n` +
    `若您未發起此請求，請忽略本郵件。— DocGen TW`;
  const result = await sendEmail({
    to: email,
    subject: `[DocGen TW] 登入連結`,
    text,
  });

  if (!result.ok) {
    // Still return success to avoid leaking which emails exist; log internally.
    console.error("[auth/email/start] mailgun send failed:", result.reason);
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(UID_COOKIE, uid, {
    httpOnly: false, sameSite: "lax", maxAge: UID_COOKIE_MAX_AGE, path: "/",
  });
  return res;
}
