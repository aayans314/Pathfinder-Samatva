"use client";

import { Sparkles } from "lucide-react";
import { ExportFocusIcsButton } from "@/components/features/export-focus-ics-button";

export function ProactiveStrip() {
  return (
    <div className="glass-card px-6 py-5 space-y-4">
      <div className="flex items-start gap-4">
        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Sparkles className="h-6 w-6 text-primary" />
        </div>
        <div className="min-w-0 space-y-1.5">
          <p className="text-lg font-semibold leading-snug tracking-tight">
            Navigator insight
          </p>
          <p className="text-base text-muted-foreground leading-relaxed">
            Focus on your next few steps. Lock in one time block, then let the AI
            surface what matters after that.
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 pl-0 sm:pl-[4.5rem]">
        <ExportFocusIcsButton />
      </div>
    </div>
  );
}
