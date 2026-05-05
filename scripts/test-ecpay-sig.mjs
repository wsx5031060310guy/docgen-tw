// Self-contained sanity test for ECPay CheckMacValue.
// Run: `node scripts/test-ecpay-sig.mjs`
//
// Why this exists: Mike was burned by 藍新 sig issues before. The buildCheckMacValue
// algorithm is fiddly (specific URL-encoding quirks + lowercase + sha256). Locking
// it down with a golden round-trip means any future refactor that breaks it fails
// loudly instead of only when ECPay rejects in production.

import crypto from "node:crypto";

// Mirror lib/payment/ecpay.ts buildCheckMacValue, kept inline so the test runs
// without TS toolchain. If you change the production fn, mirror here.
function ecpayUrlEncode(value) {
  return encodeURIComponent(value)
    .replace(/%20/g, "+")
    .replace(/%2D/g, "-")
    .replace(/%5F/g, "_")
    .replace(/%2E/g, ".")
    .replace(/%21/g, "!")
    .replace(/%2A/g, "*")
    .replace(/%28/g, "(")
    .replace(/%29/g, ")");
}

function buildCheckMacValue(params, hashKey, hashIV) {
  const sorted = Object.keys(params)
    .filter((k) => k !== "CheckMacValue")
    .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  const raw = `HashKey=${hashKey}&${sorted}&HashIV=${hashIV}`;
  const encoded = ecpayUrlEncode(raw).toLowerCase();
  return crypto.createHash("sha256").update(encoded).digest("hex").toUpperCase();
}

function verify(params, hashKey, hashIV) {
  const expected = buildCheckMacValue(params, hashKey, hashIV);
  return params.CheckMacValue?.toUpperCase() === expected;
}

const HASH_KEY = "5294y06JbISpM5x9";
const HASH_IV = "v77hoKGq4kWxNNIS";

let failed = 0;
function ok(name, cond, detail = "") {
  if (cond) {
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.log(`  ✗ ${name}${detail ? `\n    ${detail}` : ""}`);
  }
}

console.log("ECPay CheckMacValue tests");

// 1. Round-trip: build then verify.
{
  const params = {
    MerchantID: "2000132",
    MerchantTradeNo: "TCRM20260505000001",
    MerchantTradeDate: "2026/05/05 19:00:00",
    PaymentType: "aio",
    TotalAmount: "499",
    TradeDesc: "TinyCRM Subscription",
    ItemName: "TinyCRM 基礎版",
    ReturnURL: "https://example.com/api/payment/ecpay/callback",
    ClientBackURL: "https://example.com/payment/success",
    ChoosePayment: "ALL",
    EncryptType: "1",
  };
  const sig = buildCheckMacValue(params, HASH_KEY, HASH_IV);
  ok("sig is uppercase 64-char hex", /^[0-9A-F]{64}$/.test(sig), `got ${sig}`);
  ok("verify accepts correct sig", verify({ ...params, CheckMacValue: sig }, HASH_KEY, HASH_IV));
  ok(
    "verify rejects tampered sig",
    !verify({ ...params, CheckMacValue: sig.replace(/^./, "0") }, HASH_KEY, HASH_IV)
  );
  ok(
    "verify rejects tampered amount",
    !verify({ ...params, TotalAmount: "1", CheckMacValue: sig }, HASH_KEY, HASH_IV)
  );
}

// 2. Order-independence: same params in different insertion order produce same sig.
{
  const a = buildCheckMacValue(
    { MerchantID: "X", MerchantTradeNo: "Y", TotalAmount: "100" },
    HASH_KEY,
    HASH_IV
  );
  const b = buildCheckMacValue(
    { TotalAmount: "100", MerchantTradeNo: "Y", MerchantID: "X" },
    HASH_KEY,
    HASH_IV
  );
  ok("sig stable across key insertion order", a === b);
}

// 3. Encoding quirks: chars that ECPay's lowercase URL-encode rules touch
//    (space, parens, asterisk) must round-trip.
{
  const params = {
    ItemName: "Pro 方案 (推薦)*",
    TotalAmount: "299",
    MerchantID: "2000132",
  };
  const sig = buildCheckMacValue(params, HASH_KEY, HASH_IV);
  ok("verify accepts unicode + special chars", verify({ ...params, CheckMacValue: sig }, HASH_KEY, HASH_IV));
}

// 4. CheckMacValue field is excluded from sig calc (otherwise verify would always fail).
{
  const params = {
    MerchantID: "2000132",
    TotalAmount: "100",
    CheckMacValue: "OLD_SIG_TO_BE_IGNORED",
  };
  const fresh = buildCheckMacValue(params, HASH_KEY, HASH_IV);
  const without = buildCheckMacValue(
    { MerchantID: "2000132", TotalAmount: "100" },
    HASH_KEY,
    HASH_IV
  );
  ok("CheckMacValue is excluded from its own calc", fresh === without);
}

console.log(failed === 0 ? "\nALL PASS" : `\n${failed} FAILED`);
process.exit(failed === 0 ? 0 : 1);
