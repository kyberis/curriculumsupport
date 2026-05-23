"use client";

import { Fragment, useEffect, useState } from "react";
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
  Heart,
  Eye,
  MousePointerClick,
  Brain,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  sessionSummary: string | null;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
}

interface UserMemory {
  profileSummary: string | null;
  sessionSummaries: {
    id: string;
    title: string;
    sessionSummary: string | null;
    updatedAt: string;
  }[];
}

interface DonateStats {
  views: number;
  viewsUnique: number;
  clicksDonate: number;
  clicksDonateUnique: number;
  clicksCrypto: number;
  clicksCryptoUnique: number;
  clicksPaypal: number;
  clicksPaypalUnique: number;
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
  const [donateStats, setDonateStats] = useState<DonateStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [userSessions, setUserSessions] = useState<
    Record<string, UserSession[]>
  >({});
  const [loadingSessions, setLoadingSessions] = useState<string | null>(null);
  const [userMemory, setUserMemory] = useState<Record<string, UserMemory>>({});
  const [loadingMemory, setLoadingMemory] = useState<string | null>(null);
  const [clearingMemory, setClearingMemory] = useState<string | null>(null);

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
      fetch("/api/admin/donate-events").then((res) => {
        if (!res.ok) return null;
        return res.json();
      }),
    ])
      .then(([usersData, usageData, donateData]) => {
        setUsers(usersData);
        setUsage(usageData);
        setDonateStats(donateData);
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

    const loadSessions = userSessions[userId]
      ? Promise.resolve(userSessions[userId])
      : fetch(`/api/admin/users/${userId}/sessions`)
          .then((res) => {
            if (!res.ok) throw new Error("Error al cargar sesiones");
            return res.json() as Promise<UserSession[]>;
          })
          .then((sessions) => {
            setUserSessions((prev) => ({ ...prev, [userId]: sessions }));
            return sessions;
          });

    const loadMemory = userMemory[userId]
      ? Promise.resolve(userMemory[userId])
      : fetch(`/api/admin/users/${userId}/memory`)
          .then((res) => {
            if (!res.ok) throw new Error("Error al cargar memoria");
            return res.json() as Promise<UserMemory>;
          })
          .then((memory) => {
            setUserMemory((prev) => ({ ...prev, [userId]: memory }));
            return memory;
          });

    setLoadingSessions(userId);
    setLoadingMemory(userId);

    try {
      await Promise.all([loadSessions, loadMemory]);
    } catch {
      if (!userSessions[userId]) {
        setUserSessions((prev) => ({ ...prev, [userId]: [] }));
      }
      if (!userMemory[userId]) {
        setUserMemory((prev) => ({
          ...prev,
          [userId]: { profileSummary: null, sessionSummaries: [] },
        }));
      }
    } finally {
      setLoadingSessions(null);
      setLoadingMemory(null);
    }
  }

  async function clearUserMemory(userId: string) {
    if (
      !confirm(
        "¿Borrar toda la memoria entre sesiones de este usuario? Renata dejará de recordar conversaciones anteriores."
      )
    ) {
      return;
    }

    setClearingMemory(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}/memory`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Error al borrar memoria");

      setUserMemory((prev) => ({
        ...prev,
        [userId]: { profileSummary: null, sessionSummaries: [] },
      }));
      setUserSessions((prev) => ({
        ...prev,
        [userId]: (prev[userId] ?? []).map((s) => ({
          ...s,
          sessionSummary: null,
        })),
      }));
    } catch {
      alert("No se pudo borrar la memoria. Intenta de nuevo.");
    } finally {
      setClearingMemory(null);
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

          {/* Donate funnel */}
          {donateStats && (
            <div className="mb-8">
              <h2 className="mb-4 text-lg font-semibold text-neutral-100">
                <Heart className="mr-2 inline h-5 w-5 text-amber-400" />
                Donaciones — Funnel
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg border border-white/10 bg-[#161b22] p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                      <Eye className="h-5 w-5 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-semibold text-neutral-100">
                        {donateStats.views}
                      </p>
                      <p className="text-xs text-neutral-500">
                        vieron la página ({donateStats.viewsUnique} únicos)
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-white/10 bg-[#161b22] p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                      <MousePointerClick className="h-5 w-5 text-green-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-semibold text-neutral-100">
                        {donateStats.clicksDonate}
                      </p>
                      <p className="text-xs text-neutral-500">
                        hicieron click en Donate ({donateStats.clicksDonateUnique} únicos)
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-white/10 bg-[#161b22] p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F7931A]/10">
                      <svg
                        viewBox="0 0 24 24"
                        className="h-5 w-5 text-[#F7931A]"
                        fill="currentColor"
                      >
                        <path d="M23.638 14.904c-1.602 6.43-8.113 10.34-14.542 8.736C2.67 22.05-1.244 15.525.362 9.105 1.962 2.67 8.475-1.243 14.9.358c6.43 1.605 10.342 8.115 8.738 14.546zm-6.35-4.613c.24-1.59-.974-2.45-2.64-3.03l.54-2.153-1.315-.33-.52 2.107c-.345-.087-.7-.168-1.05-.25l.526-2.127-1.32-.33-.54 2.165c-.285-.067-.565-.13-.84-.2l-1.815-.45-.35 1.407s.975.225.955.236c.535.136.63.486.615.766l-1.477 5.92c-.075.166-.24.406-.614.314.015.02-.96-.24-.96-.24l-.66 1.51 1.71.426.93.242-.54 2.19 1.32.327.54-2.17c.36.1.705.19 1.05.273l-.51 2.154 1.32.33.545-2.19c2.24.427 3.93.257 4.64-1.774.57-1.637-.03-2.58-1.217-3.196.854-.193 1.5-.74 1.68-1.93zm-3.01 4.22c-.404 1.64-3.157.75-4.05.53l.72-2.9c.896.23 3.757.67 3.33 2.37zm.41-4.24c-.37 1.49-2.662.735-3.405.55l.654-2.64c.744.18 3.137.52 2.75 2.084z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-2xl font-semibold text-neutral-100">
                        {donateStats.clicksCrypto}
                      </p>
                      <p className="text-xs text-neutral-500">
                        eligieron Crypto ({donateStats.clicksCryptoUnique} únicos)
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-white/10 bg-[#161b22] p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0070BA]/10">
                      <svg
                        viewBox="0 0 24 24"
                        className="h-5 w-5 text-[#0070BA]"
                        fill="currentColor"
                      >
                        <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c1.145 4.876-2.274 8.005-7.268 8.005H11.43l-1.617 10.243h3.32c.46 0 .85-.334.923-.788l.038-.194.73-4.627.047-.256a.933.933 0 0 1 .923-.788h.582c3.768 0 6.715-1.53 7.577-5.957.36-1.848.174-3.39-.73-4.097z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-2xl font-semibold text-neutral-100">
                        {donateStats.clicksPaypal}
                      </p>
                      <p className="text-xs text-neutral-500">
                        eligieron PayPal ({donateStats.clicksPaypalUnique} únicos)
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

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
                  <Fragment key={user.id}>
                    <TableRow
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
                        className="border-white/5 hover:bg-transparent"
                      >
                        <TableCell colSpan={7} className="p-0">
                          <div className="ml-4 border-l-2 border-amber-500/30 bg-[#0d1117]/50 px-6 py-4">
                            {loadingSessions === user.id ||
                            loadingMemory === user.id ? (
                              <div className="flex items-center justify-center py-4">
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
                              </div>
                            ) : (
                              <div className="space-y-4">
                                <div className="rounded-lg border border-white/5 bg-[#161b22] p-4">
                                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                                    <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-neutral-500">
                                      <Brain className="h-3.5 w-3.5" />
                                      Memoria entre sesiones
                                    </p>
                                    {(userMemory[user.id]?.profileSummary ||
                                      (userMemory[user.id]?.sessionSummaries
                                        .length ?? 0) > 0) && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300"
                                        disabled={clearingMemory === user.id}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          clearUserMemory(user.id);
                                        }}
                                      >
                                        <Trash2 className="mr-1 h-3 w-3" />
                                        {clearingMemory === user.id
                                          ? "Borrando…"
                                          : "Borrar memoria"}
                                      </Button>
                                    )}
                                  </div>
                                  {userMemory[user.id]?.profileSummary ? (
                                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-300">
                                      {userMemory[user.id].profileSummary}
                                    </p>
                                  ) : (
                                    <p className="text-sm text-neutral-500">
                                      Sin perfil consolidado aún. Se genera
                                      automáticamente conforme el usuario
                                      conversa en distintas sesiones.
                                    </p>
                                  )}
                                </div>

                                {!userSessions[user.id]?.length ? (
                                  <p className="py-2 text-sm text-neutral-500">
                                    Este usuario no tiene sesiones.
                                  </p>
                                ) : (
                                  <div className="space-y-2">
                                    <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">
                                      Sesiones ({userSessions[user.id].length})
                                    </p>
                                    {userSessions[user.id].map((session) => (
                                      <div
                                        key={session.id}
                                        className="rounded-lg border border-white/5 bg-[#161b22] px-4 py-3"
                                      >
                                        <div className="flex items-center justify-between gap-3">
                                          <div className="flex items-center gap-3">
                                            <FileText className="h-4 w-4 shrink-0 text-neutral-500" />
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
                                          <div className="flex shrink-0 items-center gap-4">
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
                                            <Link
                                              href={`/dashboard/admin/users/${user.id}/session/${session.id}`}
                                              onClick={(e) =>
                                                e.stopPropagation()
                                              }
                                              className="text-xs font-medium text-amber-400/90 underline-offset-2 transition-colors hover:text-amber-300 hover:underline"
                                            >
                                              Ver conversación
                                            </Link>
                                          </div>
                                        </div>
                                        {session.sessionSummary?.trim() && (
                                          <p className="mt-3 border-t border-white/5 pt-3 text-xs leading-relaxed text-neutral-400">
                                            {session.sessionSummary}
                                          </p>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
