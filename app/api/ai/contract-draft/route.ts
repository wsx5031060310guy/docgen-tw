import { NextResponse } from "next/server";
import { AI_DAILY_LIMIT, AI_TEXT_MAX, extractContractDraft } from "@/lib/ai-contract";
import { readUidFromRequest } from "@/lib/billing";
import { consumeAiQuota } from "@/lib/contract-bot";
import { checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const uid = readUidFromRequest(req);
  if (!uid) return NextResponse.json({ error: "請重新整理頁面後再試" }, { status: 401 });
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!checkRateLimit(`ai:${ip}`, 10).ok) {
    return NextResponse.json({ error: "請求太頻繁，請稍後再試" }, { status: 429 });
  }

  let body: { text?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "請輸入合約內容" }, { status: 400 });
  }
  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) return NextResponse.json({ error: "請輸入合約內容" }, { status: 400 });
  if (text.length > AI_TEXT_MAX) {
    return NextResponse.json({ error: `內容請勿超過 ${AI_TEXT_MAX} 字` }, { status: 400 });
  }
  if (!(await consumeAiQuota(uid))) {
    return NextResponse.json(
      { error: `今天的 AI 填寫次數（${AI_DAILY_LIMIT} 次）已用完，明天再試或改手動填寫` },
      { status: 429 },
    );
  }
  try {
    return NextResponse.json({ draft: await extractContractDraft({ text }) });
  } catch (error) {
    console.error("AI contract draft failed", error);
    return NextResponse.json(
      { error: "AI 暫時無法解析，請稍後再試或改手動填寫" },
      { status: 502 },
    );
  }
}
