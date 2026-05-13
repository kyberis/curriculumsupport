"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Paperclip, Send, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { heroContent } from "@/lib/marketing-content";
import { FeaturesGrid } from "@/components/marketing/features-grid";
import {
  AVAILABLE_MODELS,
  DEFAULT_MODEL,
  type ModelId,
} from "@/lib/model";
import type { Session } from "@/lib/db/schema";

/** Isolated so `useSearchParams` does not force the main home UI into a mismatched CSR/hydration path. */
function NewSessionOpener() {
  const searchParams = useSearchParams();
  const router = useRouter();
  useEffect(() => {
    // #region agent log
    fetch(
      "http://127.0.0.1:7760/ingest/8c0f0354-03c4-4965-9f49-725411b7d7da",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Debug-Session-Id": "e5ec84",
        },
        body: JSON.stringify({
          sessionId: "e5ec84",
          hypothesisId: "H3",
          location: "home-chat-client.tsx:NewSessionOpener",
          message: "NewSessionOpener searchParams effect",
          data: { query: searchParams.toString() },
          timestamp: Date.now(),
          runId: "pre-fix",
        }),
      }
    ).catch(() => {});
    // #endregion
    if (searchParams.get("new") !== "1") return;
    window.dispatchEvent(new Event("renata-open-model-picker"));
    router.replace("/", { scroll: false });
  }, [searchParams, router]);
  return null;
}

function HomeChatInner({
  authenticated,
  googleCta,
}: {
  authenticated: boolean;
  /** Server-rendered sign-in form — avoids importing server actions in this client module. */
  googleCta: React.ReactNode;
}) {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedModel, setSelectedModel] = useState<ModelId>(DEFAULT_MODEL);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasSessions = sessions.length > 0;

  useEffect(() => {
    // #region agent log
    fetch(
      "http://127.0.0.1:7760/ingest/8c0f0354-03c4-4965-9f49-725411b7d7da",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Debug-Session-Id": "e5ec84",
        },
        body: JSON.stringify({
          sessionId: "e5ec84",
          hypothesisId: "H2",
          location: "home-chat-client.tsx:HomeChatInner",
          message: "HomeChatInner mounted",
          data: { authenticated },
          timestamp: Date.now(),
          runId: "pre-fix",
        }),
      }
    ).catch(() => {});
    // #endregion
  }, [authenticated]);

  useEffect(() => {
    if (!authenticated) {
      setSessions([]);
      return;
    }
    fetch("/api/sessions")
      .then((res) => res.json())
      .then(setSessions)
      .catch(() => setSessions([]));
  }, [authenticated]);

  async function createSessionWithFirstMessage() {
    const text = input.trim();
    if (!text) return;
    setBusy(true);
    setError(null);
    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "New CV Session",
        model: selectedModel,
      }),
    });
    if (res.status === 429) {
      const data = await res.json();
      setError(data.error ?? "Limit reached");
      setBusy(false);
      return;
    }
    if (!res.ok) {
      setError("Could not start session.");
      setBusy(false);
      return;
    }
    const row = await res.json();
    setInput("");
    setBusy(false);
    router.push(`/session/${row.id}?start=${encodeURIComponent(text)}`);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void createSessionWithFirstMessage();
    }
  }

  function applyPill(text: string) {
    if (!authenticated) {
      router.push("/sign-in?callbackUrl=/");
      return;
    }
    setInput(text);
  }

  const modelLabel = AVAILABLE_MODELS[selectedModel].label;

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-[#0d1117]">
      <header className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-3">
        {authenticated ? (
          <>
            <DropdownMenu>
              <DropdownMenuTrigger
                type="button"
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-neutral-100 hover:bg-white/5"
              >
                {modelLabel}
                <svg width="12" height="12" viewBox="0 0 24 24" className="text-neutral-500">
                  <path fill="currentColor" d="M7 10l5 5 5-5z" />
                </svg>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-[240px] border-white/10 bg-[#161b22] text-neutral-100">
                <DropdownMenuRadioGroup
                  value={selectedModel}
                  onValueChange={(v) => setSelectedModel(v as ModelId)}
                >
                  {Object.values(AVAILABLE_MODELS).map((m) => (
                    <DropdownMenuRadioItem key={m.id} value={m.id} className="text-neutral-200">
                      {m.label}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            <Link
              href="/dashboard/settings"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-400 hover:bg-white/5 hover:text-white"
              aria-label="Settings"
            >
              <Settings className="h-5 w-5" />
            </Link>
          </>
        ) : (
          <>
            <span className="px-1 text-sm text-neutral-500">
              Sign in to choose a model and start chatting
            </span>
            <Link
              href="/sign-in?callbackUrl=/"
              className="rounded-lg px-3 py-2 text-sm font-medium text-amber-400/90 hover:bg-white/5 hover:text-amber-400"
            >
              Sign in
            </Link>
          </>
        )}
      </header>

      <div className="flex min-h-0 flex-1 flex-col items-center overflow-y-auto px-4 pb-28 pt-8 sm:justify-start">
        <img
          src="/renata-avatar.png"
          alt="Renata"
          width={72}
          height={72}
          className="mb-5 rounded-full object-cover shadow-[0_0_0_2px_rgba(245,158,11,0.35),0_8px_32px_rgba(0,0,0,0.4)]"
        />

        <div className="mb-8 max-w-lg text-center">
          <h1 className="font-serif text-3xl font-semibold tracking-tight text-neutral-100 md:text-[2rem]">
            {hasSessions ? (
              "What do you want to work on?"
            ) : (
              <>
                {heroContent.headline[0]}{" "}
                <span className="text-amber-500">{heroContent.headline[1]}</span>
              </>
            )}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-neutral-400 md:text-[15px]">
            {hasSessions
              ? "Start a message or open a session from the sidebar."
              : heroContent.subheadline}
          </p>
        </div>

        {error && (
          <div className="mb-4 max-w-xl rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2 text-center text-sm text-red-400">
            {error}
          </div>
        )}

        {!hasSessions ? (
          <div className="mb-10 w-full max-w-4xl">
            <p className="mb-5 text-center text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Why Renata
            </p>
            <FeaturesGrid />
          </div>
        ) : null}

        <div className="w-full max-w-2xl">
          {authenticated ? (
            <>
              <div className="flex items-end gap-2 rounded-[28px] border border-white/10 bg-[#161b22] px-4 py-3 shadow-lg">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-neutral-400 hover:text-white"
                  aria-label="New session to upload PDF"
                  onClick={() =>
                    window.dispatchEvent(new Event("renata-open-model-picker"))
                  }
                >
                  <Paperclip className="h-5 w-5" />
                </Button>
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder="Message Renata…"
                  rows={1}
                  className="max-h-[200px] min-h-[28px] flex-1 resize-none border-0 bg-transparent text-neutral-100 placeholder:text-neutral-500 focus-visible:ring-0"
                />
                <Button
                  type="button"
                  size="icon"
                  disabled={!input.trim() || busy}
                  className="shrink-0 rounded-full bg-amber-600 hover:bg-amber-500"
                  onClick={() => void createSessionWithFirstMessage()}
                  aria-label="Send"
                >
                  {busy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-4 rounded-[28px] border border-white/10 bg-[#161b22] px-5 py-5 shadow-lg sm:flex-row sm:items-center sm:justify-between sm:gap-6">
              <p className="min-w-0 text-center text-sm leading-relaxed text-neutral-400 sm:flex-1 sm:text-left">
                Sign in with Google to message Renata, upload your CV, and export when you’re ready.
              </p>
              <div className="flex w-full shrink-0 justify-center sm:w-auto sm:justify-end">
                {googleCta}
              </div>
            </div>
          )}

          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {[
              {
                label: "I have a PDF CV to upload",
                text: "I'd like to upload my CV as a PDF so we can improve it.",
              },
              {
                label: "Start from scratch",
                text: "I'm starting from scratch. I want a new CV for my target role.",
              },
              {
                label: "Tailor for a specific job",
                text: "I'm applying for a specific role and want my CV tailored to the job description.",
              },
              {
                label: "Improve my current draft",
                text: "I already have a draft CV in this chat — help me strengthen the impact of my bullet points.",
              },
            ].map((pill) => (
              <button
                key={pill.label}
                type="button"
                onClick={() => applyPill(pill.text)}
                className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm text-neutral-200 hover:border-amber-500/25 hover:bg-white/[0.08]"
              >
                {pill.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function HomeChatClientDebugShell({
  authenticated,
  children,
}: {
  authenticated: boolean;
  children: React.ReactNode;
}) {
  useEffect(() => {
    // #region agent log
    fetch(
      "http://127.0.0.1:7760/ingest/8c0f0354-03c4-4965-9f49-725411b7d7da",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Debug-Session-Id": "e5ec84",
        },
        body: JSON.stringify({
          sessionId: "e5ec84",
          hypothesisId: "H2",
          location: "home-chat-client.tsx:DebugShell",
          message: "HomeChatClient shell mounted",
          data: { authenticated },
          timestamp: Date.now(),
          runId: "pre-fix",
        }),
      }
    ).catch(() => {});
    // #endregion
    const onErr = (ev: ErrorEvent) => {
      // #region agent log
      fetch(
        "http://127.0.0.1:7760/ingest/8c0f0354-03c4-4965-9f49-725411b7d7da",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Debug-Session-Id": "e5ec84",
          },
          body: JSON.stringify({
            sessionId: "e5ec84",
            hypothesisId: "H2",
            location: "home-chat-client.tsx:window.error",
            message: ev.message || "error event",
            data: {
              filename: ev.filename,
              lineno: ev.lineno,
              colno: ev.colno,
            },
            timestamp: Date.now(),
            runId: "pre-fix",
          }),
        }
      ).catch(() => {});
      // #endregion
    };
    window.addEventListener("error", onErr);
    return () => window.removeEventListener("error", onErr);
  }, [authenticated]);

  return <>{children}</>;
}

export function HomeChatClient({
  authenticated,
  googleCta,
}: {
  authenticated: boolean;
  googleCta: React.ReactNode;
}) {
  return (
    <HomeChatClientDebugShell authenticated={authenticated}>
      <Suspense fallback={null}>
        <NewSessionOpener />
      </Suspense>
      <HomeChatInner authenticated={authenticated} googleCta={googleCta} />
    </HomeChatClientDebugShell>
  );
}
