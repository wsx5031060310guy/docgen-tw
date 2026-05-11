import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/mailgun";

export const runtime = "nodejs";

interface ReferralPayload {
  name?: string;
  email?: string;
  phone?: string;
  city?: string;
  topic?: string;
  budget?: string;
  description?: string;
  contractId?: string;
}

const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// POST /api/referrals — public form submission from /disclaimer
export async function POST(req: Request) {
  let body: ReferralPayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const { name, email, phone, city, topic, budget, description, contractId } = body;
  if (!name || !name.trim()) return NextResponse.json({ error: "請填寫姓名" }, { status: 400 });
  if (!email || !RE_EMAIL.test(email)) return NextResponse.json({ error: "Email 格式錯誤" }, { status: 400 });
  if (!description || description.trim().length < 5) {
    return NextResponse.json({ error: "請描述案情（至少 5 字）" }, { status: 400 });
  }
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "database not configured" }, { status: 503 });
  }

  const ref = await prisma.lawyerReferral.create({
    data: {
      name: name.trim().slice(0, 120),
      email: email.trim().slice(0, 200),
      phone: phone?.trim().slice(0, 40) ?? null,
      city: city?.trim().slice(0, 40) ?? null,
      topic: topic?.trim().slice(0, 80) ?? null,
      budget: budget?.trim().slice(0, 40) ?? null,
      description: description.trim().slice(0, 4000),
      contractId: contractId?.trim() || null,
    },
  });

  // Best-effort notify ops (NOT a confirmation to the user — just internal ping)
  const opsTo = process.env.REFERRAL_NOTIFY_TO;
  if (opsTo) {
    await sendEmail({
      to: opsTo,
      subject: `[DocGen TW] 新律師轉介需求 #${ref.id.slice(0, 8)}`,
      text:
        `姓名：${ref.name}\nEmail：${ref.email}\n電話：${ref.phone || "—"}\n` +
        `城市：${ref.city || "—"}\n主題：${ref.topic || "—"}\n預算：${ref.budget || "—"}\n` +
        `${ref.contractId ? `合約 ID：${ref.contractId}\n` : ""}\n描述：\n${ref.description}`,
    }).catch(() => undefined);
  }

  return NextResponse.json({ ok: true, id: ref.id });
}
