import { createCipheriv, createHash } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildCheckoutPayload, computeTradeSha, decodeTradeInfo, encodeTradeInfo, getNewebpayConfig, readPaymentCallback,
} from "@/lib/payment/newebpay";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("NewebPay API base", () => {
  it("falls back to ccore outside production", () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("NEWEBPAY_API_BASE", "");

    expect(getNewebpayConfig().apiBase).toBe("https://ccore.newebpay.com");
  });

  it("rejects non-whitelisted gateways outside production", () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("NEWEBPAY_API_BASE", "https://example.com");

    expect(() => getNewebpayConfig()).toThrow("只允許");
  });

  it.each([
    ["missing API base", "", "development"],
    ["ccore API base", "https://ccore.newebpay.com", "development"],
  ])("rejects %s when VERCEL_ENV is production", (_name, apiBase, nodeEnv) => {
    vi.stubEnv("NODE_ENV", nodeEnv);
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("NEWEBPAY_API_BASE", apiBase);

    expect(() => getNewebpayConfig()).toThrow(
      "Production 必須明確設定 NEWEBPAY_API_BASE=https://core.newebpay.com",
    );
  });

  it("accepts explicit core gateway in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEWEBPAY_API_BASE", "https://core.newebpay.com");

    expect(getNewebpayConfig().apiBase).toBe("https://core.newebpay.com");
  });
});

// Locks the NewebPay MPG SHA256 formula:
//   SHA256("HashKey={KEY}&{tradeInfoHex}&HashIV={IV}").toUpperCase()
// — there is NO "TradeInfo=" infix prefix. Past LLM-generated code
// repeatedly inserted that prefix and broke the live gateway with
// "交易資料 SHA 256 檢查不符合". This test guards against regression.
describe("NewebPay TradeSha", () => {
  const HASH_KEY = "12345678901234567890123456789012"; // 32 bytes
  const HASH_IV = "1234567890123456"; // 16 bytes

  it("matches HashKey={KEY}&{HEX}&HashIV={IV} formula (no TradeInfo= prefix)", () => {
    const hex = "abcdef0123456789";
    const got = computeTradeSha(hex, HASH_KEY, HASH_IV);

    // Independently compute expected with the canonical formula.
    const expected = createHash("sha256")
      .update(`HashKey=${HASH_KEY}&${hex}&HashIV=${HASH_IV}`)
      .digest("hex")
      .toUpperCase();

    expect(got).toBe(expected);
  });

  it("does NOT match the wrong formula with TradeInfo= prefix", () => {
    const hex = "abcdef0123456789";
    const got = computeTradeSha(hex, HASH_KEY, HASH_IV);

    const wrong = createHash("sha256")
      .update(`HashKey=${HASH_KEY}&TradeInfo=${hex}&HashIV=${HASH_IV}`)
      .digest("hex")
      .toUpperCase();

    expect(got).not.toBe(wrong);
  });

  it("encode → decode round-trips", () => {
    const fields = {
      MerchantID: "TEST123",
      MerchantOrderNo: "ORD20260510001",
      Amt: 99,
      ItemDesc: "DocGen 單份合約解鎖",
      Email: "test@example.com",
      TimeStamp: 1715300000,
      Version: "2.0",
      RespondType: "JSON",
      ReturnURL: "https://docgen.tw/api/payment/newebpay/return",
      NotifyURL: "https://docgen.tw/api/payment/newebpay/notify",
      ClientBackURL: "https://docgen.tw/checkout",
    };
    const hex = encodeTradeInfo(fields, HASH_KEY, HASH_IV);
    const decoded = Object.fromEntries(new URLSearchParams(decodeTradeInfo(hex, HASH_KEY, HASH_IV)));
    expect(decoded.MerchantOrderNo).toBe("ORD20260510001");
    expect(decoded.Amt).toBe("99");
    expect(decoded.Email).toBe("test@example.com");
  });
});

describe("NewebPay payment callback", () => {
  const HASH_KEY = "12345678901234567890123456789012";
  const HASH_IV = "1234567890123456";

  function encrypt(text: string) {
    const body = Buffer.from(text);
    const pad = 32 - (body.length % 32);
    const cipher = createCipheriv("aes-256-cbc", HASH_KEY, HASH_IV);
    cipher.setAutoPadding(false);
    return Buffer.concat([cipher.update(Buffer.concat([body, Buffer.alloc(pad, pad)])), cipher.final()]).toString("hex");
  }
  const read = (hex: string, sha = computeTradeSha(hex, HASH_KEY, HASH_IV)) =>
    readPaymentCallback(hex, sha, HASH_KEY, HASH_IV);
  const paid = (Message = "授權成功") =>
    JSON.stringify({
      Status: "SUCCESS", Message,
      Result: { Amt: 299, MerchantOrderNo: "DOC1", TradeNo: "T1", PaymentType: "CREDIT", PayTime: "2023-09-27 14:21:59" },
    });

  it("reads a signed JSON result at every padding length the gateway uses (1–32)", () => {
    const pads = new Set<number>();
    for (let i = 0; i < 32; i += 1) {
      const text = paid("x".repeat(i));
      pads.add(32 - (Buffer.byteLength(text) % 32));
      expect(read(encrypt(text))).toMatchObject({
        outcome: "PAID", merchantOrderNo: "DOC1", amount: 299, paymentType: "CREDIT",
      });
    }
    expect(pads.size).toBe(32);
  });

  it("tells paid, not yet paid and failed apart", () => {
    const outcome = (Status: string, PayTime?: string) =>
      read(encrypt(JSON.stringify({ Status, Result: { MerchantOrderNo: "DOC1", PayTime } }))).outcome;
    expect(outcome("SUCCESS", "2023-09-27 14:21:59")).toBe("PAID");
    expect(outcome("SUCCESS")).toBe("PENDING");
    expect(outcome("MPG03009", "2023-09-27 14:21:59")).toBe("FAILED");
  });

  it("checks TradeSha before decrypting", () => {
    const hex = encrypt(paid());
    const sha = computeTradeSha(hex, HASH_KEY, HASH_IV);
    expect(() => read(hex, "")).toThrow("TradeSha");
    expect(() => read(hex, sha.slice(0, -1))).toThrow("TradeSha");
    expect(() => read("zz", sha)).toThrow("TradeSha");
    expect(() => read(encrypt(paid("other")), sha)).toThrow("TradeSha");
  });

  it("rejects signed content that is not a payment result", () => {
    const request = encodeTradeInfo({ MerchantID: "TEST123", MerchantOrderNo: "DOC1", Amt: 299 }, HASH_KEY, HASH_IV);
    expect(() => read(request)).toThrow();
    // Same fields plus a status, still a form-encoded body rather than a JSON result.
    const flat = { Status: "SUCCESS", MerchantOrderNo: "DOC1", Amt: 299, PayTime: "2023-09-27 14:21:59" };
    expect(() => read(encodeTradeInfo(flat, HASH_KEY, HASH_IV))).toThrow();
    for (const body of [flat, { Status: "SUCCESS" }, { Status: "SUCCESS", Result: [] }, { Status: "SUCCESS", Result: { MerchantOrderNo: "" } }, null, "x"]) {
      expect(() => read(encrypt(JSON.stringify(body))), JSON.stringify(body)).toThrow("not a payment result");
    }
  });

  it("asks the gateway for the JSON results that readPaymentCallback understands", () => {
    vi.stubEnv("NEWEBPAY_MERCHANT_ID", "TEST123");
    vi.stubEnv("NEWEBPAY_HASH_KEY", HASH_KEY);
    vi.stubEnv("NEWEBPAY_HASH_IV", HASH_IV);
    vi.stubEnv("NEWEBPAY_API_BASE", "");
    const { params } = buildCheckoutPayload({
      merchantOrderNo: "DOC1", amount: 299, itemDesc: "Pro", email: "a@example.com",
      returnUrl: "http://localhost/r", notifyUrl: "http://localhost/n", clientBackUrl: "http://localhost/c",
    });
    const sent = new URLSearchParams(decodeTradeInfo(params.TradeInfo, HASH_KEY, HASH_IV));
    expect(sent.get("RespondType")).toBe("JSON");
    expect(sent.get("NotifyURL")).toBe("http://localhost/n");
  });

  it("fails closed when the keys are not configured", () => {
    const hex = encrypt(paid());
    expect(() => readPaymentCallback(hex, computeTradeSha(hex, "", ""), "", "")).toThrow();
  });
});
