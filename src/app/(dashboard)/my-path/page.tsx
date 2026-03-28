"use client";

import { useState, useCallback, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useGoals, useMilestones, useTasks, useGoalsByCategory } from "@/hooks/use-goals";
import { MilestoneFlow } from "@/components/features/milestone-flow";
import { MilestoneDetailPanel } from "@/components/features/milestone-detail-panel";
import { CategoryHeader } from "@/components/features/category-header";
import { AddPathDialog } from "@/components/features/add-path-dialog";
import { CATEGORY_CONFIG } from "@/components/features/life-section-card";
import { Badge } from "@/components/ui/badge";
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

  const initialCategory = (searchParams.get("category") as GoalCategory) || null;
  const [selectedCategory, setSelectedCategory] = useState<GoalCategory | null>(
    initialCategory
  );
  const [selectedGoalId, setSelectedGoalId] = useState<string>("all");
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | null>(
    null
  );

  // Filter goals by category
  const filteredGoals = useMemo(() => {
    if (!selectedCategory) return goals;
    return goals.filter((g) => g.category === selectedCategory);
  }, [goals, selectedCategory]);

  const goalIdForMilestones =
    selectedGoalId === "all" ? undefined : selectedGoalId;

  // Get milestones filtered by either selected goal or all goals in category
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
    // Update URL without full navigation
    if (cat) {
      router.replace(`/my-path?category=${cat}`, { scroll: false });
    } else {
      router.replace("/my-path", { scroll: false });
    }
  };

  const completedCount = milestones.filter(
    (m) => m.status === "completed"
  ).length;
  const inProgressCount = milestones.filter(
    (m) => m.status === "in_progress"
  ).length;

  // Get current category stats
  const currentCategoryStats = selectedCategory
    ? categoryStats.find((cs) => cs.category === selectedCategory)
    : null;

  // Get accent color
  const accentColor = selectedCategory
    ? CATEGORY_CONFIG[selectedCategory].ring
    : undefined;

  // Categories that have goals
  const activeCategories = categoryStats.map((cs) => cs.category);

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)]">
      {/* Category pills */}
      <div className="flex items-center gap-2 mb-4 shrink-0 overflow-x-auto pb-1">
        <button
          onClick={() => handleCategoryChange(null)}
          className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            !selectedCategory
              ? "bg-foreground text-background"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          All Paths
        </button>
        {ALL_CATEGORIES.filter((c) => activeCategories.includes(c)).map(
          (cat) => {
            const config = CATEGORY_CONFIG[cat];
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                  isActive
                    ? `bg-gradient-to-r ${config.gradient} text-white shadow-sm`
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                <span>{config.emoji}</span>
                {config.label}
              </button>
            );
          }
        )}
        <div className="ml-auto">
          <AddPathDialog onSuccess={handleCategoryChange} />
        </div>
      </div>

      {/* Category header banner */}
      {selectedCategory && currentCategoryStats && (
        <div className="mb-4 shrink-0">
          <CategoryHeader
            category={selectedCategory}
            stats={currentCategoryStats}
          />
        </div>
      )}

      {/* Header row */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {selectedCategory
              ? `${CATEGORY_CONFIG[selectedCategory].emoji} ${CATEGORY_CONFIG[selectedCategory].label} Path`
              : "My Path"}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="default">{completedCount} completed</Badge>
            <Badge variant="secondary">{inProgressCount} in progress</Badge>
            <Badge variant="outline">
              {milestones.length - completedCount - inProgressCount} locked
            </Badge>
          </div>
        </div>

        {filteredGoals.length > 1 && (
          <Select
            value={selectedGoalId}
            onValueChange={(v) => setSelectedGoalId(v ?? "all")}
          >
            <SelectTrigger className="w-64">
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
        )}
      </div>

      {/* Flow */}
      <div className="flex-1 relative rounded-lg border bg-muted/30 overflow-hidden">
        {milestones.length > 0 ? (
          <MilestoneFlow
            key={`${selectedCategory ?? "all"}-${selectedGoalId}-layout-${selectedCategory ? "linear" : "radial"}`}
            milestones={milestones}
            tasks={filteredTasks}
            accentColor={accentColor}
            layout={selectedCategory ? "linear" : "radial"}
            onNodeClick={handleNodeClick}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground text-sm">
              No milestones found. Select a category above to view your path.
            </p>
          </div>
        )}
        {selectedMilestoneId && (
          <MilestoneDetailPanel
            milestoneId={selectedMilestoneId}
            onClose={() => setSelectedMilestoneId(null)}
          />
        )}
      </div>
    </div>
  );
}

export default function MyPathPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-[calc(100vh-5rem)]">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      }
    >
      <MyPathContent />
    </Suspense>
  );
}
