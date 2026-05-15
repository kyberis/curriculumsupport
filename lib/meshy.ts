const MESHY_BASE = "https://api.meshy.ai/openapi/v1";

export type MeshyTaskStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "SUCCEEDED"
  | "FAILED"
  | "CANCELED";

export type MeshyImageTo3dTask = {
  id: string;
  status: MeshyTaskStatus;
  progress?: number;
  model_urls?: { glb?: string };
  task_error?: { message?: string };
};

export async function meshyCreateImageTo3d(
  apiKey: string,
  body: Record<string, unknown>
): Promise<{ taskId: string }> {
  const res = await fetch(`${MESHY_BASE}/image-to-3d`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as {
    result?: string;
    message?: string;
  };
  if (!res.ok) {
    throw new Error(data.message || `Meshy ${res.status}: ${res.statusText}`);
  }
  if (!data.result) {
    throw new Error("Meshy no devolvió un id de tarea");
  }
  return { taskId: data.result };
}

export async function meshyGetImageTo3dTask(
  apiKey: string,
  taskId: string
): Promise<MeshyImageTo3dTask> {
  const res = await fetch(`${MESHY_BASE}/image-to-3d/${taskId}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  const data = (await res.json().catch(() => ({}))) as MeshyImageTo3dTask & {
    message?: string;
  };
  if (!res.ok) {
    throw new Error(
      (data as { message?: string }).message ||
        `Meshy ${res.status}: ${res.statusText}`
    );
  }
  return data;
}
