"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText } from "lucide-react";
import type { Session } from "@/lib/db/schema";
import { AVAILABLE_MODELS, type ModelId } from "@/lib/model";
import { ModelPickerDialog } from "@/components/chat/model-picker-dialog";
import { DeleteSessionButton } from "@/components/chat/delete-session-button";

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);
  const isOnboarding = searchParams.get("new") === "1";
  const autoOpenedRef = useRef(false);

  useEffect(() => {
    fetch("/api/sessions")
      .then((res) => res.json())
      .then(setSessions)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (isOnboarding && !autoOpenedRef.current && !loading) {
      autoOpenedRef.current = true;
      setPickerOpen(true);
    }
  }, [isOnboarding, loading]);

  function getModelLabel(modelId: string) {
    const m = AVAILABLE_MODELS[modelId as ModelId];
    return m?.label ?? modelId;
  }

  function onSessionDeleted(deletedId: string) {
    setSessions((prev) => prev.filter((s) => s.id !== deletedId));
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl text-neutral-100">
            Your sessions
          </h1>
          <p className="mt-1 text-sm text-neutral-400">
            Each session is a conversation to build or improve a CV.
          </p>
        </div>
        <Button
          onClick={() => setPickerOpen(true)}
          className="bg-amber-600 text-white hover:bg-amber-500"
        >
          <Plus className="mr-2 h-4 w-4" />
          New session
        </Button>
      </div>

      <ModelPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onboarding={isOnboarding}
        onCreated={(id) => router.push(`/session/${id}`)}
      />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
        </div>
      ) : sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-white/10 py-20 text-center">
          <FileText className="mb-4 h-10 w-10 text-neutral-600" />
          <p className="text-neutral-400">No sessions yet.</p>
          <p className="mt-1 text-sm text-neutral-500">
            Start a new session to begin writing your CV.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sessions.map((session) => (
            <Card
              key={session.id}
              className="group cursor-pointer border-white/10 bg-[#161b22] transition-colors hover:border-amber-500/30"
              onClick={() => router.push(`/session/${session.id}`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-neutral-100">
                    {session.title}
                  </CardTitle>
                  <div className="flex shrink-0 items-center gap-1">
                    <Badge
                      variant={
                        session.status === "complete" ? "default" : "secondary"
                      }
                      className={
                        session.status === "complete"
                          ? "bg-green-500/20 text-green-400"
                          : "bg-neutral-500/20 text-neutral-400"
                      }
                    >
                      {session.status === "complete" ? "Complete" : "In progress"}
                    </Badge>
                    <DeleteSessionButton
                      sessionId={session.id}
                      sessionTitle={session.title}
                      onDeleted={() => onSessionDeleted(session.id)}
                      className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
                    />
                  </div>
                </div>
                <CardDescription className="text-neutral-500">
                  {session.targetRole || "No target role set"}
                  <span className="mx-2">·</span>
                  {getModelLabel(session.model)}
                  <span className="mx-2">·</span>
                  {new Date(session.createdAt).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
