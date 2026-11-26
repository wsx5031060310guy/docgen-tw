// NewebPay callback routes against a real Postgres (order claim + PRO activation).
//
//   createdb docgen_authtest
//   TEST_DATABASE_URL=postgresql://localhost/docgen_authtest npx vitest run tests/newebpay-notify.test.ts
import { execSync } from "node:child_process";
import { createCipheriv, randomBytes } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { computeTradeSha } from "@/lib/payment/newebpay";

const DB = process.env.TEST_DATABASE_URL ?? "";
if (DB && !/^postgres(ql)?:\/\/([^@/]*@)?(localhost|127\.0\.0\.1)[:/]/.test(DB)) {
  throw new Error("TEST_DATABASE_URL must point at localhost: this test writes rows");
}
if (!DB) console.warn("newebpay-notify tests SKIPPED: set TEST_DATABASE_URL to a local Postgres to run them");

const HASH_KEY = "12345678901234567890123456789012";
const HASH_IV = "1234567890123456";
const DAY = 86400_000;

type Fields = Record<string, string>;
type Handler = (req: NextRequest) => Promise<Response>;
let prisma: import("@prisma/client").PrismaClient;
let checkout: Handler, notify: Handler, back: Handler, emailStart: (req: Request) => Promise<Response>;
let signUid: (uid: string) => string;
vi.mock("@/lib/mailgun", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  sendEmail: async () => ({ ok: true }),
}));

/** Encrypt and sign a payload the way the gateway does. */
function seal(payload: unknown, hashKey = HASH_KEY): Fields {
  const body = Buffer.from(JSON.stringify(payload));
  const pad = 32 - (body.length % 32);
  const cipher = createCipheriv("aes-256-cbc", hashKey, HASH_IV);
  cipher.setAutoPadding(false);
  const TradeInfo = Buffer.concat([cipher.update(Buffer.concat([body, Buffer.alloc(pad, pad)])), cipher.final()]).toString("hex");
  return { Status: "SUCCESS", MerchantID: "TEST123", TradeInfo, TradeSha: computeTradeSha(TradeInfo, hashKey, HASH_IV), Version: "2.0" };
}

function result(order: string, over: { Status?: string; Result?: Record<string, unknown> } = {}) {
  return {
    Status: over.Status ?? "SUCCESS",
    Message: "授權成功",
    Result: {
      MerchantID: "TEST123", Amt: 299, TradeNo: "23092714215835071", MerchantOrderNo: order,
      RespondType: "JSON", PaymentType: "CREDIT", PayTime: "2023-09-27 14:21:59", ...over.Result,
    },
  };
}

const post = (path: string, body: BodyInit, headers: Fields = {}) =>
  new NextRequest(`http://localhost${path}`, { method: "POST", body, headers });
const callback = (fields: Fields) => notify(post("/api/payment/newebpay/notify", new URLSearchParams(fields)));

/** Create a real order through the checkout route; returns what the buyer's browser receives. */
async function buy(plan = "pro", uid = `buyer-${randomBytes(6).toString("hex")}`, email = "buyer@example.com") {
  const res = await checkout(post("/api/payment/newebpay/checkout", JSON.stringify({ plan, email }), {
    "content-type": "application/json", cookie: `docgen_uid=${encodeURIComponent(signUid(uid))}`,
  }));
  const { params, merchantOrderNo } = (await res.json()) as { params: Fields; merchantOrderNo: string };
  return { uid, params, order: merchantOrderNo };
}
const orderStatus = async (order: string) => (await prisma.order.findUniqueOrThrow({ where: { merchantTradeNo: order } })).status;
const profile = (uid: string) => prisma.billingProfile.findUnique({ where: { uid } });
const daysLeft = (p: { periodEnd: Date | null } | null) => Math.round((p!.periodEnd!.getTime() - Date.now()) / DAY);

describe.skipIf(!DB)("newebpay callbacks (real Postgres)", () => {
  beforeAll(async () => {
    const env = { DATABASE_URL: DB, DATABASE_POSTGRES_PRISMA_URL: DB, DATABASE_URL_UNPOOLED: DB };
    execSync("./node_modules/.bin/prisma migrate deploy", { env: { ...process.env, ...env }, stdio: "pipe" });
    Object.assign(process.env, env, {
      UID_COOKIE_SECRET: "test-uid-secret", NEWEBPAY_MERCHANT_ID: "TEST123",
      NEWEBPAY_HASH_KEY: HASH_KEY, NEWEBPAY_HASH_IV: HASH_IV, NEWEBPAY_API_BASE: "", NEXT_PUBLIC_SITE_URL: "http://localhost",
    });
    for (const m of ["error", "warn"] as const) vi.spyOn(console, m).mockImplementation(() => {});
    ({ prisma } = await import("@/lib/prisma"));
    ({ signUid } = await import("@/lib/billing"));
    checkout = (await import("@/app/api/payment/newebpay/checkout/route")).POST;
    notify = (await import("@/app/api/payment/newebpay/notify/route")).POST;
    back = (await import("@/app/api/payment/newebpay/return/route")).POST;
    emailStart = (await import("@/app/api/auth/email/start/route")).POST;
  }, 60_000);
  afterAll(async () => prisma?.$disconnect());

  it("marks the order paid and activates PRO on a signed payment result", async () => {
    const { uid, order } = await buy();
    const res = await callback(seal(result(order)));
    expect(res.status).toBe(200);
    expect(await orderStatus(order)).toBe("PAID");
    const p = await profile(uid);
    expect(p?.plan).toBe("PRO");
    expect(daysLeft(p)).toBe(30);
  });

  it("does not accept the checkout form as a payment result", async () => {
    const { uid, order, params } = await buy();
    const attempts: Fields[] = [{ ...params, Status: "SUCCESS" }, { Status: "SUCCESS", TradeInfo: params.TradeInfo }];
    for (const fields of attempts) {
      const res = await callback(fields);
      expect(await orderStatus(order)).toBe("PENDING");
      expect(await profile(uid)).toBeNull();
      expect(res.status).toBe(400);
    }
  });

  it("rejects a result whose TradeSha is missing, wrong or made with another key", async () => {
    const { uid, order } = await buy();
    const good = seal(result(order));
    const otherKey = seal(result(order), "x".repeat(32));
    for (const fields of [
      { ...good, TradeSha: "" },
      { ...good, TradeSha: "0".repeat(64) },
      { ...good, TradeInfo: otherKey.TradeInfo },
      otherKey,
    ]) {
      expect((await callback(fields)).status).toBe(400);
    }
    expect((await notify(post("/api/payment/newebpay/notify", "{}", { "content-type": "application/json" }))).status).toBe(400);
    expect(await orderStatus(order)).toBe("PENDING");
    expect(await profile(uid)).toBeNull();
  });

  it("takes the status from the signed payload, not from the form field", async () => {
    const { uid, order } = await buy();
    await callback({ ...seal(result(order, { Status: "MPG03009" })), Status: "SUCCESS" });
    expect(await orderStatus(order)).toBe("FAILED");
    expect(await profile(uid)).toBeNull();
  });

  it("credits a payment that succeeds after an earlier failed attempt, and never undoes a paid order", async () => {
    const { uid, order } = await buy();
    const failed = seal(result(order, { Status: "MPG03009" }));
    await callback(failed);
    expect(await orderStatus(order)).toBe("FAILED");
    await callback(seal(result(order)));
    expect(await orderStatus(order)).toBe("PAID");
    await callback(failed);
    expect(await orderStatus(order)).toBe("PAID");
    expect(daysLeft(await profile(uid))).toBe(30);
  });

  it("does not credit an order that was closed by hand", async () => {
    const { uid, order } = await buy();
    await prisma.order.update({ where: { merchantTradeNo: order }, data: { status: "REFUNDED" } });
    await callback(seal(result(order)));
    expect(await orderStatus(order)).toBe("REFUNDED");
    expect(await profile(uid)).toBeNull();
  });

  it("adds the second purchase on top of the first", async () => {
    const first = await buy();
    await callback(seal(result(first.order)));
    const second = await buy("pack", first.uid);
    await callback(seal(result(second.order, { Result: { Amt: 499 } })));
    expect(daysLeft(await profile(first.uid))).toBe(120);
  });

  it("leaves the order pending when the paid amount differs", async () => {
    const { uid, order } = await buy();
    for (const Amt of [1, 298, "299abc", null, undefined]) await callback(seal(result(order, { Result: { Amt } })));
    expect(await orderStatus(order)).toBe("PENDING");
    expect(await profile(uid)).toBeNull();
  });

  it("leaves the order pending when a payment code was issued but nothing is paid yet", async () => {
    const { uid, order } = await buy();
    for (const PayTime of [undefined, ""]) {
      const res = await callback(seal(result(order, { Result: { PaymentType: "VACC", PayTime, ExpireDate: "2026-12-01", CodeNo: "1" } })));
      expect(res.status).toBe(200);
    }
    expect(await prisma.order.findUnique({ where: { merchantTradeNo: order } })).toMatchObject({ status: "PENDING", paymentDate: null });
    expect(await profile(uid)).toBeNull();

    await callback(seal(result(order, { Result: { PaymentType: "VACC" } })));
    expect(await orderStatus(order)).toBe("PAID");
  });

  it("credits one period when the same result arrives many times at once", async () => {
    const { uid, order } = await buy();
    const fields = seal(result(order));
    const codes = await Promise.all(Array.from({ length: 10 }, () => callback(fields).then((r) => r.status)));
    expect(new Set(codes)).toEqual(new Set([200]));
    await callback(fields);
    expect(daysLeft(await profile(uid))).toBe(30);
  });

  it("stays pending and answers non-200 when activation fails, so the gateway's retry can succeed", async () => {
    const { uid, order } = await buy();
    const fields = seal(result(order));
    await prisma.$executeRawUnsafe(`ALTER TABLE "BillingProfile" ADD CONSTRAINT notify_test_block CHECK (uid <> '${uid}') NOT VALID`);
    try {
      // Next turns a thrown route error into a 500.
      await expect(callback(fields)).rejects.toThrow();
    } finally {
      await prisma.$executeRawUnsafe(`ALTER TABLE "BillingProfile" DROP CONSTRAINT notify_test_block`);
    }
    expect(await orderStatus(order)).toBe("PENDING");
    expect((await callback(fields)).status).toBe(200);
    expect(await orderStatus(order)).toBe("PAID");
    expect((await profile(uid))?.plan).toBe("PRO");
  });

  it("ignores results for unknown orders and plans without PRO days", async () => {
    expect((await callback(seal(result("DOC0000000000000000")))).status).toBe(200);
    const { uid, order } = await buy("single");
    await callback(seal(result(order, { Result: { Amt: 99 } })));
    expect(await orderStatus(order)).toBe("PAID");
    expect(await profile(uid)).toBeNull();
  });

  it("sends the buyer back to their order only for a signed result", async () => {
    const { order, params } = await buy();
    const go = async (f: Fields) =>
      (await back(post("/api/payment/newebpay/return", new URLSearchParams(f)))).headers.get("location");
    expect(await go(seal(result(order)))).toBe(`http://localhost/payment/success?order=${order}`);
    expect(await go(seal(result(order, { Status: "MPG03009" })))).toBe(`http://localhost/payment/success?order=${order}`);
    expect(await go({ ...params, Status: "SUCCESS" })).toBe("http://localhost/payment/success");
    expect(await go({ ...seal(result(order)), TradeSha: "0".repeat(64) })).toBe("http://localhost/payment/success");
    expect(await orderStatus(order)).toBe("PENDING");
  });

  it("does not bind the email typed at checkout to the account", async () => {
    const typed = `typed-${randomBytes(6).toString("hex")}@example.test`;
    const { uid, order } = await buy("pro", undefined, typed);
    await callback(seal(result(order)));
    expect(await profile(uid)).toMatchObject({ plan: "PRO", email: null });
    expect((await prisma.order.findUniqueOrThrow({ where: { merchantTradeNo: order } })).buyerEmail).toBe(typed);
  });

  it("keeps the email bound by a login link when another email is typed at checkout", async () => {
    const uid = `buyer-${randomBytes(6).toString("hex")}`;
    const bound = `bound-${uid}@example.test`;
    await prisma.billingProfile.create({ data: { uid, email: bound } });
    const { order } = await buy("pro", uid, `other-${uid}@example.test`);
    await callback(seal(result(order)));
    expect(await profile(uid)).toMatchObject({ plan: "PRO", email: bound });
  });

  it("a login link for the email typed at checkout does not open the payer's account", async () => {
    const typed = `someone-${randomBytes(6).toString("hex")}@example.test`;
    const { uid, order } = await buy("pro", undefined, typed);
    await callback(seal(result(order)));
    const res = await emailStart(new Request("http://localhost/api/auth/email/start", {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: typed }),
    }));
    expect(res.status).toBe(200);
    const link = await prisma.magicLink.findFirstOrThrow({ where: { email: typed }, orderBy: { createdAt: "desc" } });
    expect(link.uid).not.toBe(uid);
  });

  it("requires a valid checkout email and stores it lowercased", async () => {
    const uid = `buyer-${randomBytes(6).toString("hex")}`;
    const cookie = `docgen_uid=${encodeURIComponent(signUid(uid))}`;
    const send = (body: object) =>
      checkout(post("/api/payment/newebpay/checkout", JSON.stringify(body), { "content-type": "application/json", cookie }));
    for (const body of [{ plan: "pro" }, { plan: "pro", email: "" }, { plan: "pro", email: "not-an-email" }, { plan: "pro", email: 42 }]) {
      expect((await send(body)).status).toBe(400);
    }
    expect(await prisma.order.count({ where: { uid } })).toBe(0);
    const res = await send({ plan: "pro", email: `  Mixed.Case-${uid}@Example.TEST ` });
    const { merchantOrderNo } = (await res.json()) as { merchantOrderNo: string };
    expect((await prisma.order.findUniqueOrThrow({ where: { merchantTradeNo: merchantOrderNo } })).buyerEmail)
      .toBe(`mixed.case-${uid}@example.test`.toLowerCase());
  });
});
