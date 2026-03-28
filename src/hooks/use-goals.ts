import { useMemo } from "react";
import { useAppStore } from "@/lib/store";
import { useShallow } from "zustand/react/shallow";

export function useCurrentUser() {
  return useAppStore((s) => {
    const user = s.users.find((u) => u.id === s.currentUserId);
    return user ?? s.users[0];
  });
}

export function useGoals() {
  const currentUserId = useAppStore((s) => s.currentUserId);
  const goals = useAppStore(useShallow((s) => s.goals));
  return useMemo(
    () => goals.filter((g) => g.user_id === currentUserId),
    [goals, currentUserId]
  );
}

export function useGoalById(goalId: string) {
  return useAppStore((s) => s.goals.find((g) => g.id === goalId));
}

export function useMilestones(goalId?: string) {
  const currentUserId = useAppStore((s) => s.currentUserId);
  const goals = useAppStore(useShallow((s) => s.goals));
  const milestones = useAppStore(useShallow((s) => s.milestones));

  return useMemo(() => {
    const userGoalIds = new Set(
      goals.filter((g) => g.user_id === currentUserId).map((g) => g.id)
    );
    return milestones.filter(
      (m) => userGoalIds.has(m.goal_id) && (!goalId || m.goal_id === goalId)
    );
  }, [goals, milestones, currentUserId, goalId]);
}

export function useMilestoneById(milestoneId: string) {
  return useAppStore((s) => s.milestones.find((m) => m.id === milestoneId));
}

export function useTasks(milestoneId?: string) {
  const currentUserId = useAppStore((s) => s.currentUserId);
  const goals = useAppStore(useShallow((s) => s.goals));
  const milestones = useAppStore(useShallow((s) => s.milestones));
  const tasks = useAppStore(useShallow((s) => s.tasks));

  return useMemo(() => {
    if (milestoneId) {
      return tasks.filter((t) => t.milestone_id === milestoneId);
    }
    const userGoalIds = new Set(
      goals.filter((g) => g.user_id === currentUserId).map((g) => g.id)
    );
    const userMilestoneIds = new Set(
      milestones.filter((m) => userGoalIds.has(m.goal_id)).map((m) => m.id)
    );
    return tasks.filter((t) => userMilestoneIds.has(t.milestone_id));
  }, [tasks, milestones, goals, currentUserId, milestoneId]);
}

export function useStats() {
  const currentUserId = useAppStore((s) => s.currentUserId);
  const goals = useAppStore(useShallow((s) => s.goals));
  const milestones = useAppStore(useShallow((s) => s.milestones));
  const tasks = useAppStore(useShallow((s) => s.tasks));

  return useMemo(() => {
    const userGoals = goals.filter((g) => g.user_id === currentUserId);
    const userGoalIds = new Set(userGoals.map((g) => g.id));
    const userMilestones = milestones.filter((m) =>
      userGoalIds.has(m.goal_id)
    );
    const userMilestoneIds = new Set(userMilestones.map((m) => m.id));
    const userTasks = tasks.filter((t) =>
      userMilestoneIds.has(t.milestone_id)
    );
    const completedTasks = userTasks.filter((t) => t.completed);

    const upcomingTasks = userTasks
      .filter((t) => !t.completed && t.due_date)
      .sort((a, b) => (a.due_date! > b.due_date! ? 1 : -1));

    return {
      activeGoals: userGoals.filter((g) => g.status === "active").length,
      totalMilestones: userMilestones.length,
      completedMilestones: userMilestones.filter(
        (m) => m.status === "completed"
      ).length,
      totalTasks: userTasks.length,
      completedTasks: completedTasks.length,
      nextDeadline: upcomingTasks[0]?.due_date ?? null,
      completionPercent:
        userTasks.length > 0
          ? Math.round((completedTasks.length / userTasks.length) * 100)
          : 0,
    };
  }, [goals, milestones, tasks, currentUserId]);
}
