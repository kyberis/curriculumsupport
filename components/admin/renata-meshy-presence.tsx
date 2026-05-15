"use client";

import type { Message as DbMessage } from "@/lib/db/schema";
import { RenataAvatarPanel } from "@/components/chat/renata-avatar-panel";

const STORAGE_KEY = "renata_admin_meshy_task_id";

export function RenataMeshyPresence({ messages }: { messages: DbMessage[] }) {
  const simple = messages.map((m) => ({
    id: m.id,
    role: m.role,
    content: m.content,
  }));
  return (
    <RenataAvatarPanel messages={simple} meshyStorageKey={STORAGE_KEY} />
  );
}
