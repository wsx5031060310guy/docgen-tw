import { NextResponse } from "next/server";
import { findContractByToken } from "@/lib/contract-store";
import { buildSignFetchPayload } from "@/lib/sign-fetch";

export const runtime = "nodejs";

// GET /api/contracts/[id]/sign-fetch?token=… — public, token-authed.
// Returns only the data needed to render the recipient-sign screen.
// Does NOT return sender's signature hash beyond what's already in the PDF.
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = new URL(req.url).searchParams.get("token") || "";
  if (!token) return NextResponse.json({ error: "missing token" }, { status: 400 });

  const c = await findContractByToken(id, token);
  if (!c) return NextResponse.json({ error: "invalid token or contract" }, { status: 404 });

  return NextResponse.json(buildSignFetchPayload(c));
}
