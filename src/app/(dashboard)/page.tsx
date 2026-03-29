"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Target,
  Flag,
  CheckSquare,
  CalendarClock,
  ArrowRight,
} from "lucide-react";
import { useGoalsByCategory, useStats } from "@/hooks/use-goals";
import { GreetingWidget } from "@/components/features/greeting-widget";
import { DailyGoalsRing } from "@/components/features/daily-goals-ring";
import { LifeSectionCard } from "@/components/features/life-section-card";
import { TodaysFocus } from "@/components/features/todays-focus";
import { SectionDetailDialog } from "@/components/features/section-detail-dialog";
import { WeeklyReportDialog } from "@/components/features/weekly-report-dialog";
import { ProactiveStrip } from "@/components/features/proactive-strip";
import { StreakCounter } from "@/components/features/streak-counter";
import type { GoalCategory } from "@/types/database";
import { format } from "date-fns";

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  accent: string;
}) {
  return (
    <div className="glass-card p-5 flex items-center gap-4">
      <div
        className="h-14 w-14 rounded-2xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${accent}18`, color: accent }}
      >
        <Icon className="h-7 w-7" />
      </div>
      <div>
        <p className="text-2xl md:text-[1.75rem] font-bold tabular-nums leading-none">
          {value}
        </p>
        <p className="text-base text-muted-foreground mt-1">{label}</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const categoryStats = useGoalsByCategory();
  const stats = useStats();
  const [detailCategory, setDetailCategory] = useState<GoalCategory | null>(
    null
  );

  const nextDeadlineLabel = stats.nextDeadline
    ? format(new Date(stats.nextDeadline), "MMM d")
    : "None";

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header row */}
      <div className="glass-card p-6 md:p-7 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <GreetingWidget />
        <div className="flex items-center gap-2 shrink-0">
          <StreakCounter />
          <WeeklyReportDialog />
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={Target}
          label="Active goals"
          value={stats.activeGoals}
          accent="#3b82f6"
        />
        <StatCard
          icon={Flag}
          label="Milestones done"
          value={`${stats.completedMilestones}/${stats.totalMilestones}`}
          accent="#10b981"
        />
        <StatCard
          icon={CheckSquare}
          label="Tasks completed"
          value={`${stats.completedTasks}/${stats.totalTasks}`}
          accent="#8b5cf6"
        />
        <StatCard
          icon={CalendarClock}
          label="Next deadline"
          value={nextDeadlineLabel}
          accent="#f59e0b"
        />
      </div>

      {/* AI strip */}
      <ProactiveStrip />

      {/* Main two-column layout */}
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Left column: smart task feed */}
        <section className="glass-card p-6 md:p-7">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              Focus right now
            </h2>
            <Link
              href="/my-path"
              className="text-base text-primary hover:underline flex items-center gap-1.5 font-medium"
            >
              View full path <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
          <TodaysFocus />
        </section>

        {/* Right column */}
        <aside className="space-y-5">
          {/* Daily focus ring */}
          <div className="glass-card p-6">
            <DailyGoalsRing />
          </div>

          {/* Category breakdown */}
          {categoryStats.length > 0 && (
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold tracking-tight text-foreground">
                  My paths
                </h3>
                <Link
                  href="/my-path"
                  className="text-base text-primary hover:underline font-medium"
                >
                  See all
                </Link>
              </div>
              <div className="space-y-0.5">
                {categoryStats.map((cs) => (
                  <LifeSectionCard
                    key={cs.category}
                    stats={cs}
                    onClick={() => setDetailCategory(cs.category)}
                  />
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* Section detail dialog */}
      {detailCategory && (
        <SectionDetailDialog
          category={detailCategory}
          open={!!detailCategory}
          onOpenChange={(open) => {
            if (!open) setDetailCategory(null);
          }}
        />
      )}
    </div>
  );
}
