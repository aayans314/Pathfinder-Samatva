import { useMemo } from "react";
import { useAppStore } from "@/lib/store";
import { useShallow } from "zustand/react/shallow";
import type { GoalCategory } from "@/types/database";

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

// ===== New hooks for life sections =====

export function useDailyGoals() {
  const currentUserId = useAppStore((s) => s.currentUserId);
  const dailyGoals = useAppStore(useShallow((s) => s.dailyGoals));

  return useMemo(() => {
    const d = new Date();
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    return dailyGoals.filter(
      (dg) => dg.user_id === currentUserId && dg.date === today
    );
  }, [dailyGoals, currentUserId]);
}

export interface CategoryStats {
  category: GoalCategory;
  goals: number;
  totalMilestones: number;
  completedMilestones: number;
  totalTasks: number;
  completedTasks: number;
  completionPercent: number;
}

export function useGoalsByCategory(): CategoryStats[] {
  const currentUserId = useAppStore((s) => s.currentUserId);
  const goals = useAppStore(useShallow((s) => s.goals));
  const milestones = useAppStore(useShallow((s) => s.milestones));
  const tasks = useAppStore(useShallow((s) => s.tasks));

  return useMemo(() => {
    const userGoals = goals.filter(
      (g) => g.user_id === currentUserId && g.category !== "daily"
    );
    const categories = [...new Set(userGoals.map((g) => g.category))];

    return categories.map((cat) => {
      const catGoals = userGoals.filter((g) => g.category === cat);
      const catGoalIds = new Set(catGoals.map((g) => g.id));
      const catMilestones = milestones.filter((m) =>
        catGoalIds.has(m.goal_id)
      );
      const catMilestoneIds = new Set(catMilestones.map((m) => m.id));
      const catTasks = tasks.filter((t) =>
        catMilestoneIds.has(t.milestone_id)
      );
      const completed = catTasks.filter((t) => t.completed).length;

      return {
        category: cat,
        goals: catGoals.length,
        totalMilestones: catMilestones.length,
        completedMilestones: catMilestones.filter(
          (m) => m.status === "completed"
        ).length,
        totalTasks: catTasks.length,
        completedTasks: completed,
        completionPercent:
          catTasks.length > 0
            ? Math.round((completed / catTasks.length) * 100)
            : 0,
      };
    });
  }, [goals, milestones, tasks, currentUserId]);
}

export function useCategoryDetail(category: GoalCategory) {
  const currentUserId = useAppStore((s) => s.currentUserId);
  const goals = useAppStore(useShallow((s) => s.goals));
  const milestones = useAppStore(useShallow((s) => s.milestones));
  const tasks = useAppStore(useShallow((s) => s.tasks));

  return useMemo(() => {
    const catGoals = goals.filter(
      (g) => g.user_id === currentUserId && g.category === category
    );
    const catGoalIds = new Set(catGoals.map((g) => g.id));
    const catMilestones = milestones.filter((m) => catGoalIds.has(m.goal_id));
    const catMilestoneIds = new Set(catMilestones.map((m) => m.id));
    const catTasks = tasks.filter((t) => catMilestoneIds.has(t.milestone_id));

    return { goals: catGoals, milestones: catMilestones, tasks: catTasks };
  }, [goals, milestones, tasks, currentUserId, category]);
}
