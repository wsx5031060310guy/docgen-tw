// Anonymous-identity + usage-metering helpers.
// Identity: a random `uid` stored in cookie `docgen_uid` (httpOnly: false so
// client JS can read it for UI banners; doesn't hold any secrets).
// Quota: FREE = 3 contracts / calendar month (Asia/Taipei); PRO = unlimited.

import crypto from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

export const FREE_MONTHLY_QUOTA = 3;
export const UID_COOKIE = "docgen_uid";
export const UID_COOKIE_MAX_AGE = 60 * 60 * 24 * 365 * 2; // 2 years

export function thisMonth(now: Date = new Date()): string {
  // Format YYYY-MM in Asia/Taipei. We approximate by shifting +08:00.
  const tpe = new Date(now.getTime() + 8 * 3600 * 1000);
  return `${tpe.getUTCFullYear()}-${String(tpe.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function newUid(): string {
  return crypto.randomBytes(18).toString("base64url");
}

/** Read uid from `Cookie` header on a request. Returns null if absent. */
export function readUidFromRequest(req: Request): string | null {
  const cookie = req.headers.get("cookie") || "";
  const m = cookie.match(/(?:^|;\s*)docgen_uid=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

/** Read uid from server-component cookies(). Returns null if absent. */
export async function readUidFromCookies(): Promise<string | null> {
  const c = await cookies();
  return c.get(UID_COOKIE)?.value ?? null;
}

export interface BillingStatus {
  uid: string;
  email: string | null;
  plan: "FREE" | "PRO";
  periodEnd: Date | null;
  month: string;
  usedThisMonth: number;
  remaining: number | "unlimited";
  quotaExceeded: boolean;
}

async function getProfile(uid: string) {
  if (!process.env.DATABASE_URL) return null;
  return prisma.billingProfile.findUnique({ where: { uid } });
}

function planFor(profile: { plan: string; periodEnd: Date | null } | null): "FREE" | "PRO" {
  if (!profile) return "FREE";
  if (profile.plan !== "PRO") return "FREE";
  if (!profile.periodEnd) return "FREE";
  return profile.periodEnd > new Date() ? "PRO" : "FREE";
}

export async function getBillingStatus(uid: string): Promise<BillingStatus> {
  const month = thisMonth();
  if (!process.env.DATABASE_URL) {
    return {
      uid, email: null, plan: "FREE", periodEnd: null, month,
      usedThisMonth: 0, remaining: FREE_MONTHLY_QUOTA, quotaExceeded: false,
    };
  }
  const [profile, usage] = await Promise.all([
    getProfile(uid),
    prisma.usage.findUnique({ where: { uid_month: { uid, month } } }),
  ]);
  const plan = planFor(profile);
  const used = usage?.count ?? 0;
  if (plan === "PRO") {
    return {
      uid, email: profile?.email ?? null, plan: "PRO",
      periodEnd: profile?.periodEnd ?? null, month,
      usedThisMonth: used, remaining: "unlimited", quotaExceeded: false,
    };
  }
  const remaining = Math.max(0, FREE_MONTHLY_QUOTA - used);
  return {
    uid, email: profile?.email ?? null, plan: "FREE",
    periodEnd: null, month, usedThisMonth: used,
    remaining, quotaExceeded: remaining <= 0,
  };
}

/** Atomically increment usage; safe to call after a successful contract create. */
export async function incrementUsage(uid: string) {
  if (!process.env.DATABASE_URL) return;
  const month = thisMonth();
  await prisma.usage.upsert({
    where: { uid_month: { uid, month } },
    create: { uid, month, count: 1 },
    update: { count: { increment: 1 } },
  });
}

/** Activate PRO for `days` from now (default 30). Called from NewebPay notify. */
export async function activatePro(input: {
  uid: string;
  email?: string | null;
  orderId: string;
  days?: number;
}) {
  const days = input.days ?? 30;
  const existing = await prisma.billingProfile.findUnique({ where: { uid: input.uid } });
  const baseline =
    existing?.periodEnd && existing.periodEnd > new Date() ? existing.periodEnd : new Date();
  const periodEnd = new Date(baseline.getTime() + days * 86400_000);
  await prisma.billingProfile.upsert({
    where: { uid: input.uid },
    create: {
      uid: input.uid,
      email: input.email ?? null,
      plan: "PRO",
      periodEnd,
      lastOrderId: input.orderId,
    },
    update: {
      email: input.email ?? existing?.email ?? null,
      plan: "PRO",
      periodEnd,
      lastOrderId: input.orderId,
    },
  });
}
