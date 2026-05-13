"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AVAILABLE_MODELS,
  DEFAULT_MODEL,
  type ModelId,
} from "@/lib/model";
import { AlertCircle, MessageSquare, Sparkles, X, Zap } from "lucide-react";

const modelList = Object.values(AVAILABLE_MODELS);

type ModelPickerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (sessionId: string) => void;
  onboarding?: boolean;
};

export function ModelPickerDialog({
  open,
  onOpenChange,
  onCreated,
  onboarding = false,
}: ModelPickerDialogProps) {
  const [selectedModel, setSelectedModel] = useState<ModelId>(DEFAULT_MODEL);
  const [creating, setCreating] = useState(false);
  const [limitError, setLimitError] = useState<string | null>(null);

  if (!open) return null;

  async function createSession() {
    setCreating(true);
    setLimitError(null);
    onOpenChange(false);
    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "New CV Session",
        model: selectedModel,
        ...(onboarding && { onboarding: true }),
      }),
    });
    if (res.status === 429) {
      const data = await res.json();
      setLimitError(data.error);
      setCreating(false);
      onOpenChange(true);
      return;
    }
    const session = await res.json();
    setCreating(false);
    onCreated(session.id);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-lg rounded-xl border border-white/10 bg-[#161b22] p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-serif text-xl text-neutral-100">Choose a model</h2>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-lg p-1 text-neutral-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {limitError && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {limitError}
          </div>
        )}

        <div className="space-y-2">
          {modelList.map((model) => (
            <button
              key={model.id}
              type="button"
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
                      <>
                        <Sparkles className="mr-1 h-3 w-3" />
                        Premium
                      </>
                    ) : (
                      <>
                        <Zap className="mr-1 h-3 w-3" />
                        Basic
                      </>
                    )}
                  </Badge>
                </div>
                <span className="text-xs text-neutral-500">{model.provider}</span>
              </div>
              <div className="mt-1.5 flex items-center gap-1 text-xs text-neutral-400">
                <MessageSquare className="h-3 w-3" />
                {model.dailyMessageLimit} messages/day
              </div>
            </button>
          ))}
        </div>
        <Button
          type="button"
          onClick={createSession}
          disabled={creating}
          className="mt-5 w-full bg-amber-600 text-white hover:bg-amber-500"
        >
          {creating ? "Creating..." : "Start session"}
        </Button>
      </div>
    </div>
  );
}
