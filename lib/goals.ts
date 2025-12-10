// /lib/goals.ts

export type GoalType = "revenue" | "audience" | "leads" | "custom";

export interface Goal {
  id: string;
  user_id: string;
  type: GoalType;
  label: string;
  target_value: number;
  current_value: number;
  period: "monthly" | "quarterly" | "yearly";
  period_label: string | null;
  deadline: string | null; // ISO string
  created_at: string;
  updated_at: string;
}

export function computeGoalProgress(goal: Goal): number {
  if (!goal.target_value || goal.target_value <= 0) return 0;
  const raw = goal.current_value / goal.target_value;
  const clamped = Math.max(0, Math.min(1, raw));
  return clamped;
}

export function getGoalStatus(goal: Goal): "behind" | "on-track" | "ahead" {
  const progress = computeGoalProgress(goal);

  if (progress < 0.4) return "behind";
  if (progress < 1.05) return "on-track";
  return "ahead";
}
