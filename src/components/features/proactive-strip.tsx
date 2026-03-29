"use client";

import { Sparkles } from "lucide-react";
import { ExportFocusIcsButton } from "@/components/features/export-focus-ics-button";

/**
 * Surfaces proactive, low-friction actions (not chat-first) so the product story matches the UI.
 */
export function ProactiveStrip() {
  return (
    <div className="rounded-xl border bg-muted/30 px-4 py-3 space-y-3">
      <div className="flex items-start gap-2">
        <Sparkles className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-medium leading-snug">Proactive, not only reactive</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Top tasks are short-list ranked (not your whole path wall of text). Weekly report +
            Navigator for depth. Settings: browser nudges. One-click .ics for your next block.
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 pl-6">
        <ExportFocusIcsButton />
      </div>
    </div>
  );
}
