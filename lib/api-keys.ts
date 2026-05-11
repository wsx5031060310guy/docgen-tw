// API key helpers. We store only the SHA-256 hash of the raw key, plus a
// short prefix so users can recognise their own keys in /settings.
// Raw key format: `dk_<32 url-safe base64 chars>`.

import crypto from "node:crypto";
import { prisma } from "./prisma";

const RAW_PREFIX = "dk_";

export interface IssuedKey {
  id: string;
  rawKey: string;        // shown once at creation, never again
  prefix: string;
  label: string | null;
  createdAt: Date;
}

function hash(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

export async function issueApiKey(uid: string, label?: string | null): Promise<IssuedKey> {
  const raw = RAW_PREFIX + crypto.randomBytes(24).toString("base64url");
  const prefix = raw.slice(0, 8);
  const row = await prisma.apiKey.create({
    data: {
      uid,
      hashedKey: hash(raw),
      prefix,
      label: label?.trim() || null,
    },
  });
  return { id: row.id, rawKey: raw, prefix, label: row.label, createdAt: row.createdAt };
}

export async function listKeysForUid(uid: string) {
  return prisma.apiKey.findMany({
    where: { uid },
    orderBy: { createdAt: "desc" },
    select: { id: true, prefix: true, label: true, lastUsedAt: true, revokedAt: true, createdAt: true },
  });
}

export async function revokeKey(uid: string, id: string) {
  return prisma.apiKey.updateMany({
    where: { id, uid, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

/** Resolve a raw bearer token to its owning uid. Returns null if invalid/revoked. */
export async function resolveBearer(raw: string): Promise<{ uid: string; keyId: string } | null> {
  if (!raw || !raw.startsWith(RAW_PREFIX)) return null;
  const row = await prisma.apiKey.findUnique({
    where: { hashedKey: hash(raw) },
    select: { id: true, uid: true, revokedAt: true },
  });
  if (!row || row.revokedAt) return null;
  // Touch lastUsedAt (best-effort, don't await)
  prisma.apiKey.update({ where: { id: row.id }, data: { lastUsedAt: new Date() } }).catch(() => undefined);
  return { uid: row.uid, keyId: row.id };
}
