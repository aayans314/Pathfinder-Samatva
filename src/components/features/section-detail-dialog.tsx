"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Check } from "lucide-react";
import { useCategoryDetail } from "@/hooks/use-goals";
import { useAppStore } from "@/lib/store";
import { CATEGORY_CONFIG } from "@/components/features/life-section-card";
import type { GoalCategory } from "@/types/database";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export function SectionDetailDialog({
  category,
  open,
  onOpenChange,
}: {
  category: GoalCategory;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const config = CATEGORY_CONFIG[category];
  const { goals, milestones, tasks } = useCategoryDetail(category);
  const updateTask = useAppStore((s) => s.updateTask);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const percent =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{config.label}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            {completedTasks}/{totalTasks} tasks · {percent}% complete
          </p>
        </DialogHeader>

        <div className="mt-1 h-1 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${percent}%`,
              backgroundColor: config.ring,
              opacity: 0.7,
            }}
          />
        </div>

        <div className="space-y-6 pt-2">
          {goals.map((goal) => {
            const goalMilestones = milestones.filter(
              (m) => m.goal_id === goal.id
            );
            const goalMilestoneIds = new Set(goalMilestones.map((m) => m.id));
            const goalTasks = tasks.filter((t) =>
              goalMilestoneIds.has(t.milestone_id)
            );
            const goalCompleted = goalTasks.filter((t) => t.completed).length;
            const goalPercent =
              goalTasks.length > 0
                ? Math.round((goalCompleted / goalTasks.length) * 100)
                : 0;

            return (
              <div key={goal.id} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium">{goal.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      Target: {format(new Date(goal.target_date), "MMM yyyy")}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {goalPercent}%
                  </span>
                </div>

                <div className="h-1 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-foreground/50 transition-all duration-500"
                    style={{ width: `${goalPercent}%` }}
                  />
                </div>

                {goalMilestones.map((milestone) => {
                  const mTasks = goalTasks.filter(
                    (t) => t.milestone_id === milestone.id
                  );

                  return (
                    <div
                      key={milestone.id}
                      className="pl-3 border-l border-border space-y-1.5"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{milestone.title}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {milestone.status.replace("_", " ")}
                        </span>
                      </div>

                      {mTasks.length > 0 && (
                        <div className="space-y-0.5 pl-3">
                          {mTasks.map((task) => (
                            <div
                              key={task.id}
                              className="group flex items-center gap-2 rounded px-1 py-1 -mx-1 hover:bg-muted/40 transition-colors"
                            >
                              <button
                                onClick={() =>
                                  updateTask(task.id, {
                                    completed: !task.completed,
                                  })
                                }
                                className={cn(
                                  "shrink-0 h-4 w-4 rounded border flex items-center justify-center transition-all",
                                  task.completed
                                    ? "bg-foreground border-foreground"
                                    : "border-border hover:border-foreground/50"
                                )}
                              >
                                {task.completed && (
                                  <Check className="h-2.5 w-2.5 text-background" />
                                )}
                              </button>
                              <span
                                className={cn(
                                  "text-xs flex-1",
                                  task.completed &&
                                    "line-through text-muted-foreground"
                                )}
                              >
                                {task.title}
                              </span>
                              {task.due_date && (
                                <span className="text-[10px] text-muted-foreground">
                                  {format(new Date(task.due_date), "MMM d")}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
