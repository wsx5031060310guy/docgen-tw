import { after } from "next/server";
import { AI_DAILY_LIMIT, AI_TEXT_MAX, extractContractDraft, type AiContractDraft } from "@/lib/ai-contract";
import { getBillingStatus } from "@/lib/billing";
import { bindLine, consumeAiQuota, createDraft, findUidByLine } from "@/lib/contract-bot";
import { fetchMessageContent, pushText, replyText, showLoading, verifyLineSignature } from "@/lib/line";
import { checkRateLimit } from "@/lib/rate-limit";
import { getTemplate } from "@/lib/templates";

const SITE = process.env.NEXT_PUBLIC_APP_URL ?? "https://docgen-tw.vercel.app";
const MAX_AUDIO_MS = 120_000;
const HELP = `直接傳一句話或語音，我幫你產生合約草稿。例如：
「幫我跟陳設計簽接案合約，品牌設計 12 萬，12/31 交件」

完成後會回傳網頁連結。請在網頁覆核內容、補齊欄位並由甲方簽名，再把乙方簽署連結轉傳給對方。`;

type LineEvent = {
  type: string;
  replyToken?: string;
  source?: { type: string; userId?: string };
  message?: { id: string; type: string; text?: string; duration?: number };
};

const toHalfWidth = (value: string) =>
  value.replace(/[０-９]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xfee0));

export async function POST(request: Request) {
  const secret = process.env.LINE_CHANNEL_SECRET;
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!secret || !token) return new Response("LINE not configured", { status: 503 });
  const raw = await request.text();
  if (!verifyLineSignature(raw, request.headers.get("x-line-signature"), secret)) {
    return new Response("bad signature", { status: 401 });
  }
  const events: LineEvent[] = JSON.parse(raw).events ?? [];
  after(() => Promise.all(
    events.map((event) => handleEvent(event, token).catch((error) => console.error("[line] event failed", error))),
  ));
  return new Response("ok");
}

async function handleEvent(event: LineEvent, token: string) {
  const lineUserId = event.source?.userId;
  const replyToken = event.replyToken;
  if (event.source?.type !== "user" || !lineUserId || !replyToken) return;
  const reply = (message: string) =>
    replyText(token, replyToken, message).catch(() => pushText(token, lineUserId, message));

  if (event.type === "follow") {
    return reply(`歡迎使用 DocGen TW LINE 合約機器人！\n先到 ${SITE}/settings 產生綁定碼，再傳「綁定 12345678」給我。\n\n${HELP}`);
  }
  if (event.type !== "message" || !event.message) return;
  const message = event.message;
  const text = message.type === "text" ? toHalfWidth(String(message.text ?? "").trim()) : "";
  const bind = text.match(/^綁定\s*(\d{8})$/);
  if (bind) {
    // ponytail: in-memory per instance; enough to stop one LINE account brute-forcing 8-digit codes.
    if (!checkRateLimit(`line-bind:${lineUserId}`, 5, 10 * 60_000).ok) {
      return reply("綁定嘗試太多次，請 10 分鐘後再試。");
    }
    const account = await bindLine(lineUserId, bind[1]);
    // Show which account got linked so a user tricked into sending someone else's code can notice.
    return reply(account
      ? `✅ 已綁定 DocGen TW 帳號（${account}）。如果不是你的帳號，請到設定頁重新綁定。\n\n${HELP}`
      : "綁定碼錯誤、已過期或已使用，請到設定頁重新產生。");
  }

  const uid = await findUidByLine(lineUserId);
  if (!uid) {
    return reply(`還沒綁定 DocGen TW 帳號。\n請到 ${SITE}/settings 產生綁定碼，再傳「綁定 12345678」給我。`);
  }
  if (/^(說明|help|\?|？)$/i.test(text)) return reply(HELP);
  if (message.type !== "text" && message.type !== "audio") return reply(`目前只看得懂文字和語音。\n\n${HELP}`);
  if (message.type === "text" && !text) return;
  if (text.length > AI_TEXT_MAX) return reply(`內容請在 ${AI_TEXT_MAX} 字以內，太長的條款請到網頁再補。`);
  if (message.type === "audio" && (message.duration ?? 0) > MAX_AUDIO_MS) return reply("語音請在 2 分鐘以內。");

  const billing = await getBillingStatus(uid);
  if (billing.quotaExceeded) {
    return reply(`本月免費合約額度（3 份）已用完，升級 Pro：${SITE}/checkout`);
  }
  if (!(await consumeAiQuota(uid))) {
    return reply(`今天的 AI 填寫次數（${AI_DAILY_LIMIT} 次）已用完，明天再試或改手動填寫。`);
  }
  await showLoading(token, lineUserId);

  let draft: AiContractDraft;
  try {
    draft = message.type === "audio"
      ? await extractContractDraft({
          audio: { data: await fetchMessageContent(token, message.id), mediaType: "audio/mp4" },
        })
      : await extractContractDraft({ text });
  } catch (error) {
    console.error("[line] AI contract draft failed", error);
    return reply("AI 暫時無法解析，請稍後再試一次。");
  }

  const heard = message.type === "audio" && draft.transcript ? `我聽到：「${draft.transcript}」\n\n` : "";
  if (!draft.templateId) {
    return reply(`${heard}看不出要哪一種合約，請說清楚類型，例如：「幫我跟陳設計簽接案合約，品牌設計 12 萬，12/31 交件」`);
  }
  const template = getTemplate(draft.templateId);
  if (!template) return reply("合約類型無效，請再試一次。");

  let saved: { id: string; token: string };
  try {
    saved = await createDraft(uid, {
      templateId: draft.templateId,
      values: draft.values,
      transcript: draft.transcript,
    });
  } catch (error) {
    console.error("[line] create contract draft failed", error);
    return reply("合約草稿建立失敗，請稍後再試一次。");
  }

  const lines = template.fields
    .filter((field) => draft.values[field.id])
    .slice(0, 10)
    .map((field) => `・${field.label}：${draft.values[field.id].slice(0, 40)}`);
  return reply(
    `${heard}✅ 已產生《${template.name}》草稿\n` +
      `👉 確認／修改並簽署（甲方）：\n` +
      `${SITE}/contracts/new?draft=${saved.id}&t=${saved.token}\n` +
      "簽完會產生乙方簽署連結，可直接轉傳給對方（草稿 7 天內有效）。\n\n" +
      lines.join("\n") +
      (draft.missing.length ? `\n⚠ 還缺：${draft.missing.join("、")}，開連結補上即可。` : ""),
  );
}
