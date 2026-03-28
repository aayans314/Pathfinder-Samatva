"use client";

import { useCurrentUser, useStats, useDailyGoals } from "@/hooks/use-goals";

export function GreetingWidget() {
  const user = useCurrentUser();
  const stats = useStats();
  const dailyGoals = useDailyGoals();

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const firstName = user.name.split(" ")[0];

  const dailyCompleted = dailyGoals.filter((dg) => dg.completed).length;
  const dailyTotal = dailyGoals.length;

  // Motivational nudge
  let nudge = "";
  if (stats.completionPercent >= 75) {
    nudge = `You're ${stats.completionPercent}% through your goals — the finish line is in sight!`;
  } else if (stats.completionPercent >= 50) {
    nudge = `${stats.completionPercent}% done — past the halfway mark. Keep pushing!`;
  } else if (stats.completionPercent >= 25) {
    nudge = `${stats.completionPercent}% complete — great momentum. Every step counts.`;
  } else {
    nudge = `Every journey starts with a single step. You've got ${stats.activeGoals} goals to conquer!`;
  }

  // Format today's date
  const today = new Date();
  const dateStr = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="relative overflow-hidden rounded-xl border border-border/50 bg-gradient-to-br from-card via-card to-muted/30 p-6">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-primary/5 to-transparent rounded-full -translate-y-32 translate-x-32" />

      <div className="relative space-y-2">
        <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase">
          {dateStr}
        </p>
        <h1 className="text-2xl font-bold tracking-tight">
          {greeting}, {firstName} 👋
        </h1>
        <p className="text-sm text-muted-foreground max-w-lg">{nudge}</p>

        {/* Quick stats row */}
        <div className="flex items-center gap-6 pt-3">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">
                {stats.completedTasks}
              </span>{" "}
              tasks completed
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-blue-500" />
            <span className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">
                {stats.activeGoals}
              </span>{" "}
              active goals
            </span>
          </div>
          {dailyTotal > 0 && (
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-amber-500" />
              <span className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">
                  {dailyCompleted}/{dailyTotal}
                </span>{" "}
                daily goals
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
