"use client";

import { useMemo } from "react";
import { ChevronRight, CheckCircle2, Circle, Lock, PauseCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { CATEGORY_CONFIG } from "@/components/features/life-section-card";
import {
  useGoals,
  useMilestones,
  useTasks,
  useGoalsByCategory,
} from "@/hooks/use-goals";
import type { GoalCategory, Milestone, MilestoneStatus } from "@/types/database";

const STATUS_DOT: Record<MilestoneStatus, { bg: string; ring: string; glow: boolean }> = {
  completed: { bg: "bg-emerald-400", ring: "ring-emerald-400/30", glow: false },
  in_progress: { bg: "bg-cyan-400", ring: "ring-cyan-400/40", glow: true },
  locked: { bg: "bg-muted-foreground/30", ring: "ring-muted-foreground/20", glow: false },
  paused: { bg: "bg-amber-400", ring: "ring-amber-400/30", glow: false },
};

const STATUS_ICON: Record<MilestoneStatus, React.ComponentType<{ className?: string }>> = {
  completed: CheckCircle2,
  in_progress: Circle,
  locked: Lock,
  paused: PauseCircle,
};

function SegmentColor(status: MilestoneStatus, accent: string): string {
  if (status === "completed") return "#fbbf24";
  if (status === "in_progress") return accent;
  return "rgba(100,116,139,0.25)";
}

interface PathOverviewProps {
  onCategoryClick: (cat: GoalCategory) => void;
}

export function PathOverview({ onCategoryClick }: PathOverviewProps) {
  const goals = useGoals();
  const allMilestones = useMilestones();
  const allTasks = useTasks();
  const categoryStats = useGoalsByCategory();

  const lanes = useMemo(() => {
    return categoryStats.map((cs) => {
      const catGoals = goals.filter((g) => g.category === cs.category);
      const goalIds = new Set(catGoals.map((g) => g.id));
      const milestones = allMilestones
        .filter((m) => goalIds.has(m.goal_id))
        .sort((a, b) => a.order_index - b.order_index);

      const rootMilestones = milestones.filter((m) => !m.parent_milestone_id);

      function flattenChain(m: Milestone): Milestone[] {
        const children = milestones
          .filter((c) => c.parent_milestone_id === m.id)
          .sort((a, b) => a.order_index - b.order_index);
        return [m, ...children.flatMap(flattenChain)];
      }

      const ordered = rootMilestones.flatMap(flattenChain);

      const milestonesWithTasks = ordered.map((m) => {
        const tasks = allTasks.filter((t) => t.milestone_id === m.id);
        const done = tasks.filter((t) => t.completed).length;
        return { ...m, taskCount: tasks.length, completedTasks: done };
      });

      return {
        category: cs.category,
        config: CATEGORY_CONFIG[cs.category],
        stats: cs,
        milestones: milestonesWithTasks,
      };
    });
  }, [categoryStats, goals, allMilestones, allTasks]);

  if (lanes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="h-24 w-24 rounded-full bg-muted border border-border flex items-center justify-center">
          <svg
            viewBox="0 0 24 24"
            className="h-12 w-12 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </div>
        <div className="text-center space-y-2">
          <p className="text-lg font-medium text-foreground">
            Your journey starts here
          </p>
          <p className="text-base text-muted-foreground max-w-xs">
            Add a path to see your life goals laid out as visual lanes.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 space-y-4">
      <div className="flex flex-wrap items-baseline gap-3 mb-5">
        <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground">
          All paths
        </h2>
        <span className="text-base text-muted-foreground">
          {lanes.length} categories · {lanes.reduce((s, l) => s + l.milestones.length, 0)} milestones
        </span>
      </div>

      {lanes.map(({ category, config, stats, milestones }) => {
        const pct = stats.completionPercent;
        return (
          <button
            key={category}
            onClick={() => onCategoryClick(category)}
            className="group w-full cursor-pointer text-left rounded-2xl border border-border/70 bg-card shadow-sm hover:bg-accent/50 transition-all p-6 md:p-7"
          >
            <div className="flex items-center gap-4 mb-6">
              <div
                className="h-14 w-14 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-sm shrink-0"
                style={{ backgroundColor: config.ring }}
              >
                {config.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="text-lg md:text-xl font-semibold text-foreground">
                    {config.label}
                  </span>
                  <span className="text-base text-muted-foreground tabular-nums">
                    {stats.completedMilestones}/{stats.totalMilestones} milestones
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-3">
                  <div className="flex-1 h-2.5 md:h-3 rounded-full bg-muted overflow-hidden min-w-0">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, backgroundColor: config.ring }}
                    />
                  </div>
                  <span className="text-base tabular-nums font-semibold text-muted-foreground shrink-0 w-12 text-right">
                    {pct}%
                  </span>
                </div>
              </div>
              <ChevronRight className="h-7 w-7 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
            </div>

            {milestones.length > 0 && (
              <div className="relative flex items-start gap-0 overflow-x-auto pb-2 pt-1 -mx-1 px-1">
                {milestones.map((m, i) => {
                  const dot = STATUS_DOT[m.status];
                  const Icon = STATUS_ICON[m.status];
                  const isLast = i === milestones.length - 1;

                  return (
                    <div key={m.id} className="flex items-start shrink-0">
                      <div className="flex flex-col items-center gap-2.5 w-[min(100%,11rem)] min-w-30 sm:min-w-36 md:min-w-40 px-1">
                        <div
                          className={cn(
                            "relative h-12 w-12 sm:h-14 sm:w-14 rounded-full ring-[3px] flex items-center justify-center",
                            dot.bg,
                            dot.ring,
                            dot.glow && "shadow-[0_0_16px_rgba(34,211,238,0.4)]"
                          )}
                        >
                          <Icon
                            className={cn(
                              "h-6 w-6 sm:h-7 sm:w-7 text-white",
                              m.status === "locked" && "text-muted-foreground"
                            )}
                          />
                          <span className="absolute -top-0.5 -right-0.5 min-h-6 min-w-6 px-1 rounded-full bg-background border-2 border-border flex items-center justify-center text-xs sm:text-sm font-bold text-foreground">
                            {i + 1}
                          </span>
                        </div>
                        <span
                          className={cn(
                            "text-sm sm:text-base leading-snug text-center line-clamp-3 max-w-42 sm:max-w-48",
                            m.status === "locked"
                              ? "text-muted-foreground/70"
                              : m.status === "completed"
                                ? "text-muted-foreground"
                                : "text-foreground font-medium"
                          )}
                        >
                          {m.title}
                        </span>
                        {m.taskCount > 0 && m.status !== "locked" && (
                          <span className="text-sm sm:text-base tabular-nums font-medium text-muted-foreground">
                            {m.completedTasks}/{m.taskCount} tasks
                          </span>
                        )}
                      </div>

                      {!isLast && (
                        <div
                          className="h-1.5 sm:h-2 w-8 sm:w-12 md:w-16 rounded-full shrink-0 self-start mt-6 sm:mt-7"
                          style={{
                            backgroundColor: SegmentColor(m.status, config.ring),
                          }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
