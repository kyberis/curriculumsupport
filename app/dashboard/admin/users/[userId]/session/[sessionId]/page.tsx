"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ArrowLeft,
  Eye,
  Loader2,
  Info,
  Calendar,
  Cpu,
  Briefcase,
  Languages,
  FileText,
  MessageSquare,
  Hash,
  Brain,
  Activity,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Message as DbMessage, Session } from "@/lib/db/schema";
import { AVAILABLE_MODELS, type ModelId } from "@/lib/model";

interface Owner {
  id: string;
  name: string | null;
  email: string | null;
}

type AdminSessionSnapshot = Omit<Session, "cvContent" | "generatedCv">;

interface SessionMeta {
  messageCount: number;
  userMessageCount: number;
  assistantMessageCount: number;
  systemMessageCount: number;
  hasCvContent: boolean;
  cvContentChars: number;
  hasGeneratedCv: boolean;
  generatedCvChars: number;
}

function formatDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString("es", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function modelLabel(modelId: string): string {
  return AVAILABLE_MODELS[modelId as ModelId]?.label ?? modelId;
}

export default function AdminSessionViewPage() {
  const { userId, sessionId } = useParams<{
    userId: string;
    sessionId: string;
  }>();
  const scrollRef = useRef<HTMLDivElement>(null);

  const [session, setSession] = useState<AdminSessionSnapshot | null>(null);
  const [messages, setMessages] = useState<DbMessage[]>([]);
  const [owner, setOwner] = useState<Owner | null>(null);
  const [meta, setMeta] = useState<SessionMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/admin/users/${userId}/sessions/${sessionId}`)
      .then((res) => {
        if (res.status === 403) {
          throw new Error("No tienes permisos de administrador");
        }
        if (res.status === 404) {
          throw new Error("Sesión no encontrada");
        }
        if (!res.ok) throw new Error("Error al cargar la conversación");
        return res.json() as Promise<{
          session: AdminSessionSnapshot;
          messages: DbMessage[];
          owner: Owner;
          meta: SessionMeta;
        }>;
      })
      .then((data) => {
        setSession(data.session);
        setMessages(data.messages);
        setOwner(data.owner);
        setMeta(data.meta);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [userId, sessionId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <p className="text-red-400">{error}</p>
        <Link
          href="/dashboard/admin"
          className={cn(buttonVariants({ variant: "ghost" }), "mt-4")}
        >
          Volver a administración
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-[70vh] flex-col">
      <div className="mb-6 space-y-6">
      <div className="mb-6">
        <Link
          href="/dashboard/admin"
          className="mb-3 inline-flex items-center gap-1 text-sm text-neutral-400 transition-colors hover:text-neutral-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Administración
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-serif text-2xl text-neutral-100">
              {session?.title ?? "Sesión"}
            </h1>
            <p className="mt-1 text-sm text-neutral-400">
              {owner?.name || "Sin nombre"}
              {owner?.email ? ` · ${owner.email}` : ""}
            </p>
          </div>
          <Badge className="shrink-0 gap-1 bg-amber-500/15 text-amber-300">
            <Eye className="h-3 w-3" />
            Solo lectura
          </Badge>
        </div>
      </div>

      {session && meta && (
        <div className="mb-6 rounded-lg border border-white/10 bg-[#161b22] p-4">
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-neutral-500">
            Metadatos de la sesión
          </p>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div className="flex gap-2">
              <Hash className="mt-0.5 h-4 w-4 shrink-0 text-neutral-500" />
              <div>
                <dt className="text-neutral-500">ID de sesión</dt>
                <dd className="mt-0.5 font-mono text-xs text-neutral-300 break-all">
                  {session.id}
                </dd>
              </div>
            </div>
            <div className="flex gap-2">
              <Hash className="mt-0.5 h-4 w-4 shrink-0 text-neutral-500" />
              <div>
                <dt className="text-neutral-500">ID de usuario</dt>
                <dd className="mt-0.5 font-mono text-xs text-neutral-300 break-all">
                  {session.userId}
                </dd>
              </div>
            </div>
            <div className="flex gap-2">
              <Cpu className="mt-0.5 h-4 w-4 shrink-0 text-neutral-500" />
              <div>
                <dt className="text-neutral-500">Modelo</dt>
                <dd className="mt-0.5 text-neutral-200">
                  {modelLabel(session.model)}
                </dd>
              </div>
            </div>
            <div className="flex gap-2">
              <Briefcase className="mt-0.5 h-4 w-4 shrink-0 text-neutral-500" />
              <div>
                <dt className="text-neutral-500">Rol objetivo</dt>
                <dd className="mt-0.5 text-neutral-200">
                  {session.targetRole?.trim() || "—"}
                </dd>
              </div>
            </div>
            <div className="flex gap-2">
              <Languages className="mt-0.5 h-4 w-4 shrink-0 text-neutral-500" />
              <div>
                <dt className="text-neutral-500">Idioma del CV</dt>
                <dd className="mt-0.5 text-neutral-200">
                  {session.cvLanguage?.trim() || "—"}
                </dd>
              </div>
            </div>
            <div className="flex gap-2">
              <Activity className="mt-0.5 h-4 w-4 shrink-0 text-neutral-500" />
              <div>
                <dt className="text-neutral-500">Estado</dt>
                <dd className="mt-0.5">
                  <Badge
                    className={
                      session.status === "complete"
                        ? "bg-green-500/20 text-green-400"
                        : "bg-neutral-500/20 text-neutral-400"
                    }
                  >
                    {session.status === "complete" ? "Completa" : "En progreso"}
                  </Badge>
                </dd>
              </div>
            </div>
            <div className="flex gap-2 sm:col-span-2">
              <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-neutral-500" />
              <div className="flex flex-wrap gap-x-6 gap-y-1">
                <div>
                  <dt className="text-neutral-500">Creada</dt>
                  <dd className="mt-0.5 text-neutral-200">
                    {formatDate(session.createdAt)}
                  </dd>
                </div>
                <div>
                  <dt className="text-neutral-500">Última actualización</dt>
                  <dd className="mt-0.5 text-neutral-200">
                    {formatDate(session.updatedAt)}
                  </dd>
                </div>
              </div>
            </div>
            <div className="flex gap-2 sm:col-span-2">
              <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-neutral-500" />
              <div>
                <dt className="text-neutral-500">Mensajes</dt>
                <dd className="mt-0.5 text-neutral-200">
                  {meta.messageCount} total
                  <span className="text-neutral-500">
                    {" "}
                    · usuario {meta.userMessageCount}, asistente{" "}
                    {meta.assistantMessageCount}
                    {meta.systemMessageCount > 0
                      ? `, sistema ${meta.systemMessageCount}`
                      : ""}
                  </span>
                </dd>
              </div>
            </div>
            <div className="flex gap-2 sm:col-span-2">
              <FileText className="mt-0.5 h-4 w-4 shrink-0 text-neutral-500" />
              <div>
                <dt className="text-neutral-500">CV en sesión</dt>
                <dd className="mt-0.5 text-neutral-200">
                  {meta.hasCvContent ? (
                    <>
                      Texto extraído cargado (~{meta.cvContentChars.toLocaleString()}{" "}
                      caracteres)
                    </>
                  ) : (
                    "Sin PDF / texto de CV cargado"
                  )}
                  {" · "}
                  {meta.hasGeneratedCv ? (
                    <>
                      Borrador generado (~{meta.generatedCvChars.toLocaleString()}{" "}
                      caracteres)
                    </>
                  ) : (
                    "Sin CV generado aún"
                  )}
                </dd>
              </div>
            </div>
          </dl>
        </div>
      )}

      {session?.sessionSummary?.trim() && (
        <div className="mb-6 rounded-lg border border-white/10 bg-[#161b22] p-4">
          <p className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-neutral-500">
            <Brain className="h-3.5 w-3.5" />
            Resumen de sesión (memoria compartida)
          </p>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-300">
            {session.sessionSummary}
          </p>
        </div>
      )}

      <div
        ref={scrollRef}
        className="max-h-[min(70vh,calc(100vh-16rem))] min-h-[320px] flex-1 overflow-y-auto rounded-lg border border-white/10 bg-[#161b22]"
      >
        <div className="mx-auto max-w-3xl space-y-4 px-4 py-6 sm:px-6">
          {messages.length === 0 ? (
            <p className="text-center text-sm text-neutral-500">
              No hay mensajes en esta sesión.
            </p>
          ) : (
            messages.map((msg) => {
              if (!msg.content.trim()) return null;
              const isUser = msg.role === "user";
              const isSystem = msg.role === "system";
              return (
                <div
                  key={msg.id}
                  className={`flex ${
                    isUser ? "justify-end" : "justify-start"
                  }`}
                >
                  {!isUser &&
                    (isSystem ? (
                      <div
                        className="mr-2.5 mt-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-neutral-700 text-neutral-400"
                        title="Mensaje de sistema"
                      >
                        <Info className="h-4 w-4" />
                      </div>
                    ) : (
                      <img
                        src="/renata-avatar.png"
                        alt="Renata"
                        className="mr-2.5 mt-1 h-7 w-7 flex-shrink-0 rounded-full"
                      />
                    ))}
                  <div
                    className={`max-w-[85%] rounded-lg px-4 py-3 text-sm leading-relaxed ${
                      isUser
                        ? "bg-amber-600/20 text-amber-100"
                        : isSystem
                          ? "border border-white/10 bg-neutral-800/40 text-neutral-400"
                          : "bg-white/5 text-neutral-300"
                    }`}
                  >
                    {isSystem && (
                      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-500">
                        Sistema
                      </p>
                    )}
                    {msg.role === "assistant" || isSystem ? (
                      <div className="prose prose-invert prose-sm max-w-none prose-headings:text-neutral-100 prose-headings:font-semibold prose-p:text-neutral-300 prose-strong:text-neutral-200 prose-li:text-neutral-300 prose-a:text-amber-400">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
      </div>

      <p className="mt-4 text-center text-xs text-neutral-600">
        Esta vista no permite enviar mensajes ni modificar la sesión del
        usuario.
      </p>
    </div>
  );
}
