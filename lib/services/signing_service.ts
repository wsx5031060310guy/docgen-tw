import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { put } from "@vercel/blob";

export interface SignatureRecord {
  url: string;
  filename: string;
  sha256: string;
}

// Strategy:
//   - Production / Vercel: use @vercel/blob (BLOB_READ_WRITE_TOKEN must be set,
//     auto-injected when the Blob store is connected to the Vercel project)
//   - Local dev (no token): fall back to public/signatures/ on disk
// Keeping both paths in one file avoids leaking storage choice into callers.

const hasBlobToken = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);

export async function persistSignaturePng(
  contractId: string,
  base64Image: string,
): Promise<SignatureRecord> {
  const base64Data = base64Image.replace(/^data:image\/png;base64,/, "");
  const sha256 = crypto.createHash("sha256").update(base64Data).digest("hex");
  const filename = `sig_${contractId}_${Date.now()}.png`;
  const buf = Buffer.from(base64Data, "base64");

  if (hasBlobToken()) {
    const blob = await put(`signatures/${filename}`, buf, {
      access: "public",
      contentType: "image/png",
      addRandomSuffix: false,
    });
    return { url: blob.url, filename, sha256 };
  }

  // Local fs fallback (dev only; ephemeral on Vercel serverless).
  const sigDir = path.join(process.cwd(), "public", "signatures");
  if (!fs.existsSync(sigDir)) fs.mkdirSync(sigDir, { recursive: true });
  fs.writeFileSync(path.join(sigDir, filename), buf);
  return { url: `/signatures/${filename}`, filename, sha256 };
}

export function buildAuditTrail(opts: {
  contractId: string;
  ip: string;
  userAgent: string;
  partyAHash: string;
  partyBHash: string;
}) {
  return {
    contractId: opts.contractId,
    signedAt: new Date().toISOString(),
    ip: opts.ip,
    userAgent: opts.userAgent,
    signatureHashA: opts.partyAHash,
    signatureHashB: opts.partyBHash,
  };
}
