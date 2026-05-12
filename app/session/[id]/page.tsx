"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft,
  Download,
  Paperclip,
  Send,
  FileText,
  Loader2,
} from "lucide-react";
import { siteConfig } from "@/lib/marketing-content";
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
          <span className="font-serif text-lg text-neutral-100">
            {session?.title || siteConfig.name}
          </span>
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
          <UserButton />
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
                <div
                  className={`max-w-[85%] rounded-lg px-4 py-3 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-amber-600/20 text-amber-100"
                      : "bg-white/5 text-neutral-300"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{text}</p>
                </div>
              </div>
            );
          })}
          {isStreaming && messages[messages.length - 1]?.role === "user" && (
            <div className="flex justify-start">
              <div className="flex items-center gap-1.5 rounded-lg bg-white/5 px-4 py-3">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

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
      </div>
    </div>
  );
}
