"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppStore } from "@/lib/store";
import { useMilestones, useGoals } from "@/hooks/use-goals";
import type { Task } from "@/types/database";

interface TaskFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingTask?: Task | null;
}

export function TaskFormDialog({
  open,
  onOpenChange,
  editingTask,
}: TaskFormDialogProps) {
  const goals = useGoals();
  const milestones = useMilestones();
  const addTask = useAppStore((s) => s.addTask);
  const updateTask = useAppStore((s) => s.updateTask);

  const [title, setTitle] = useState(editingTask?.title ?? "");
  const [milestoneId, setMilestoneId] = useState(
    editingTask?.milestone_id ?? ""
  );
  const [dueDate, setDueDate] = useState(editingTask?.due_date ?? "");

  const isEditing = !!editingTask;

  const milestonesByGoal = goals.map((goal) => ({
    goal,
    milestones: milestones.filter((m) => m.goal_id === goal.id),
  }));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !milestoneId) return;

    if (isEditing) {
      updateTask(editingTask.id, {
        title: title.trim(),
        milestone_id: milestoneId,
        due_date: dueDate || null,
      });
    } else {
      addTask({
        title: title.trim(),
        milestone_id: milestoneId,
        completed: false,
        due_date: dueDate || null,
      });
    }

    setTitle("");
    setMilestoneId("");
    setDueDate("");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Task" : "New Task"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="task-title">Title</Label>
            <Input
              id="task-title"
              placeholder="What needs to be done?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-milestone">Link to Milestone</Label>
            <Select value={milestoneId} onValueChange={(v) => setMilestoneId(v ?? "")}>
              <SelectTrigger id="task-milestone">
                <SelectValue placeholder="Select a milestone" />
              </SelectTrigger>
              <SelectContent>
                {milestonesByGoal.map(({ goal, milestones: ms }) => (
                  <div key={goal.id}>
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                      {goal.title}
                    </div>
                    {ms.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.title}
                      </SelectItem>
                    ))}
                  </div>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-due-date">Due Date (optional)</Label>
            <Input
              id="task-due-date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim() || !milestoneId}>
              {isEditing ? "Save Changes" : "Create Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
