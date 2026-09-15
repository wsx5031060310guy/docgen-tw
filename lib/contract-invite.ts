import { checkRateLimit, type RateLimitResult } from "@/lib/rate-limit";

const INVITE_LIMIT = 5;
const INVITE_WINDOW_MS = 60 * 60 * 1000;

export function buildSignUrl(origin: string, id: string, token: string): string {
  const baseUrl = origin.replace(/\/+$/, "");
  return `${baseUrl}/contracts/${encodeURIComponent(id)}/sign?token=${encodeURIComponent(token)}`;
}

/**
 * Best-effort, per-instance protection. This in-memory bucket is not a strict
 * distributed limit when the application runs on multiple server instances.
 */
export function checkInviteRateLimit(id: string): RateLimitResult {
  return checkRateLimit(`contract-invite:${id}`, INVITE_LIMIT, INVITE_WINDOW_MS);
}
