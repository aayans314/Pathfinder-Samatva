"use client";

import { useState } from "react";
import { useGoalsByCategory } from "@/hooks/use-goals";
import { GreetingWidget } from "@/components/features/greeting-widget";
import { DailyGoalsRing } from "@/components/features/daily-goals-ring";
import { LifeSectionCard } from "@/components/features/life-section-card";
import { TodaysFocus } from "@/components/features/todays-focus";
import { SectionDetailDialog } from "@/components/features/section-detail-dialog";
import { WeeklyReportDialog } from "@/components/features/weekly-report-dialog";
import type { GoalCategory } from "@/types/database";

export default function DashboardPage() {
  const categoryStats = useGoalsByCategory();
  const [detailCategory, setDetailCategory] = useState<GoalCategory | null>(
    null
  );

  return (
    <div className="max-w-3xl mx-auto space-y-10">
      {/* Header: greeting + weekly report */}
      <div className="flex items-start justify-between gap-4">
        <GreetingWidget />
        <WeeklyReportDialog />
      </div>

      {/* Main two-column layout */}
      <div className="grid gap-10 lg:grid-cols-[1fr_280px]">
        {/* Left column: smart task feed */}
        <section>
          <h2 className="text-sm font-medium text-muted-foreground mb-3">
            Focus today
          </h2>
          <TodaysFocus />
        </section>

        {/* Right column: daily goals + categories */}
        <aside className="space-y-8">
          <DailyGoalsRing />

          {categoryStats.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                Goals
              </h3>
              <div>
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
