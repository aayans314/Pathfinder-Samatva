"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { useAppStore } from "@/lib/store";
import { Loader2 } from "lucide-react";

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const setInitialData = useAppStore((state) => state.setInitialData);

  useEffect(() => {
    let isMounted = true;
    const supabase = createClient();

    async function loadData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          if (isMounted) setIsLoading(false);
          return;
        }

        const { data: goals, error: goalsErr } = await supabase
          .from("goals")
          .select("*")
          .eq("user_id", user.id);

        if (goalsErr) throw goalsErr;

        if (!goals || goals.length === 0) {
          if (isMounted) {
            setInitialData(user.id, [], [], [], [], []);
            setIsLoading(false);
          }
          return;
        }

        const goalIds = goals.map(g => g.id);

        const { data: milestones, error: milestonesErr } = await supabase
          .from("milestones")
          .select("*")
          .in("goal_id", goalIds);

        if (milestonesErr) throw milestonesErr;

        let tasks: unknown[] = [];
        if (milestones && milestones.length > 0) {
          const milestoneIds = milestones.map(m => m.id);
          const { data: tasksData, error: tasksErr } = await supabase
            .from("tasks")
            .select("*")
            .in("milestone_id", milestoneIds);

          if (tasksErr) throw tasksErr;
          tasks = tasksData || [];
        }

        const { data: dailyGoals } = await supabase
          .from("daily_goals")
          .select("*")
          .eq("user_id", user.id);

        const { data: decisions } = await supabase
          .from("decisions")
          .select("*")
          .eq("user_id", user.id);

        if (isMounted) {
          setInitialData(
            user.id,
            goals,
            milestones || [],
            tasks as Parameters<typeof setInitialData>[3],
            dailyGoals || [],
            decisions || []
          );
        }
      } catch (err) {
        console.error("Failed to load initial data", err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [setInitialData]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-medium text-muted-foreground animate-pulse">
            Loading your paths...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
