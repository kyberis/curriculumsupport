"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { ArrowLeft, Link2, Unlink, Copy, Check, RefreshCw } from "lucide-react";
import Link from "next/link";

interface TelegramStatus {
  connected: boolean;
  username: string | null;
  firstName: string | null;
  linkedAt: string | null;
}

interface LinkCodeResponse {
  code: string;
  expiresAt: string;
  botUsername: string;
}

export default function SettingsPage() {
  const [status, setStatus] = useState<TelegramStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [linkCode, setLinkCode] = useState<LinkCodeResponse | null>(null);
  const [generating, setGenerating] = useState(false);
  const [unlinking, setUnlinking] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchStatus = useCallback(async () => {
    const res = await fetch("/api/settings/telegram");
    const data = await res.json();
    setStatus(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  async function generateCode() {
    setGenerating(true);
    try {
      const res = await fetch("/api/settings/telegram", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setLinkCode(data);
      }
    } finally {
      setGenerating(false);
    }
  }

  async function unlinkTelegram() {
    setUnlinking(true);
    try {
      await fetch("/api/settings/telegram", { method: "DELETE" });
      setStatus({ connected: false, username: null, firstName: null, linkedAt: null });
      setLinkCode(null);
    } finally {
      setUnlinking(false);
    }
  }

  function copyCode() {
    if (!linkCode) return;
    navigator.clipboard.writeText(`/start ${linkCode.code}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div>
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="mb-4 inline-flex items-center gap-1 text-sm text-neutral-400 transition-colors hover:text-neutral-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>
        <h1 className="font-serif text-3xl text-neutral-100">Settings</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Manage integrations and preferences.
        </p>
      </div>

      <div className="space-y-6">
        <Card className="border-white/10 bg-[#161b22]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-neutral-100">
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5 text-[#26A5E4]"
                fill="currentColor"
              >
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
              </svg>
              Telegram
            </CardTitle>
            <CardDescription className="text-neutral-500">
              Connect your Telegram account to chat with Renata directly from Telegram.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
              </div>
            ) : status?.connected ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 rounded-lg border border-green-500/20 bg-green-500/5 px-4 py-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/20">
                    <Check className="h-4 w-4 text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-400">
                      Connected
                    </p>
                    <p className="text-xs text-neutral-400">
                      {status.username
                        ? `@${status.username}`
                        : status.firstName ?? "Telegram user"}
                      {status.linkedAt &&
                        ` · Linked ${new Date(status.linkedAt).toLocaleDateString()}`}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={unlinkTelegram}
                  disabled={unlinking}
                  className="text-red-400 hover:bg-red-500/10 hover:text-red-300"
                >
                  <Unlink className="mr-2 h-4 w-4" />
                  {unlinking ? "Unlinking..." : "Disconnect Telegram"}
                </Button>
              </div>
            ) : linkCode ? (
              <div className="space-y-4">
                <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
                  <p className="mb-3 text-sm text-neutral-300">
                    Open the bot in Telegram and send this command:
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 rounded bg-[#0d1117] px-3 py-2 font-mono text-sm text-amber-400">
                      /start {linkCode.code}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={copyCode}
                      className="shrink-0 text-neutral-400 hover:text-white"
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-green-400" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="mt-3 text-xs text-neutral-500">
                    Code expires{" "}
                    {new Date(linkCode.expiresAt).toLocaleTimeString()}
                  </p>
                </div>
                <a
                  href={`https://t.me/${linkCode.botUsername}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-[#26A5E4] transition-colors hover:text-[#4dc0f0]"
                >
                  Open @{linkCode.botUsername} in Telegram
                  <svg
                    viewBox="0 0 24 24"
                    className="h-3.5 w-3.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3" />
                  </svg>
                </a>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={generateCode}
                    disabled={generating}
                    className="text-neutral-400 hover:text-white"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Generate new code
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={fetchStatus}
                    className="text-neutral-400 hover:text-white"
                  >
                    <Check className="mr-2 h-4 w-4" />
                    I already sent it
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                onClick={generateCode}
                disabled={generating}
                className="bg-[#26A5E4] text-white hover:bg-[#1d8abf]"
              >
                <Link2 className="mr-2 h-4 w-4" />
                {generating ? "Generating..." : "Connect Telegram"}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
