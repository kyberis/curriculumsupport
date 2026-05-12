"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft,
  Check,
  Download,
  Paperclip,
  Pencil,
  Send,
  FileText,
  Loader2,
  X,
} from "lucide-react";
import { siteConfig } from "@/lib/marketing-content";
import { AI_MODEL_LABEL } from "@/lib/model";
import { DonateBanner } from "@/components/donate-banner";
import type { Session, Message as DbMessage } from "@/lib/db/schema";

function getMessageText(msg: UIMessage): string {
  return msg.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("\n");
}

export default function SessionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [session, setSession] = useState<Session | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [hasGeneratedCv, setHasGeneratedCv] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const titleInputRef = useRef<HTMLInputElement>(null);

  const { messages, sendMessage, status, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: { sessionId: id },
    }),
  });

  useEffect(() => {
    fetch(`/api/sessions/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data: { session: Session; messages: DbMessage[] }) => {
        setSession(data.session);
        setHasGeneratedCv(!!data.session.generatedCv);

        const restored: UIMessage[] = data.messages.map((m) => ({
          id: m.id,
          role: m.role as "user" | "assistant",
          parts: [{ type: "text" as const, text: m.content }],
        }));
        setMessages(restored);
      })
      .catch(() => router.push("/dashboard"))
      .finally(() => setInitialLoading(false));
  }, [id, router, setMessages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const lastAssistant = messages.findLast((m) => m.role === "assistant");
    if (lastAssistant) {
      const text = getMessageText(lastAssistant);
      if (text.includes("## Experience")) {
        setHasGeneratedCv(true);
      }
    }
  }, [messages]);

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
      setInputValue(
        `I've uploaded my CV (${data.pages} page${data.pages > 1 ? "s" : ""}). Please review it and start asking me questions.`
      );
    } catch {
      alert("Failed to upload file. Please try again.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleDownload() {
    window.open(`/api/sessions/${id}/export-pdf`, "_blank");
  }

  function handleSend() {
    const text = inputValue.trim();
    if (!text) return;
    setInputValue("");
    sendMessage({ text });
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
      <div className="flex min-h-screen items-center justify-center bg-[#0d1117]">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  const isStreaming = status === "streaming" || status === "submitted";

  return (
    <div className="flex h-screen flex-col bg-[#0d1117]">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-white/10 px-6 py-3">
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <Button
              variant="ghost"
              size="sm"
              className="text-neutral-400 hover:text-white"
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back
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
        </div>
        <div className="flex items-center gap-3">
          {hasGeneratedCv && (
            <Button
              onClick={handleDownload}
              variant="outline"
              size="sm"
              className="border-amber-500/30 text-amber-500 hover:bg-amber-500/10"
            >
              <Download className="mr-1.5 h-4 w-4" />
              Download PDF
            </Button>
          )}
        </div>
      </header>

      {/* Messages */}
      <ScrollArea ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl space-y-4 px-6 py-6">
          {messages.map((msg) => {
            const text = getMessageText(msg);
            if (!text) return null;
            return (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <img
                    src="/renata-avatar.png"
                    alt="Renata"
                    className="mr-2.5 mt-1 h-7 w-7 flex-shrink-0 rounded-full"
                  />
                )}
                <div
                  className={`max-w-[85%] rounded-lg px-4 py-3 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-amber-600/20 text-amber-100"
                      : "bg-white/5 text-neutral-300"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <div className="prose prose-invert prose-sm max-w-none prose-headings:text-neutral-100 prose-headings:font-semibold prose-h1:text-lg prose-h2:text-base prose-h3:text-sm prose-p:text-neutral-300 prose-strong:text-neutral-200 prose-li:text-neutral-300 prose-a:text-amber-400">
                      <ReactMarkdown>{text}</ReactMarkdown>
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
        </div>
      </ScrollArea>

      {hasGeneratedCv && <DonateBanner />}

      {/* Input */}
      <div className="border-t border-white/10 bg-[#0d1117] px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-end gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
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
          <p className="mx-auto mt-2 max-w-3xl text-xs text-neutral-500">
            <FileText className="mr-1 inline h-3 w-3" />
            Extracting text from your PDF...
          </p>
        )}
        <p className="mx-auto mt-2 max-w-3xl text-center text-xs text-neutral-600">
          Powered by {AI_MODEL_LABEL}
        </p>
      </div>
    </div>
  );
}
