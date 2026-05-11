import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { listMilestonesNeedingReminder, markOverdue } from "@/lib/case-store";
import { sendEmail } from "@/lib/mailgun";

export const runtime = "nodejs";
// Vercel Hobby cron: max 2 invocations/day. We run this once daily; it handles
// every D-7 / D-1 / D-0 / D+1 bucket in a single pass.
export const maxDuration = 60;

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://docgen-tw.vercel.app";

function bucketFor(due: Date, now: Date): "D7" | "D1" | "D0" | "D1p" | null {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const dueDay = new Date(due);
  dueDay.setHours(0, 0, 0, 0);
  const diff = Math.round((dueDay.getTime() - start.getTime()) / 86400000);
  if (diff === 7) return "D7";
  if (diff === 1) return "D1";
  if (diff === 0) return "D0";
  if (diff === -1) return "D1p";
  return null;
}

function authorised(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // dev mode: open
  const auth = req.headers.get("authorization") || "";
  return auth === `Bearer ${secret}`;
}

export async function GET(req: Request) {
  if (!authorised(req)) return NextResponse.json({ error: "unauthorised" }, { status: 401 });

  const now = new Date();
  let sent = 0;
  let skipped = 0;
  const log: string[] = [];

  try {
    // 1. Mark anything past due as OVERDUE
    const overdue = await markOverdue(now);
    log.push(`marked ${overdue.count} milestones OVERDUE`);

    // 2. Find upcoming milestones in our reminder window
    const ms = await listMilestonesNeedingReminder(now);
    log.push(`found ${ms.length} milestones in window`);

    for (const m of ms) {
      const bucket = bucketFor(m.dueDate, now);
      if (!bucket) {
        skipped++;
        continue;
      }
      // Skip if already reminded for this bucket
      const flag =
        bucket === "D7" ? m.remindedD7 :
        bucket === "D1" ? m.remindedD1 :
        bucket === "D0" ? m.remindedD0 :
        m.remindedD1p;
      if (flag) {
        skipped++;
        continue;
      }
      const email = m.contract?.recipientEmail;
      if (!email) {
        skipped++;
        log.push(`m=${m.id} skipped: no recipientEmail`);
        continue;
      }

      const due = m.dueDate.toLocaleDateString("zh-Hant");
      const subject =
        bucket === "D7" ? `[DocGen TW] ${m.title} 將於 7 日後到期（${due}）` :
        bucket === "D1" ? `[DocGen TW] ${m.title} 明日到期（${due}）` :
        bucket === "D0" ? `[DocGen TW] ${m.title} 今日到期（${due}）` :
        `[DocGen TW] ${m.title} 已逾期 1 日（原定 ${due}）`;
      const amountLine = m.amount != null ? `\n金額：NT$ ${m.amount.toLocaleString()}` : "";
      const text =
        `您好 ${m.contract?.recipientName || ""}，\n\n` +
        `這是來自 DocGen TW 的自動提醒：\n\n` +
        `項目：${m.title}\n類型：${m.kind}\n到期日：${due}${amountLine}\n\n` +
        `合約：${APP_URL}/contracts/${m.contractId}\n\n` +
        (bucket === "D1p"
          ? `此項已逾原訂期限 1 日。若已處理請忽略本通知；如有疑慮請與對方聯繫。\n如逾期款項，您可於 DocGen TW 產出「催款通知書」草稿。\n`
          : `請於到期日前完成處理。如已完成請於系統中標記為「已完成」以停止提醒。\n`) +
        `\n— DocGen TW 自動通知（請勿直接回覆）`;

      const r = await sendEmail({ to: email, subject, text });
      if (!r.ok) {
        log.push(`m=${m.id} send failed: ${r.reason}`);
        skipped++;
        continue;
      }
      // Mark this bucket as reminded
      await prisma.milestone.update({
        where: { id: m.id },
        data: {
          remindedD7: bucket === "D7" ? true : m.remindedD7,
          remindedD1: bucket === "D1" ? true : m.remindedD1,
          remindedD0: bucket === "D0" ? true : m.remindedD0,
          remindedD1p: bucket === "D1p" ? true : m.remindedD1p,
        },
      });
      sent++;
    }
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message, log },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, sent, skipped, log });
}
