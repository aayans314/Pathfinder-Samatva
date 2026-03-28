import { useMemo } from "react";
import { useTasks, useMilestones, useGoals } from "@/hooks/use-goals";
import type { Task, Milestone, Goal } from "@/types/database";

export interface PrioritizedTask extends Task {
  priorityScore: number;
  milestoneName: string;
  goalName: string;
  reason: string;
}

export function useSmartPriority(limit = 5): PrioritizedTask[] {
  const tasks = useTasks();
  const milestones = useMilestones();
  const goals = useGoals();

  return useMemo(() => {
    const milestoneMap = new Map<string, Milestone>(
      milestones.map((m) => [m.id, m])
    );
    const goalMap = new Map<string, Goal>(
      goals.map((g) => [g.id, g])
    );

    const now = Date.now();
    const incompleteTasks = tasks.filter((t) => !t.completed);

    const scored: PrioritizedTask[] = incompleteTasks.map((task) => {
      let score = 0;
      const reasons: string[] = [];

      const milestone = milestoneMap.get(task.milestone_id);
      const goal = milestone ? goalMap.get(milestone.goal_id) : undefined;

      // Tasks on active milestones rank higher
      if (milestone?.status === "in_progress") {
        score += 30;
        reasons.push("active milestone");
      }

      // Due date urgency
      if (task.due_date) {
        const daysUntilDue = (new Date(task.due_date).getTime() - now) / (1000 * 60 * 60 * 24);
        if (daysUntilDue < 0) {
          score += 50;
          reasons.push("overdue");
        } else if (daysUntilDue < 1) {
          score += 45;
          reasons.push("due today");
        } else if (daysUntilDue < 3) {
          score += 35;
          reasons.push("due soon");
        } else if (daysUntilDue < 7) {
          score += 20;
          reasons.push("due this week");
        }
      }

      // Downstream milestone count -- tasks on milestones with many children are blocking
      if (milestone) {
        const childCount = milestones.filter(
          (m) => m.parent_milestone_id === milestone.id
        ).length;
        if (childCount > 0) {
          score += childCount * 10;
          reasons.push(`unlocks ${childCount} milestone${childCount > 1 ? "s" : ""}`);
        }
      }

      // Active goal bonus
      if (goal?.status === "active") {
        score += 5;
      }

      return {
        ...task,
        priorityScore: score,
        milestoneName: milestone?.title ?? "Unknown",
        goalName: goal?.title ?? "Unknown",
        reason: reasons.length > 0 ? reasons.join(", ") : "backlog",
      };
    });

    scored.sort((a, b) => b.priorityScore - a.priorityScore);
    return scored.slice(0, limit);
  }, [tasks, milestones, goals, limit]);
}
