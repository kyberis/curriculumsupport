"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DeleteSessionButtonProps = {
  sessionId: string;
  sessionTitle: string;
  onDeleted: () => void;
  className?: string;
  iconClassName?: string;
};

export function DeleteSessionButton({
  sessionId,
  sessionTitle,
  onDeleted,
  className,
  iconClassName,
}: DeleteSessionButtonProps) {
  const [deleting, setDeleting] = useState(false);

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    const label = sessionTitle.trim() || "this session";
    if (
      !window.confirm(
        `Delete "${label}"? This will permanently remove the conversation and any generated CV.`
      )
    ) {
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete session");
      onDeleted();
    } catch {
      window.alert("Could not delete the session. Please try again.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      disabled={deleting}
      aria-label={`Delete ${sessionTitle || "session"}`}
      className={cn(
        "shrink-0 text-neutral-500 hover:bg-red-500/10 hover:text-red-400",
        className
      )}
      onClick={handleClick}
    >
      <Trash2 className={cn("h-4 w-4", iconClassName)} />
    </Button>
  );
}
