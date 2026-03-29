"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/browser";
import { useSmartPriority } from "@/hooks/use-smart-priority";
import type { PrioritizedTask } from "@/hooks/use-smart-priority";
import { compactTaskLabel } from "@/lib/focus-task-display";

/**
 * When the user enables daily reminders + grants browser notification permission,
 * fires one notification per day at their chosen local time with the top focus task.
 * Requires the dashboard tab to be open (browser limitation). Server-side email/push is separate.
 */
export function ReminderScheduler() {
  const topTasks = useSmartPriority(3);
  const tasksRef = useRef<PrioritizedTask[]>([]);

  const lastFireKey = useRef<string | null>(null);

  useEffect(() => {
    tasksRef.current = topTasks;
  }, [topTasks]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof Notification === "undefined") {
      return;
    }

    let cancelled = false;

    const tick = async () => {
      if (cancelled) return;
      if (Notification.permission !== "granted") return;

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("reminder_enabled, reminder_time")
        .eq("id", user.id)
        .single();

      if (!profile?.reminder_enabled) return;

      const parts = (profile.reminder_time || "09:00").split(":");
      const h = Number.parseInt(parts[0] ?? "9", 10);
      const m = Number.parseInt(parts[1] ?? "0", 10);
      if (Number.isNaN(h) || Number.isNaN(m)) return;

      const now = new Date();
      if (now.getHours() !== h || now.getMinutes() !== m) return;

      const dayKey = now.toDateString();
      const fireKey = `${dayKey}-${h}-${m}`;
      if (lastFireKey.current === fireKey) return;
      lastFireKey.current = fireKey;

      const latest = tasksRef.current;
      const primary = latest[0];
      const body = primary
        ? `${compactTaskLabel(primary.title, 100)}\n${primary.goalName}`
        : "Open Pathfinder to review your focus tasks and paths.";

      try {
        new Notification("Pathfinder — your daily nudge", {
          body,
          tag: "pathfinder-daily-nudge",
          requireInteraction: false,
        });
      } catch {
        /* ignore */
      }
    };

    const interval = window.setInterval(() => {
      void tick();
    }, 15_000);
    void tick();

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  return null;
}
