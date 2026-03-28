"use client";

import { Check } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useSmartPriority } from "@/hooks/use-smart-priority";
import { cn } from "@/lib/utils";

export function TodaysFocus() {
  const prioritizedTasks = useSmartPriority(6);
  const updateTask = useAppStore((s) => s.updateTask);

  if (prioritizedTasks.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-6 text-center">
        Nothing on your plate right now.
      </p>
    );
  }

  return (
    <div className="space-y-0.5">
      {prioritizedTasks.map((task) => (
        <div
          key={task.id}
          className="group flex items-start gap-2.5 rounded-lg px-2 py-2 -mx-2 hover:bg-muted/40 transition-colors"
        >
          <button
            onClick={() => updateTask(task.id, { completed: !task.completed })}
            className={cn(
              "shrink-0 mt-0.5 h-4.5 w-4.5 rounded border flex items-center justify-center transition-all",
              task.completed
                ? "bg-foreground border-foreground"
                : "border-border hover:border-foreground/50"
            )}
          >
            {task.completed && <Check className="h-3 w-3 text-background" />}
          </button>
          <div className="flex-1 min-w-0">
            <p
              className={cn(
                "text-sm leading-snug",
                task.completed && "line-through text-muted-foreground"
              )}
            >
              {task.title}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {task.milestoneName}
              {task.reason !== "backlog" && (
                <span className="before:content-['_·_']">{task.reason}</span>
              )}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
