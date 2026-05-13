"use client";

import { useState } from "react";
import Link from "next/link";
import { X, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

function trackDonateEvent(eventType: string) {
  fetch("/api/donate-events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ eventType }),
  }).catch(() => {});
}

export function DonateBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="relative border-t border-amber-500/20 bg-amber-500/5 px-6 py-4">
      <button
        onClick={() => setDismissed(true)}
        className="absolute right-3 top-3 rounded p-1 text-neutral-500 transition-colors hover:text-neutral-300"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="mx-auto max-w-3xl">
        <div className="flex items-start gap-3">
          <Heart className="mt-0.5 h-5 w-5 shrink-0 text-amber-500/70" />
          <div>
            <p className="text-sm leading-relaxed text-neutral-300">
              Si este proyecto te ayudó a mejorar tu CV, puedes donar cualquier
              monto que quieras para mantener el proyecto vivo y retribuir la
              ayuda.{" "}
              <span className="text-neutral-500">No es obligatorio.</span>
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href="/dashboard/donate">
                <Button
                  size="sm"
                  className="bg-amber-600 text-white hover:bg-amber-500"
                  onClick={() => trackDonateEvent("click_donate")}
                >
                  <Heart className="mr-1.5 h-3.5 w-3.5" />
                  Donate
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
