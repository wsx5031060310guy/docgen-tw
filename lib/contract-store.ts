// In-memory contract store for the two-party signing flow. Persists across
// hot reloads via globalThis caching. Swap to Prisma once DATABASE_URL is
// pointed at a real Postgres (the schema already covers all fields here).

import crypto from "node:crypto";

export type SigningStatus =
  | "UNSIGNED"
  | "SENDER_SIGNED"
  | "AWAITING_RECIPIENT"
  | "FULLY_SIGNED";

export interface StoredContract {
  id: string;
  templateId: string;
  client: string;
  content: string;
  // Sender (party A) — signs at creation
  senderSignatureUrl: string | null;
  senderSignedAt: Date | null;
  senderSignatureHash: string | null;
  // Recipient (party B) — signs via shareable link
  recipientName: string | null;
  recipientEmail: string | null;
  recipientSignatureUrl: string | null;
  recipientSignedAt: Date | null;
  recipientSignatureHash: string | null;
  // Public signing token (recipient uses ?token= to access)
  signingToken: string;
  signingStatus: SigningStatus;
  // Audit
  senderIp: string | null;
  recipientIp: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const globalForStore = globalThis as unknown as {
  __docgenContracts?: StoredContract[];
};
const store: StoredContract[] =
  globalForStore.__docgenContracts ?? (globalForStore.__docgenContracts = []);

function makeId(): string {
  return crypto.randomBytes(8).toString("hex");
}

function makeToken(): string {
  return crypto.randomBytes(24).toString("base64url");
}

export function createContract(input: {
  templateId: string;
  client: string;
  content: string;
  senderSignatureUrl: string;
  senderSignatureHash: string;
  senderIp: string;
  recipientName?: string | null;
  recipientEmail?: string | null;
}): StoredContract {
  const now = new Date();
  const c: StoredContract = {
    id: makeId(),
    templateId: input.templateId,
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
    signingToken: makeToken(),
    signingStatus: "AWAITING_RECIPIENT",
    senderIp: input.senderIp,
    recipientIp: null,
    createdAt: now,
    updatedAt: now,
  };
  store.unshift(c);
  return c;
}

export function findContractById(id: string): StoredContract | undefined {
  return store.find((c) => c.id === id);
}

export function findContractByToken(id: string, token: string): StoredContract | undefined {
  const c = findContractById(id);
  if (!c) return undefined;
  // Constant-time compare to discourage token brute-force
  const expected = Buffer.from(c.signingToken);
  const provided = Buffer.from(token);
  if (expected.length !== provided.length) return undefined;
  if (!crypto.timingSafeEqual(expected, provided)) return undefined;
  return c;
}

export function recordRecipientSignature(input: {
  id: string;
  token: string;
  recipientSignatureUrl: string;
  recipientSignatureHash: string;
  recipientIp: string;
  recipientName?: string | null;
}): StoredContract | { error: string } {
  const c = findContractByToken(input.id, input.token);
  if (!c) return { error: "簽署連結無效或已過期" };
  if (c.signingStatus === "FULLY_SIGNED") return { error: "本合約已完成簽署" };

  c.recipientSignatureUrl = input.recipientSignatureUrl;
  c.recipientSignatureHash = input.recipientSignatureHash;
  c.recipientSignedAt = new Date();
  c.recipientIp = input.recipientIp;
  if (input.recipientName) c.recipientName = input.recipientName;
  c.signingStatus = "FULLY_SIGNED";
  c.updatedAt = new Date();
  return c;
}
