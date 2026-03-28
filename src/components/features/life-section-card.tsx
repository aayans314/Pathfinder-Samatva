"use client";

import type { GoalCategory } from "@/types/database";
import type { CategoryStats } from "@/hooks/use-goals";

const CATEGORY_CONFIG: Record<
  GoalCategory,
  { label: string; emoji: string; gradient: string; ring: string; bg: string }
> = {
  daily: {
    label: "Daily Goals",
    emoji: "☀️",
    gradient: "from-amber-500 to-orange-500",
    ring: "#f59e0b",
    bg: "bg-amber-50",
  },
  academics: {
    label: "Academics",
    emoji: "🎓",
    gradient: "from-blue-500 to-cyan-500",
    ring: "#3b82f6",
    bg: "bg-blue-50",
  },
  research: {
    label: "Research",
    emoji: "🔬",
    gradient: "from-purple-500 to-violet-500",
    ring: "#a855f7",
    bg: "bg-purple-50",
  },
  internships: {
    label: "Internships",
    emoji: "💼",
    gradient: "from-teal-500 to-emerald-500",
    ring: "#14b8a6",
    bg: "bg-teal-50",
  },
  career: {
    label: "Career",
    emoji: "🚀",
    gradient: "from-emerald-500 to-green-500",
    ring: "#10b981",
    bg: "bg-emerald-50",
  },
  fitness: {
    label: "Fitness",
    emoji: "💪",
    gradient: "from-rose-500 to-pink-500",
    ring: "#f43f5e",
    bg: "bg-rose-50",
  },
  networking: {
    label: "Networking",
    emoji: "🤝",
    gradient: "from-orange-500 to-amber-500",
    ring: "#f97316",
    bg: "bg-orange-50",
  },
  personal: {
    label: "Personal",
    emoji: "✨",
    gradient: "from-indigo-500 to-blue-500",
    ring: "#6366f1",
    bg: "bg-indigo-50",
  },
};

export { CATEGORY_CONFIG };

function ProgressRing({
  percent,
  color,
  size = 64,
}: {
  percent: number;
  color: string;
  size?: number;
}) {
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-muted/30"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{
          transition: "stroke-dashoffset 0.6s ease-in-out",
        }}
      />
    </svg>
  );
}

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
      className="group relative w-full text-left rounded-xl border border-border/50 bg-card p-5 transition-all duration-300 hover:shadow-lg hover:shadow-black/5 hover:-translate-y-1 hover:border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {/* Top gradient accent */}
      <div
        className={`absolute inset-x-0 top-0 h-1 rounded-t-xl bg-gradient-to-r ${config.gradient} opacity-60 group-hover:opacity-100 transition-opacity`}
      />

      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{config.emoji}</span>
            <h3 className="font-semibold text-sm tracking-tight">
              {config.label}
            </h3>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">
              {stats.completedMilestones}/{stats.totalMilestones} milestones
            </p>
            <p className="text-xs text-muted-foreground">
              {stats.completedTasks}/{stats.totalTasks} tasks done
            </p>
          </div>
        </div>

        <div className="relative flex items-center justify-center">
          <ProgressRing percent={stats.completionPercent} color={config.ring} />
          <span className="absolute text-xs font-bold">
            {stats.completionPercent}%
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-4 h-1.5 w-full rounded-full bg-muted/50 overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${config.gradient} transition-all duration-500`}
          style={{ width: `${stats.completionPercent}%` }}
        />
      </div>
    </button>
  );
}
