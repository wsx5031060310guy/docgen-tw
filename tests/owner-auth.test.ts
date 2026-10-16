// Route-level authorization against a real Postgres. Every contract / case /
// milestone route is called three times: no cookie (401), another user's
// signed cookie (403 or filtered), the owner's signed cookie (2xx).
//
//   createdb docgen_authtest
//   TEST_DATABASE_URL=postgresql://localhost/docgen_authtest npx vitest run tests/owner-auth.test.ts
//
// Migrations are applied with `prisma migrate deploy`; each run seeds rows under
// fresh random uids, so reruns on the same local database stay independent.
import { execSync } from "node:child_process";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const DB = process.env.TEST_DATABASE_URL ?? "";
if (DB && !/^postgres(ql)?:\/\/([^@/]*@)?(localhost|127\.0\.0\.1)[:/]/.test(DB)) {
  throw new Error("TEST_DATABASE_URL must point at localhost: this test writes rows");
}

const sent = vi.hoisted(() => ({
  puts: [] as { path: string; opts: Record<string, unknown> }[],
  gets: [] as { url: string; opts: Record<string, unknown> }[],
  mail: [] as { to: string; text: string }[],
}));
vi.mock("@vercel/blob", () => ({
  put: async (path: string, _body: unknown, opts: Record<string, unknown>) => {
    sent.puts.push({ path, opts });
    const host = opts.access === "private" ? "store.private.blob.vercel-storage.com" : "store.public.blob.vercel-storage.com";
    return { url: `https://${host}/${path}` };
  },
  get: async (url: string, opts: Record<string, unknown>) => {
    sent.gets.push({ url, opts });
    return { statusCode: 200, stream: new Response("file-bytes").body, headers: new Headers(), blob: {} };
  },
}));
vi.mock("@/lib/mailgun", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  sendEmail: async (m: { to: string; text: string }) => {
    sent.mail.push(m);
    return { ok: true };
  },
}));

type Handler = (req: Request, ctx: { params: Promise<{ id: string }> }) => Promise<Response>;
type Mod = Record<string, Handler>;

const run = Math.random().toString(36).slice(2, 10);
const A = `ownerA-${run}`;
const B = `otherB-${run}`;
const ids = { contractA: "", contractB: "", contractC: "", caseA: "", caseB: "", milestoneA: "" };
let signUid: (uid: string) => string;
let prisma: import("@prisma/client").PrismaClient;
const routes: Record<string, Mod> = {};

function req(path: string, opts: { method?: string; uid?: string; cookie?: string; body?: unknown; headers?: Record<string, string> } = {}) {
  const headers = new Headers(opts.headers);
  const cookie = opts.cookie ?? (opts.uid ? signUid(opts.uid) : undefined);
  if (cookie) headers.set("cookie", `docgen_uid=${encodeURIComponent(cookie)}`);
  let body: BodyInit | undefined;
  if (opts.body instanceof FormData) body = opts.body;
  else if (opts.body !== undefined) {
    body = JSON.stringify(opts.body);
    headers.set("content-type", "application/json");
  }
  return new Request(`http://localhost${path}`, { method: opts.method ?? "GET", headers, body });
}
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

if (!DB) console.warn("owner-auth tests SKIPPED: set TEST_DATABASE_URL to a local Postgres to run them");

describe.skipIf(!DB)("owner authorization (real Postgres)", () => {
  beforeAll(async () => {
    const env = { DATABASE_URL: DB, DATABASE_POSTGRES_PRISMA_URL: DB, DATABASE_URL_UNPOOLED: DB };
    execSync("./node_modules/.bin/prisma migrate deploy", {
      env: { ...process.env, ...env },
      stdio: "pipe",
    });
    Object.assign(process.env, env, {
      UID_COOKIE_SECRET: "test-uid-secret", BLOB_READ_WRITE_TOKEN: "test", PRIVATE_BLOB_READ_WRITE_TOKEN: "test-private",
    });
    delete process.env.CRON_SECRET;

    ({ signUid } = await import("@/lib/billing"));
    ({ prisma } = await import("@/lib/prisma"));
    const load = async (key: string, p: Promise<unknown>) => { routes[key] = (await p) as Mod; };
    await Promise.all([
      load("contracts", import("@/app/api/contracts/route")),
      load("contract", import("@/app/api/contracts/[id]/route")),
      load("values", import("@/app/api/contracts/[id]/values/route")),
      load("versions", import("@/app/api/contracts/[id]/versions/route")),
      load("invite", import("@/app/api/contracts/[id]/invite/route")),
      load("signFetch", import("@/app/api/contracts/[id]/sign-fetch/route")),
      load("pdf", import("@/app/api/contracts/[id]/pdf/route")),
      load("cases", import("@/app/api/cases/route")),
      load("case", import("@/app/api/cases/[id]/route")),
      load("attachments", import("@/app/api/cases/[id]/attachments/route")),
      load("milestones", import("@/app/api/milestones/route")),
      load("milestone", import("@/app/api/milestones/[id]/route")),
      load("dunning", import("@/app/api/milestones/[id]/dunning-prefill/route")),
      load("cron", import("@/app/api/cron/reminders/route")),
      load("emailStart", import("@/app/api/auth/email/start/route")),
      load("profile", import("@/app/api/billing/profile/route")),
      load("recipientSign", import("@/app/api/contracts/[id]/recipient-sign/route")),
    ]);

    const contract = (uid: string, token: string) =>
      prisma.contract.create({
        data: {
          templateId: "freelance", values: { party_a_name: uid }, client: uid, content: "x",
          signingToken: token, signingStatus: "AWAITING_RECIPIENT", uid,
        },
      });
    ids.contractA = (await contract(A, `token-A-${run}`)).id;
    ids.contractB = (await contract(B, `token-B-${run}`)).id;
    ids.caseA = (await prisma.case.create({ data: { title: "case A", uid: A } })).id;
    ids.caseB = (await prisma.case.create({ data: { title: "case B", uid: B } })).id;
    ids.milestoneA = (await prisma.milestone.create({
      data: { contractId: ids.contractA, kind: "PAYMENT", title: "m", amount: 1, dueDate: new Date(Date.now() + 60 * 86400_000) },
    })).id;
    await prisma.billingProfile.create({ data: { uid: A, email: `owner-a-${run}@example.test` } });
    const contractC = await prisma.contract.create({
      data: {
        templateId: "freelance", values: {}, client: A, content: "x", uid: A,
        signingToken: `token-C-${run}`, signingStatus: "FULLY_SIGNED", recipientEmail: `recipient-${run}@example.test`,
      },
    });
    ids.contractC = contractC.id;
    await prisma.milestone.create({
      data: { contractId: contractC.id, kind: "PAYMENT", title: "due soon", amount: 1, dueDate: new Date(Date.now() + 86400_000) },
    });
  }, 60_000);

  afterAll(async () => {
    await prisma?.$disconnect();
  });

  // [route, call(uid), owner's expected status]
  const matrix: [string, (uid?: string) => Promise<Response>, number][] = [
    ["GET /api/contracts/[id]", (uid) => routes.contract.GET(req(`/api/contracts/${ids.contractA}`, { uid }), ctx(ids.contractA)), 200],
    ["PATCH /api/contracts/[id]", (uid) => routes.contract.PATCH(req(`/api/contracts/${ids.contractA}`, { uid, method: "PATCH", body: { expiryDate: "2027-01-01" } }), ctx(ids.contractA)), 200],
    ["PATCH /api/contracts/[id]/values", (uid) => routes.values.PATCH(req(`/api/contracts/${ids.contractA}/values`, { uid, method: "PATCH", body: { values: { party_a_name: "A2" } } }), ctx(ids.contractA)), 200],
    ["GET /api/contracts/[id]/versions", (uid) => routes.versions.GET(req(`/api/contracts/${ids.contractA}/versions`, { uid }), ctx(ids.contractA)), 200],
    ["POST /api/contracts/[id]/invite", (uid) => routes.invite.POST(req(`/api/contracts/${ids.contractA}/invite`, { uid, method: "POST", body: { dryRun: true } }), ctx(ids.contractA)), 200],
    ["GET /api/cases/[id]", (uid) => routes.case.GET(req(`/api/cases/${ids.caseA}`, { uid }), ctx(ids.caseA)), 200],
    ["PATCH /api/cases/[id]", (uid) => routes.case.PATCH(req(`/api/cases/${ids.caseA}`, { uid, method: "PATCH", body: { contractId: ids.contractA } }), ctx(ids.caseA)), 200],
    ["POST /api/cases/[id]/attachments", (uid) => {
      const form = new FormData();
      form.set("file", new File(["hello"], "a.txt", { type: "text/plain" }));
      return routes.attachments.POST(req(`/api/cases/${ids.caseA}/attachments`, { uid, method: "POST", body: form }), ctx(ids.caseA));
    }, 200],
    ["POST /api/milestones", (uid) => routes.milestones.POST(req("/api/milestones", { uid, method: "POST", body: { contractId: ids.contractA, kind: "PAYMENT", title: "t", dueDate: "2027-02-01" } }), ctx("")), 200],
    ["PATCH /api/milestones/[id]", (uid) => routes.milestone.PATCH(req(`/api/milestones/${ids.milestoneA}`, { uid, method: "PATCH", body: { status: "DONE" } }), ctx(ids.milestoneA)), 200],
    ["GET /api/milestones/[id]/dunning-prefill", (uid) => routes.dunning.GET(req(`/api/milestones/${ids.milestoneA}/dunning-prefill`, { uid }), ctx(ids.milestoneA)), 200],
  ];

  for (const [name, call, ownerStatus] of matrix) {
    it(`${name}: anonymous 401, other owner 403, owner ${ownerStatus}`, async () => {
      expect((await call()).status).toBe(401);
      expect((await call(B)).status).toBe(403);
      expect((await call(A)).status).toBe(ownerStatus);
    });
  }

  it("GET /api/contracts: anonymous 401, each owner sees only their own rows", async () => {
    expect((await routes.contracts.GET(req("/api/contracts"), ctx(""))).status).toBe(401);
    const listIds = async (uid: string) => {
      const res = await routes.contracts.GET(req("/api/contracts", { uid }), ctx(""));
      expect(res.status).toBe(200);
      return ((await res.json()).contracts as { id: string }[]).map((c) => c.id);
    };
    expect((await listIds(A)).sort()).toEqual([ids.contractA, ids.contractC].sort());
    expect(await listIds(B)).toEqual([ids.contractB]);
  });

  it("GET /api/cases: anonymous 401, each owner sees only their own cases", async () => {
    expect((await routes.cases.GET(req("/api/cases"), ctx(""))).status).toBe(401);
    const listIds = async (uid: string) => {
      const res = await routes.cases.GET(req("/api/cases", { uid }), ctx(""));
      expect(res.status).toBe(200);
      return ((await res.json()).cases as { id: string }[]).map((c) => c.id);
    };
    expect(await listIds(A)).toEqual([ids.caseA]);
    expect(await listIds(B)).toEqual([ids.caseB]);
  });

  it("cannot link own contract to someone else's case, or someone else's contract to own case", async () => {
    const r1 = await routes.contract.PATCH(req(`/api/contracts/${ids.contractA}`, { uid: A, method: "PATCH", body: { caseId: ids.caseB } }), ctx(ids.contractA));
    expect(r1.status).toBe(403);
    const r2 = await routes.case.PATCH(req(`/api/cases/${ids.caseA}`, { uid: A, method: "PATCH", body: { contractId: ids.contractB } }), ctx(ids.caseA));
    expect(r2.status).toBe(403);
  });

  it("unsigned, foreign-signed and swapped cookies are no identity", async () => {
    const { createHmac } = await import("node:crypto");
    const foreign = `${A}.${createHmac("sha256", "other-secret").update(A).digest("base64url")}`;
    const swapped = `${A}.${signUid(B).split(".")[1]}`;
    for (const cookie of [A, foreign, swapped, `${A}.`]) {
      expect((await routes.contracts.GET(req("/api/contracts", { cookie }), ctx(""))).status).toBe(401);
    }
    const malformed = req("/api/contracts", { headers: { cookie: "docgen_uid=%E0%A4%A" } });
    expect((await routes.contracts.GET(malformed, ctx(""))).status).toBe(401);
  });

  it("POST /api/cases mints a signed httpOnly uid that then owns the case", async () => {
    const res = await routes.cases.POST(req("/api/cases", { method: "POST", body: { title: "new" } }), ctx(""));
    expect(res.status).toBe(200);
    const setCookie = res.headers.get("set-cookie") ?? "";
    expect(setCookie).toMatch(/^docgen_uid=[^;]+\.[^;]+;/);
    expect(setCookie).toMatch(/HttpOnly/i);
    const cookie = decodeURIComponent(setCookie.split(";")[0].slice("docgen_uid=".length));
    const caseId = (await res.json()).case.id as string;
    expect((await routes.case.GET(req(`/api/cases/${caseId}`, { cookie }), ctx(caseId))).status).toBe(200);
  });

  it("signing-token routes: no token 400, wrong token 404, right token 200", async () => {
    const sf = (token?: string) =>
      routes.signFetch.GET(req(`/api/contracts/${ids.contractA}/sign-fetch${token ? `?token=${token}` : ""}`), ctx(ids.contractA));
    expect((await sf()).status).toBe(400);
    expect((await sf(`token-B-${run}`)).status).toBe(404);
    expect((await sf(`token-A-${run}`)).status).toBe(200);
    const pdf = await routes.pdf.GET(
      Object.assign(req(`/api/contracts/${ids.contractA}/pdf?token=token-B-${run}`), { nextUrl: new URL(`http://localhost/api/contracts/${ids.contractA}/pdf?token=token-B-${run}`) }),
      ctx(ids.contractA),
    );
    expect(pdf.status).toBe(404);
  });

  it("cron fails closed when CRON_SECRET is unset, and needs the exact bearer when set", async () => {
    const cron = (auth?: string) =>
      routes.cron.GET(req("/api/cron/reminders", { headers: auth ? { authorization: auth } : {} }), ctx(""));
    expect((await cron()).status).toBe(401);
    expect((await cron("Bearer undefined")).status).toBe(401);
    process.env.CRON_SECRET = "cron-test-secret";
    try {
      expect((await cron("Bearer wrong")).status).toBe(401);
      expect((await cron("Bearer cron-test-secret")).status).toBe(200);
    } finally {
      delete process.env.CRON_SECRET;
    }
  });

  it("POST /api/auth/email/start does not hand out the uid bound to an email", async () => {
    const res = await routes.emailStart.POST(req("/api/auth/email/start", { method: "POST", body: { email: `owner-a-${run}@example.test` } }), ctx(""));
    expect(res.status).toBe(200);
    expect(res.headers.get("set-cookie") ?? "").not.toMatch(/docgen_uid=/);
  });

  it("POST /api/auth/email/start refuses a cross-site form post (no nonce planted)", async () => {
    // <form enctype="text/plain"> can submit a JSON-looking body without a CORS preflight.
    const form = new Request("http://localhost/api/auth/email/start", {
      method: "POST",
      headers: { "content-type": "text/plain" },
      body: `{"email":"attacker-form-${run}@example.test","p":"="}\r\n`,
    });
    const res = await routes.emailStart.POST(form, ctx(""));
    expect(res.status).toBe(415);
    expect(res.headers.get("set-cookie")).toBeNull();
    expect(sent.mail.some((m) => m.to === `attacker-form-${run}@example.test`)).toBe(false);
  });

  it("magic link only logs in the browser that requested it (login CSRF)", async () => {
    const verify = (await import("@/app/api/auth/email/verify/route")).GET;
    const email = `attacker-${run}@example.test`;
    const start = await routes.emailStart.POST(req("/api/auth/email/start", { uid: B, method: "POST", body: { email } }), ctx(""));
    const nonce = /docgen_magic=([^;]+)/.exec(start.headers.get("set-cookie") ?? "")?.[1];
    const link = sent.mail.find((m) => m.to === email)?.text.match(/token=([\w-]+)/)?.[1];
    expect(nonce && link).toBeTruthy();
    const click = (cookie?: string) =>
      verify(new Request(`http://localhost/api/auth/email/verify?token=${link}`, { headers: cookie ? { cookie } : {} }));
    const victim = await click();
    expect(victim.headers.get("set-cookie") ?? "").not.toMatch(/docgen_uid=/);
    expect(await prisma.billingProfile.findFirst({ where: { email } })).toBeNull();
    const requester = await click(`docgen_magic=${nonce}`);
    expect(requester.headers.get("set-cookie") ?? "").toMatch(/docgen_uid=/);
  });

  it("GET /api/cases/[id] hides contracts of other owners linked to the case, and signing tokens", async () => {
    await prisma.contract.update({ where: { id: ids.contractB }, data: { caseId: ids.caseA } });
    const res = await routes.case.GET(req(`/api/cases/${ids.caseA}`, { uid: A }), ctx(ids.caseA));
    expect(res.status).toBe(200);
    const contracts = (await res.json()).case.contracts as Record<string, unknown>[];
    expect(contracts.map((c) => c.id)).toEqual([ids.contractA]);
    expect(contracts[0]).not.toHaveProperty("signingToken");
  });

  it("case attachments go to the private store and are served only to the case owner", async () => {
    const form = new FormData();
    form.set("file", new File(["hello"], "報價.pdf", { type: "application/pdf" }));
    const up = await routes.attachments.POST(req(`/api/cases/${ids.caseA}/attachments`, { uid: A, method: "POST", body: form }), ctx(ids.caseA));
    expect(up.status).toBe(200);
    expect(sent.puts.at(-1)?.opts).toMatchObject({ access: "private", token: "test-private" });
    const attId = (await up.json()).attachment.id as string;

    const download = (await import("@/app/api/cases/[id]/attachments/[attachmentId]/route")).GET;
    const dl = (caseId: string, uid?: string) =>
      download(req(`/api/cases/${caseId}/attachments/${attId}`, { uid }), { params: Promise.resolve({ id: caseId, attachmentId: attId }) });
    expect((await dl(ids.caseA)).status).toBe(401);
    expect((await dl(ids.caseA, B)).status).toBe(403);
    expect((await dl(ids.caseB, B)).status).toBe(404);
    const ok = await dl(ids.caseA, A);
    expect(ok.status).toBe(200);
    expect(ok.headers.get("content-disposition")).toMatch(/^attachment;/);
    expect(await ok.text()).toBe("file-bytes");
    expect(sent.gets.at(-1)?.opts).toMatchObject({ access: "private", token: "test-private" });
  });

  it("recipient-sign checks the token before storing the signature image", async () => {
    const before = sent.puts.length;
    const res = await routes.recipientSign.POST(
      req(`/api/contracts/${ids.contractA}/recipient-sign`, { method: "POST", body: { token: `token-B-${run}`, signature: "data:image/png;base64,AAAA" } }),
      ctx(ids.contractA),
    );
    expect(res.status).toBe(403);
    expect(sent.puts.length).toBe(before);
  });

  it("signature images get a random suffix so their public URL cannot be guessed", async () => {
    const { persistSignaturePng } = await import("@/lib/services/signing_service");
    await persistSignaturePng("x_recipient", "data:image/png;base64,AAAA");
    expect(sent.puts.at(-1)?.opts.addRandomSuffix).toBe(true);
  });

  it("cron reminder mails the recipient the token sign page, not owner-only pages", async () => {
    process.env.CRON_SECRET = "cron-test-secret";
    try {
      const res = await routes.cron.GET(req("/api/cron/reminders", { headers: { authorization: "Bearer cron-test-secret" } }), ctx(""));
      expect(res.status).toBe(200);
    } finally {
      delete process.env.CRON_SECRET;
    }
    const mail = sent.mail.find((m) => m.to === `recipient-${run}@example.test`);
    expect(mail?.text).toContain(`/contracts/${ids.contractC}/sign?token=token-C-${run}`);
    expect(mail?.text).not.toMatch(new RegExp(`/contracts/${ids.contractC}(?!/sign)`));
    expect(mail?.text).not.toContain("fromMilestone");
  });

  it("PATCH /api/billing/profile cannot claim an email; the bound one is accepted unchanged", async () => {
    const patch = (email: string) =>
      routes.profile.PATCH(req("/api/billing/profile", { uid: A, method: "PATCH", body: { email, webhookUrl: "" } }), ctx(""));
    expect((await patch(`victim-${run}@example.test`)).status).toBe(400);
    expect((await patch(`owner-a-${run}@example.test`)).status).toBe(200);
    const otherClaims = await routes.profile.PATCH(
      req("/api/billing/profile", { uid: B, method: "PATCH", body: { email: `owner-a-${run}@example.test` } }),
      ctx(""),
    );
    expect(otherClaims.status).toBe(400);
  });
});
