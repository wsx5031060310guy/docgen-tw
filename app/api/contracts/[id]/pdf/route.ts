import { NextRequest, NextResponse } from "next/server";
import { findContractByToken } from "@/lib/contract-store";
import { pdfInputFor } from "@/lib/pdf/input";
import { renderContractPdf } from "@/lib/pdf/render";

// Always run on Node (react-pdf needs node APIs, not edge).
export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const token = req.nextUrl.searchParams.get("token") || "";
  if (!token) return NextResponse.json({ error: "missing token" }, { status: 400 });

  const c = await findContractByToken(id, token);
  if (!c) return NextResponse.json({ error: "簽署連結無效或合約不存在" }, { status: 404 });

  // Only allow PDF download once at least the sender has signed. The contract
  // is created in AWAITING_RECIPIENT state, so this passes for any contract
  // that exists; it explicitly blocks the (currently unused) UNSIGNED state.
  if (c.signingStatus === "UNSIGNED") {
    return NextResponse.json({ error: "尚未簽署" }, { status: 409 });
  }

  const buf = await renderContractPdf(pdfInputFor(c));

  return new NextResponse(buf as unknown as BodyInit, {
    status: 200,
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `inline; filename="docgen-${id}.pdf"`,
      "cache-control": "private, no-store",
    },
  });
}
