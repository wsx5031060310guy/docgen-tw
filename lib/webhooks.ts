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

// Exponential backoff in minutes; ~5 retries spanning ~24h before giving up.
export const RETRY_BACKOFFS_MIN = [1, 5, 30, 120, 1440];
export const MAX_ATTEMPTS = RETRY_BACKOFFS_MIN.length + 1; // initial + retries

function nextRetryFor(attempt: number, now = new Date()): Date | null {
  if (attempt >= MAX_ATTEMPTS) return null;
  const minutes = RETRY_BACKOFFS_MIN[attempt - 1] ?? null;
  if (minutes == null) return null;
  return new Date(now.getTime() + minutes * 60_000);
}

function buildBody(ev: WebhookEvent): string {
  return JSON.stringify({
    event: ev.type,
    summary: summaryFor(ev),
    text: summaryFor(ev),
    data: ev,
    timestamp: new Date().toISOString(),
    source: "docgen-tw",
  });
}

function buildHeaders(body: string, secret?: string | null): Record<string, string> {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (secret) {
    const sig = crypto.createHmac("sha256", secret).update(body).digest("hex");
    headers["x-docgen-signature"] = `sha256=${sig}`;
  }
  return headers;
}

async function singleAttempt(url: string, body: string, secret: string | null | undefined, timeoutMs = 5_000) {
  const started = Date.now();
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: buildHeaders(body, secret),
      body,
      signal: controller.signal,
    });
    const durationMs = Date.now() - started;
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { ok: false, status: res.status, reason: text.slice(0, 200), durationMs };
    }
    return { ok: true, status: res.status, durationMs };
  } catch (err) {
    return { ok: false, reason: (err as Error).message, durationMs: Date.now() - started };
  } finally {
    clearTimeout(t);
  }
}

export async function dispatchWebhook(
  url: string,
  ev: WebhookEvent,
  opts: { secret?: string | null; timeoutMs?: number; uid?: string | null } = {},
): Promise<{ ok: boolean; status?: number; reason?: string; durationMs: number }> {
  if (!url || !/^https?:\/\//i.test(url)) {
    return { ok: false, reason: "invalid url", durationMs: 0 };
  }
  const body = buildBody(ev);
  const result = await singleAttempt(url, body, opts.secret, opts.timeoutMs);

  // Log delivery — only when we know who owns it (uid), so test pings stay quiet.
  if (opts.uid && process.env.DATABASE_URL) {
    (async () => {
      try {
        const { prisma } = await import("./prisma");
        const nextRetryAt = result.ok ? null : nextRetryFor(1);
        await prisma.webhookDelivery.create({
          data: {
            uid: opts.uid!,
            event: ev.type,
            url,
            payload: body,
            secret: opts.secret ?? null,
            status: result.status ?? null,
            ok: result.ok,
            durationMs: result.durationMs,
            reason: result.reason ?? null,
            attempt: 1,
            nextRetryAt,
            giveUpAt: result.ok ? null : nextRetryAt == null ? new Date() : null,
            succeeded: result.ok,
          },
        });
      } catch {}
    })();
  }

  return result;
}

const ADMIN_ALERT_THRESHOLD = Number(process.env.WEBHOOK_FAIL_ALERT_THRESHOLD || 10);
const ADMIN_ALERT_WEBHOOK = process.env.ADMIN_ALERT_WEBHOOK;

/** If 24h failure count exceeds threshold AND we haven't pinged in the last
 *  6h, ping the admin alert webhook. State is held in process memory so we
 *  don't spam between cron runs (Vercel functions are warm enough for the
 *  single-daily cron cadence we use). */
declare global {
  // eslint-disable-next-line no-var
  var __docgenAdminAlertLastAt: number | undefined;
}

async function maybeAlertAdmin(fails24h: number) {
  if (!ADMIN_ALERT_WEBHOOK) return;
  if (fails24h < ADMIN_ALERT_THRESHOLD) return;
  const last = globalThis.__docgenAdminAlertLastAt ?? 0;
  if (Date.now() - last < 6 * 3600_000) return;
  globalThis.__docgenAdminAlertLastAt = Date.now();
  const body = JSON.stringify({
    event: "admin.webhook_alarm",
    summary: `🚨 DocGen TW webhook 失敗 ${fails24h} 次（最近 24 小時，門檻 ${ADMIN_ALERT_THRESHOLD}）`,
    text: `🚨 DocGen TW webhook 失敗 ${fails24h} 次（最近 24 小時，門檻 ${ADMIN_ALERT_THRESHOLD}）`,
    data: { fails24h, threshold: ADMIN_ALERT_THRESHOLD },
    timestamp: new Date().toISOString(),
    source: "docgen-tw",
  });
  try {
    await fetch(ADMIN_ALERT_WEBHOOK, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
    });
  } catch (e) {
    console.error("[admin-alert] failed", (e as Error).message);
  }
}

/** Run by cron. Picks rows where nextRetryAt<=now and retries them. */
export async function retryPendingWebhooks(now = new Date()): Promise<{
  retried: number; succeeded: number; gaveUp: number; fails24h: number;
}> {
  if (!process.env.DATABASE_URL) return { retried: 0, succeeded: 0, gaveUp: 0, fails24h: 0 };
  const { prisma } = await import("./prisma");
  const due = await prisma.webhookDelivery.findMany({
    where: { succeeded: false, giveUpAt: null, nextRetryAt: { lte: now } },
    orderBy: { nextRetryAt: "asc" },
    take: 50,
  });
  let retried = 0, succeeded = 0, gaveUp = 0;
  for (const d of due) {
    if (!d.payload) {
      await prisma.webhookDelivery.update({
        where: { id: d.id },
        data: { giveUpAt: new Date(), reason: "(no payload to retry)" },
      });
      gaveUp++;
      continue;
    }
    retried++;
    const r = await singleAttempt(d.url, d.payload, d.secret);
    const attempt = d.attempt + 1;
    if (r.ok) {
      succeeded++;
      await prisma.webhookDelivery.update({
        where: { id: d.id },
        data: {
          succeeded: true,
          ok: true,
          attempt,
          status: r.status ?? null,
          durationMs: r.durationMs,
          reason: null,
          nextRetryAt: null,
        },
      });
    } else {
      const next = nextRetryFor(attempt, now);
      if (next == null) gaveUp++;
      await prisma.webhookDelivery.update({
        where: { id: d.id },
        data: {
          ok: false,
          attempt,
          status: r.status ?? null,
          durationMs: r.durationMs,
          reason: r.reason ?? null,
          nextRetryAt: next,
          giveUpAt: next == null ? now : null,
        },
      });
    }
  }
  // Count failures in the last 24 hours and maybe alert admin.
  const fails24h = await prisma.webhookDelivery.count({
    where: { ok: false, createdAt: { gte: new Date(now.getTime() - 86400_000) } },
  });
  await maybeAlertAdmin(fails24h);

  return { retried, succeeded, gaveUp, fails24h };
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
    const r = await dispatchWebhook(profile.webhookUrl, ev, {
      secret: profile.webhookSecret,
      uid,
    });
    if (!r.ok) console.error("[webhook] dispatch failed", uid, ev.type, r.reason);
  } catch (err) {
    console.error("[webhook] fireUserWebhook err", err);
  }
}
