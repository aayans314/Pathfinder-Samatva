import { create } from "zustand";
import type { User, Goal, Milestone, Task, GoalStatus, MilestoneStatus, DailyGoal, GoalCategory } from "@/types/database";
import { mockUsers, mockGoals, mockMilestones, mockTasks, mockDailyGoals } from "@/lib/mockData";
import { createClient } from "@/lib/supabase/browser";

export interface Decision {
  id: string;
  user_id: string;
  title: string;
  option_a: string;
  option_b: string;
  criteria: DecisionCriterion[];
  created_at: string;
}

export interface DecisionCriterion {
  goal_id: string;
  weight: number;
  score_a: number;
  score_b: number;
}

interface AppState {
  currentUserId: string;
  users: User[];
  goals: Goal[];
  milestones: Milestone[];
  tasks: Task[];
  dailyGoals: DailyGoal[];
  decisions: Decision[];

  addTask: (task: Omit<Task, "id" | "created_at">) => void;
  addTasks: (tasks: Omit<Task, "id" | "created_at">[]) => void;
  updateTask: (
    id: string,
    updates: Partial<
      Pick<Task, "title" | "completed" | "due_date" | "milestone_id" | "sort_order">
    >
  ) => void;
  deleteTask: (id: string) => void;

  addGoal: (goal: Omit<Goal, "id" | "created_at"> & { id?: string }) => void;
  updateGoalStatus: (id: string, status: GoalStatus) => void;

  addMilestone: (milestone: Omit<Milestone, "id" | "created_at"> & { id?: string }) => void;
  updateMilestoneStatus: (id: string, status: MilestoneStatus) => void;

  toggleDailyGoal: (id: string) => void;
  addDailyGoal: (goal: Omit<DailyGoal, "id" | "created_at">) => void;
  deleteDailyGoal: (id: string) => void;

  addDecision: (decision: Omit<Decision, "id" | "created_at">) => void;
  deleteDecision: (id: string) => void;

  clearAndSetPaths: (
    goals: (Omit<Goal, "created_at"> & { id: string })[],
    milestones: (Omit<Milestone, "created_at"> & { id: string })[],
    tasks: Omit<Task, "id" | "created_at">[]
  ) => void;

  setInitialData: (
    userId: string,
    goals: Goal[],
    milestones: Milestone[],
    tasks: Task[],
    dailyGoals?: DailyGoal[],
    decisions?: Decision[]
  ) => void;

  /** Apply agentic reschedule: pause milestones and set global task priority order. */
  applyAgentReschedule: (payload: {
    milestonesToPause: string[];
    reprioritizedTaskIds: string[];
  }) => void;
}

function getSupabase() {
  return createClient();
}

function isMockId(id: string): boolean {
  return !id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
}

export const useAppStore = create<AppState>((set, get) => ({
  currentUserId: mockUsers[0].id,
  users: mockUsers,
  goals: mockGoals,
  milestones: mockMilestones,
  tasks: mockTasks,
  dailyGoals: mockDailyGoals,
  decisions: [],

  addTask: (taskData) => {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    set((state) => {
      const siblings = state.tasks.filter(
        (t) => t.milestone_id === taskData.milestone_id
      );
      const maxOrder = siblings.reduce(
        (max, t) => Math.max(max, t.sort_order ?? 0),
        -1
      );
      const sort_order = maxOrder + 1;
      const newTask: Task = {
        ...taskData,
        id,
        created_at: now,
        sort_order,
      };
      return { tasks: [...state.tasks, newTask] };
    });

    const supabase = getSupabase();
    const task = get().tasks.find((t) => t.id === id);
    const sort_order = task?.sort_order ?? 0;
    supabase
      .from("tasks")
      .upsert(
        {
          id,
          milestone_id: taskData.milestone_id,
          title: taskData.title,
          completed: taskData.completed,
          due_date: taskData.due_date,
          sort_order,
        },
        { onConflict: "id" }
      )
      .then(({ error }) => {
        if (error) console.error("Failed to persist task:", error);
      });
  },

  addTasks: (tasksData) => {
    const now = new Date().toISOString();
    const newTasks = tasksData.map((t) => ({
      ...t,
      id: crypto.randomUUID(),
      created_at: now,
    }));

    set((state) => ({ tasks: [...state.tasks, ...newTasks] }));

    const supabase = getSupabase();
    const rows = newTasks.map((t) => ({
      id: t.id,
      milestone_id: t.milestone_id,
      title: t.title,
      completed: t.completed,
      due_date: t.due_date,
      sort_order: t.sort_order ?? 0,
    }));
    supabase
      .from("tasks")
      .upsert(rows, { onConflict: "id" })
      .then(({ error }) => {
        if (error) console.error("Failed to persist tasks:", error);
      });
  },

  addGoal: (goalData) => {
    const id = goalData.id || crypto.randomUUID();
    const now = new Date().toISOString();
    const newGoal: Goal = { ...goalData, id, created_at: now };

    set((state) => ({ goals: [...state.goals, newGoal] }));

    if (!isMockId(id)) {
      const supabase = getSupabase();
      supabase
        .from("goals")
        .upsert(
          {
            id,
            user_id: goalData.user_id,
            title: goalData.title,
            category: goalData.category,
            target_date: goalData.target_date,
            status: goalData.status,
          },
          { onConflict: "id" }
        )
        .then(({ error }) => {
          if (error) console.error("Failed to persist goal:", error);
        });
    }
  },

  addMilestone: (milestoneData) => {
    const id = milestoneData.id || crypto.randomUUID();
    const now = new Date().toISOString();
    const newMilestone: Milestone = { ...milestoneData, id, created_at: now };

    set((state) => ({ milestones: [...state.milestones, newMilestone] }));

    if (!isMockId(id)) {
      const supabase = getSupabase();
      supabase
        .from("milestones")
        .upsert(
          {
            id,
            goal_id: milestoneData.goal_id,
            title: milestoneData.title,
            description: milestoneData.description,
            parent_milestone_id: milestoneData.parent_milestone_id,
            status: milestoneData.status,
            order_index: milestoneData.order_index,
          },
          { onConflict: "id" }
        )
        .then(({ error }) => {
          if (error) console.error("Failed to persist milestone:", error);
        });
    }
  },

  updateTask: (id, updates) => {
    set((state) => {
      const newTasks = state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t));
      let newMilestones = state.milestones;

      if (updates.completed !== undefined) {
        const task = newTasks.find((t) => t.id === id);
        if (task) {
          const siblingTasks = newTasks.filter((t) => t.milestone_id === task.milestone_id);
          const allComplete = siblingTasks.every((t) => t.completed);
          const milestone = newMilestones.find((m) => m.id === task.milestone_id);

          if (
            allComplete &&
            milestone &&
            milestone.status === "in_progress"
          ) {
            newMilestones = newMilestones.map((m) => {
              if (m.id === milestone.id) return { ...m, status: "completed" as const };
              if (m.parent_milestone_id === milestone.id && m.status === "locked") {
                return { ...m, status: "in_progress" as const };
              }
              return m;
            });

            if (!isMockId(milestone.id)) {
              const supabase = getSupabase();
              supabase.from("milestones").update({ status: "completed" }).eq("id", milestone.id).then(({ error }) => {
                if (error) console.error("Failed to auto-complete milestone:", error);
              });
              const nextMilestone = newMilestones.find(
                (m) => m.parent_milestone_id === milestone.id && m.status === "in_progress"
              );
              if (nextMilestone && !isMockId(nextMilestone.id)) {
                supabase.from("milestones").update({ status: "in_progress" }).eq("id", nextMilestone.id).then(({ error }) => {
                  if (error) console.error("Failed to unlock next milestone:", error);
                });
              }
            }
          }
        }
      }

      return { tasks: newTasks, milestones: newMilestones };
    });

    if (!isMockId(id)) {
      const supabase = getSupabase();
      const row: Record<string, unknown> = {};
      if (updates.title !== undefined) row.title = updates.title;
      if (updates.completed !== undefined) row.completed = updates.completed;
      if (updates.due_date !== undefined) row.due_date = updates.due_date;
      if (updates.milestone_id !== undefined) row.milestone_id = updates.milestone_id;
      if (updates.sort_order !== undefined) row.sort_order = updates.sort_order;
      if (Object.keys(row).length > 0) {
        supabase
          .from("tasks")
          .update(row)
          .eq("id", id)
          .then(({ error }) => {
            if (error) console.error("Failed to update task:", error);
          });
      }
    }
  },

  deleteTask: (id) => {
    set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }));

    if (!isMockId(id)) {
      const supabase = getSupabase();
      supabase.from("tasks").delete().eq("id", id).then(({ error }) => {
        if (error) console.error("Failed to delete task:", error);
      });
    }
  },

  updateMilestoneStatus: (id, status) => {
    set((state) => ({
      milestones: state.milestones.map((m) =>
        m.id === id ? { ...m, status } : m
      ),
    }));

    if (!isMockId(id)) {
      const supabase = getSupabase();
      supabase.from("milestones").update({ status }).eq("id", id).then(({ error }) => {
        if (error) console.error("Failed to update milestone:", error);
      });
    }
  },

  updateGoalStatus: (id, status) => {
    set((state) => ({
      goals: state.goals.map((g) => (g.id === id ? { ...g, status } : g)),
    }));

    if (!isMockId(id)) {
      const supabase = getSupabase();
      supabase.from("goals").update({ status }).eq("id", id).then(({ error }) => {
        if (error) console.error("Failed to update goal:", error);
      });
    }
  },

  toggleDailyGoal: (id) => {
    const current = get().dailyGoals.find((dg) => dg.id === id);
    if (!current) return;
    const newCompleted = !current.completed;

    set((state) => ({
      dailyGoals: state.dailyGoals.map((dg) =>
        dg.id === id ? { ...dg, completed: newCompleted } : dg
      ),
    }));

    if (!isMockId(id)) {
      const supabase = getSupabase();
      supabase.from("daily_goals").update({ completed: newCompleted }).eq("id", id).then(({ error }) => {
        if (error) console.error("Failed to toggle daily goal:", error);
      });
    }
  },

  addDailyGoal: (goalData) => {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const newGoal: DailyGoal = { ...goalData, id, created_at: now };

    set((state) => ({ dailyGoals: [...state.dailyGoals, newGoal] }));

    const supabase = getSupabase();
    supabase.from("daily_goals").insert({
      id,
      user_id: goalData.user_id,
      title: goalData.title,
      completed: goalData.completed,
      date: goalData.date,
      category: goalData.category,
    }).then(({ error }) => {
      if (error) console.error("Failed to persist daily goal:", error);
    });
  },

  deleteDailyGoal: (id) => {
    set((state) => ({
      dailyGoals: state.dailyGoals.filter((dg) => dg.id !== id),
    }));

    if (!isMockId(id)) {
      const supabase = getSupabase();
      supabase.from("daily_goals").delete().eq("id", id).then(({ error }) => {
        if (error) console.error("Failed to delete daily goal:", error);
      });
    }
  },

  addDecision: (decisionData) => {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const newDecision: Decision = { ...decisionData, id, created_at: now };

    set((state) => ({ decisions: [...state.decisions, newDecision] }));

    const supabase = getSupabase();
    supabase.from("decisions").insert({
      id,
      user_id: decisionData.user_id,
      title: decisionData.title,
      option_a: decisionData.option_a,
      option_b: decisionData.option_b,
      criteria: decisionData.criteria,
    }).then(({ error }) => {
      if (error) console.error("Failed to persist decision:", error);
    });
  },

  deleteDecision: (id) => {
    set((state) => ({
      decisions: state.decisions.filter((d) => d.id !== id),
    }));

    if (!isMockId(id)) {
      const supabase = getSupabase();
      supabase.from("decisions").delete().eq("id", id).then(({ error }) => {
        if (error) console.error("Failed to delete decision:", error);
      });
    }
  },

  applyAgentReschedule: ({ milestonesToPause, reprioritizedTaskIds }) => {
    const prev = get();
    const userGoalIds = new Set(
      prev.goals
        .filter((g) => g.user_id === prev.currentUserId)
        .map((g) => g.id)
    );
    const userMilestones = prev.milestones.filter((m) =>
      userGoalIds.has(m.goal_id)
    );
    const milestoneIds = new Set(userMilestones.map((m) => m.id));
    const pauseSet = new Set(
      milestonesToPause.filter((id) => milestoneIds.has(id))
    );

    const newMilestones = prev.milestones.map((m) => {
      if (!pauseSet.has(m.id)) return m;
      if (m.status === "completed") return m;
      return { ...m, status: "paused" as const };
    });

    const userTasks = prev.tasks.filter((t) => milestoneIds.has(t.milestone_id));
    const userTaskIdSet = new Set(userTasks.map((t) => t.id));

    const orderedIds = reprioritizedTaskIds.filter((id) =>
      userTaskIdSet.has(id)
    );
    const seen = new Set<string>();
    const deduped: string[] = [];
    for (const id of orderedIds) {
      if (seen.has(id)) continue;
      seen.add(id);
      deduped.push(id);
    }

    const restIds = userTasks
      .filter((t) => !seen.has(t.id))
      .sort((a, b) => {
        const ao = a.sort_order ?? 0;
        const bo = b.sort_order ?? 0;
        if (ao !== bo) return ao - bo;
        return a.created_at.localeCompare(b.created_at);
      })
      .map((t) => t.id);

    const finalOrder = [...deduped, ...restIds];
    const orderMap = new Map(finalOrder.map((id, i) => [id, i]));

    const newTasks = prev.tasks.map((t) => {
      if (!orderMap.has(t.id)) return t;
      return { ...t, sort_order: orderMap.get(t.id)! };
    });

    set({ milestones: newMilestones, tasks: newTasks });

    const supabase = getSupabase();
    for (const m of newMilestones) {
      const old = prev.milestones.find((o) => o.id === m.id);
      if (old && old.status !== m.status && !isMockId(m.id)) {
        supabase
          .from("milestones")
          .update({ status: m.status })
          .eq("id", m.id)
          .then(({ error }) => {
            if (error) console.error("Failed to persist milestone pause:", error);
          });
      }
    }
    for (const t of newTasks) {
      const old = prev.tasks.find((o) => o.id === t.id);
      if (
        old &&
        (old.sort_order ?? 0) !== (t.sort_order ?? 0) &&
        !isMockId(t.id)
      ) {
        supabase
          .from("tasks")
          .update({ sort_order: t.sort_order ?? 0 })
          .eq("id", t.id)
          .then(({ error }) => {
            if (error) console.error("Failed to persist task order:", error);
          });
      }
    }
  },

  clearAndSetPaths: (newGoals, newMilestones, newTasks) =>
    set(() => {
      const now = new Date().toISOString();
      return {
        goals: newGoals.map((g) => ({ ...g, created_at: now })),
        milestones: newMilestones.map((m) => ({ ...m, created_at: now })),
        tasks: newTasks.map((t) => ({
          ...t,
          id: crypto.randomUUID(),
          created_at: now,
        })),
        dailyGoals: [],
      };
    }),

  setInitialData: (userId, newGoals, newMilestones, newTasks, newDailyGoals, newDecisions) =>
    set({
      currentUserId: userId,
      goals: newGoals,
      milestones: newMilestones,
      tasks: newTasks,
      dailyGoals: newDailyGoals ?? [],
      decisions: newDecisions ?? [],
    }),
}));
