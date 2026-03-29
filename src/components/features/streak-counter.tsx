"use client";

import { useEffect, useState } from "react";
import { Flame } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";

interface StreakData {
  current_streak: number;
  longest_streak: number;
  last_active_date: string | null;
}

export function StreakCounter() {
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [celebration, setCelebration] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function loadAndUpdateStreak() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split("T")[0];

      const { data: existing } = await supabase
        .from("streaks")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (!existing) {
        const { data: newStreak } = await supabase
          .from("streaks")
          .insert({
            user_id: user.id,
            current_streak: 1,
            longest_streak: 1,
            last_active_date: today,
          })
          .select()
          .single();
        if (newStreak) setStreak(newStreak);
        return;
      }

      if (existing.last_active_date === today) {
        setStreak(existing);
        return;
      }

      const lastDate = existing.last_active_date
        ? new Date(existing.last_active_date)
        : null;
      const todayDate = new Date(today);

      let newCurrentStreak: number;

      if (lastDate) {
        const diffDays = Math.round(
          (todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        newCurrentStreak = diffDays === 1 ? existing.current_streak + 1 : 1;
      } else {
        newCurrentStreak = 1;
      }

      const newLongest = Math.max(existing.longest_streak, newCurrentStreak);

      const { data: updated } = await supabase
        .from("streaks")
        .update({
          current_streak: newCurrentStreak,
          longest_streak: newLongest,
          last_active_date: today,
        })
        .eq("user_id", user.id)
        .select()
        .single();

      if (updated) {
        setStreak(updated);
        if ([7, 30, 100, 365].includes(newCurrentStreak)) {
          setCelebration(`${newCurrentStreak}-day streak!`);
          setTimeout(() => setCelebration(null), 4000);
        }
      }
    }

    loadAndUpdateStreak();
  }, [supabase]);

  if (!streak) return null;

  const isActive = streak.current_streak > 0;

  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          "flex items-center gap-1.5 rounded-full px-3.5 py-2 text-base font-semibold transition-all",
          isActive
            ? "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
            : "bg-muted text-muted-foreground"
        )}
      >
        <Flame
          className={cn(
            "h-5 w-5",
            isActive && "text-amber-500",
            streak.current_streak >= 7 && "animate-pulse"
          )}
        />
        <span>{streak.current_streak}</span>
      </div>
      {streak.longest_streak > streak.current_streak && (
        <Badge variant="outline" className="text-xs px-2 py-0.5">
          Best: {streak.longest_streak}
        </Badge>
      )}
      {celebration && (
        <span className="text-base font-bold text-amber-500 animate-bounce">
          {celebration}
        </span>
      )}
    </div>
  );
}
