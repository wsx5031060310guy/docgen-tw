// Persistence layer for contracts. Uses Prisma when DATABASE_URL is set,
// otherwise falls back to an in-memory store (dev-only — single instance,
// data lost on restart). Same exported API in both modes.

import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";

export type SigningStatus =
  | "UNSIGNED"
  | "SENDER_SIGNED"
  | "AWAITING_RECIPIENT"
  | "FULLY_SIGNED";

export interface StoredContract {
  id: string;
  templateId: string;
  values: Record<string, string>;
  client: string;
  content: string;
  senderSignatureUrl: string | null;
  senderSignedAt: Date | null;
  senderSignatureHash: string | null;
  recipientName: string | null;
  recipientEmail: string | null;
  recipientSignatureUrl: string | null;
  recipientSignedAt: Date | null;
  recipientSignatureHash: string | null;
  signingToken: string;
  signingStatus: SigningStatus;
  senderIp: string | null;
  recipientIp: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const useDb = () => Boolean(process.env.DATABASE_URL);

const globalForStore = globalThis as unknown as {
  __docgenContracts?: StoredContract[];
};
const memStore: StoredContract[] =
  globalForStore.__docgenContracts ?? (globalForStore.__docgenContracts = []);

const makeId = () => crypto.randomBytes(8).toString("hex");
const makeToken = () => crypto.randomBytes(24).toString("base64url");

// Map Prisma row → StoredContract. Prisma `Contract` model uses a slimmer
// schema (`signatureUrl` etc) — we widen it here so callers see the full type.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromRow(r: any): StoredContract {
  return {
    id: r.id,
    templateId: r.templateId ?? "",
    values: (r.values ?? {}) as Record<string, string>,
    client: r.client ?? "",
    content: r.content ?? "",
    senderSignatureUrl: r.signatureUrl ?? null,
    senderSignedAt: r.senderSignedAt ?? null,
    senderSignatureHash: r.senderSignatureHash ?? null,
    recipientName: r.recipientName ?? null,
    recipientEmail: r.recipientEmail ?? null,
    recipientSignatureUrl: r.recipientSignatureUrl ?? null,
    recipientSignedAt: r.recipientSignedAt ?? null,
    recipientSignatureHash: r.recipientSignatureHash ?? null,
    signingToken: r.signingToken ?? "",
    signingStatus: (r.signingStatus ?? "UNSIGNED") as SigningStatus,
    senderIp: r.senderIp ?? null,
    recipientIp: r.recipientIp ?? null,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

export async function createContract(input: {
  templateId: string;
  values: Record<string, string>;
  client: string;
  content: string;
  senderSignatureUrl: string;
  senderSignatureHash: string;
  senderIp: string;
  recipientName?: string | null;
  recipientEmail?: string | null;
  uid?: string | null;
}): Promise<StoredContract> {
  const now = new Date();
  const token = makeToken();

  if (useDb()) {
    const row = await prisma.contract.create({
      data: {
        templateId: input.templateId,
        values: input.values as object,
        client: input.client,
        content: input.content,
        signatureUrl: input.senderSignatureUrl,
        senderSignedAt: now,
        senderSignatureHash: input.senderSignatureHash,
        senderIp: input.senderIp,
        recipientName: input.recipientName ?? null,
        recipientEmail: input.recipientEmail ?? null,
        signingToken: token,
        signingStatus: "AWAITING_RECIPIENT",
        uid: input.uid ?? null,
      },
    });
    return fromRow(row);
  }

  const c: StoredContract = {
    id: makeId(),
    templateId: input.templateId,
    values: input.values,
    client: input.client,
    content: input.content,
    senderSignatureUrl: input.senderSignatureUrl,
    senderSignedAt: now,
    senderSignatureHash: input.senderSignatureHash,
    recipientName: input.recipientName ?? null,
    recipientEmail: input.recipientEmail ?? null,
    recipientSignatureUrl: null,
    recipientSignedAt: null,
    recipientSignatureHash: null,
    signingToken: token,
    signingStatus: "AWAITING_RECIPIENT",
    senderIp: input.senderIp,
    recipientIp: null,
    createdAt: now,
    updatedAt: now,
  };
  memStore.unshift(c);
  return c;
}

export async function findContractById(id: string): Promise<StoredContract | undefined> {
  if (useDb()) {
    const row = await prisma.contract.findUnique({ where: { id } });
    return row ? fromRow(row) : undefined;
  }
  return memStore.find((c) => c.id === id);
}

export async function findContractByToken(
  id: string,
  token: string,
): Promise<StoredContract | undefined> {
  const c = await findContractById(id);
  if (!c || !c.signingToken) return undefined;
  const expected = Buffer.from(c.signingToken);
  const provided = Buffer.from(token);
  if (expected.length !== provided.length) return undefined;
  if (!crypto.timingSafeEqual(expected, provided)) return undefined;
  return c;
}

export async function recordRecipientSignature(input: {
  id: string;
  token: string;
  recipientSignatureUrl: string;
  recipientSignatureHash: string;
  recipientIp: string;
  recipientName?: string | null;
}): Promise<StoredContract | { error: string }> {
  const c = await findContractByToken(input.id, input.token);
  if (!c) return { error: "簽署連結無效或已過期" };
  if (c.signingStatus === "FULLY_SIGNED") return { error: "本合約已完成簽署" };

  if (useDb()) {
    const updated = await prisma.contract.update({
      where: { id: input.id },
      data: {
        recipientSignatureUrl: input.recipientSignatureUrl,
        recipientSignatureHash: input.recipientSignatureHash,
        recipientSignedAt: new Date(),
        recipientIp: input.recipientIp,
        recipientName: input.recipientName ?? c.recipientName,
        signingStatus: "FULLY_SIGNED",
      },
    });
    return fromRow(updated);
  }

  c.recipientSignatureUrl = input.recipientSignatureUrl;
  c.recipientSignatureHash = input.recipientSignatureHash;
  c.recipientSignedAt = new Date();
  c.recipientIp = input.recipientIp;
  if (input.recipientName) c.recipientName = input.recipientName;
  c.signingStatus = "FULLY_SIGNED";
  c.updatedAt = new Date();
  return c;
}
