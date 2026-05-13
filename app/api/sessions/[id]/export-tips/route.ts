import { db } from "@/lib/db";
import { sessions, messages } from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { getUserId } from "@/lib/auth";

const TIPS_KEYWORDS = [
  "interview",
  "tips",
  "preparation",
  "company-specific",
  "role-specific",
  "interviewer",
  "STAR method",
  "body language",
  "follow up",
  "entrevista",
  "consejos",
  "preparación",
];

function isTipsMessage(content: string): boolean {
  const lower = content.toLowerCase();
  const matchCount = TIPS_KEYWORDS.filter((kw) =>
    lower.includes(kw.toLowerCase())
  ).length;
  return matchCount >= 3;
}

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

  const tipsMessages = sessionMessages.filter(
    (m) => m.role === "assistant" && isTipsMessage(m.content)
  );

  if (tipsMessages.length === 0) {
    return new Response(
      "No interview tips found in this session yet. Tips are generated after the CV is finalized.",
      { status: 422 }
    );
  }

  const lines: string[] = [
    `# Interview Tips — ${session.targetRole || "Your Role"}`,
    "",
    `*Generated for your session: ${session.title}*`,
    `*Date: ${session.createdAt.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}*`,
    "",
    "---",
    "",
  ];

  for (const msg of tipsMessages) {
    lines.push(msg.content, "", "---", "");
  }

  const markdown = lines.join("\n");
  const filename = `interview-tips-${session.targetRole?.replace(/\s+/g, "-").toLowerCase() || session.id}.md`;

  return new Response(markdown, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
