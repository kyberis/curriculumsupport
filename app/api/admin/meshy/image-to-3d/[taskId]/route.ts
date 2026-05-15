import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { meshyGetImageTo3dTask } from "@/lib/meshy";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const apiKey = process.env.MESHY_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      { error: "MESHY_API_KEY no está configurada." },
      { status: 503 }
    );
  }

  const { taskId } = await params;
  if (!taskId) {
    return NextResponse.json({ error: "Falta taskId" }, { status: 400 });
  }

  try {
    const task = await meshyGetImageTo3dTask(apiKey, taskId);
    return NextResponse.json({
      id: task.id,
      status: task.status,
      progress: task.progress ?? 0,
      glbUrl: task.model_urls?.glb ?? null,
      errorMessage: task.task_error?.message ?? null,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error Meshy";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
