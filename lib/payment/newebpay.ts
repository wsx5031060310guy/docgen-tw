import { createCipheriv, createDecipheriv, createHash } from "node:crypto";

export type NewebpayConfig = {
  merchantId: string;
  hashKey: string;
  hashIv: string;
  apiBase: string;
};

export function getNewebpayConfig(): NewebpayConfig {
  // .trim() defensively — pasting from the NewebPay merchant console often
  // brings along an invisible trailing whitespace that makes AES + SHA fail.
  return {
    merchantId: (process.env.NEWEBPAY_MERCHANT_ID || "").trim(),
    hashKey: (process.env.NEWEBPAY_HASH_KEY || "").trim(),
    hashIv: (process.env.NEWEBPAY_HASH_IV || "").trim(),
    apiBase: (process.env.NEWEBPAY_API_BASE || "https://ccore.newebpay.com").trim(),
  };
}

type TradeInfoFields = Record<string, string | number>;

function pkcs7Pad(buf: Buffer, blockSize: number): Buffer {
  const pad = blockSize - (buf.length % blockSize);
  return Buffer.concat([buf, Buffer.alloc(pad, pad)]);
}

function pkcs7Unpad(buf: Buffer): Buffer {
  const pad = buf[buf.length - 1];
  return buf.subarray(0, buf.length - pad);
}

export function encodeTradeInfo(fields: TradeInfoFields, hashKey: string, hashIv: string): string {
  const params = new URLSearchParams(Object.entries(fields).map(([k, v]) => [k, String(v)]));
  const data = params.toString();
  const padded = pkcs7Pad(Buffer.from(data, "utf8"), 32);
  const cipher = createCipheriv("aes-256-cbc", Buffer.from(hashKey, "utf8"), Buffer.from(hashIv, "utf8"));
  cipher.setAutoPadding(false);
  return Buffer.concat([cipher.update(padded), cipher.final()]).toString("hex");
}

export function decodeTradeInfo(hex: string, hashKey: string, hashIv: string): Record<string, string> {
  const decipher = createDecipheriv("aes-256-cbc", Buffer.from(hashKey, "utf8"), Buffer.from(hashIv, "utf8"));
  decipher.setAutoPadding(false);
  const dec = Buffer.concat([decipher.update(Buffer.from(hex, "hex")), decipher.final()]);
  const stripped = pkcs7Unpad(dec).toString("utf8");
  return Object.fromEntries(new URLSearchParams(stripped));
}

// SHA256 input format per MPG 1.1 spec: `HashKey={KEY}&{HEX}&HashIV={IV}`.
// The encrypted hex is concatenated raw — there is NO `TradeInfo=` prefix.
// (Older notes claiming a `TradeInfo=` prefix were wrong; the canonical
// node-newebpay SDK and the official NewebPay PHP sample both omit it.)
export function computeTradeSha(tradeInfoHex: string, hashKey: string, hashIv: string): string {
  return createHash("sha256")
    .update(`HashKey=${hashKey}&${tradeInfoHex}&HashIV=${hashIv}`)
    .digest("hex")
    .toUpperCase();
}

export function buildCheckoutPayload(input: {
  merchantOrderNo: string;
  amount: number;
  itemDesc: string;
  email: string;
  returnUrl: string;
  notifyUrl: string;
  clientBackUrl: string;
}) {
  const { merchantId, hashKey, hashIv, apiBase } = getNewebpayConfig();
  if (!merchantId || !hashKey || !hashIv) {
    throw new Error("newebpay env not configured");
  }

  const fields: TradeInfoFields = {
    MerchantID: merchantId,
    MerchantOrderNo: input.merchantOrderNo,
    Amt: input.amount,
    ItemDesc: input.itemDesc.slice(0, 50),
    Email: input.email,
    TimeStamp: Math.floor(Date.now() / 1000),
    Version: "2.0",
    RespondType: "JSON",
    ReturnURL: input.returnUrl,
    NotifyURL: input.notifyUrl,
    ClientBackURL: input.clientBackUrl,
  };

  const tradeInfo = encodeTradeInfo(fields, hashKey, hashIv);
  const tradeSha = computeTradeSha(tradeInfo, hashKey, hashIv);

  return {
    endpoint: `${apiBase}/MPG/mpg_gateway`,
    params: {
      MerchantID: merchantId,
      TradeInfo: tradeInfo,
      TradeSha: tradeSha,
      Version: "2.0",
    },
  };
}
