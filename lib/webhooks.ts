// Generic outbound webhook dispatcher. Sends a small JSON payload to the
// user-configured `webhookUrl` on key lifecycle events.
//
// Supported endpoints (no parsing — POST JSON):
//   - Slack incoming webhooks (with optional Slack-formatted `text` fallback)
//   - Discord webhooks (also accept generic JSON)
//   - Make.com / Zapier / n8n catch-hooks
//
// Failures are intentionally swallowed (logged) — we never block a contract
// flow on the user's external integration.

import crypto from "node:crypto";

export type WebhookEvent =
  | { type: "contract.signed.full"; contractId: string; templateId: string | null; recipientName: string | null; senderName: string }
  | { type: "milestone.overdue"; milestoneId: string; contractId: string; title: string; dueDate: string; amount: number | null }
  | { type: "milestone.due"; milestoneId: string; contractId: string; title: string; dueDate: string; bucket: "D7" | "D1" | "D0" };

function summaryFor(ev: WebhookEvent): string {
  switch (ev.type) {
    case "contract.signed.full":
      return `📑 合約已雙方簽署：${ev.senderName} ↔ ${ev.recipientName || "—"}（${ev.templateId || "—"}）`;
    case "milestone.overdue":
      return `⚠️ 逾期：${ev.title}（到期 ${ev.dueDate}${ev.amount != null ? ` · NT$ ${ev.amount.toLocaleString()}` : ""}）`;
    case "milestone.due":
      return `⏰ ${ev.bucket} 到期提醒：${ev.title}（${ev.dueDate}）`;
  }
}

export async function dispatchWebhook(
  url: string,
  ev: WebhookEvent,
  opts: { secret?: string | null; timeoutMs?: number } = {},
): Promise<{ ok: boolean; status?: number; reason?: string }> {
  if (!url || !/^https?:\/\//i.test(url)) {
    return { ok: false, reason: "invalid url" };
  }
  const body = JSON.stringify({
    event: ev.type,
    summary: summaryFor(ev),
    text: summaryFor(ev), // Slack-compatible fallback
    data: ev,
    timestamp: new Date().toISOString(),
    source: "docgen-tw",
  });

  const headers: Record<string, string> = { "content-type": "application/json" };
  if (opts.secret) {
    const sig = crypto.createHmac("sha256", opts.secret).update(body).digest("hex");
    headers["x-docgen-signature"] = `sha256=${sig}`;
  }

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), opts.timeoutMs ?? 5_000);
  try {
    const res = await fetch(url, { method: "POST", headers, body, signal: controller.signal });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { ok: false, status: res.status, reason: text.slice(0, 200) };
    }
    return { ok: true, status: res.status };
  } catch (err) {
    return { ok: false, reason: (err as Error).message };
  } finally {
    clearTimeout(t);
  }
}

/** Fire-and-forget convenience. Looks up the user's webhook by uid and sends. */
export async function fireUserWebhook(
  uid: string | null | undefined,
  ev: WebhookEvent,
): Promise<void> {
  if (!uid || !process.env.DATABASE_URL) return;
  try {
    const { prisma } = await import("./prisma");
    const profile = await prisma.billingProfile.findUnique({
      where: { uid },
      select: { webhookUrl: true, webhookSecret: true },
    });
    if (!profile?.webhookUrl) return;
    const r = await dispatchWebhook(profile.webhookUrl, ev, { secret: profile.webhookSecret });
    if (!r.ok) console.error("[webhook] dispatch failed", uid, ev.type, r.reason);
  } catch (err) {
    console.error("[webhook] fireUserWebhook err", err);
  }
}
