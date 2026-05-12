"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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

export default function DashboardPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetch("/api/sessions")
      .then((res) => res.json())
      .then(setSessions)
      .finally(() => setLoading(false));
  }, []);

  async function createSession() {
    setCreating(true);
    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "New CV Session" }),
    });
    const session = await res.json();
    router.push(`/session/${session.id}`);
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
          onClick={createSession}
          disabled={creating}
          className="bg-amber-600 text-white hover:bg-amber-500"
        >
          <Plus className="mr-2 h-4 w-4" />
          {creating ? "Creating..." : "New session"}
        </Button>
      </div>

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
