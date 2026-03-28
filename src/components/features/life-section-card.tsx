"use client";

import type { GoalCategory } from "@/types/database";
import type { CategoryStats } from "@/hooks/use-goals";

const CATEGORY_CONFIG: Record<
  GoalCategory,
  { label: string; emoji: string; gradient: string; ring: string; bg: string }
> = {
  daily: { label: "Daily Goals", emoji: "D", gradient: "from-amber-500 to-orange-500", ring: "#f59e0b", bg: "bg-amber-50" },
  academics: { label: "Academics", emoji: "A", gradient: "from-blue-500 to-cyan-500", ring: "#3b82f6", bg: "bg-blue-50" },
  research: { label: "Research", emoji: "R", gradient: "from-purple-500 to-violet-500", ring: "#a855f7", bg: "bg-purple-50" },
  internships: { label: "Internships", emoji: "I", gradient: "from-teal-500 to-emerald-500", ring: "#14b8a6", bg: "bg-teal-50" },
  career: { label: "Career", emoji: "C", gradient: "from-emerald-500 to-green-500", ring: "#10b981", bg: "bg-emerald-50" },
  fitness: { label: "Fitness", emoji: "F", gradient: "from-rose-500 to-pink-500", ring: "#f43f5e", bg: "bg-rose-50" },
  networking: { label: "Networking", emoji: "N", gradient: "from-orange-500 to-amber-500", ring: "#f97316", bg: "bg-orange-50" },
  personal: { label: "Personal", emoji: "P", gradient: "from-indigo-500 to-blue-500", ring: "#6366f1", bg: "bg-indigo-50" },
};

export { CATEGORY_CONFIG };

export function LifeSectionCard({
  stats,
  onClick,
}: {
  stats: CategoryStats;
  onClick: () => void;
}) {
  const config = CATEGORY_CONFIG[stats.category];

  return (
    <button
      onClick={onClick}
      className="group w-full text-left rounded-lg px-3 py-2.5 -mx-3 hover:bg-muted/50 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{config.label}</span>
            <span className="text-xs text-muted-foreground tabular-nums">
              {stats.completedTasks}/{stats.totalTasks}
            </span>
          </div>
          <div className="mt-1.5 h-1 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${stats.completionPercent}%`,
                backgroundColor: config.ring,
                opacity: 0.7,
              }}
            />
          </div>
        </div>
        <span className="text-xs text-muted-foreground tabular-nums shrink-0">
          {stats.completionPercent}%
        </span>
      </div>
    </button>
  );
}
