"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import { useTasks, useMilestones } from "@/hooks/use-goals";
import { TaskFormDialog } from "@/components/features/task-form-dialog";
import type { Task } from "@/types/database";

export function TaskList() {
  const tasks = useTasks();
  const milestones = useMilestones();
  const updateTask = useAppStore((s) => s.updateTask);
  const deleteTask = useAppStore((s) => s.deleteTask);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const milestoneName = (milestoneId: string) =>
    milestones.find((m) => m.id === milestoneId)?.title ?? "Unknown";

  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    if (a.due_date && b.due_date) return a.due_date > b.due_date ? 1 : -1;
    if (a.due_date) return -1;
    if (b.due_date) return 1;
    return 0;
  });

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">All Tasks</CardTitle>
          <Button
            size="sm"
            onClick={() => {
              setEditingTask(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Task
          </Button>
        </CardHeader>
        <CardContent>
          {sortedTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No tasks yet. Click &quot;Add Task&quot; to get started.
            </p>
          ) : (
            <div className="space-y-1">
              {sortedTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-muted/50 group"
                >
                  <Checkbox
                    checked={task.completed}
                    onCheckedChange={(checked) =>
                      updateTask(task.id, { completed: checked === true })
                    }
                  />
                  <div className="flex-1 min-w-0">
                    <span
                      className={cn(
                        "text-sm",
                        task.completed &&
                          "line-through text-muted-foreground"
                      )}
                    >
                      {task.title}
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0"
                      >
                        {milestoneName(task.milestone_id)}
                      </Badge>
                      {task.due_date && (
                        <span className="text-[10px] text-muted-foreground">
                          Due {format(new Date(task.due_date), "MMM d")}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => {
                        setEditingTask(task);
                        setDialogOpen(true);
                      }}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => deleteTask(task.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <TaskFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingTask={editingTask}
      />
    </>
  );
}
