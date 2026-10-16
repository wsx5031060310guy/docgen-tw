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

vi.mock("@vercel/blob", () => ({
  put: async (path: string) => ({ url: `https://blob.test/${path}` }),
}));

type Handler = (req: Request, ctx: { params: Promise<{ id: string }> }) => Promise<Response>;
type Mod = Record<string, Handler>;

const run = Math.random().toString(36).slice(2, 10);
const A = `ownerA-${run}`;
const B = `otherB-${run}`;
const ids = { contractA: "", contractB: "", caseA: "", caseB: "", milestoneA: "" };
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

describe.skipIf(!DB)("owner authorization (real Postgres)", () => {
  beforeAll(async () => {
    const env = { DATABASE_URL: DB, DATABASE_POSTGRES_PRISMA_URL: DB, DATABASE_URL_UNPOOLED: DB };
    execSync("./node_modules/.bin/prisma migrate deploy", {
      env: { ...process.env, ...env },
      stdio: "pipe",
    });
    Object.assign(process.env, env, { UID_COOKIE_SECRET: "test-uid-secret", BLOB_READ_WRITE_TOKEN: "test" });
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
    expect(await listIds(A)).toEqual([ids.contractA]);
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
    expect(res.headers.get("set-cookie")).toBeNull();
  });
});
