"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Users,
  ChevronDown,
  ChevronRight,
  MessageSquare,
  FileText,
  DollarSign,
  Cpu,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AVAILABLE_MODELS, type ModelId } from "@/lib/model";

interface AdminUser {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: "user" | "admin";
  emailVerified: string | null;
  sessionCount: number;
  lastSessionAt: string | null;
}

interface UserSession {
  id: string;
  title: string;
  targetRole: string | null;
  status: "in_progress" | "complete";
  cvLanguage: string | null;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
}

interface UsageData {
  totals: {
    totalCostCents: number;
    totalInputTokens: number;
    totalOutputTokens: number;
    totalRequests: number;
  };
  byModel: {
    model: string;
    costCents: number;
    inputTokens: number;
    outputTokens: number;
    requests: number;
  }[];
  byUser: {
    userId: string;
    name: string | null;
    email: string | null;
    image: string | null;
    costCents: number;
    inputTokens: number;
    outputTokens: number;
    requests: number;
  }[];
}

function formatCost(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatTokens(tokens: number): string {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`;
  if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(1)}K`;
  return String(tokens);
}

function getModelLabel(modelId: string): string {
  return AVAILABLE_MODELS[modelId as ModelId]?.label ?? modelId;
}

export default function AdminPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [userSessions, setUserSessions] = useState<
    Record<string, UserSession[]>
  >({});
  const [loadingSessions, setLoadingSessions] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/users").then((res) => {
        if (res.status === 403)
          throw new Error("No tienes permisos de administrador");
        if (!res.ok) throw new Error("Error al cargar usuarios");
        return res.json();
      }),
      fetch("/api/admin/usage").then((res) => {
        if (!res.ok) return null;
        return res.json();
      }),
    ])
      .then(([usersData, usageData]) => {
        setUsers(usersData);
        setUsage(usageData);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function toggleUserSessions(userId: string) {
    if (expandedUser === userId) {
      setExpandedUser(null);
      return;
    }

    setExpandedUser(userId);

    if (userSessions[userId]) return;

    setLoadingSessions(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}/sessions`);
      if (!res.ok) throw new Error("Error al cargar sesiones");
      const sessions = await res.json();
      setUserSessions((prev) => ({ ...prev, [userId]: sessions }));
    } catch {
      setUserSessions((prev) => ({ ...prev, [userId]: [] }));
    } finally {
      setLoadingSessions(null);
    }
  }

  function getUserCost(userId: string): number {
    return usage?.byUser.find((u) => u.userId === userId)?.costCents ?? 0;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Users className="mb-4 h-10 w-10 text-red-400" />
        <p className="text-red-400">{error}</p>
        <Link
          href="/dashboard"
          className="mt-4 text-sm text-neutral-400 transition-colors hover:text-neutral-200"
        >
          Volver al dashboard
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="mb-4 inline-flex items-center gap-1 text-sm text-neutral-400 transition-colors hover:text-neutral-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al dashboard
        </Link>
        <h1 className="font-serif text-3xl text-neutral-100">
          Administración
        </h1>
        <p className="mt-1 text-sm text-neutral-400">
          Usuarios registrados, sesiones y gasto de IA.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
        </div>
      ) : (
        <>
          {/* Stats cards */}
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-white/10 bg-[#161b22] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                  <Users className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-neutral-100">
                    {users.length}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {users.length === 1
                      ? "usuario registrado"
                      : "usuarios registrados"}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-white/10 bg-[#161b22] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                  <DollarSign className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-neutral-100">
                    {usage ? formatCost(usage.totals.totalCostCents) : "$0.00"}
                  </p>
                  <p className="text-xs text-neutral-500">gasto total</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-white/10 bg-[#161b22] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                  <Cpu className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-neutral-100">
                    {usage
                      ? formatTokens(
                          usage.totals.totalInputTokens +
                            usage.totals.totalOutputTokens
                        )
                      : "0"}
                  </p>
                  <p className="text-xs text-neutral-500">tokens totales</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-white/10 bg-[#161b22] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                  <Zap className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-neutral-100">
                    {usage?.totals.totalRequests ?? 0}
                  </p>
                  <p className="text-xs text-neutral-500">requests totales</p>
                </div>
              </div>
            </div>
          </div>

          {/* Spending by model */}
          {usage && usage.byModel.length > 0 && (
            <div className="mb-8">
              <h2 className="mb-4 text-lg font-semibold text-neutral-100">
                Gasto por modelo
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {usage.byModel.map((m) => (
                  <div
                    key={m.model}
                    className="rounded-lg border border-white/10 bg-[#161b22] p-4"
                  >
                    <p className="text-sm font-medium text-neutral-200">
                      {getModelLabel(m.model)}
                    </p>
                    <p className="mt-1 text-xl font-semibold text-neutral-100">
                      {formatCost(m.costCents)}
                    </p>
                    <div className="mt-2 flex items-center gap-3 text-xs text-neutral-500">
                      <span>{formatTokens(m.inputTokens + m.outputTokens)} tokens</span>
                      <span>{m.requests} requests</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Users table */}
          <h2 className="mb-4 text-lg font-semibold text-neutral-100">
            Usuarios
          </h2>
          <div className="overflow-hidden rounded-lg border border-white/10 bg-[#161b22]">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="w-8 text-neutral-400" />
                  <TableHead className="text-neutral-400">Usuario</TableHead>
                  <TableHead className="text-neutral-400">Email</TableHead>
                  <TableHead className="text-neutral-400">Rol</TableHead>
                  <TableHead className="text-center text-neutral-400">
                    Sesiones
                  </TableHead>
                  <TableHead className="text-right text-neutral-400">
                    Gasto
                  </TableHead>
                  <TableHead className="text-neutral-400">
                    Última sesión
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <>
                    <TableRow
                      key={user.id}
                      className="cursor-pointer border-white/5 hover:bg-white/5"
                      onClick={() => toggleUserSessions(user.id)}
                    >
                      <TableCell className="w-8">
                        {expandedUser === user.id ? (
                          <ChevronDown className="h-4 w-4 text-neutral-500" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-neutral-500" />
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {user.image ? (
                            <img
                              src={user.image}
                              alt=""
                              className="h-8 w-8 rounded-full"
                            />
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-700 text-xs text-neutral-300">
                              {(user.name || user.email || "?")[0]?.toUpperCase()}
                            </div>
                          )}
                          <span className="text-neutral-200">
                            {user.name || "Sin nombre"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-neutral-400">
                        {user.email}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            user.role === "admin"
                              ? "bg-amber-500/20 text-amber-400"
                              : "bg-neutral-500/20 text-neutral-400"
                          }
                        >
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center text-neutral-300">
                        {user.sessionCount}
                      </TableCell>
                      <TableCell className="text-right text-neutral-300">
                        {formatCost(getUserCost(user.id))}
                      </TableCell>
                      <TableCell className="text-neutral-400">
                        {user.lastSessionAt
                          ? new Date(user.lastSessionAt).toLocaleDateString()
                          : "—"}
                      </TableCell>
                    </TableRow>

                    {expandedUser === user.id && (
                      <TableRow
                        key={`${user.id}-sessions`}
                        className="border-white/5 hover:bg-transparent"
                      >
                        <TableCell colSpan={7} className="p-0">
                          <div className="ml-4 border-l-2 border-amber-500/30 bg-[#0d1117]/50 px-6 py-4">
                            {loadingSessions === user.id ? (
                              <div className="flex items-center justify-center py-4">
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
                              </div>
                            ) : !userSessions[user.id]?.length ? (
                              <p className="py-2 text-sm text-neutral-500">
                                Este usuario no tiene sesiones.
                              </p>
                            ) : (
                              <div className="space-y-2">
                                <p className="mb-3 text-xs font-medium uppercase tracking-wider text-neutral-500">
                                  Sesiones ({userSessions[user.id].length})
                                </p>
                                {userSessions[user.id].map((session) => (
                                  <div
                                    key={session.id}
                                    className="flex items-center justify-between rounded-lg border border-white/5 bg-[#161b22] px-4 py-3"
                                  >
                                    <div className="flex items-center gap-3">
                                      <FileText className="h-4 w-4 text-neutral-500" />
                                      <div>
                                        <p className="text-sm text-neutral-200">
                                          {session.title}
                                        </p>
                                        <p className="text-xs text-neutral-500">
                                          {session.targetRole ||
                                            "Sin rol objetivo"}
                                          {session.cvLanguage &&
                                            ` · ${session.cvLanguage}`}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                      <div className="flex items-center gap-1 text-xs text-neutral-500">
                                        <MessageSquare className="h-3 w-3" />
                                        {session.messageCount}
                                      </div>
                                      <Badge
                                        className={
                                          session.status === "complete"
                                            ? "bg-green-500/20 text-green-400"
                                            : "bg-neutral-500/20 text-neutral-400"
                                        }
                                      >
                                        {session.status === "complete"
                                          ? "Completa"
                                          : "En progreso"}
                                      </Badge>
                                      <span className="text-xs text-neutral-500">
                                        {new Date(
                                          session.createdAt
                                        ).toLocaleDateString()}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
