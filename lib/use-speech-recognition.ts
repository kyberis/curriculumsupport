"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type RecognitionCtor = new () => {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((ev: Event) => void) | null;
  onerror: ((ev: Event) => void) | null;
  onend: ((ev: Event) => void) | null;
};

function getSpeechRecognitionCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function getTranscriptFromResultEvent(ev: Event): string {
  const e = ev as unknown as {
    results: { 0: { 0: { transcript: string } } };
  };
  return e.results?.[0]?.[0]?.transcript?.trim() ?? "";
}

function getErrorCode(ev: Event): string {
  const e = ev as unknown as { error?: string };
  return e.error ?? "unknown";
}

export function useSpeechRecognitionToText(options: {
  lang?: string;
  onFinal: (text: string) => void;
  onError?: (message: string) => void;
}) {
  const { lang = "es-ES", onFinal, onError } = options;
  const [supported, setSupported] = useState<boolean | null>(null);
  const [listening, setListening] = useState(false);
  const recRef = useRef<InstanceType<RecognitionCtor> | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setSupported(getSpeechRecognitionCtor() !== null);
    }, 0);
    return () => window.clearTimeout(t);
  }, []);

  const stop = useCallback(() => {
    try {
      recRef.current?.abort();
    } catch {
      /* ignore */
    }
    recRef.current = null;
    setListening(false);
  }, []);

  const start = useCallback(() => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      onError?.(
        "Este navegador no soporta reconocimiento de voz (prueba Chrome)."
      );
      return;
    }
    try {
      recRef.current?.abort();
    } catch {
      /* ignore */
    }
    const rec = new Ctor();
    rec.lang = lang;
    rec.continuous = false;
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (event: Event) => {
      const text = getTranscriptFromResultEvent(event);
      if (text) onFinal(text);
      setListening(false);
      recRef.current = null;
    };
    rec.onerror = (event: Event) => {
      const code = getErrorCode(event);
      if (code === "aborted" || code === "no-speech") {
        setListening(false);
        recRef.current = null;
        return;
      }
      onError?.(code || "Error de micrófono");
      setListening(false);
      recRef.current = null;
    };
    rec.onend = () => {
      setListening(false);
      recRef.current = null;
    };
    recRef.current = rec;
    setListening(true);
    try {
      rec.start();
    } catch (e) {
      setListening(false);
      recRef.current = null;
      onError?.(
        e instanceof Error ? e.message : "No se pudo iniciar el micrófono"
      );
    }
  }, [lang, onFinal, onError]);

  useEffect(() => () => stop(), [stop]);

  return { supported, listening, start, stop };
}
