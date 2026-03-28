import { create } from "zustand";
import type { User, Goal, Milestone, Task, GoalStatus, MilestoneStatus } from "@/types/database";
import { mockUsers, mockGoals, mockMilestones, mockTasks } from "@/lib/mockData";

interface AppState {
  currentUserId: string;
  users: User[];
  goals: Goal[];
  milestones: Milestone[];
  tasks: Task[];

  addTask: (task: Omit<Task, "id" | "created_at">) => void;
  updateTask: (id: string, updates: Partial<Pick<Task, "title" | "completed" | "due_date" | "milestone_id">>) => void;
  deleteTask: (id: string) => void;
  updateMilestoneStatus: (id: string, status: MilestoneStatus) => void;
  updateGoalStatus: (id: string, status: GoalStatus) => void;

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

export const useAppStore = create<AppState>((set) => ({
  currentUserId: mockUsers[0].id,
  users: mockUsers,
  goals: mockGoals,
  milestones: mockMilestones,
  tasks: mockTasks,
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
}));
