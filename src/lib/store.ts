import { create } from "zustand";
import type { User, Goal, Milestone, Task, GoalStatus, MilestoneStatus, DailyGoal, GoalCategory } from "@/types/database";
import { mockUsers, mockGoals, mockMilestones, mockTasks, mockDailyGoals } from "@/lib/mockData";

interface AppState {
  currentUserId: string;
  users: User[];
  goals: Goal[];
  milestones: Milestone[];
  tasks: Task[];
  dailyGoals: DailyGoal[];

  addTask: (task: Omit<Task, "id" | "created_at">) => void;
  addTasks: (tasks: Omit<Task, "id" | "created_at">[]) => void;
  updateTask: (id: string, updates: Partial<Pick<Task, "title" | "completed" | "due_date" | "milestone_id">>) => void;
  deleteTask: (id: string) => void;
  
  addGoal: (goal: Omit<Goal, "id" | "created_at"> & { id?: string }) => void;
  updateGoalStatus: (id: string, status: GoalStatus) => void;
  
  addMilestone: (milestone: Omit<Milestone, "id" | "created_at"> & { id?: string }) => void;
  updateMilestoneStatus: (id: string, status: MilestoneStatus) => void;

  toggleDailyGoal: (id: string) => void;
  addDailyGoal: (goal: Omit<DailyGoal, "id" | "created_at">) => void;
  deleteDailyGoal: (id: string) => void;

  clearAndSetPaths: (
    goals: (Omit<Goal, "created_at"> & { id: string })[],
    milestones: (Omit<Milestone, "created_at"> & { id: string })[],
    tasks: Omit<Task, "id" | "created_at">[]
  ) => void;

  setInitialData: (
    userId: string,
    goals: Goal[],
    milestones: Milestone[],
    tasks: Task[]
  ) => void;

  decisions: Decision[];
  addDecision: (decision: Omit<Decision, "id" | "created_at">) => void;
  deleteDecision: (id: string) => void;
}

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

let taskCounter = 100;
let decisionCounter = 0;
let dailyGoalCounter = 100;

export const useAppStore = create<AppState>((set) => ({
  currentUserId: mockUsers[0].id,
  users: mockUsers,
  goals: mockGoals,
  milestones: mockMilestones,
  tasks: mockTasks,
  dailyGoals: mockDailyGoals,
  decisions: [],

  addTask: (taskData) =>
    set((state) => ({
      tasks: [
        ...state.tasks,
        {
          ...taskData,
          id: `t-new-${++taskCounter}`,
          created_at: new Date().toISOString(),
        },
      ],
    })),

  addTasks: (tasksData) =>
    set((state) => {
      const newTasks = tasksData.map((t) => ({
        ...t,
        id: `t-new-${++taskCounter}`,
        created_at: new Date().toISOString(),
      }));
      return { tasks: [...state.tasks, ...newTasks] };
    }),

  addGoal: (goalData) =>
    set((state) => ({
      goals: [
        ...state.goals,
        {
          ...goalData,
          id: goalData.id || `g-new-${Date.now()}`,
          created_at: new Date().toISOString(),
        },
      ],
    })),

  addMilestone: (milestoneData) =>
    set((state) => ({
      milestones: [
        ...state.milestones,
        {
          ...milestoneData,
          id: milestoneData.id || `m-new-${Date.now()}`,
          created_at: new Date().toISOString(),
        },
      ],
    })),

  updateTask: (id, updates) =>
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    })),

  deleteTask: (id) =>
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
    })),

  updateMilestoneStatus: (id, status) =>
    set((state) => ({
      milestones: state.milestones.map((m) =>
        m.id === id ? { ...m, status } : m
      ),
    })),

  updateGoalStatus: (id, status) =>
    set((state) => ({
      goals: state.goals.map((g) => (g.id === id ? { ...g, status } : g)),
    })),

  toggleDailyGoal: (id) =>
    set((state) => ({
      dailyGoals: state.dailyGoals.map((dg) =>
        dg.id === id ? { ...dg, completed: !dg.completed } : dg
      ),
    })),

  addDailyGoal: (goalData) =>
    set((state) => ({
      dailyGoals: [
        ...state.dailyGoals,
        {
          ...goalData,
          id: `dg-new-${++dailyGoalCounter}`,
          created_at: new Date().toISOString(),
        },
      ],
    })),

  deleteDailyGoal: (id) =>
    set((state) => ({
      dailyGoals: state.dailyGoals.filter((dg) => dg.id !== id),
    })),

  addDecision: (decisionData) =>
    set((state) => ({
      decisions: [
        ...state.decisions,
        {
          ...decisionData,
          id: `d-${++decisionCounter}`,
          created_at: new Date().toISOString(),
        },
      ],
    })),

  deleteDecision: (id) =>
    set((state) => ({
      decisions: state.decisions.filter((d) => d.id !== id),
    })),

  clearAndSetPaths: (newGoals, newMilestones, newTasks) =>
    set(() => {
      const now = new Date().toISOString();
      return {
        goals: newGoals.map((g) => ({ ...g, created_at: now })),
        milestones: newMilestones.map((m) => ({ ...m, created_at: now })),
        tasks: newTasks.map((t, i) => ({
          ...t,
          id: `t-onboard-${Date.now()}-${i}`,
          created_at: now,
        })),
        dailyGoals: [], // fresh start
      };
    }),

  setInitialData: (userId, newGoals, newMilestones, newTasks) =>
    set({
      currentUserId: userId,
      goals: newGoals,
      milestones: newMilestones,
      tasks: newTasks,
      // Leaving daily goals out of Supabase sync for now
    }),
}));
