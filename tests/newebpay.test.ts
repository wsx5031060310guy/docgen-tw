import { describe, expect, it } from "vitest";
import { computeTradeSha, encodeTradeInfo, decodeTradeInfo } from "@/lib/payment/newebpay";

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
    const { createHash } = require("node:crypto");
    const expected = createHash("sha256")
      .update(`HashKey=${HASH_KEY}&${hex}&HashIV=${HASH_IV}`)
      .digest("hex")
      .toUpperCase();

    expect(got).toBe(expected);
  });

  it("does NOT match the wrong formula with TradeInfo= prefix", () => {
    const hex = "abcdef0123456789";
    const got = computeTradeSha(hex, HASH_KEY, HASH_IV);

    const { createHash } = require("node:crypto");
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
    const decoded = decodeTradeInfo(hex, HASH_KEY, HASH_IV);
    expect(decoded.MerchantOrderNo).toBe("ORD20260510001");
    expect(decoded.Amt).toBe("99");
    expect(decoded.Email).toBe("test@example.com");
  });
});
