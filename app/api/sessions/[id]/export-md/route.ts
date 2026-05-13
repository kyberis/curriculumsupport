import { db } from "@/lib/db";
import { sessions, messages } from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { getUserId } from "@/lib/auth";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getUserId();
  const { id } = await params;

  const [session] = await db
    .select()
    .from(sessions)
    .where(and(eq(sessions.id, id), eq(sessions.userId, userId)));

  if (!session) {
    return new Response("Session not found", { status: 404 });
  }

  const sessionMessages = await db
    .select()
    .from(messages)
    .where(eq(messages.sessionId, id))
    .orderBy(asc(messages.createdAt));

  const lines: string[] = [
    `# ${session.title}`,
    "",
    `**Role:** ${session.targetRole || "Not specified"}`,
    `**Date:** ${session.createdAt.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`,
    "",
    "---",
    "",
  ];

  for (const msg of sessionMessages) {
    const label = msg.role === "user" ? "**You:**" : "**Renata:**";
    lines.push(label, "", msg.content, "", "---", "");
  }

  const markdown = lines.join("\n");
  const filename = `session-${session.targetRole?.replace(/\s+/g, "-").toLowerCase() || session.id}.md`;

  return new Response(markdown, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
