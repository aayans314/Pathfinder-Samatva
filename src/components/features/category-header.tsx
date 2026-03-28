"use client";

import { CATEGORY_CONFIG } from "@/components/features/life-section-card";
import type { GoalCategory } from "@/types/database";
import type { CategoryStats } from "@/hooks/use-goals";

function ProgressRing({
  percent,
  color,
  size = 56,
}: {
  percent: number;
  color: string;
  size?: number;
}) {
  const strokeWidth = 4;
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
        className="text-white/20"
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
        style={{ transition: "stroke-dashoffset 0.6s ease-in-out" }}
      />
    </svg>
  );
}

export function CategoryHeader({
  category,
  stats,
}: {
  category: GoalCategory;
  stats: CategoryStats;
}) {
  const config = CATEGORY_CONFIG[category];

  // XP system: tasks = 10 XP, milestones = 50 XP
  const xp =
    stats.completedTasks * 10 + stats.completedMilestones * 50;
  const level = Math.floor(xp / 100) + 1;
  const xpInLevel = xp % 100;

  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-gradient-to-r ${config.gradient} p-5 text-white`}
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-24 translate-x-24" />
      <div className="absolute bottom-0 left-1/2 w-32 h-32 bg-white/5 rounded-full translate-y-16" />

      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <ProgressRing
              percent={stats.completionPercent}
              color="white"
              size={56}
            />
            <span className="absolute inset-0 flex items-center justify-center text-xl">
              {config.emoji}
            </span>
          </div>

          <div>
            <h2 className="text-xl font-bold tracking-tight">
              {config.label}
            </h2>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-sm text-white/80">
                {stats.completedMilestones}/{stats.totalMilestones} milestones
              </span>
              <span className="text-white/40">•</span>
              <span className="text-sm text-white/80">
                {stats.completedTasks}/{stats.totalTasks} tasks
              </span>
              <span className="text-white/40">•</span>
              <span className="text-sm text-white/80">
                {stats.completionPercent}% complete
              </span>
            </div>
          </div>
        </div>

        {/* XP / Level */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-white/60 uppercase tracking-wider font-medium">
                Level
              </span>
              <span className="text-2xl font-bold">{level}</span>
            </div>
            <div className="mt-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/60">{xp} XP</span>
                <div className="h-1.5 w-20 rounded-full bg-white/20 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-white transition-all duration-500"
                    style={{ width: `${xpInLevel}%` }}
                  />
                </div>
                <span className="text-xs text-white/60">
                  {100 - xpInLevel} to next
                </span>
              </div>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
            <span className="text-2xl">⭐</span>
          </div>
        </div>
      </div>
    </div>
  );
}
