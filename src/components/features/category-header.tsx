"use client";

import { CATEGORY_CONFIG } from "@/components/features/life-section-card";
import type { GoalCategory } from "@/types/database";
import type { CategoryStats } from "@/hooks/use-goals";

export function CategoryHeader({
  category,
  stats,
}: {
  category: GoalCategory;
  stats: CategoryStats;
}) {
  const config = CATEGORY_CONFIG[category];

  return (
    <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">
          {config.label}
        </h2>
        <p className="text-base text-muted-foreground mt-0.5">
          {stats.completedMilestones}/{stats.totalMilestones} milestones
          <span className="mx-1.5 text-border">·</span>
          {stats.completedTasks}/{stats.totalTasks} tasks
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="h-1.5 w-24 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${stats.completionPercent}%`,
              backgroundColor: config.ring,
              opacity: 0.7,
            }}
          />
        </div>
        <span className="text-base tabular-nums text-muted-foreground">
          {stats.completionPercent}%
        </span>
      </div>
    </div>
  );
}
