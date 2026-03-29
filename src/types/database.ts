export type GoalStatus = "active" | "paused" | "completed" | "archived";
export type MilestoneStatus =
  | "locked"
  | "in_progress"
  | "paused"
  | "completed";
export type GoalCategory =
  | "daily"
  | "academics"
  | "research"
  | "internships"
  | "career"
  | "fitness"
  | "networking"
  | "personal";

export interface User {
  id: string;
  name: string;
  bio: string | null;
  target_visa: string | null;
  opt_in_matching: boolean;
  created_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  category: GoalCategory;
  target_date: string;
  status: GoalStatus;
  created_at: string;
}

export interface Milestone {
  id: string;
  goal_id: string;
  title: string;
  description: string | null;
  parent_milestone_id: string | null;
  status: MilestoneStatus;
  order_index: number;
  created_at: string;
}

export interface Task {
  id: string;
  milestone_id: string;
  title: string;
  completed: boolean;
  due_date: string | null;
  created_at: string;
  /** Lower sorts first; used after agentic reschedule reprioritization. */
  sort_order?: number;
}

export interface DailyGoal {
  id: string;
  user_id: string;
  title: string;
  completed: boolean;
  date: string;
  category: GoalCategory;
  created_at: string;
}
