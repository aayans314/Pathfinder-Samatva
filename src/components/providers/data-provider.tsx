"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { useAppStore } from "@/lib/store";
import { Loader2 } from "lucide-react";

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const setInitialData = useAppStore((state) => state.setInitialData);
  const supabase = createClient();

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          if (isMounted) setIsLoading(false);
          return;
        }

        // Fetch user's goals
        const { data: goals, error: goalsErr } = await supabase
          .from("goals")
          .select("*")
          .eq("user_id", user.id);
          
        if (goalsErr) throw goalsErr;
        
        // If no goals, just set empty to override mock data
        if (!goals || goals.length === 0) {
          if (isMounted) {
            setInitialData(user.id, [], [], []);
            setIsLoading(false);
          }
          return;
        }

        // Extract goal IDs to fetch milestones
        const goalIds = goals.map(g => g.id);
        
        const { data: milestones, error: milestonesErr } = await supabase
          .from("milestones")
          .select("*")
          .in("goal_id", goalIds);
          
        if (milestonesErr) throw milestonesErr;

        // Extract milestone IDs to fetch tasks
        let tasks: any[] = [];
        if (milestones && milestones.length > 0) {
          const milestoneIds = milestones.map(m => m.id);
          const { data: tasksData, error: tasksErr } = await supabase
            .from("tasks")
            .select("*")
            .in("milestone_id", milestoneIds);
            
          if (tasksErr) throw tasksErr;
          tasks = tasksData || [];
        }

        if (isMounted) {
          setInitialData(user.id, goals, milestones || [], tasks);
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
  }, [setInitialData, supabase]);

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
