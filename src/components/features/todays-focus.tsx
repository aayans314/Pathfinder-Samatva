"use client";

import { Check } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useSmartPriority } from "@/hooks/use-smart-priority";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { compactTaskLabel } from "@/lib/focus-task-display";

const FOCUS_LIMIT = 5;

export function TodaysFocus() {
  const prioritizedTasks = useSmartPriority(FOCUS_LIMIT);
  const updateTask = useAppStore((s) => s.updateTask);

  if (prioritizedTasks.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-6 text-center">
        Nothing on your plate right now.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {prioritizedTasks.map((task, i) => (
        <div
          key={task.id}
          className={cn(
            "group flex gap-3 rounded-xl border bg-card px-3 py-2.5 shadow-sm transition-colors",
            "hover:border-foreground/15",
            i === 0 && "ring-1 ring-foreground/10 bg-gradient-to-br from-muted/40 to-card"
          )}
        >
          <button
            type="button"
            aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
            onClick={() => updateTask(task.id, { completed: !task.completed })}
            className={cn(
              "shrink-0 mt-0.5 h-5 w-5 rounded-md border flex items-center justify-center transition-colors",
              task.completed
                ? "bg-foreground border-foreground"
                : "border-border hover:border-foreground/40"
            )}
          >
            {task.completed && <Check className="h-3 w-3 text-background" />}
          </button>
          <div className="flex-1 min-w-0 space-y-1">
            <p
              className={cn(
                "text-sm font-medium leading-snug line-clamp-2",
                task.completed && "line-through text-muted-foreground font-normal"
              )}
            >
              {compactTaskLabel(task.title, 100)}
            </p>
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge
                variant="outline"
                className="text-[10px] font-normal px-1.5 py-0 h-5 max-w-[200px] truncate"
              >
                {task.goalName}
              </Badge>
              {task.focusHint ? (
                <Badge variant="secondary" className="text-[10px] font-normal px-1.5 py-0 h-5">
                  {task.focusHint}
                </Badge>
              ) : null}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
