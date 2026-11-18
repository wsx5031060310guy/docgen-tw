import crypto from "node:crypto";
import { Prisma } from "@prisma/client";
import { AI_DAILY_LIMIT, AI_DAILY_LIMIT_PRO, taipeiDate } from "./ai-contract";
import { planFor } from "./billing";
import { prisma } from "./prisma";

/** Counts one AI call against today's (Asia/Taipei) quota: PRO 200, everyone else 30. */
export async function consumeAiQuota(uid: string): Promise<{ ok: boolean; limit: number }> {
  if (!process.env.DATABASE_URL) return { ok: true, limit: AI_DAILY_LIMIT };
  const profile = await prisma.billingProfile.upsert({
    where: { uid },
    create: { uid },
    update: {},
  });
  const limit = planFor(profile) === "PRO" ? AI_DAILY_LIMIT_PRO : AI_DAILY_LIMIT;
  const day = taipeiDate(new Date());
  const sameDay = await prisma.billingProfile.updateMany({
    where: { uid, aiDay: day, aiCount: { lt: limit } },
    data: { aiCount: { increment: 1 } },
  });
  if (sameDay.count === 1) return { ok: true, limit };
  const newDay = await prisma.billingProfile.updateMany({
    where: { uid, OR: [{ aiDay: null }, { aiDay: { not: day } }] },
    data: { aiDay: day, aiCount: 1 },
  });
  if (newDay.count === 1) return { ok: true, limit };
  // A concurrent request rolled the day over between our two updates: count against today.
  const retry = await prisma.billingProfile.updateMany({
    where: { uid, aiDay: day, aiCount: { lt: limit } },
    data: { aiCount: { increment: 1 } },
  });
  return { ok: retry.count === 1, limit };
}

export async function createDraft(
  uid: string,
  input: { templateId: string; values: Record<string, string>; transcript?: string | null },
) {
  return prisma.contractDraft.create({
    data: {
      uid,
      token: crypto.randomBytes(24).toString("base64url"),
      templateId: input.templateId,
      values: input.values,
      transcript: input.transcript ?? null,
      expiresAt: new Date(Date.now() + 7 * 86_400_000),
    },
    select: { id: true, token: true },
  });
}

export async function findDraft(id: string, token: string) {
  const draft = await prisma.contractDraft.findUnique({ where: { id } });
  if (!draft || draft.expiresAt <= new Date()) return null;
  const expected = Buffer.from(draft.token);
  const provided = Buffer.from(token);
  if (expected.length !== provided.length || !crypto.timingSafeEqual(expected, provided)) return null;
  return draft;
}

export async function claimDraft(id: string, token: string) {
  const draft = await findDraft(id, token);
  if (!draft) return null;
  const claimed = await prisma.contractDraft.updateMany({
    where: { id, usedAt: null, expiresAt: { gt: new Date() } },
    data: { usedAt: new Date() },
  });
  return claimed.count === 1 ? draft : null;
}

export function releaseDraft(id: string) {
  return prisma.contractDraft.update({ where: { id }, data: { usedAt: null } });
}

export function markDraftContract(id: string, contractId: string) {
  return prisma.contractDraft.update({ where: { id }, data: { contractId } });
}

export async function issueLinkCode(uid: string): Promise<{ code: string; expiresAt: Date }> {
  await prisma.billingProfile.upsert({ where: { uid }, create: { uid }, update: {} });
  const expiresAt = new Date(Date.now() + 10 * 60_000);
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const code = String(crypto.randomInt(0, 100_000_000)).padStart(8, "0");
    try {
      await prisma.billingProfile.update({
        where: { uid },
        data: { lineLinkCode: code, lineLinkCodeExpires: expiresAt },
      });
      return { code, expiresAt };
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")) throw error;
    }
  }
  throw new Error("Unable to issue unique LINE link code");
}

/** Returns a short account hint (masked email or uid tail) on success, null on failure. */
export async function bindLine(lineUserId: string, code: string): Promise<string | null> {
  return prisma.$transaction(async (tx) => {
    const now = new Date();
    const owner = await tx.billingProfile.findFirst({
      where: { lineLinkCode: code, lineLinkCodeExpires: { gt: now } },
      select: { uid: true, email: true },
    });
    if (!owner) return null;
    const claimed = await tx.billingProfile.updateMany({
      where: { uid: owner.uid, lineLinkCode: code, lineLinkCodeExpires: { gt: now } },
      data: { lineLinkCode: null, lineLinkCodeExpires: null },
    });
    if (claimed.count !== 1) return null;
    await tx.billingProfile.updateMany({
      where: { lineUserId, uid: { not: owner.uid } },
      data: { lineUserId: null },
    });
    await tx.billingProfile.update({ where: { uid: owner.uid }, data: { lineUserId } });
    const [user, domain] = (owner.email ?? "").split("@");
    return user && domain ? `${user.slice(0, 2)}***@${domain}` : `識別碼末四碼 ${owner.uid.slice(-4)}`;
  });
}

export function unlinkLine(uid: string) {
  return prisma.billingProfile.updateMany({
    where: { uid },
    data: { lineUserId: null, lineLinkCode: null, lineLinkCodeExpires: null },
  });
}

export async function isLineLinked(uid: string): Promise<boolean> {
  const profile = await prisma.billingProfile.findUnique({
    where: { uid },
    select: { lineUserId: true },
  });
  return Boolean(profile?.lineUserId);
}

export async function findUidByLine(lineUserId: string): Promise<string | null> {
  const profile = await prisma.billingProfile.findUnique({
    where: { lineUserId },
    select: { uid: true },
  });
  return profile?.uid ?? null;
}
