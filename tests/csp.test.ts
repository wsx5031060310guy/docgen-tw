import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { contentSecurityPolicy, proxy } from "@/proxy";

const directives = (csp: string) =>
  Object.fromEntries(csp.split("; ").map((d) => [d.split(" ")[0], d.split(" ").slice(1)]));

describe("content security policy", () => {
  it("production policy: nonce + strict-dynamic, no inline/eval/wildcard sources", () => {
    const d = directives(contentSecurityPolicy("abc", false));
    expect(d["script-src"]).toEqual(["'self'", "'nonce-abc'", "'strict-dynamic'"]);
    expect(d["style-src"]).toEqual(["'self'", "'nonce-abc'"]);
    for (const k of ["default-src", "object-src", "base-uri", "form-action", "frame-ancestors"]) expect(d[k]).toBeDefined();
    expect(d["object-src"]).toEqual(["'none'"]);
    expect(d["frame-ancestors"]).toEqual(["'none'"]);
    for (const sources of Object.values(d)) {
      expect(sources).not.toContain("*");
      expect(sources).not.toContain("https:");
      expect(sources).not.toContain("'unsafe-eval'");
    }
  });

  it("pages get a fresh nonce on request and response; API routes do not", () => {
    const a = proxy(new NextRequest("http://localhost/templates/freelance"));
    const b = proxy(new NextRequest("http://localhost/templates/freelance"));
    const csp = a.headers.get("content-security-policy")!;
    expect(csp).toMatch(/'nonce-[A-Za-z0-9+/=]{20,}'/);
    expect(csp).not.toBe(b.headers.get("content-security-policy"));
    // Next.js takes the nonce from the forwarded request header.
    expect(a.headers.get("x-middleware-request-content-security-policy")).toBe(csp);

    const api = proxy(new NextRequest("http://localhost/api/contracts"));
    expect(api.headers.get("content-security-policy")).toBeNull();
  });
});
