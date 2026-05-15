/** Strip markdown-ish noise for browser TTS (best-effort). */
export function textForSpeech(input: string, maxLen = 8000): string {
  let t = input.replace(/\r\n/g, "\n");
  t = t.replace(/```[\s\S]*?```/g, " ");
  t = t.replace(/`([^`]+)`/g, "$1");
  t = t.replace(/^#{1,6}\s+/gm, "");
  t = t.replace(/^\s*[-*+]\s+/gm, "");
  t = t.replace(/^\s*\d+\.\s+/gm, "");
  t = t.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
  t = t.replace(/(\*{1,2}|_{1,2})([^*_]+)\1/g, "$2");
  t = t.replace(/\n{2,}/g, ". ");
  t = t.replace(/\s+/g, " ").trim();
  if (t.length > maxLen) t = `${t.slice(0, maxLen)}…`;
  return t;
}
