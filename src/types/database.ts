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

export interface ResumeData {
  email?: string;
  phone?: string;
  summary?: string;
  skills?: string[];
  experience?: Array<{
    title: string;
    company: string;
    duration: string;
    highlights: string[];
  }>;
  education?: Array<{
    degree: string;
    institution: string;
    year: string;
  }>;
  certifications?: string[];
  projects?: Array<{
    name: string;
    description: string;
  }>;
}

export interface User {
  id: string;
  name: string;
  bio: string | null;
  target_visa: string | null;
  opt_in_matching: boolean;
  resume_data?: ResumeData;
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
