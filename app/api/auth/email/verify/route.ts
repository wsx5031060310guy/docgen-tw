import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { UID_COOKIE, UID_COOKIE_MAX_AGE } from "@/lib/billing";

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
  const row = await prisma.magicLink.findUnique({ where: { tokenHash: tokenHash(token) } });
  if (!row) return NextResponse.redirect(`${APP_URL}/settings?magic=invalid`);
  if (row.usedAt) return NextResponse.redirect(`${APP_URL}/settings?magic=used`);
  if (row.expiresAt < new Date()) return NextResponse.redirect(`${APP_URL}/settings?magic=expired`);

  // Bind email <-> uid in BillingProfile, mark token used.
  await Promise.all([
    prisma.magicLink.update({ where: { id: row.id }, data: { usedAt: new Date() } }),
    prisma.billingProfile.upsert({
      where: { uid: row.uid },
      create: { uid: row.uid, email: row.email },
      update: { email: row.email },
    }),
  ]);

  const res = NextResponse.redirect(`${APP_URL}/settings?magic=ok`);
  res.cookies.set(UID_COOKIE, row.uid, {
    httpOnly: false, sameSite: "lax", maxAge: UID_COOKIE_MAX_AGE, path: "/",
  });
  return res;
}
