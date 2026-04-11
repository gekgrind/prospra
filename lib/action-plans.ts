export const ACTION_PLAN_STATUSES = [
  "not_started",
  "in_progress",
  "completed",
  "blocked",
] as const;

export type ActionPlanTaskStatus = (typeof ACTION_PLAN_STATUSES)[number];

export interface ActionPlanTask {
  id: string;
  title: string;
  status: ActionPlanTaskStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ActionPlan {
  id: string;
  conversation_id: string;
  user_id: string;
  title: string | null;
  tasks: ActionPlanTask[];
  created_at: string;
  updated_at: string;
}

const STEP_LINE_REGEX = /^\s*(?:[-*•]|\d+[.)])\s+(.+)$/;

export function normalizeTaskTitle(line: string): string {
  return line
    .replace(/^\s*(?:[-*•]|\d+[.)])\s+/, "")
    .replace(/^\*\*|\*\*$/g, "")
    .trim();
}

export function extractPlanTasksFromAssistantText(text: string): string[] {
  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);

  const actionHeaderIndex = lines.findIndex((line) =>
    /action steps?|next steps?|plan/i.test(line.replace(/[*:#]/g, "").trim())
  );

  const sourceLines = actionHeaderIndex >= 0 ? lines.slice(actionHeaderIndex + 1) : lines;

  const tasks: string[] = [];
  for (const line of sourceLines) {
    const match = line.match(STEP_LINE_REGEX);
    if (!match) {
      if (tasks.length > 0) {
        break;
      }
      continue;
    }

    const title = normalizeTaskTitle(match[1] ?? line);
    if (!title) continue;
    tasks.push(title);

    if (tasks.length >= 12) break;
  }

  return tasks;
}

export function buildTasksFromTitles(titles: string[], nowIso = new Date().toISOString()): ActionPlanTask[] {
  return titles.map((title, index) => ({
    id: `${index + 1}`,
    title,
    status: "not_started",
    notes: null,
    created_at: nowIso,
    updated_at: nowIso,
  }));
}

export function sanitizeTasks(tasks: unknown): ActionPlanTask[] {
  if (!Array.isArray(tasks)) return [];

  return tasks
    .map((task, index) => {
      const candidate = task as Partial<ActionPlanTask>;
      const status = ACTION_PLAN_STATUSES.includes(candidate.status as ActionPlanTaskStatus)
        ? (candidate.status as ActionPlanTaskStatus)
        : "not_started";
      const title = typeof candidate.title === "string" ? candidate.title.trim() : "";
      if (!title) return null;

      const fallbackDate = new Date().toISOString();

      return {
        id: typeof candidate.id === "string" && candidate.id ? candidate.id : `${index + 1}`,
        title,
        status,
        notes: typeof candidate.notes === "string" ? candidate.notes : null,
        created_at: typeof candidate.created_at === "string" ? candidate.created_at : fallbackDate,
        updated_at: typeof candidate.updated_at === "string" ? candidate.updated_at : fallbackDate,
      } satisfies ActionPlanTask;
    })
    .filter((task): task is ActionPlanTask => Boolean(task));
}

export function computeActionPlanProgress(tasks: ActionPlanTask[]) {
  const total = tasks.length;
  const completed = tasks.filter((task) => task.status === "completed").length;
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

  return { total, completed, percentage };
}

export function getNextActionableTask(tasks: ActionPlanTask[]): ActionPlanTask | null {
  return (
    tasks.find((task) => task.status === "in_progress") ??
    tasks.find((task) => task.status === "not_started") ??
    null
  );
}
