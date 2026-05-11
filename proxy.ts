import { NextResponse, type NextRequest } from "next/server";

// Forward the current pathname as a header so server components can pick
// the right locale via lib/i18n/locale.ts -> getServerLocale().
export function proxy(req: NextRequest) {
  const res = NextResponse.next();
  res.headers.set("x-pathname", req.nextUrl.pathname);
  return res;
}

export const config = {
  matcher: [
    // Skip _next + static files
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
