"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Users, ChevronDown, ChevronRight, MessageSquare, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

export default function AdminPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [userSessions, setUserSessions] = useState<Record<string, UserSession[]>>({});
  const [loadingSessions, setLoadingSessions] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/users")
      .then((res) => {
        if (res.status === 403) throw new Error("No tienes permisos de administrador");
        if (!res.ok) throw new Error("Error al cargar usuarios");
        return res.json();
      })
      .then(setUsers)
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
          Usuarios registrados y sus sesiones.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
        </div>
      ) : (
        <>
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
              <Users className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-neutral-100">
                {users.length}
              </p>
              <p className="text-xs text-neutral-500">
                {users.length === 1 ? "usuario registrado" : "usuarios registrados"}
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-white/10 bg-[#161b22]">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-neutral-400 w-8" />
                  <TableHead className="text-neutral-400">Usuario</TableHead>
                  <TableHead className="text-neutral-400">Email</TableHead>
                  <TableHead className="text-neutral-400">Rol</TableHead>
                  <TableHead className="text-neutral-400 text-center">Sesiones</TableHead>
                  <TableHead className="text-neutral-400">Última sesión</TableHead>
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
                      <TableCell className="text-neutral-400">
                        {user.lastSessionAt
                          ? new Date(user.lastSessionAt).toLocaleDateString()
                          : "—"}
                      </TableCell>
                    </TableRow>

                    {expandedUser === user.id && (
                      <TableRow key={`${user.id}-sessions`} className="border-white/5 hover:bg-transparent">
                        <TableCell colSpan={6} className="p-0">
                          <div className="border-l-2 border-amber-500/30 bg-[#0d1117]/50 px-6 py-4 ml-4">
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
                                          {session.targetRole || "Sin rol objetivo"}
                                          {session.cvLanguage && ` · ${session.cvLanguage}`}
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
                                        {session.status === "complete" ? "Completa" : "En progreso"}
                                      </Badge>
                                      <span className="text-xs text-neutral-500">
                                        {new Date(session.createdAt).toLocaleDateString()}
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
