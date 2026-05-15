"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import "@google/model-viewer";
import { Box, Loader2, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { textForSpeech } from "@/lib/markdown-to-speech";
import { cn } from "@/lib/utils";

export type RenataAvatarMessage = {
  id: string;
  role: string;
  content: string;
};

export type RenataAvatarPanelHandle = {
  speakPlainText: (markdownOrPlain: string) => void;
  cancelSpeech: () => void;
};

type RenataAvatarPanelProps = {
  messages: RenataAvatarMessage[];
  /** sessionStorage key for Meshy task id (avoid clashes between admin viewer vs session chat). */
  meshyStorageKey?: string;
  /** Hide manual “listen to message” picker (session voice mode). */
  compact?: boolean;
  /** Renata is generating a reply (subtle UI hint). */
  assistantBusy?: boolean;
};

type MeshyPoll = {
  status: string;
  progress: number;
  glbUrl: string | null;
  error: string | null;
};

export const RenataAvatarPanel = forwardRef<
  RenataAvatarPanelHandle,
  RenataAvatarPanelProps
>(function RenataAvatarPanel(
  { messages, meshyStorageKey = "renata_admin_meshy_task_id", compact = false, assistantBusy = false },
  ref
) {
  const [taskId, setTaskId] = useState<string | null>(null);
  const [poll, setPoll] = useState<MeshyPoll | null>(null);
  const [busy, setBusy] = useState(false);
  const pollIntervalRef = useRef<number | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const [pulse, setPulse] = useState(0);
  const rafRef = useRef(0);

  const assistantMessages = useMemo(
    () =>
      messages.filter(
        (m) => m.role === "assistant" && m.content.trim().length > 0
      ),
    [messages]
  );

  const defaultAssistantId = assistantMessages.at(-1)?.id ?? "";
  const [pickOverride, setPickOverride] = useState<string | null>(null);
  const selectedId =
    pickOverride &&
    assistantMessages.some((m) => m.id === pickOverride)
      ? pickOverride
      : defaultAssistantId;

  useEffect(() => {
    const t = window.setTimeout(() => {
      const saved = sessionStorage.getItem(meshyStorageKey);
      if (saved) setTaskId(saved);
    }, 0);
    return () => window.clearTimeout(t);
  }, [meshyStorageKey]);

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current != null) {
      window.clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  const fetchTask = useCallback(
    async (tid: string) => {
      const res = await fetch(`/api/admin/meshy/image-to-3d/${tid}`);
      const data = (await res.json()) as {
        status?: string;
        progress?: number;
        glbUrl?: string | null;
        errorMessage?: string | null;
        error?: string;
      };
      if (!res.ok) {
        setPoll({
          status: "FAILED",
          progress: 0,
          glbUrl: null,
          error: data.error || "Error al consultar Meshy",
        });
        stopPolling();
        return;
      }
      const status = data.status ?? "UNKNOWN";
      setPoll({
        status,
        progress: data.progress ?? 0,
        glbUrl: data.glbUrl ?? null,
        error: data.errorMessage ?? null,
      });
      if (status === "SUCCEEDED" && data.glbUrl) {
        sessionStorage.setItem(meshyStorageKey, tid);
        stopPolling();
      }
      if (status === "FAILED" || status === "CANCELED") {
        stopPolling();
      }
    },
    [meshyStorageKey, stopPolling]
  );

  useEffect(() => {
    if (!taskId) return;
    const run = () => {
      void fetchTask(taskId);
    };
    const first = window.setTimeout(run, 0);
    pollIntervalRef.current = window.setInterval(run, 4000);
    return () => {
      window.clearTimeout(first);
      stopPolling();
    };
  }, [taskId, fetchTask, stopPolling]);

  const startPulse = useCallback(() => {
    const tick = () => {
      setPulse(0.45 + 0.55 * Math.sin(Date.now() / 100));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const stopPulse = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    setPulse(0);
  }, []);

  const runSpeech = useCallback(
    (raw: string) => {
      if (typeof window === "undefined" || !window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      const plain = textForSpeech(raw);
      if (!plain) return;
      const u = new SpeechSynthesisUtterance(plain);
      u.lang = "es-ES";
      u.rate = 1;
      u.onstart = () => {
        setSpeaking(true);
        startPulse();
      };
      u.onend = () => {
        setSpeaking(false);
        stopPulse();
      };
      u.onerror = () => {
        setSpeaking(false);
        stopPulse();
      };
      window.speechSynthesis.speak(u);
    },
    [startPulse, stopPulse]
  );

  useImperativeHandle(
    ref,
    () => ({
      speakPlainText: (markdownOrPlain: string) => {
        runSpeech(markdownOrPlain);
      },
      cancelSpeech: () => {
        if (typeof window !== "undefined") window.speechSynthesis.cancel();
        setSpeaking(false);
        stopPulse();
      },
    }),
    [runSpeech, stopPulse]
  );

  const speakSelected = () => {
    const msg = assistantMessages.find((m) => m.id === selectedId);
    if (!msg) return;
    runSpeech(msg.content);
  };

  useEffect(() => {
    return () => {
      stopPulse();
      if (typeof window !== "undefined") window.speechSynthesis.cancel();
    };
  }, [stopPulse]);

  async function startMeshy() {
    setBusy(true);
    setPoll(null);
    try {
      const res = await fetch("/api/admin/meshy/image-to-3d", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = (await res.json()) as { taskId?: string; error?: string };
      if (!res.ok) {
        setPoll({
          status: "FAILED",
          progress: 0,
          glbUrl: null,
          error: data.error || "No se pudo iniciar Meshy",
        });
        return;
      }
      if (data.taskId) {
        setTaskId(data.taskId);
        sessionStorage.setItem(meshyStorageKey, data.taskId);
      }
    } finally {
      setBusy(false);
    }
  }

  const glbUrl = poll?.glbUrl ?? null;
  /** Same-origin proxy avoids CORS when loading Meshy’s CDN in the browser. */
  const modelViewerSrc =
    glbUrl && taskId
      ? `/api/admin/meshy/image-to-3d/${encodeURIComponent(taskId)}/model`
      : null;
  const meshyLabel =
    poll == null
      ? taskId
        ? "Consultando Meshy…"
        : "Sin modelo 3D aún"
      : poll.status === "SUCCEEDED"
        ? "Modelo listo"
        : poll.status === "FAILED" || poll.status === "CANCELED"
          ? poll.error || "Generación fallida"
          : `${poll.status} · ${poll.progress}%`;

  return (
    <div className="rounded-lg border border-white/10 bg-[#161b22] p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <p className="font-serif text-base text-neutral-100">Renata 3D</p>
          <p className="text-xs text-neutral-500">
            Meshy (image → GLB) + voz del navegador.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="shrink-0 gap-1.5 border border-white/10 bg-white/5 text-neutral-200 hover:bg-white/10"
          disabled={busy}
          onClick={() => void startMeshy()}
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Box className="h-4 w-4 text-amber-500" />
          )}
          Generar GLB
        </Button>
      </div>

      <p
        className={cn(
          "mb-3 text-xs text-neutral-400",
          assistantBusy && "animate-pulse"
        )}
      >
        {meshyLabel}
      </p>

      <div
        className={cn(
          "relative overflow-hidden rounded-lg bg-black/40",
          speaking && "ring-2 ring-amber-500/40"
        )}
        style={{
          transform: modelViewerSrc ? `scale(${1 + pulse * 0.06})` : undefined,
          transition: speaking ? undefined : "transform 0.3s ease",
        }}
      >
        {modelViewerSrc ? (
          <model-viewer
            src={modelViewerSrc}
            alt="Renata 3D"
            camera-controls
            auto-rotate
            shadow-intensity="1"
            exposure="1"
            interaction-prompt="none"
            className={cn(
              "w-full bg-gradient-to-b from-neutral-900 to-black",
              compact
                ? "h-[min(40vh,320px)]"
                : "h-[min(52vh,420px)]"
            )}
          />
        ) : (
          <div
            className={cn(
              "flex flex-col items-center justify-center gap-2 px-4 text-center",
              compact ? "h-[min(40vh,320px)]" : "h-[min(52vh,420px)]"
            )}
          >
            <p className="text-sm text-neutral-500">
              Genera un modelo desde el avatar 2D (`renata-avatar.png`). La
              generación puede tardar varios minutos y consume créditos Meshy.
            </p>
          </div>
        )}
      </div>

      {!compact && (
        <div className="mt-4 space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">
            Leer mensaje (voz del sistema)
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <select
              value={selectedId}
              onChange={(e) => setPickOverride(e.target.value)}
              disabled={assistantMessages.length === 0}
              className="h-9 w-full rounded-md border border-white/10 bg-black/30 px-3 text-sm text-neutral-200 sm:max-w-xs"
            >
              {[...assistantMessages].reverse().map((m, i) => (
                <option key={m.id} value={m.id}>
                  Mensaje asistente {assistantMessages.length - i}
                </option>
              ))}
            </select>
            <Button
              type="button"
              size="sm"
              className="gap-1.5 bg-amber-600 text-neutral-950 hover:bg-amber-500"
              disabled={!selectedId || speaking}
              onClick={speakSelected}
            >
              <Volume2 className="h-4 w-4" />
              Escuchar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
});

RenataAvatarPanel.displayName = "RenataAvatarPanel";
