import { useMemo } from "react";
import { useTasks, useMilestones, useGoals } from "@/hooks/use-goals";
import type { Task, Milestone, Goal } from "@/types/database";
import {
  stripTaskPrefix,
  taskDedupeKey,
  looksLikeFarHorizonTask,
} from "@/lib/focus-task-display";

/** Single user-facing hint; internal scoring terms are not shown. */
function focusHintFromReasons(reasons: string[]): string {
  const order: { key: string; label: string }[] = [
    { key: "overdue", label: "Overdue" },
    { key: "due today", label: "Due today" },
    { key: "due soon", label: "Due soon" },
    { key: "this week", label: "This week" },
    { key: "active", label: "Active phase" },
    { key: "unlocks next", label: "Unblocks next step" },
    { key: "paused", label: "Paused" },
  ];
  for (const { key, label } of order) {
    if (reasons.includes(key)) return label;
  }
  return "";
}

export interface PrioritizedTask extends Task {
  priorityScore: number;
  milestoneName: string;
  goalName: string;
  /** @deprecated use focusHint for UI */
  reason: string;
  /** Short label for chips: "Due today", "Active phase", … */
  focusHint: string;
}

export function useSmartPriority(limit = 5): PrioritizedTask[] {
  const tasks = useTasks();
  const milestones = useMilestones();
  const goals = useGoals();

  return useMemo(() => {
    const milestoneMap = new Map<string, Milestone>(
      milestones.map((m) => [m.id, m])
    );
    const goalMap = new Map<string, Goal>(goals.map((g) => [g.id, g]));

    // Due-date scoring needs wall-clock time; recomputes when tasks/milestones change.
    // eslint-disable-next-line react-hooks/purity -- intentional
    const now = Date.now();
    const incompleteTasks = tasks.filter((t) => !t.completed);

    const scored: PrioritizedTask[] = incompleteTasks.map((task) => {
      let score = 0;
      const reasons: string[] = [];

      const milestone = milestoneMap.get(task.milestone_id);
      const goal = milestone ? goalMap.get(milestone.goal_id) : undefined;

      const stripped = stripTaskPrefix(task.title);
      const mTitle = milestone?.title ?? "";
      // Task is basically a duplicate of the milestone line → deprioritize (old "Start: {milestone}" pattern)
      if (
        mTitle &&
        stripped.length > 20 &&
        (stripped === mTitle ||
          stripped.includes(mTitle) ||
          mTitle.includes(stripped.slice(0, 40)))
      ) {
        score -= 120;
        reasons.push("milestone-sized");
      }

      // Prefer bite-sized tasks in "Focus today"
      if (stripped.length > 140) {
        score -= 50;
        reasons.push("long text");
      } else if (stripped.length <= 80) {
        score += 12;
      }

      if (looksLikeFarHorizonTask(task.title)) {
        score -= 420;
        reasons.push("far horizon");
      }

      if (milestone?.status === "paused") {
        score -= 200;
        reasons.push("paused");
      }

      if (milestone?.status === "in_progress") {
        score += 30;
        reasons.push("active");
      }

      if (task.due_date) {
        const daysUntilDue =
          (new Date(task.due_date).getTime() - now) /
          (1000 * 60 * 60 * 24);
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
          reasons.push("this week");
        }
      }

      if (milestone) {
        const childCount = milestones.filter(
          (m) => m.parent_milestone_id === milestone.id
        ).length;
        if (childCount > 0) {
          score += childCount * 8;
          reasons.push("unlocks next");
        }
      }

      if (goal?.status === "active") {
        score += 5;
      }

      const reasonShort =
        reasons.length > 0 ? reasons.slice(0, 2).join(" · ") : "backlog";
      const focusHint = focusHintFromReasons(reasons);

      return {
        ...task,
        priorityScore: score,
        milestoneName: milestone?.title ?? "Unknown",
        goalName: goal?.title ?? "Unknown",
        reason: reasonShort,
        focusHint,
      };
    });

    scored.sort((a, b) => b.priorityScore - a.priorityScore);

    const seen = new Set<string>();
    const deduped: PrioritizedTask[] = [];
    for (const t of scored) {
      const key = taskDedupeKey(t.title);
      if (seen.has(key)) continue;
      seen.add(key);
      deduped.push(t);
      if (deduped.length >= limit * 2) break;
    }

    return deduped.slice(0, limit);
  }, [tasks, milestones, goals, limit]);
}
