import { db } from "@/lib/db";
import { donateEvents } from "@/lib/db/schema";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth-config";

const VALID_EVENTS = [
  "view",
  "click_donate",
  "click_crypto",
  "click_paypal",
] as const;

export async function POST(req: Request) {
  const body = await req.json();
  const { eventType } = body;

  if (!VALID_EVENTS.includes(eventType)) {
    return NextResponse.json({ error: "Invalid event type" }, { status: 400 });
  }

  let userId: string | null = null;
  try {
    const session = await auth();
    userId = session?.user?.id ?? null;
  } catch {
    // anonymous event is fine
  }

  await db.insert(donateEvents).values({ eventType, userId });

  return NextResponse.json({ ok: true });
}
