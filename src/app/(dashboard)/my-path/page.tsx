"use client";

import { useState, useCallback, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  useGoals,
  useMilestones,
  useTasks,
  useGoalsByCategory,
} from "@/hooks/use-goals";
import { MilestoneFlow } from "@/components/features/milestone-flow";
import { MilestoneDetailPanel } from "@/components/features/milestone-detail-panel";
import { CategoryHeader } from "@/components/features/category-header";
import { AddPathDialog } from "@/components/features/add-path-dialog";
import { PathOverview } from "@/components/features/path-overview";
import { CATEGORY_CONFIG } from "@/components/features/life-section-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { GoalCategory } from "@/types/database";

const ALL_CATEGORIES: GoalCategory[] = [
  "career",
  "academics",
  "research",
  "internships",
  "fitness",
  "networking",
  "personal",
];

function MyPathContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const goals = useGoals();
  const categoryStats = useGoalsByCategory();

  const initialCategory =
    (searchParams.get("category") as GoalCategory) || null;
  const [selectedCategory, setSelectedCategory] =
    useState<GoalCategory | null>(initialCategory);
  const [selectedGoalId, setSelectedGoalId] = useState<string>("all");
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<
    string | null
  >(null);

  const filteredGoals = useMemo(() => {
    if (!selectedCategory) return goals;
    return goals.filter((g) => g.category === selectedCategory);
  }, [goals, selectedCategory]);

  const goalIdForMilestones =
    selectedGoalId === "all" ? undefined : selectedGoalId;

  const allMilestones = useMilestones();
  const milestones = useMemo(() => {
    if (goalIdForMilestones) {
      return allMilestones.filter((m) => m.goal_id === goalIdForMilestones);
    }
    const goalIds = new Set(filteredGoals.map((g) => g.id));
    return allMilestones.filter((m) => goalIds.has(m.goal_id));
  }, [allMilestones, goalIdForMilestones, filteredGoals]);

  const tasks = useTasks();
  const filteredTasks = tasks.filter((t) =>
    milestones.some((m) => m.id === t.milestone_id)
  );

  const handleNodeClick = useCallback((milestoneId: string) => {
    setSelectedMilestoneId((prev) =>
      prev === milestoneId ? null : milestoneId
    );
  }, []);

  const handleCategoryChange = (cat: GoalCategory | null) => {
    setSelectedCategory(cat);
    setSelectedGoalId("all");
    setSelectedMilestoneId(null);
    if (cat) {
      router.replace(`/my-path?category=${cat}`, { scroll: false });
    } else {
      router.replace("/my-path", { scroll: false });
    }
  };

  const activeCategories = categoryStats.map((cs) => cs.category);
  const currentCategoryStats = selectedCategory
    ? categoryStats.find((cs) => cs.category === selectedCategory)
    : null;
  const accentColor = selectedCategory
    ? CATEGORY_CONFIG[selectedCategory].ring
    : undefined;

  const isOverview = !selectedCategory;

  const completedCount = milestones.filter(
    (m) => m.status === "completed"
  ).length;
  const totalCount = milestones.length;
  const progressPct =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)]">
      {/* Top bar: category pills + add */}
      <div className="flex items-center gap-2 mb-2 shrink-0 overflow-x-auto pb-0.5">
        <button
          onClick={() => handleCategoryChange(null)}
          className={`shrink-0 flex cursor-pointer items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            isOverview
              ? "bg-muted/50 text-foreground ring-1 ring-border shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          All paths
        </button>

        {ALL_CATEGORIES.filter((c) => activeCategories.includes(c)).map(
          (cat) => {
            const config = CATEGORY_CONFIG[cat];
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className={`shrink-0 flex cursor-pointer items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? "text-foreground ring-1 ring-border shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
                style={
                  isActive
                    ? {
                        backgroundColor: `${config.ring}25`,
                      }
                    : undefined
                }
              >
                <span
                  className="h-3 w-3 rounded-full shrink-0 shadow-sm"
                  style={{ backgroundColor: config.ring }}
                />
                {config.label}
              </button>
            );
          }
        )}

        <div className="ml-auto shrink-0">
          <AddPathDialog onSuccess={handleCategoryChange} />
        </div>
      </div>

      {/* === OVERVIEW MODE: swimlane cards === */}
      {isOverview && (
        <div className="flex-1 relative rounded-2xl border border-border bg-card overflow-hidden">
          <PathOverview onCategoryClick={handleCategoryChange} />
        </div>
      )}

      {/* === CATEGORY MODE: horizontal flow === */}
      {!isOverview && (
        <>
          {/* Category summary */}
          {currentCategoryStats && (
            <div className="mb-3 shrink-0 rounded-2xl border border-border bg-card/50 backdrop-blur-md p-4">
              <CategoryHeader
                category={selectedCategory!}
                stats={currentCategoryStats}
              />
            </div>
          )}

          {/* Goal filter */}
          {filteredGoals.length > 1 && (
            <div className="mb-3 shrink-0">
              <Select
                value={selectedGoalId}
                onValueChange={(v) => setSelectedGoalId(v ?? "all")}
              >
                <SelectTrigger className="w-56 h-10 text-base font-medium bg-card/50 border-border">
                  <SelectValue placeholder="Filter by goal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Goals</SelectItem>
                  {filteredGoals.map((goal) => (
                    <SelectItem key={goal.id} value={goal.id}>
                      {goal.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Inline progress summary */}
          {totalCount > 0 && (
            <div className="flex items-center gap-3 mb-3 shrink-0 px-1">
              <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${progressPct}%`,
                    backgroundColor: accentColor || "#22d3ee",
                  }}
                />
              </div>
              <span className="text-sm text-muted-foreground tabular-nums font-semibold shrink-0">
                {completedCount}/{totalCount} milestones · {progressPct}%
              </span>
            </div>
          )}

          {/* Flow graph */}
          <div className="flex-1 relative rounded-2xl border border-border bg-card overflow-hidden">
            {milestones.length > 0 ? (
              <MilestoneFlow
                key={`${selectedCategory}-${selectedGoalId}`}
                milestones={milestones}
                tasks={filteredTasks}
                accentColor={accentColor}
                layout="linear"
                onNodeClick={handleNodeClick}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <div className="h-20 w-20 rounded-full bg-muted/60 border border-border flex items-center justify-center">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-10 w-10 text-muted-foreground/60"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </div>
                <div className="text-center space-y-1.5">
                  <p className="text-base font-medium text-foreground">
                    No milestones in this category yet
                  </p>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    Add a path to see your journey unfold left → right.
                  </p>
                </div>
              </div>
            )}
            {selectedMilestoneId && (
              <MilestoneDetailPanel
                milestoneId={selectedMilestoneId}
                onClose={() => setSelectedMilestoneId(null)}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function MyPathPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-[calc(100vh-5rem)]">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
            <p className="text-muted-foreground text-base">Loading your path...</p>
          </div>
        </div>
      }
    >
      <MyPathContent />
    </Suspense>
  );
}
