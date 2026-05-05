import fs from "fs";
import path from "path";
import crypto from "crypto";

export interface SignatureRecord {
  url: string;
  filename: string;
  sha256: string;
}

export function persistSignaturePng(contractId: string, base64Image: string): SignatureRecord {
  const sigDir = path.join(process.cwd(), "public", "signatures");
  if (!fs.existsSync(sigDir)) {
    fs.mkdirSync(sigDir, { recursive: true });
  }

  const filename = `sig_${contractId}_${Date.now()}.png`;
  const filepath = path.join(sigDir, filename);

  const base64Data = base64Image.replace(/^data:image\/png;base64,/, "");
  fs.writeFileSync(filepath, base64Data, "base64");

  const sha256 = crypto.createHash("sha256").update(base64Data).digest("hex");
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
