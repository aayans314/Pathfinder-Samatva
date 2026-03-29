"use client";

import { useRef, useState } from "react";
import { Check } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useSmartPriority } from "@/hooks/use-smart-priority";
import { cn } from "@/lib/utils";
import { compactTaskLabel } from "@/lib/focus-task-display";

const FOCUS_LIMIT = 3;

export function TodaysFocus() {
  const prioritizedTasks = useSmartPriority(FOCUS_LIMIT);
  const updateTask = useAppStore((s) => s.updateTask);
  const [lastCompletedTaskId, setLastCompletedTaskId] = useState<string | null>(
    null
  );
  const clearAnimationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleTaskToggle(taskId: string, completed: boolean) {
    if (!completed) {
      setLastCompletedTaskId(taskId);
      if (clearAnimationTimer.current) {
        clearTimeout(clearAnimationTimer.current);
      }
      clearAnimationTimer.current = setTimeout(() => {
        setLastCompletedTaskId(null);
      }, 450);
    }
    updateTask(taskId, { completed: !completed });
  }

  if (prioritizedTasks.length === 0) {
    return (
      <p className="text-base text-muted-foreground py-8 text-center">
        Nothing on your plate right now.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-full bg-muted/50 h-2 overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${(prioritizedTasks.filter((t) => t.completed).length / prioritizedTasks.length) * 100}%` }}
        />
      </div>
      {prioritizedTasks.map((task, i) => (
        <div
          key={task.id}
          className={cn(
            "group flex gap-4 rounded-xl border bg-card/70 px-4 py-3.5 shadow-sm transition-colors",
            "hover:border-foreground/15",
            i === 0 && "ring-1 ring-primary/35 bg-linear-to-br from-primary/10 to-card/60",
            lastCompletedTaskId === task.id && "animate-task-fly-up"
          )}
        >
          <button
            type="button"
            aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
            onClick={() => handleTaskToggle(task.id, task.completed)}
            className={cn(
              "shrink-0 mt-0.5 h-7 w-7 rounded-lg border-2 flex items-center justify-center transition-colors",
              task.completed
                ? "bg-emerald-500 border-emerald-400"
                : "border-border hover:border-primary/60"
            )}
          >
            {task.completed && <Check className="h-4 w-4 text-black/80" />}
          </button>
          <div className="flex-1 min-w-0 space-y-1.5">
            <p
              className={cn(
                "text-base font-medium leading-snug line-clamp-2",
                task.completed && "line-through text-muted-foreground font-normal"
              )}
            >
              {compactTaskLabel(task.title, 100)}
            </p>
            <div className="flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:items-baseline sm:gap-x-3 sm:gap-y-1">
              <span className="inline-block max-w-full rounded-lg border border-border bg-muted/40 px-2.5 py-1.5 text-sm font-medium leading-snug text-foreground wrap-anywhere">
                {task.goalName}
              </span>
              {task.reason !== "backlog" && (
                <span className="text-sm text-muted-foreground shrink-0">
                  {task.reason}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
