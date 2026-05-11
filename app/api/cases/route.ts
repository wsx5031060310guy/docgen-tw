import { NextResponse } from "next/server";
import { createCase, listCases } from "@/lib/case-store";

export async function GET() {
  try {
    const cases = await listCases();
    return NextResponse.json({ cases });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const { title, clientName, counterparty, notes, ownerEmail } = body ?? {};
  if (!title || typeof title !== "string") {
    return NextResponse.json({ error: "title required" }, { status: 400 });
  }
  try {
    const c = await createCase({ title, clientName, counterparty, notes, ownerEmail });
    return NextResponse.json({ case: c });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
