import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { writeUidCookie } from "@/lib/billing";

export const runtime = "nodejs";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://docgen-tw.vercel.app";

function tokenHash(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

// GET /api/auth/email/verify?token=<raw>
// Sets docgen_uid cookie to the magic link's bound uid + ensures
// BillingProfile.email is filled. Redirects to /settings on success.
export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token") || "";
  if (!token) return NextResponse.redirect(`${APP_URL}/settings?magic=missing`);
  if (!process.env.DATABASE_URL) {
    return NextResponse.redirect(`${APP_URL}/settings?magic=disabled`);
  }
  // Nonce cookie set by /start in the browser that asked for the link.
  const nonce = req.headers.get("cookie")?.match(/(?:^|;\s*)docgen_magic=([^;]+)/)?.[1];
  if (!nonce) return NextResponse.redirect(`${APP_URL}/settings?magic=browser`);
  const row = await prisma.magicLink.findUnique({ where: { tokenHash: tokenHash(`${token}.${nonce}`) } });
  if (!row) return NextResponse.redirect(`${APP_URL}/settings?magic=invalid`);
  if (row.usedAt) return NextResponse.redirect(`${APP_URL}/settings?magic=used`);
  if (row.expiresAt < new Date()) return NextResponse.redirect(`${APP_URL}/settings?magic=expired`);

  // Claim the token atomically (one winner under concurrent clicks), then bind
  // email <-> uid in BillingProfile.
  const claimed = await prisma.magicLink.updateMany({
    where: { id: row.id, usedAt: null },
    data: { usedAt: new Date() },
  });
  if (claimed.count !== 1) return NextResponse.redirect(`${APP_URL}/settings?magic=used`);
  await prisma.billingProfile.upsert({
    where: { uid: row.uid },
    create: { uid: row.uid, email: row.email },
    update: { email: row.email },
  });

  const res = NextResponse.redirect(`${APP_URL}/settings?magic=ok`);
  writeUidCookie(res, row.uid);
  return res;
}
