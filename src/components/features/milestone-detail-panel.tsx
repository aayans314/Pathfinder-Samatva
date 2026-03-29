"use client";

import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { CheckCircle2, Circle, Lock, Loader2, X, Star, PauseCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import { useMilestoneById, useTasks } from "@/hooks/use-goals";
import type { MilestoneStatus } from "@/types/database";

const statusDisplay: Record<
  MilestoneStatus,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    variant: "default" | "secondary" | "outline";
    color: string;
  }
> = {
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    variant: "default",
    color: "text-amber-600",
  },
  in_progress: {
    label: "In Progress",
    icon: Loader2,
    variant: "secondary",
    color: "text-blue-600",
  },
  locked: {
    label: "Locked",
    icon: Lock,
    variant: "outline",
    color: "text-muted-foreground",
  },
  paused: {
    label: "Paused",
    icon: PauseCircle,
    variant: "outline",
    color: "text-muted-foreground",
  },
};

interface MilestoneDetailPanelProps {
  milestoneId: string;
  onClose: () => void;
}

export function MilestoneDetailPanel({
  milestoneId,
  onClose,
}: MilestoneDetailPanelProps) {
  const router = useRouter();
  const milestone = useMilestoneById(milestoneId);
  const tasks = useTasks(milestoneId);
  const updateTask = useAppStore((s) => s.updateTask);

  if (!milestone) return null;

  const config = statusDisplay[milestone.status];
  const StatusIcon = config.icon;
  const completedCount = tasks.filter((t) => t.completed).length;
  const allDone = tasks.length > 0 && completedCount === tasks.length;

  // XP calculation
  const taskXP = completedCount * 10;
  const milestoneXP = milestone.status === "completed" ? 50 : 0;
  const totalXP = taskXP + milestoneXP;

  return (
    <div className="absolute right-0 top-0 h-full w-96 border-l bg-background shadow-lg z-10 flex flex-col">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="font-semibold text-sm truncate">{milestone.title}</h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-7 w-7"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="flex items-center gap-2">
          <StatusIcon
            className={cn(
              "h-4 w-4",
              config.color,
              milestone.status === "in_progress" && "animate-spin"
            )}
          />
          <Badge variant={config.variant}>{config.label}</Badge>
          {tasks.length > 0 && (
            <span className="text-xs text-muted-foreground ml-auto">
              {completedCount}/{tasks.length} tasks
            </span>
          )}
        </div>

        {/* XP Summary */}
        <div className="rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-400/20 p-3">
          <div className="flex items-center gap-2 mb-1">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">
              {totalXP} XP earned
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-amber-600/70 dark:text-amber-400/70">
            <span>{taskXP} XP from tasks</span>
            {milestoneXP > 0 && <span>+50 XP milestone bonus</span>}
          </div>
        </div>

        {/* All tasks completed celebration */}
        {allDone && (
          <div className="rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-400/20 p-3 text-center">
            <p className="text-lg mb-1">🎉</p>
            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
              All tasks completed!
            </p>
            <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70">
              This milestone is ready to be marked as cleared.
            </p>
          </div>
        )}

        {milestone.description && milestone.status !== "locked" && (
          <p className="text-sm text-muted-foreground">
            {milestone.description}
          </p>
        )}

        {tasks.length > 0 && (
          <div className="space-y-1">
            <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
              Tasks
            </h4>
            {tasks.map((task) => (
              <div
                key={task.id}
                className="rounded-md p-2 hover:bg-muted/50 group"
              >
                <div className="flex items-start gap-2">
                  <Checkbox
                    checked={task.completed}
                    onCheckedChange={(checked) =>
                      updateTask(task.id, { completed: checked === true })
                    }
                    className="mt-0.5"
                  />
                  <div className="min-w-0 flex-1">
                    <span
                      className={cn(
                        "text-sm",
                        task.completed && "line-through text-muted-foreground"
                      )}
                    >
                      {task.title}
                    </span>
                    {task.due_date && (
                      <p className="text-xs text-muted-foreground">
                        Due {format(new Date(task.due_date), "MMM d, yyyy")}
                      </p>
                    )}
                  </div>
                  {task.completed && (
                    <span className="text-[10px] font-semibold text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      +10 XP
                    </span>
                  )}
                </div>
                <div className="ml-6 mt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-3 text-xs"
                    onClick={() => {
                      const params = new URLSearchParams({
                        taskId: task.id,
                        milestoneId: milestone.id,
                        goalId: milestone.goal_id,
                      });
                      router.push(`/task-roadmap?${params.toString()}`);
                    }}
                  >
                    Do it
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tasks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Circle className="h-8 w-8 text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">
              No tasks linked to this milestone yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
