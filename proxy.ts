import { NextResponse, type NextRequest } from "next/server";

// Per-request nonce CSP for pages. Next.js reads the nonce from the request's CSP
// header and stamps it on its own scripts and inline styles, so every page must be
// dynamically rendered (see app/layout.tsx). API routes keep the static
// `frame-ancestors 'none'` from next.config.ts (PDF downloads, JSON).
export function contentSecurityPolicy(nonce: string, isDev = process.env.NODE_ENV === "development") {
  return [
    "default-src 'self'",
    // React needs eval only in dev (server error stack reconstruction).
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    // <style>/<link> need the nonce or same origin. Pages still render ~160
    // style={{...}} attributes server-side; only style-src-attr can allow those.
    isDev ? "style-src 'self' 'unsafe-inline'" : `style-src 'self' 'nonce-${nonce}'`,
    "style-src-attr 'unsafe-inline'",
    // data: = signature pad previews + CSS data-URI icons; Blob = stored signature PNGs.
    "img-src 'self' data: https://*.public.blob.vercel-storage.com",
    "font-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    // Checkout posts a form to the NewebPay MPG gateway (lib/payment/newebpay.ts).
    `form-action 'self' https://core.newebpay.com${isDev ? " https://ccore.newebpay.com" : ""}`,
    "frame-ancestors 'none'",
  ].join("; ");
}

export function proxy(req: NextRequest) {
  let res: NextResponse;
  if (req.nextUrl.pathname.startsWith("/api/")) {
    res = NextResponse.next();
  } else {
    const csp = contentSecurityPolicy(Buffer.from(crypto.randomUUID()).toString("base64"));
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("content-security-policy", csp);
    res = NextResponse.next({ request: { headers: requestHeaders } });
    res.headers.set("content-security-policy", csp);
  }
  // Forward the current pathname as a header so server components can pick
  // the right locale via lib/i18n/locale.ts -> getServerLocale().
  res.headers.set("x-pathname", req.nextUrl.pathname);
  return res;
}

export const config = {
  matcher: [
    // Skip _next + static files
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
