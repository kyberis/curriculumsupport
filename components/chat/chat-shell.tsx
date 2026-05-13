"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, MessageSquare, Plus, Shield } from "lucide-react";
import type { Session } from "@/lib/db/schema";
import { ModelPickerDialog } from "@/components/chat/model-picker-dialog";
import { siteConfig } from "@/lib/marketing-content";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ChatShellUser = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
};

export function ChatShell({
  user,
  children,
  sidebarGoogleSignIn,
}: {
  user: ChatShellUser | null;
  children: React.ReactNode;
  /** Server-rendered; must not import `@/app/actions/auth` in this client module. */
  sidebarGoogleSignIn: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const loadSessions = useCallback(() => {
    fetch("/api/sessions")
      .then((res) => res.json())
      .then(setSessions)
      .catch(() => setSessions([]));
  }, []);

  useEffect(() => {
    if (!user) {
      setSessions([]);
      return;
    }
    loadSessions();
  }, [loadSessions, pathname, user]);

  useEffect(() => {
    const open = () => {
      if (user) setPickerOpen(true);
      else router.push("/sign-in?callbackUrl=/");
    };
    window.addEventListener("renata-open-model-picker", open);
    return () => window.removeEventListener("renata-open-model-picker", open);
  }, [router, user]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "n") {
        e.preventDefault();
        if (user) setPickerOpen(true);
        else router.push("/sign-in?callbackUrl=/");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router, user]);

  function onSessionCreated(id: string) {
    loadSessions();
    router.push(`/session/${id}`);
    setMobileOpen(false);
  }

  const sessionIdFromPath = pathname.startsWith("/session/")
    ? pathname.slice("/session/".length).split("/")[0] ?? null
    : null;

  function formatSessionDate(d: Date | string) {
    const date = typeof d === "string" ? new Date(d) : d;
    const now = new Date();
    if (date.toDateString() === now.toDateString()) return "Today";
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  const initials =
    user?.name
      ?.split(/\s+/)
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?";

  function onNewSessionClick() {
    if (user) setPickerOpen(true);
    else router.push("/sign-in?callbackUrl=/");
  }

  return (
    <div className="flex h-dvh min-h-0 overflow-hidden bg-[#0d1117]">
      {/* Mobile overlay */}
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <aside
        className={cn(
          "flex h-dvh w-[260px] min-w-[260px] flex-col border-r border-white/10 bg-[#161b22] transition-transform duration-200 ease-out",
          "fixed inset-y-0 left-0 z-50 md:static md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex shrink-0 items-center gap-1.5 p-3">
          <Link
            href="/"
            className="flex h-9 min-w-0 shrink items-center justify-center rounded-lg px-2 font-serif text-lg font-semibold tracking-tight text-neutral-100 hover:bg-white/5"
            onClick={() => setMobileOpen(false)}
          >
            {siteConfig.name}
          </Link>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 flex-1 border-white/10 bg-transparent text-neutral-100 hover:bg-white/5"
            onClick={onNewSessionClick}
          >
            <Plus className="mr-1 h-4 w-4" />
            New session
          </Button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col px-2 pb-2">
          <div className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
            Sessions
          </div>
          <nav className="flex-1 overflow-y-auto pr-1">
            {sessions.length === 0 ? (
              <p className="px-2 py-3 text-center text-sm text-neutral-500">
                {user
                  ? "No sessions yet. Start one to build your CV."
                  : "Sign in to create sessions and resume your CV work."}
              </p>
            ) : (
              sessions.map((s) => {
                const active = sessionIdFromPath === s.id;
                return (
                  <Link
                    key={s.id}
                    href={`/session/${s.id}`}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "mb-0.5 flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2.5 text-left text-sm transition-colors",
                      active
                        ? "bg-amber-500/15 text-amber-100"
                        : "text-neutral-400 hover:bg-white/5 hover:text-neutral-100"
                    )}
                  >
                    <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 opacity-80" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{s.title}</span>
                      <span
                        className={cn(
                          "text-xs",
                          active ? "text-amber-200/60" : "text-neutral-500"
                        )}
                      >
                        {formatSessionDate(s.updatedAt ?? s.createdAt)}
                      </span>
                    </span>
                  </Link>
                );
              })
            )}
          </nav>
        </div>

        <div className="shrink-0 border-t border-white/10 p-3">
          {!user ? (
            <>
              {sidebarGoogleSignIn}
              <p className="mt-2 px-0.5 text-center text-[11px] leading-snug text-neutral-500">
                Sign in to save chats and export your CV.
              </p>
              <div className="mt-3 flex flex-wrap justify-center gap-x-3 gap-y-1 text-[11px] text-neutral-500">
                <Link href="/terms" className="hover:text-neutral-300">
                  Terms
                </Link>
                <Link href="/privacy" className="hover:text-neutral-300">
                  Privacy
                </Link>
              </div>
            </>
          ) : (
            <>
              {user.role === "admin" && (
                <Link
                  href="/dashboard/admin"
                  className="mb-2 flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-amber-400/80 hover:bg-white/5 hover:text-amber-400"
                  onClick={() => setMobileOpen(false)}
                >
                  <Shield className="h-4 w-4" />
                  Admin
                </Link>
              )}
              <div className="flex items-center gap-2.5 rounded-lg px-2 py-2">
                {user.image ? (
                  <img
                    src={user.image}
                    alt=""
                    className="h-8 w-8 rounded-full"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/20 text-xs font-semibold text-amber-200">
                    {initials}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-neutral-100">
                    {user.name || "Account"}
                  </div>
                  {user.email ? (
                    <div className="truncate text-xs text-neutral-500">{user.email}</div>
                  ) : null}
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 px-2 text-xs">
                <Link
                  href="/dashboard/settings"
                  className="text-neutral-500 hover:text-neutral-300"
                  onClick={() => setMobileOpen(false)}
                >
                  Settings
                </Link>
                <Link
                  href="/dashboard/donate"
                  className="text-neutral-500 hover:text-neutral-300"
                  onClick={() => setMobileOpen(false)}
                >
                  Support project
                </Link>
                <a
                  href="/sign-out"
                  className="text-neutral-500 hover:text-neutral-300"
                  onClick={() => setMobileOpen(false)}
                >
                  Sign out
                </a>
              </div>
            </>
          )}
        </div>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="flex shrink-0 items-center gap-2 border-b border-white/10 px-3 py-2 md:hidden">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-neutral-300"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <span className="font-serif text-lg text-neutral-100">{siteConfig.name}</span>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
      </div>

      {user ? (
        <ModelPickerDialog
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          onCreated={onSessionCreated}
        />
      ) : null}
    </div>
  );
}
