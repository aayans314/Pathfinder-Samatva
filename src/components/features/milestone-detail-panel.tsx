"use client";

import { format } from "date-fns";
import { CheckCircle2, Circle, Lock, Loader2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import { useMilestoneById, useTasks } from "@/hooks/use-goals";
import type { MilestoneStatus } from "@/types/database";

const statusDisplay: Record<
  MilestoneStatus,
  { label: string; icon: React.ComponentType<{ className?: string }>; variant: "default" | "secondary" | "outline" }
> = {
  completed: { label: "Completed", icon: CheckCircle2, variant: "default" },
  in_progress: { label: "In Progress", icon: Loader2, variant: "secondary" },
  locked: { label: "Locked", icon: Lock, variant: "outline" },
};

interface MilestoneDetailPanelProps {
  milestoneId: string;
  onClose: () => void;
}

export function MilestoneDetailPanel({
  milestoneId,
  onClose,
}: MilestoneDetailPanelProps) {
  const milestone = useMilestoneById(milestoneId);
  const tasks = useTasks(milestoneId);
  const updateTask = useAppStore((s) => s.updateTask);

  if (!milestone) return null;

  const config = statusDisplay[milestone.status];
  const StatusIcon = config.icon;
  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <div className="absolute right-0 top-0 h-full w-80 border-l bg-background shadow-lg z-10 flex flex-col">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="font-semibold text-sm truncate">{milestone.title}</h3>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="flex items-center gap-2">
          <StatusIcon
            className={cn(
              "h-4 w-4",
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

        {milestone.description && (
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
              <label
                key={task.id}
                className="flex items-start gap-2 rounded-md p-2 hover:bg-muted/50 cursor-pointer"
              >
                <Checkbox
                  checked={task.completed}
                  onCheckedChange={(checked) =>
                    updateTask(task.id, { completed: checked === true })
                  }
                  className="mt-0.5"
                />
                <div className="min-w-0">
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
              </label>
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
