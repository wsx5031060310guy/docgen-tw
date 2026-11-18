import { createHmac, timingSafeEqual } from "node:crypto";

export function verifyLineSignature(rawBody: string, signature: string | null, secret: string): boolean {
  if (!signature) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest();
  const given = Buffer.from(signature, "base64");
  return given.length === expected.length && timingSafeEqual(given, expected);
}

async function lineApi(path: string, token: string, body: unknown) {
  const res = await fetch(`https://api.line.me/v2/bot/${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`LINE ${path} ${res.status}: ${await res.text()}`);
}

export function replyText(token: string, replyToken: string, message: string) {
  return lineApi("message/reply", token, {
    replyToken,
    messages: [{ type: "text", text: message.slice(0, 5000) }],
  });
}

export function pushText(token: string, to: string, message: string) {
  return lineApi("message/push", token, {
    to,
    messages: [{ type: "text", text: message.slice(0, 5000) }],
  });
}

export function showLoading(token: string, chatId: string) {
  return lineApi("chat/loading/start", token, { chatId, loadingSeconds: 20 }).catch(() => {});
}

const MAX_CONTENT_BYTES = 5 * 1024 * 1024;

export async function fetchMessageContent(token: string, messageId: string) {
  const res = await fetch(`https://api-data.line.me/v2/bot/message/${messageId}/content`, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(15_000),
  });
  if (res.status !== 200) throw new Error(`LINE content ${res.status}`);
  const data = new Uint8Array(await res.arrayBuffer());
  if (data.byteLength > MAX_CONTENT_BYTES) throw new Error(`LINE content too large: ${data.byteLength}`);
  return data;
}
