import { db } from "@/lib/db";
import { sessions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { renderCvPdf } from "@/lib/pdf-template";
import { getUserId } from "@/lib/auth";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = getUserId();
  const { id } = await params;

  const [session] = await db
    .select()
    .from(sessions)
    .where(and(eq(sessions.id, id), eq(sessions.userId, userId)));

  if (!session) {
    return new Response("Session not found", { status: 404 });
  }

  if (!session.generatedCv) {
    return new Response("No CV has been generated yet for this session", {
      status: 422,
    });
  }

  const pdfBytes = await renderCvPdf(session.generatedCv);

  const filename = `cv-${session.targetRole?.replace(/\s+/g, "-").toLowerCase() || "document"}.pdf`;

  return new Response(pdfBytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
