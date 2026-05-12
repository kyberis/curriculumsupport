import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { sessions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { PDFParse } from "pdf-parse";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const sessionId = formData.get("sessionId") as string | null;

  if (!file || !sessionId) {
    return new Response("Missing file or sessionId", { status: 400 });
  }

  if (file.type !== "application/pdf") {
    return new Response("Only PDF files are supported", { status: 400 });
  }

  const [session] = await db
    .select()
    .from(sessions)
    .where(and(eq(sessions.id, sessionId), eq(sessions.userId, userId)));

  if (!session) {
    return new Response("Session not found", { status: 404 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const data = new Uint8Array(arrayBuffer);

  const parser = new PDFParse({ data });
  const result = await parser.getText();
  const extractedText = result.text.trim();

  if (!extractedText) {
    return new Response("Could not extract text from PDF", { status: 422 });
  }

  await db
    .update(sessions)
    .set({ cvContent: extractedText, updatedAt: new Date() })
    .where(eq(sessions.id, sessionId));

  return NextResponse.json({
    text: extractedText,
    pages: result.total,
  });
}
