"use client";

import { useState, useCallback, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";
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
import { CATEGORY_CONFIG } from "@/components/features/life-section-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
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
  const [selectedCategory, setSelectedCategory] = useState<GoalCategory | null>(
    initialCategory
  );
  const [selectedGoalId, setSelectedGoalId] = useState<string>("all");
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | null>(
    null
  );
  const [capacityPercent, setCapacityPercent] = useState(100);
  const [rescheduleLoading, setRescheduleLoading] = useState(false);
  const [rescheduleError, setRescheduleError] = useState<string | null>(null);
  const applyAgentReschedule = useAppStore((s) => s.applyAgentReschedule);

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

  const handleAgentReschedule = useCallback(async () => {
    setRescheduleError(null);
    setRescheduleLoading(true);
    try {
      const res = await fetch("/api/agent/reschedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ capacityPercent }),
      });
      const data = (await res.json()) as {
        error?: string;
        milestonesToPause?: string[];
        reprioritizedTaskIds?: string[];
      };
      if (!res.ok) {
        throw new Error(data.error || "Could not reschedule");
      }
      applyAgentReschedule({
        milestonesToPause: data.milestonesToPause ?? [],
        reprioritizedTaskIds: data.reprioritizedTaskIds ?? [],
      });
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Reschedule failed. Try again.";
      setRescheduleError(message);
    } finally {
      setRescheduleLoading(false);
    }
  }, [applyAgentReschedule, capacityPercent]);

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)]">
      {/* Category tabs */}
      <div className="flex items-center gap-1 mb-4 shrink-0 overflow-x-auto pb-1">
        <button
          onClick={() => handleCategoryChange(null)}
          className={`shrink-0 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            !selectedCategory
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          All
        </button>
        {ALL_CATEGORIES.filter((c) => activeCategories.includes(c)).map(
          (cat) => {
            const config = CATEGORY_CONFIG[cat];
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className={`shrink-0 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {config.label}
              </button>
            );
          }
        )}
        <div className="ml-auto flex items-center gap-2 shrink-0">
          <AddPathDialog onSuccess={handleCategoryChange} />
        </div>
      </div>

      {/* Capacity alert — agentic reschedule */}
      <div className="mb-4 shrink-0 rounded-lg border bg-muted/30 px-3 py-3 space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
            Capacity alert
          </span>
          <label className="flex items-center gap-2 flex-1 min-w-[160px] max-w-md">
            <span className="text-[10px] text-muted-foreground w-8">Low</span>
            <input
              type="range"
              min={0}
              max={100}
              value={capacityPercent}
              onChange={(e) =>
                setCapacityPercent(Number.parseInt(e.target.value, 10))
              }
              disabled={rescheduleLoading}
              className="flex-1 h-2 accent-foreground disabled:opacity-50"
              aria-label="Available capacity percent"
            />
            <span className="text-[10px] text-muted-foreground w-8 text-right">
              High
            </span>
          </label>
          <span className="text-xs tabular-nums font-medium w-10">
            {capacityPercent}%
          </span>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="gap-1.5 shrink-0"
            disabled={rescheduleLoading || milestones.length === 0}
            onClick={() => void handleAgentReschedule()}
          >
            {rescheduleLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            Restructure path
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground leading-snug">
          Lower capacity lets Navigator pause non-critical milestones and
          reprioritize tasks. Critical academics, career, and visa-related goals
          stay protected.
        </p>
        {rescheduleError && (
          <p className="text-xs text-destructive">{rescheduleError}</p>
        )}
      </div>

      {/* Category summary */}
      {selectedCategory && currentCategoryStats && (
        <div className="mb-4 shrink-0">
          <CategoryHeader
            category={selectedCategory}
            stats={currentCategoryStats}
          />
        </div>
      )}

      {/* Goal filter (only when multiple goals in category) */}
      {filteredGoals.length > 1 && (
        <div className="mb-4 shrink-0">
          <Select
            value={selectedGoalId}
            onValueChange={(v) => setSelectedGoalId(v ?? "all")}
          >
            <SelectTrigger className="w-56">
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

      {/* Flow graph */}
      <div className="flex-1 relative rounded-lg border bg-muted/20 overflow-hidden">
        {rescheduleLoading && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-background/85 backdrop-blur-[2px] px-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm font-medium text-center text-foreground max-w-sm">
              Navigator is restructuring your path…
            </p>
          </div>
        )}
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
              No milestones yet. Select a category or add a new path.
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
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      }
    >
      <MyPathContent />
    </Suspense>
  );
}
