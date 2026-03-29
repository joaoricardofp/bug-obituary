import { NextRequest, NextResponse } from "next/server";
import { generateObituary } from "@/lib/groq";
import { saveBug } from "@/lib/kv";
import type { BugInput, BugRecord } from "@/lib/types";

export async function POST(req: NextRequest) {
  // 1. Parse and validate request body
  let body: Partial<BugInput>;
  try {
    body = (await req.json()) as Partial<BugInput>;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const { bugName, description, born, died, stack } = body;

  if (!bugName || !description || !born || !died || !stack) {
    return NextResponse.json(
      {
        error:
          "Missing required fields: bugName, description, born, died, stack.",
      },
      { status: 400 },
    );
  }

  const input: BugInput = { bugName, description, born, died, stack };

  // 2. Generate obituary via Groq
  let obituary;
  try {
    obituary = await generateObituary(input);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("unparseable")) {
      return NextResponse.json(
        { error: "AI returned an unreadable response. Please try again." },
        { status: 422 },
      );
    }
    return NextResponse.json(
      { error: "Failed to generate obituary. Please try again later." },
      { status: 500 },
    );
  }

  // 3. Compose the full record
  const record: BugRecord = {
    ...input,
    id: crypto.randomUUID(),
    obituary,
    createdAt: new Date().toISOString(),
  };

  // 4. Persist the record
  try {
    await saveBug(record);
  } catch {
    return NextResponse.json(
      { error: "Failed to save obituary. Please try again later." },
      { status: 500 },
    );
  }

  // 5. Return full record
  return NextResponse.json(record, { status: 201 });
}
