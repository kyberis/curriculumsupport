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
import { Plus, FileText, AlertCircle, X, Zap, Sparkles, MessageSquare } from "lucide-react";
import type { Session } from "@/lib/db/schema";
import { AVAILABLE_MODELS, DEFAULT_MODEL, type ModelId } from "@/lib/model";

const modelList = Object.values(AVAILABLE_MODELS);

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
  const [creating, setCreating] = useState(false);
  const [limitError, setLimitError] = useState<string | null>(null);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelId>(DEFAULT_MODEL);
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
      openModelPicker();
    }
  }, [isOnboarding, loading]);

  function openModelPicker() {
    setSelectedModel(DEFAULT_MODEL);
    setShowModelPicker(true);
  }

  async function createSession() {
    setCreating(true);
    setLimitError(null);
    setShowModelPicker(false);
    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "New CV Session",
        model: selectedModel,
        ...(isOnboarding && { onboarding: true }),
      }),
    });
    if (res.status === 429) {
      const data = await res.json();
      setLimitError(data.error);
      setCreating(false);
      return;
    }
    const session = await res.json();
    router.push(`/session/${session.id}`);
  }

  function getModelLabel(modelId: string) {
    const m = AVAILABLE_MODELS[modelId as ModelId];
    return m?.label ?? modelId;
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
          onClick={openModelPicker}
          disabled={creating}
          className="bg-amber-600 text-white hover:bg-amber-500"
        >
          <Plus className="mr-2 h-4 w-4" />
          {creating ? "Creating..." : "New session"}
        </Button>
      </div>

      {limitError && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {limitError}
        </div>
      )}

      {showModelPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-lg rounded-xl border border-white/10 bg-[#161b22] p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-serif text-xl text-neutral-100">
                Choose a model
              </h2>
              <button
                onClick={() => setShowModelPicker(false)}
                className="rounded-lg p-1 text-neutral-400 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-2">
              {modelList.map((model) => (
                <button
                  key={model.id}
                  onClick={() => setSelectedModel(model.id as ModelId)}
                  className={`w-full rounded-lg border px-4 py-3 text-left transition-all ${
                    selectedModel === model.id
                      ? "border-amber-500/50 bg-amber-500/10"
                      : "border-white/5 bg-white/[0.02] hover:border-white/15 hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-neutral-100">
                        {model.label}
                      </span>
                      <Badge
                        className={
                          model.tier === "premium"
                            ? "bg-amber-500/20 text-amber-400"
                            : "bg-neutral-500/20 text-neutral-400"
                        }
                      >
                        {model.tier === "premium" ? (
                          <><Sparkles className="mr-1 h-3 w-3" />Premium</>
                        ) : (
                          <><Zap className="mr-1 h-3 w-3" />Basic</>
                        )}
                      </Badge>
                    </div>
                    <span className="text-xs text-neutral-500">
                      {model.provider}
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-1 text-xs text-neutral-400">
                    <MessageSquare className="h-3 w-3" />
                    {model.dailyMessageLimit} messages/day
                  </div>
                </button>
              ))}
            </div>
            <Button
              onClick={createSession}
              disabled={creating}
              className="mt-5 w-full bg-amber-600 text-white hover:bg-amber-500"
            >
              {creating ? "Creating..." : "Start session"}
            </Button>
          </div>
        </div>
      )}

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
              className="cursor-pointer border-white/10 bg-[#161b22] transition-colors hover:border-amber-500/30"
              onClick={() => router.push(`/session/${session.id}`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-neutral-100">
                    {session.title}
                  </CardTitle>
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
