import { NextResponse } from "next/server";
import { get } from "@vercel/blob";
import { readUidFromRequest } from "@/lib/billing";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// GET streams a case attachment to the case owner, always as a download.
// New files are in the private store; older rows still point at the public store.
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string; attachmentId: string }> },
) {
  const { id: caseId, attachmentId } = await params;
  const uid = readUidFromRequest(req);
  if (!uid) return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  const att = await prisma.caseAttachment.findUnique({
    where: { id: attachmentId },
    select: { caseId: true, blobUrl: true, filename: true, case: { select: { uid: true } } },
  });
  if (!att || att.caseId !== caseId) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (att.case.uid !== uid) return NextResponse.json({ error: "not your case" }, { status: 403 });

  const isPrivate = new URL(att.blobUrl).hostname.includes(".private.blob.");
  const file = await get(
    att.blobUrl,
    isPrivate ? { access: "private", token: process.env.PRIVATE_BLOB_READ_WRITE_TOKEN } : { access: "public" },
  );
  if (file?.statusCode !== 200) return NextResponse.json({ error: "not found" }, { status: 404 });

  return new Response(file.stream, {
    headers: {
      "content-type": "application/octet-stream",
      "content-disposition": `attachment; filename*=UTF-8''${encodeURIComponent(att.filename)}`,
      "x-content-type-options": "nosniff",
      "cache-control": "private, no-store",
    },
  });
}
