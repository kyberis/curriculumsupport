import { db } from "@/lib/db";
import { sessions, messages } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { checkSessionLimit } from "@/lib/rate-limits";
import { isValidModel, DEFAULT_MODEL } from "@/lib/model";

export async function GET() {
  const userId = await getUserId();

  const userSessions = await db
    .select()
    .from(sessions)
    .where(eq(sessions.userId, userId))
    .orderBy(desc(sessions.createdAt));

  return NextResponse.json(userSessions);
}

export async function POST(req: Request) {
  const userId = await getUserId();

  const { allowed, remaining } = await checkSessionLimit(userId);
  if (!allowed) {
    return Response.json(
      { error: "Daily session limit reached. Try again tomorrow.", remaining },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const title = body.title || "New CV Session";
  const model = isValidModel(body.model) ? body.model : DEFAULT_MODEL;
  const onboarding = !!body.onboarding;

  const [session] = await db
    .insert(sessions)
    .values({
      userId,
      title,
      model,
    })
    .returning();

  const greetingContent = onboarding
    ? "Welcome! Let's prepare your application together.\n\nTo get started, I need a few things from you:\n\n1. **Your CV or resume** — upload a PDF or paste the text\n2. **Your LinkedIn profile URL** — so I can enrich your experience\n3. **The company you're applying to** — name or website link\n4. **The job description** — paste the text or share the posting link\n\nShare whatever you have and we'll build a tailored CV for this role!"
    : "Hello! I'm your CV writing assistant. Let's build a great CV together.\n\nWhat role are you applying for? Please share the job title, seniority level, and the industry or company if you have one in mind.";

  await db.insert(messages).values({
    sessionId: session.id,
    role: "assistant",
    content: greetingContent,
  });

  return NextResponse.json(session, { status: 201 });
}
