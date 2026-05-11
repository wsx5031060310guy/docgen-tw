import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { addAttachment } from "@/lib/case-store";

export const runtime = "nodejs";

// POST multipart/form-data with field 'file' to upload a case attachment.
// Stored on Vercel Blob; metadata persisted to CaseAttachment table.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: caseId } = await params;
  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "expected multipart form" }, { status: 400 });
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "missing file field" }, { status: 400 });
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "Vercel Blob not configured (BLOB_READ_WRITE_TOKEN missing)" },
      { status: 503 },
    );
  }
  const safeName = file.name.replace(/[^\w.\-]/g, "_").slice(0, 100);
  const blob = await put(`cases/${caseId}/${Date.now()}-${safeName}`, file, {
    access: "public",
    addRandomSuffix: true,
  });
  const rec = await addAttachment({
    caseId,
    filename: file.name,
    blobUrl: blob.url,
    mimeType: file.type || undefined,
    sizeBytes: file.size,
  });
  return NextResponse.json({ attachment: rec });
}
