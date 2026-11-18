import { execSync } from "node:child_process";
import { createHmac } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const DB = process.env.TEST_DATABASE_URL ?? "";
if (DB && !/^postgres(ql)?:\/\/([^@/]*@)?(localhost|127\.0\.0\.1)[:/]/.test(DB)) {
  throw new Error("TEST_DATABASE_URL must point at localhost: this test writes rows");
}

const sent = vi.hoisted(() => ({
  after: [] as Promise<unknown>[],
  replies: [] as string[],
  pushes: [] as string[],
  loading: [] as string[],
}));

vi.mock("next/server", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  after: (callback: () => unknown) => {
    sent.after.push(Promise.resolve().then(callback));
  },
}));

vi.mock("@/lib/line", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  replyText: async (_token: string, _replyToken: string, text: string) => {
    sent.replies.push(text);
  },
  pushText: async (_token: string, _to: string, text: string) => {
    sent.pushes.push(text);
  },
  showLoading: async (_token: string, chatId: string) => {
    sent.loading.push(chatId);
  },
  fetchMessageContent: async () => new Uint8Array([1, 2, 3]),
}));

vi.mock("@/lib/ai-contract", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  extractContractDraft: vi.fn(async () => ({
    transcript: "幫我跟陳設計簽接案合約，品牌設計十二萬",
    templateId: "freelance",
    values: {
      party_a_name: "王公司",
      party_b_name: "陳設計",
      scope: "品牌識別設計",
      deadline: "2026/12/31",
      amount: "120000",
    },
    missing: [],
  })),
}));

vi.mock("@vercel/blob", () => ({
  put: async (path: string) => ({ url: `https://store.public.blob.vercel-storage.com/${path}` }),
}));

const run = Math.random().toString(36).slice(2, 10);
let prisma: import("@prisma/client").PrismaClient;
let signUid: (uid: string) => string;
let bot: typeof import("@/lib/contract-bot");
let linkRoute: typeof import("@/app/api/line/link/route");
let webhookRoute: typeof import("@/app/api/line/webhook/route");
let draftRoute: typeof import("@/app/api/contract-drafts/[id]/route");
let contractRoute: typeof import("@/app/api/contracts/route");

function request(
  path: string,
  options: { method?: string; uid?: string; body?: unknown; headers?: Record<string, string> } = {},
) {
  const headers = new Headers(options.headers);
  if (options.uid) headers.set("cookie", `docgen_uid=${encodeURIComponent(signUid(options.uid))}`);
  let body: string | undefined;
  if (options.body !== undefined) {
    body = JSON.stringify(options.body);
    headers.set("content-type", "application/json");
  }
  return new Request(`http://localhost${path}`, {
    method: options.method ?? "GET",
    headers,
    body,
  });
}

function draftContext(id: string) {
  return { params: Promise.resolve({ id }) };
}

function signedWebhook(body: unknown, signature = true) {
  const raw = JSON.stringify(body);
  const value = signature
    ? createHmac("sha256", process.env.LINE_CHANNEL_SECRET ?? "").update(raw).digest("base64")
    : "wrong";
  return new Request("http://localhost/api/line/webhook", {
    method: "POST",
    headers: { "x-line-signature": value },
    body: raw,
  });
}

async function drainAfter() {
  const pending = sent.after.splice(0);
  await Promise.all(pending);
}

if (!DB) console.warn("contract-bot tests SKIPPED: set TEST_DATABASE_URL to a local Postgres to run them");

describe.skipIf(!DB)("AI contract bot (real Postgres)", () => {
  beforeAll(async () => {
    const dbEnv = {
      DATABASE_URL: DB,
      DATABASE_POSTGRES_PRISMA_URL: DB,
      DATABASE_URL_UNPOOLED: DB,
    };
    execSync("./node_modules/.bin/prisma migrate deploy", {
      env: { ...process.env, ...dbEnv, AI_GATEWAY_API_KEY: "invalid-local-no-billing" },
      stdio: "pipe",
    });
    Object.assign(process.env, dbEnv, {
      UID_COOKIE_SECRET: "contract-bot-test-secret",
      LINE_CHANNEL_SECRET: "line-test-secret",
      LINE_CHANNEL_ACCESS_TOKEN: "line-test-token",
      NEXT_PUBLIC_APP_URL: "https://docgen.example.test",
      BLOB_READ_WRITE_TOKEN: "test",
      AI_GATEWAY_API_KEY: "invalid-local-no-billing",
    });
    ({ prisma } = await import("@/lib/prisma"));
    ({ signUid } = await import("@/lib/billing"));
    bot = await import("@/lib/contract-bot");
    [linkRoute, webhookRoute, draftRoute, contractRoute] = await Promise.all([
      import("@/app/api/line/link/route"),
      import("@/app/api/line/webhook/route"),
      import("@/app/api/contract-drafts/[id]/route"),
      import("@/app/api/contracts/route"),
    ]);
  }, 60_000);

  afterAll(async () => {
    await prisma?.$disconnect();
  });

  it("enforces 30 AI calls per Taipei day and resets on a new day", async () => {
    const uid = `quota-${run}`;
    for (let count = 1; count <= 30; count += 1) {
      expect(await bot.consumeAiQuota(uid), `call ${count}`).toBe(true);
    }
    expect(await bot.consumeAiQuota(uid)).toBe(false);
    await prisma.billingProfile.update({
      where: { uid },
      data: { aiDay: "2000-01-01" },
    });
    expect(await bot.consumeAiQuota(uid)).toBe(true);
    const profile = await prisma.billingProfile.findUniqueOrThrow({ where: { uid } });
    expect(profile.aiCount).toBe(1);
  });

  it("issues one-time LINE codes, handles expiry, rebinding and missing cookies", async () => {
    const firstUid = `line-a-${run}`;
    const secondUid = `line-b-${run}`;
    const issue = await linkRoute.POST(request("/api/line/link", { method: "POST", uid: firstUid }));
    expect(issue.status).toBe(200);
    const { code } = await issue.json() as { code: string };
    expect(await bot.bindLine(`line-user-${run}`, code)).toBe(`識別碼末四碼 ${firstUid.slice(-4)}`);
    expect(await bot.findUidByLine(`line-user-${run}`)).toBe(firstUid);
    expect(await bot.bindLine(`line-user-${run}`, code)).toBeNull();

    const expired = await bot.issueLinkCode(firstUid);
    await prisma.billingProfile.update({
      where: { uid: firstUid },
      data: { lineLinkCodeExpires: new Date(Date.now() - 1_000) },
    });
    expect(await bot.bindLine(`expired-line-${run}`, expired.code)).toBeNull();

    const second = await bot.issueLinkCode(secondUid);
    await prisma.billingProfile.update({ where: { uid: secondUid }, data: { email: `owner-b-${run}@example.test` } });
    expect(await bot.bindLine(`line-user-${run}`, second.code)).toBe("ow***@example.test");
    expect(await bot.findUidByLine(`line-user-${run}`)).toBe(secondUid);
    expect(await bot.isLineLinked(firstUid)).toBe(false);
    expect((await linkRoute.POST(request("/api/line/link", { method: "POST" }))).status).toBe(401);
    const anonymous = await linkRoute.GET(request("/api/line/link"));
    expect(anonymous.status).toBe(200);
    expect(await anonymous.json()).toMatchObject({ configured: true, linked: false });
  });

  it("validates webhook config/signature and handles bind, text and group events", async () => {
    const secret = process.env.LINE_CHANNEL_SECRET;
    const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    delete process.env.LINE_CHANNEL_SECRET;
    delete process.env.LINE_CHANNEL_ACCESS_TOKEN;
    expect((await webhookRoute.POST(new Request("http://localhost/api/line/webhook", { method: "POST" }))).status).toBe(503);
    process.env.LINE_CHANNEL_SECRET = secret;
    process.env.LINE_CHANNEL_ACCESS_TOKEN = accessToken;

    expect((await webhookRoute.POST(signedWebhook({ events: [] }, false))).status).toBe(401);
    const empty = await webhookRoute.POST(signedWebhook({ events: [] }));
    expect(empty.status).toBe(200);
    expect(await empty.text()).toBe("ok");
    await drainAfter();

    const unlinkedLine = `unlinked-${run}`;
    await webhookRoute.POST(signedWebhook({ events: [{
      type: "message",
      replyToken: "r-unlinked",
      source: { type: "user", userId: unlinkedLine },
      message: { id: "m1", type: "text", text: "接案合約" },
    }] }));
    await drainAfter();
    expect(sent.replies.at(-1)).toContain("還沒綁定");

    const uid = `webhook-${run}`;
    const lineUserId = `webhook-line-${run}`;
    const { code } = await bot.issueLinkCode(uid);
    await webhookRoute.POST(signedWebhook({ events: [{
      type: "message",
      replyToken: "r-bind",
      source: { type: "user", userId: lineUserId },
      message: { id: "m2", type: "text", text: `綁定 ${code}` },
    }] }));
    await drainAfter();
    expect(await bot.findUidByLine(lineUserId)).toBe(uid);
    expect(sent.replies.at(-1)).toContain(`已綁定 DocGen TW 帳號（識別碼末四碼 ${uid.slice(-4)}）`);

    const before = await prisma.contractDraft.count({ where: { uid } });
    await webhookRoute.POST(signedWebhook({ events: [{
      type: "message",
      replyToken: "r-draft",
      source: { type: "user", userId: lineUserId },
      message: { id: "m3", type: "text", text: "幫我跟陳設計簽接案合約，品牌設計十二萬" },
    }] }));
    await drainAfter();
    expect(await prisma.contractDraft.count({ where: { uid } })).toBe(before + 1);
    expect(sent.replies.at(-1)).toMatch(/\/contracts\/new\?draft=.+&t=.+/);

    const replyCount = sent.replies.length;
    const draftCount = await prisma.contractDraft.count();
    await webhookRoute.POST(signedWebhook({ events: [{
      type: "message",
      replyToken: "r-group",
      source: { type: "group", userId: lineUserId },
      message: { id: "m4", type: "text", text: "接案合約" },
    }] }));
    await drainAfter();
    expect(sent.replies).toHaveLength(replyCount);
    expect(await prisma.contractDraft.count()).toBe(draftCount);

    // Over-long text: told to shorten, no AI call, no draft.
    await webhookRoute.POST(signedWebhook({ events: [{
      type: "message",
      replyToken: "r-long",
      source: { type: "user", userId: lineUserId },
      message: { id: "m5", type: "text", text: "接".repeat(1001) },
    }] }));
    await drainAfter();
    expect(sent.replies.at(-1)).toContain("1000 字以內");
    expect(await prisma.contractDraft.count()).toBe(draftCount);

    // Brute-forcing bind codes: the 6th attempt within 10 minutes is refused before touching the DB.
    const guesser = `guesser-${run}`;
    for (let i = 0; i < 6; i += 1) {
      await webhookRoute.POST(signedWebhook({ events: [{
        type: "message",
        replyToken: `r-guess-${i}`,
        source: { type: "user", userId: guesser },
        message: { id: `g${i}`, type: "text", text: `綁定 ${String(i).padStart(8, "0")}` },
      }] }));
      await drainAfter();
    }
    expect(sent.replies.at(-2)).toContain("綁定碼錯誤");
    expect(sent.replies.at(-1)).toContain("綁定嘗試太多次");
  });

  it("authorizes draft fetches and creates a contract once without a uid cookie", async () => {
    const uid = `draft-owner-${run}`;
    const draft = await bot.createDraft(uid, {
      templateId: "freelance",
      values: { party_a_name: "王公司", party_b_name: "陳設計", scope: "品牌設計", deadline: "2026/12/31", amount: "120000" },
      transcript: "品牌設計十二萬",
    });
    const wrongGet = await draftRoute.GET(
      request(`/api/contract-drafts/${draft.id}?t=wrong`),
      draftContext(draft.id),
    );
    expect(wrongGet.status).toBe(404);
    const rightGet = await draftRoute.GET(
      request(`/api/contract-drafts/${draft.id}?t=${draft.token}`),
      draftContext(draft.id),
    );
    expect(rightGet.status).toBe(200);
    expect(rightGet.headers.get("cache-control")).toBe("no-store");

    const body = {
      templateId: "freelance",
      values: {
        party_a_name: "王公司",
        party_b_name: "陳設計",
        scope: "品牌設計",
        deadline: "2026/12/31",
        amount: "120000",
      },
      partyASignature: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
      autoMilestones: false,
      draftId: draft.id,
      draftToken: draft.token,
    };
    // Owner over quota: refused, and the draft stays usable afterwards.
    const month = new Date(Date.now() + 8 * 3600_000).toISOString().slice(0, 7);
    await prisma.usage.create({ data: { uid, month, count: 3 } });
    expect((await contractRoute.POST(request("/api/contracts", { method: "POST", body }))).status).toBe(402);
    await prisma.usage.deleteMany({ where: { uid } });

    expect((await contractRoute.POST(request("/api/contracts", {
      method: "POST",
      body: { ...body, draftId: { id: draft.id } },
    }))).status).toBe(400);

    // Opened in some other browser (its own uid cookie): the contract still belongs to the draft owner.
    const created = await contractRoute.POST(
      request("/api/contracts", { method: "POST", body, uid: `other-browser-${run}` }),
    );
    expect(created.status).toBe(201);
    expect(created.headers.get("set-cookie")).toBeNull();
    const result = await created.json() as { id: string; uid?: string };
    expect(result.uid).toBeUndefined(); // the draft owner's uid is never echoed to the link holder
    expect((await prisma.contract.findUniqueOrThrow({ where: { id: result.id } })).uid).toBe(uid);
    expect((await prisma.contractDraft.findUniqueOrThrow({ where: { id: draft.id } })).contractId).toBe(result.id);
    expect((await contractRoute.POST(request("/api/contracts", { method: "POST", body }))).status).toBe(409);

    const wrongDraft = await bot.createDraft(uid, { templateId: "freelance", values: {}, transcript: "x" });
    expect((await contractRoute.POST(request("/api/contracts", {
      method: "POST",
      body: { ...body, draftId: wrongDraft.id, draftToken: "wrong" },
    }))).status).toBe(409);
    expect((await contractRoute.POST(request("/api/contracts", {
      method: "POST",
      body: { ...body, draftId: wrongDraft.id, draftToken: undefined },
    }))).status).toBe(400);

    const usedGet = await draftRoute.GET(
      request(`/api/contract-drafts/${draft.id}?t=${draft.token}`),
      draftContext(draft.id),
    );
    expect(usedGet.status).toBe(410);
  });
});
