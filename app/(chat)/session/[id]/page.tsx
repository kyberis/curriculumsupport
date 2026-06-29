"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Check,
  Paperclip,
  Pencil,
  Send,
  FileText,
  Loader2,
  X,
  Download,
  Image as ImageIcon,
  FileDown,
  Lightbulb,
  Mic,
  MicOff,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { siteConfig } from "@/lib/marketing-content";
import { AVAILABLE_MODELS, type ModelId } from "@/lib/model";
import { CHAT_MESSAGES_PAGE_SIZE } from "@/lib/agent";
import { DonateBanner } from "@/components/donate-banner";
import type { Session, Message as DbMessage } from "@/lib/db/schema";
import { toJpeg } from "html-to-image";
import { useChatShellUser } from "@/components/chat/chat-shell";
import {
  RenataAvatarPanel,
  type RenataAvatarPanelHandle,
} from "@/components/chat/renata-avatar-panel";
import { useSpeechRecognitionToText } from "@/lib/use-speech-recognition";

function getMessageText(msg: UIMessage): string {
  return msg.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("\n");
}

function dbMessagesToUi(rows: DbMessage[]): UIMessage[] {
  return rows.map((m) => ({
    id: m.id,
    role: m.role as "user" | "assistant",
    parts: [{ type: "text" as const, text: m.content }],
  }));
}

function SessionChatPageInner() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomAnchorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const prependingOlderRef = useRef(false);
  const scrollHeightBeforePrependRef = useRef(0);
  const shouldStickToBottomRef = useRef(true);
  const initialScrollDoneRef = useRef(false);

  const [session, setSession] = useState<Session | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [hasMoreOlder, setHasMoreOlder] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [hasGeneratedCv, setHasGeneratedCv] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const shellUser = useChatShellUser();
  const isAdmin = shellUser?.role === "admin";
  const [avatarMode, setAvatarMode] = useState(false);
  const avatarPanelRef = useRef<RenataAvatarPanelHandle>(null);
  const avatarModeRef = useRef(false);

  const { messages, sendMessage, status, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: { sessionId: id },
    }),
    onError(error) {
      if (error.message.includes("429")) {
        setRateLimitError(
          "You've reached your daily message limit. Try again tomorrow."
        );
      }
    },
    onFinish({ message, isAbort, isError }) {
      if (isAbort || isError) return;
      if (message.role !== "assistant") return;
      if (!avatarModeRef.current) return;
      const t = getMessageText(message);
      if (t.trim()) avatarPanelRef.current?.speakPlainText(t);
    },
  });

  const [micError, setMicError] = useState<string | null>(null);
  const { supported: micSupported, listening: micListening, start: startMic, stop: stopMic } =
    useSpeechRecognitionToText({
      lang: "es-ES",
      onFinal: (text) => {
        avatarPanelRef.current?.cancelSpeech();
        sendMessage({ text });
      },
      onError: (msg) => setMicError(msg),
    });

  const panelMessages = useMemo(
    () =>
      messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: getMessageText(m),
      })),
    [messages]
  );

  useEffect(() => {
    if (!isAdmin) return;
    const t = window.setTimeout(() => {
      if (sessionStorage.getItem(`renata_avatar_mode_${id}`) === "1") {
        setAvatarMode(true);
      }
    }, 0);
    return () => window.clearTimeout(t);
  }, [id, isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    if (typeof window === "undefined") return;
    if (avatarMode) sessionStorage.setItem(`renata_avatar_mode_${id}`, "1");
    else sessionStorage.removeItem(`renata_avatar_mode_${id}`);
  }, [avatarMode, id, isAdmin]);

  useEffect(() => {
    avatarModeRef.current = Boolean(isAdmin && avatarMode);
  }, [isAdmin, avatarMode]);

  const scrollToBottom = useCallback(() => {
    const scrollEl = scrollRef.current;
    if (!scrollEl) return;

    bottomAnchorRef.current?.scrollIntoView({ block: "end" });
    scrollEl.scrollTop = scrollEl.scrollHeight;
  }, []);

  useEffect(() => {
    setInitialLoading(true);
    setHasMoreOlder(false);
    setSession(null);
    setMessages([]);
    shouldStickToBottomRef.current = true;
    initialScrollDoneRef.current = false;
  }, [id, setMessages]);

  useEffect(() => {
    fetch(`/api/sessions/${id}?limit=${CHAT_MESSAGES_PAGE_SIZE}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then(
        (data: {
          session: Session;
          messages: DbMessage[];
          hasMoreMessages: boolean;
        }) => {
          setSession(data.session);
          setHasGeneratedCv(!!data.session.generatedCv);
          setHasMoreOlder(data.hasMoreMessages);
          setMessages(dbMessagesToUi(data.messages));
          shouldStickToBottomRef.current = true;
          initialScrollDoneRef.current = false;
        }
      )
      .catch(() => router.push("/"))
      .finally(() => setInitialLoading(false));
  }, [id, router, setMessages]);

  const loadOlderMessages = useCallback(async () => {
    if (loadingOlder || !hasMoreOlder) return;

    const oldestId = messages[0]?.id;
    if (!oldestId) return;

    const scrollEl = scrollRef.current;
    if (scrollEl) {
      scrollHeightBeforePrependRef.current = scrollEl.scrollHeight;
    }
    prependingOlderRef.current = true;
    setLoadingOlder(true);

    try {
      const res = await fetch(
        `/api/sessions/${id}?limit=${CHAT_MESSAGES_PAGE_SIZE}&before=${oldestId}`
      );
      if (!res.ok) return;

      const data: { messages: DbMessage[]; hasMoreMessages: boolean } =
        await res.json();
      const older = dbMessagesToUi(data.messages);
      if (older.length === 0) {
        setHasMoreOlder(false);
        return;
      }

      setMessages((prev) => [...older, ...prev]);
      setHasMoreOlder(data.hasMoreMessages);
    } finally {
      setLoadingOlder(false);
    }
  }, [hasMoreOlder, id, loadingOlder, messages, setMessages]);

  useEffect(() => {
    if (initialLoading) return;
    if (messages.length > 0) return;
    const start = searchParams.get("start")?.trim();
    if (!start) return;
    const key = `renata-start-sent-${id}`;
    if (typeof window !== "undefined" && sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    sendMessage({ text: start });
    router.replace(`/session/${id}`, { scroll: false });
  }, [initialLoading, searchParams, messages.length, id, sendMessage, router]);

  useLayoutEffect(() => {
    if (initialLoading) return;

    const scrollEl = scrollRef.current;
    if (!scrollEl) return;

    if (prependingOlderRef.current) {
      const delta =
        scrollEl.scrollHeight - scrollHeightBeforePrependRef.current;
      scrollEl.scrollTop += delta;
      prependingOlderRef.current = false;
      return;
    }

    if (shouldStickToBottomRef.current) {
      scrollToBottom();
    }
  }, [initialLoading, messages, scrollToBottom]);

  useEffect(() => {
    if (initialLoading) return;

    const frame = requestAnimationFrame(() => {
      if (!shouldStickToBottomRef.current) return;
      scrollToBottom();
      initialScrollDoneRef.current = true;
    });

    return () => cancelAnimationFrame(frame);
  }, [initialLoading, messages, scrollToBottom]);

  useEffect(() => {
    if (initialLoading) return;

    const chatEl = chatRef.current;
    const scrollEl = scrollRef.current;
    if (!chatEl || !scrollEl) return;

    const observer = new ResizeObserver(() => {
      if (!shouldStickToBottomRef.current) return;
      scrollEl.scrollTop = scrollEl.scrollHeight;
    });
    observer.observe(chatEl);
    return () => observer.disconnect();
  }, [initialLoading, id]);

  useEffect(() => {
    const scrollEl = scrollRef.current;
    if (!scrollEl || initialLoading) return;

    function onScroll() {
      const el = scrollRef.current;
      if (!el) return;

      shouldStickToBottomRef.current =
        el.scrollHeight - el.scrollTop - el.clientHeight < 120;

      if (
        initialScrollDoneRef.current &&
        el.scrollTop < 80 &&
        hasMoreOlder &&
        !loadingOlder
      ) {
        void loadOlderMessages();
      }
    }

    scrollEl.addEventListener("scroll", onScroll, { passive: true });
    return () => scrollEl.removeEventListener("scroll", onScroll);
  }, [hasMoreOlder, initialLoading, loadOlderMessages, loadingOlder]);

  useEffect(() => {
    const lastAssistant = messages.findLast((m) => m.role === "assistant");
    if (!lastAssistant) return;
    const text = getMessageText(lastAssistant);
    if (!text.includes("## Experience")) return;
    const t = window.setTimeout(() => setHasGeneratedCv(true), 0);
    return () => window.clearTimeout(t);
  }, [messages]);

  async function exportAsJpg() {
    if (!chatRef.current) return;
    setExporting(true);
    try {
      const dataUrl = await toJpeg(chatRef.current, {
        quality: 0.95,
        backgroundColor: "#0d1117",
        pixelRatio: 2,
      });
      const link = document.createElement("a");
      link.download = `session-${session?.targetRole?.replace(/\s+/g, "-").toLowerCase() || id}.jpg`;
      link.href = dataUrl;
      link.click();
    } catch {
      alert("Could not generate image. Try again.");
    } finally {
      setExporting(false);
    }
  }

  function exportAsMd() {
    window.open(`/api/sessions/${id}/export-md`, "_blank");
  }

  function exportTips() {
    window.open(`/api/sessions/${id}/export-tips`, "_blank");
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("sessionId", id);

    try {
      const res = await fetch("/api/parse-cv", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const text = await res.text();
        alert(`Upload failed: ${text}`);
        return;
      }

      const data = await res.json();
      const uploadMessage = `I've uploaded my CV (${data.pages} page${data.pages > 1 ? "s" : ""}). Please review it and start asking me questions.`;
      setInputValue("");
      shouldStickToBottomRef.current = true;
      sendMessage({ text: uploadMessage });
    } catch {
      alert("Failed to upload file. Please try again.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleSend() {
    const text = inputValue.trim();
    if (!text) return;
    avatarPanelRef.current?.cancelSpeech();
    setInputValue("");
    shouldStickToBottomRef.current = true;
    sendMessage({ text });
  }

  function toggleMic() {
    setMicError(null);
    if (micListening) {
      stopMic();
      return;
    }
    avatarPanelRef.current?.cancelSpeech();
    startMic();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function startEditingTitle() {
    setTitleDraft(session?.title || "");
    setEditingTitle(true);
    setTimeout(() => titleInputRef.current?.select(), 0);
  }

  async function saveTitle() {
    const newTitle = titleDraft.trim();
    if (!newTitle || newTitle === session?.title) {
      setEditingTitle(false);
      return;
    }

    const res = await fetch(`/api/sessions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle }),
    });

    if (res.ok) {
      setSession((prev) => (prev ? { ...prev, title: newTitle } : prev));
    }
    setEditingTitle(false);
  }

  function handleTitleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      saveTitle();
    } else if (e.key === "Escape") {
      setEditingTitle(false);
    }
  }

  if (initialLoading) {
    return (
      <div className="flex flex-1 items-center justify-center bg-[#0d1117]">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  const isStreaming = status === "streaming" || status === "submitted";
  const effectiveAvatarMode = Boolean(isAdmin && avatarMode);

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-[#0d1117]">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-white/10 px-6 py-3">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button
              variant="ghost"
              size="sm"
              className="text-neutral-400 hover:text-white"
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Home
            </Button>
          </Link>
          {editingTitle ? (
            <div className="flex items-center gap-1.5">
              <input
                ref={titleInputRef}
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                onKeyDown={handleTitleKeyDown}
                onBlur={saveTitle}
                className="rounded border border-white/20 bg-[#161b22] px-2 py-0.5 font-serif text-lg text-neutral-100 outline-none focus:border-amber-500/50"
                maxLength={100}
              />
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-green-400 hover:text-green-300"
                onMouseDown={(e) => {
                  e.preventDefault();
                  saveTitle();
                }}
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-neutral-400 hover:text-neutral-300"
                onMouseDown={(e) => {
                  e.preventDefault();
                  setEditingTitle(false);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <button
              onClick={startEditingTitle}
              className="group flex items-center gap-1.5 font-serif text-lg text-neutral-100"
            >
              {session?.title || siteConfig.name}
              <Pencil className="h-3.5 w-3.5 text-neutral-500 opacity-0 transition-opacity group-hover:opacity-100" />
            </button>
          )}
          {isAdmin ? (
            <label className="ml-2 flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-neutral-300 hover:bg-white/10 sm:ml-4 sm:text-sm">
              <input
                type="checkbox"
                checked={avatarMode}
                onChange={(e) => setAvatarMode(e.target.checked)}
                className="rounded border-white/30 bg-[#161b22]"
              />
              Modo avatar
            </label>
          ) : null}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "text-neutral-400 hover:text-white"
            )}
            disabled={exporting}
          >
            {exporting ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-1 h-4 w-4" />
            )}
            Export
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="bottom" sideOffset={4}>
            <DropdownMenuGroup>
              <DropdownMenuLabel>Session</DropdownMenuLabel>
              <DropdownMenuItem onClick={exportAsMd}>
                <FileDown className="mr-2 h-4 w-4" />
                Download as Markdown
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportAsJpg}>
                <ImageIcon className="mr-2 h-4 w-4" />
                Download as Image (JPG)
              </DropdownMenuItem>
            </DropdownMenuGroup>
            {hasGeneratedCv && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Interview</DropdownMenuLabel>
                  <DropdownMenuItem onClick={exportTips}>
                    <Lightbulb className="mr-2 h-4 w-4" />
                    Download Interview Tips
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col gap-3 overflow-hidden",
          effectiveAvatarMode &&
            "xl:grid xl:grid-cols-[minmax(260px,380px)_1fr] xl:items-stretch xl:gap-4 xl:px-4"
        )}
      >
        {effectiveAvatarMode ? (
          <div className="min-h-0 shrink-0 overflow-y-auto border-b border-white/10 px-4 pb-3 xl:border-b-0 xl:px-0 xl:pb-0">
            <RenataAvatarPanel
              ref={avatarPanelRef}
              messages={panelMessages}
              meshyStorageKey={`renata_session_meshy_${id}`}
              compact
              assistantBusy={isStreaming}
            />
          </div>
        ) : null}

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          {/* Messages — newest at bottom; scroll up to load older */}
          <div
            ref={scrollRef}
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
          >
        <div ref={chatRef} className="w-full space-y-4 px-6 py-6">
          {(loadingOlder || hasMoreOlder) && messages.length > 0 ? (
            <div className="flex justify-center py-2">
              {loadingOlder ? (
                <Loader2 className="h-4 w-4 animate-spin text-neutral-500" />
              ) : (
                <span className="text-xs text-neutral-600">
                  Scroll up for earlier messages
                </span>
              )}
            </div>
          ) : null}
          {messages.map((msg) => {
            const text = getMessageText(msg);
            if (!text) return null;
            return (
              <div
                key={msg.id}
                className={`flex w-full ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <img
                    src="/renata-avatar.png"
                    alt="Renata"
                    className="mr-2.5 mt-1 h-7 w-7 flex-shrink-0 rounded-full"
                  />
                )}
                <div
                  className={`rounded-lg px-4 py-3 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "max-w-[85%] bg-amber-600/20 text-amber-100"
                      : "min-w-0 flex-1 bg-white/5 text-neutral-300"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <div className="prose prose-invert prose-sm max-w-none prose-headings:text-neutral-100 prose-headings:font-semibold prose-h1:text-lg prose-h2:text-base prose-h3:text-sm prose-p:text-neutral-300 prose-strong:text-neutral-200 prose-li:text-neutral-300 prose-a:text-amber-400 prose-th:text-neutral-200 prose-td:text-neutral-300 prose-table:border-collapse prose-th:border prose-th:border-neutral-700 prose-td:border prose-td:border-neutral-700 prose-th:px-3 prose-th:py-2 prose-td:px-3 prose-td:py-2">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{text}</p>
                  )}
                </div>
              </div>
            );
          })}
          {isStreaming && messages[messages.length - 1]?.role === "user" && (
            <div className="flex justify-start">
              <img
                src="/renata-avatar.png"
                alt="Renata"
                className="mr-2.5 mt-1 h-7 w-7 flex-shrink-0 rounded-full"
              />
              <div className="flex items-center gap-1.5 rounded-lg bg-white/5 px-4 py-3">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
              </div>
            </div>
          )}
          <div ref={bottomAnchorRef} aria-hidden className="h-px shrink-0" />
        </div>
          </div>

      {hasGeneratedCv && <DonateBanner />}

      {/* Input */}
      <div className="border-t border-white/10 bg-[#0d1117] px-6 py-4">
        {effectiveAvatarMode && micSupported === false ? (
          <p className="mb-2 text-center text-xs text-amber-400/90">
            El reconocimiento de voz no está disponible en este navegador. Usa
            Chrome en escritorio o escribe con el teclado.
          </p>
        ) : null}
        {micError ? (
          <div className="mb-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-center text-xs text-red-400">
            {micError}
          </div>
        ) : null}
        {rateLimitError && (
          <div className="mb-3 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-center text-sm text-red-400">
            {rateLimitError}
          </div>
        )}
        <div className="flex w-full items-end gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf,application/octet-stream"
            className="hidden"
            onChange={handleFileUpload}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={uploading || isStreaming}
            onClick={() => fileInputRef.current?.click()}
            className="text-neutral-400 hover:text-white"
            title="Upload a PDF"
          >
            {uploading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Paperclip className="h-5 w-5" />
            )}
          </Button>
          {effectiveAvatarMode && micSupported !== false ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isStreaming}
              onClick={toggleMic}
              className={cn(
                "text-neutral-400 hover:text-white",
                micListening && "text-amber-400"
              )}
              title={
                micListening
                  ? "Detener micrófono"
                  : "Hablar (reconocimiento de voz)"
              }
            >
              {micListening ? (
                <MicOff className="h-5 w-5" />
              ) : (
                <Mic className="h-5 w-5" />
              )}
            </Button>
          ) : null}
          <Textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="min-h-[44px] flex-1 resize-none border-white/10 bg-[#161b22] text-neutral-100 placeholder:text-neutral-500"
          />
          <Button
            type="button"
            disabled={!inputValue.trim() || isStreaming}
            onClick={handleSend}
            className="bg-amber-600 text-white hover:bg-amber-500"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        {uploading && (
          <p className="mt-2 text-xs text-neutral-500">
            <FileText className="mr-1 inline h-3 w-3" />
            Extracting text from your PDF...
          </p>
        )}
        <p className="mt-2 text-center text-xs text-neutral-600">
          Powered by {session?.model ? (AVAILABLE_MODELS[session.model as ModelId]?.label ?? session.model) : "AI"}
        </p>
      </div>
        </div>
      </div>
    </div>
  );
}

export default function SessionPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center bg-[#0d1117]">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
        </div>
      }
    >
      <SessionChatPageInner />
    </Suspense>
  );
}
