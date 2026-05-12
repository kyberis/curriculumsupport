import { demoMessages } from "@/lib/marketing-content";
import { FileText } from "lucide-react";

export function DemoChat() {
  return (
    <div className="mx-auto max-w-2xl overflow-hidden rounded-xl border border-white/10 bg-[#161b22]">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
        <span className="h-3 w-3 rounded-full bg-red-500/60" />
        <span className="h-3 w-3 rounded-full bg-yellow-500/60" />
        <span className="h-3 w-3 rounded-full bg-green-500/60" />
        <span className="ml-3 text-xs text-neutral-500">
          Renata — session
        </span>
      </div>

      <div className="space-y-4 p-5">
        {demoMessages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-4 py-3 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-amber-600/20 text-amber-100"
                  : "bg-white/5 text-neutral-300"
              }`}
            >
              {msg.hasAttachment && (
                <div className="mb-2 flex items-center gap-2 rounded bg-white/5 px-3 py-1.5 text-xs text-neutral-400">
                  <FileText className="h-3.5 w-3.5" />
                  {msg.attachmentName}
                </div>
              )}
              <p className="whitespace-pre-line">{msg.content}</p>
            </div>
          </div>
        ))}
        <div className="flex justify-start">
          <div className="flex items-center gap-1.5 rounded-lg bg-white/5 px-4 py-3">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500 delay-150" />
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500 delay-300" />
          </div>
        </div>
      </div>
    </div>
  );
}
