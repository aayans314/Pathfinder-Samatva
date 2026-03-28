"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { useCategoryDetail } from "@/hooks/use-goals";
import { useAppStore } from "@/lib/store";
import { CATEGORY_CONFIG } from "@/components/features/life-section-card";
import type { GoalCategory } from "@/types/database";
import { format } from "date-fns";

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
          <DialogTitle className="flex items-center gap-2 text-lg">
            <span className="text-2xl">{config.emoji}</span>
            {config.label}
            <Badge variant="secondary" className="ml-2 text-xs">
              {percent}% complete
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {/* Overall progress */}
        <div className="space-y-2 pt-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Overall progress</span>
            <span className="font-medium">
              {completedTasks}/{totalTasks} tasks
            </span>
          </div>
          <Progress value={percent} className="h-2" />
        </div>

        {/* Goals list */}
        <div className="space-y-6 pt-4">
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
              <div
                key={goal.id}
                className="rounded-lg border border-border/50 p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-sm">{goal.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Target: {format(new Date(goal.target_date), "MMM yyyy")}
                    </p>
                  </div>
                  <Badge
                    variant={
                      goal.status === "active" ? "default" : "secondary"
                    }
                    className="text-xs"
                  >
                    {goal.status}
                  </Badge>
                </div>

                <Progress value={goalPercent} className="h-1.5" />

                {/* Milestones */}
                {goalMilestones.map((milestone) => {
                  const mTasks = goalTasks.filter(
                    (t) => t.milestone_id === milestone.id
                  );
                  const statusColor =
                    milestone.status === "completed"
                      ? "text-emerald-500"
                      : milestone.status === "in_progress"
                        ? "text-blue-500"
                        : "text-muted-foreground/40";

                  return (
                    <div key={milestone.id} className="pl-3 border-l-2 border-border/30 space-y-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`h-2 w-2 rounded-full ${
                            milestone.status === "completed"
                              ? "bg-emerald-500"
                              : milestone.status === "in_progress"
                                ? "bg-blue-500"
                                : "bg-muted-foreground/30"
                          }`}
                        />
                        <span
                          className={`text-sm font-medium ${statusColor}`}
                        >
                          {milestone.title}
                        </span>
                        <Badge variant="outline" className="text-[10px] px-1.5">
                          {milestone.status.replace("_", " ")}
                        </Badge>
                      </div>

                      {/* Tasks */}
                      {mTasks.length > 0 && (
                        <div className="space-y-1 pl-4">
                          {mTasks.map((task) => (
                            <div
                              key={task.id}
                              className="flex items-center gap-2 group"
                            >
                              <Checkbox
                                checked={task.completed}
                                onCheckedChange={(checked) =>
                                  updateTask(task.id, {
                                    completed: Boolean(checked),
                                  })
                                }
                                className="h-3.5 w-3.5"
                              />
                              <span
                                className={`text-xs flex-1 ${
                                  task.completed
                                    ? "line-through text-muted-foreground"
                                    : ""
                                }`}
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
