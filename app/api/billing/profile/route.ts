import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  readUidFromRequest,
  newUid,
  UID_COOKIE,
  UID_COOKIE_MAX_AGE,
} from "@/lib/billing";
import { dispatchWebhook } from "@/lib/webhooks";

export const runtime = "nodejs";

interface PatchBody {
  email?: string | null;
  webhookUrl?: string | null;
  webhookSecret?: string | null;
  testWebhook?: boolean;
}

const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const RE_URL = /^https?:\/\/[^\s]{4,300}$/;

export async function GET(req: Request) {
  let uid = readUidFromRequest(req);
  const setCookie = !uid;
  if (!uid) uid = newUid();
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ uid, email: null, webhookUrl: null, webhookSecret: null });
  }
  const p = await prisma.billingProfile.findUnique({
    where: { uid },
    select: { uid: true, email: true, plan: true, periodEnd: true, webhookUrl: true, webhookSecret: true },
  });
  const res = NextResponse.json(
    p ?? { uid, email: null, plan: "FREE", periodEnd: null, webhookUrl: null, webhookSecret: null },
  );
  if (setCookie) {
    res.cookies.set(UID_COOKIE, uid, {
      httpOnly: false, sameSite: "lax", maxAge: UID_COOKIE_MAX_AGE, path: "/",
    });
  }
  return res;
}

export async function PATCH(req: Request) {
  const uid = readUidFromRequest(req);
  if (!uid) return NextResponse.json({ error: "no identity cookie" }, { status: 400 });
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "database not configured" }, { status: 503 });
  }
  let body: PatchBody;
  try {
    body = (await req.json()) as PatchBody;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  if (body.email != null && body.email !== "" && !RE_EMAIL.test(body.email)) {
    return NextResponse.json({ error: "email format invalid" }, { status: 400 });
  }
  if (body.webhookUrl != null && body.webhookUrl !== "" && !RE_URL.test(body.webhookUrl)) {
    return NextResponse.json({ error: "webhookUrl must be http(s) URL" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (body.email !== undefined) data.email = body.email || null;
  if (body.webhookUrl !== undefined) data.webhookUrl = body.webhookUrl || null;
  if (body.webhookSecret !== undefined) data.webhookSecret = body.webhookSecret || null;

  const profile = await prisma.billingProfile.upsert({
    where: { uid },
    create: { uid, ...(data as { email?: string; webhookUrl?: string; webhookSecret?: string }) },
    update: data,
  });

  // Optionally fire a test ping to confirm setup
  let testResult: { ok: boolean; status?: number; reason?: string } | undefined;
  if (body.testWebhook && profile.webhookUrl) {
    testResult = await dispatchWebhook(
      profile.webhookUrl,
      {
        type: "contract.signed.full",
        contractId: "test-0000",
        templateId: "freelance",
        senderName: "DocGen TW",
        recipientName: "Webhook Test",
      },
      { secret: profile.webhookSecret },
    );
  }

  return NextResponse.json({
    profile: {
      uid: profile.uid,
      email: profile.email,
      plan: profile.plan,
      periodEnd: profile.periodEnd,
      webhookUrl: profile.webhookUrl,
      webhookSecret: profile.webhookSecret,
    },
    testResult,
  });
}
