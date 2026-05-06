import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import {
  ArrowRight,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  CircleDashed,
  Compass,
  Flag,
  ListChecks,
  MessageSquare,
  Sparkles,
  Target,
  TriangleAlert,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  computeActionPlanProgress,
  getNextActionableTask,
  type ActionPlan,
  type ActionPlanTask,
  type ActionPlanTaskStatus,
} from "@/lib/action-plans";

type ActionPlansExecutionCenterProps = {
  actionPlan: ActionPlan | null;
  error: string | null;
};

const statusLabels: Record<ActionPlanTaskStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  completed: "Completed",
  blocked: "Blocked",
};

const statusStyles: Record<ActionPlanTaskStatus, string> = {
  not_started: "border-[#4f7ca7]/24 bg-[#4f7ca7]/10 text-[#c7d8ea]",
  in_progress: "border-[#00D4FF]/26 bg-[#00D4FF]/10 text-[#9cecff]",
  completed: "border-[#6ee7b7]/24 bg-[#6ee7b7]/10 text-[#b8f7dd]",
  blocked: "border-[#ffe521]/24 bg-[#ffe521]/10 text-[#fff3a6]",
};

type Priority = "High" | "Medium" | "Low";

const priorityStyles: Record<Priority, string> = {
  High: "border-[#ff8f70]/28 bg-[#ff8f70]/10 text-[#ffd1c4]",
  Medium: "border-[#ffe521]/24 bg-[#ffe521]/10 text-[#fff3a6]",
  Low: "border-[#6ee7b7]/24 bg-[#6ee7b7]/10 text-[#b8f7dd]",
};

export function ActionPlansExecutionCenter({
  actionPlan,
  error,
}: ActionPlansExecutionCenterProps) {
  const tasks = actionPlan?.tasks ?? [];
  const progress = computeActionPlanProgress(tasks);
  const nextTask = getNextActionableTask(tasks);

  return (
    <div className="space-y-6">
      <Card className="relative overflow-hidden rounded-[28px] border border-[#4f7ca7]/20 bg-[rgba(10,20,38,0.72)] shadow-[0_20px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#00D4FF]/55 to-transparent" />
        <CardHeader className="gap-5 md:flex-row md:items-start md:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center rounded-full border border-[#00D4FF]/20 bg-[#00D4FF]/[0.06] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#9cecff]">
              Founder execution center
            </div>
            <CardTitle className="text-2xl text-white md:text-3xl">
              Action Plans
            </CardTitle>
            <CardDescription className="mt-2 text-sm leading-6 text-[#c7d8ea]/72">
              Turn Mentor guidance, website diagnostics, and founder priorities
              into a focused queue of next moves.
            </CardDescription>
          </div>

          <div className="flex flex-wrap gap-2">
            <ActionButton href="/mentor?intent=action-plan" primary>
              <Sparkles className="h-4 w-4" />
              Generate plan
            </ActionButton>
            <ActionButton href="/mentor">
              <MessageSquare className="h-4 w-4" />
              AI Mentor
            </ActionButton>
            <ActionButton href="/site-strategist/website-coach">
              <Compass className="h-4 w-4" />
              Site Strategist
            </ActionButton>
          </div>
        </CardHeader>
      </Card>

      {error ? <ActionPlansErrorState message={error} /> : null}

      {!error && !actionPlan ? <ActionPlansEmptyState /> : null}

      {!error && actionPlan ? (
        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <PlanOverviewCard actionPlan={actionPlan} nextTask={nextTask} />
          <ProgressCard progress={progress} tasks={tasks} />
          <TaskQueueCard tasks={tasks} />
          <FirstPlanGuidanceCard hasTasks={tasks.length > 0} />
        </div>
      ) : null}
    </div>
  );
}

function PlanOverviewCard({
  actionPlan,
  nextTask,
}: {
  actionPlan: ActionPlan;
  nextTask: ActionPlanTask | null;
}) {
  const tasks = actionPlan.tasks;
  const objective = actionPlan.title?.trim() || "Founder execution plan";
  const priority = getPlanPriority(tasks);

  return (
    <ShellCard className="xl:col-span-2">
      <div className="grid gap-4 lg:grid-cols-5">
        <PlanSection
          icon={Target}
          label="Objective"
          value={objective}
          className="lg:col-span-2"
        />
        <PlanSection
          icon={Flag}
          label="Priority"
          value={priority}
          badgeClassName={priorityStyles[priority]}
        />
        <PlanSection
          icon={BarChart3}
          label="Estimated impact"
          value={getEstimatedImpact(tasks)}
        />
        <PlanSection
          icon={CalendarClock}
          label="Suggested timeline"
          value={getSuggestedTimeline(tasks)}
        />
      </div>

      <div className="mt-4 rounded-2xl border border-[#4f7ca7]/18 bg-[#07111f]/62 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8fb8d8]">
          Next step
        </p>
        <p className="mt-2 text-sm leading-6 text-white">
          {nextTask
            ? nextTask.title
            : "Review the plan with Mentor and choose the next execution checkpoint."}
        </p>
      </div>
    </ShellCard>
  );
}

function ProgressCard({
  progress,
  tasks,
}: {
  progress: { total: number; completed: number; percentage: number };
  tasks: ActionPlanTask[];
}) {
  const active = tasks.filter((task) => task.status === "in_progress").length;
  const blocked = tasks.filter((task) => task.status === "blocked").length;

  return (
    <ShellCard>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8fb8d8]">
            Progress
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            {progress.percentage}% complete
          </h2>
        </div>
        <Badge className="border-[#00D4FF]/24 bg-[#00D4FF]/10 text-[#9cecff]">
          {progress.completed}/{progress.total} done
        </Badge>
      </div>
      <Progress
        value={progress.percentage}
        className="mt-5 h-2 bg-[#07111f]/80 [&>div]:bg-[#00D4FF]"
      />
      <div className="mt-5 grid grid-cols-3 gap-3">
        <MetricTile label="Active" value={active} />
        <MetricTile label="Blocked" value={blocked} />
        <MetricTile label="Open" value={Math.max(progress.total - progress.completed, 0)} />
      </div>
    </ShellCard>
  );
}

function TaskQueueCard({ tasks }: { tasks: ActionPlanTask[] }) {
  return (
    <ShellCard className="xl:row-span-2">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8fb8d8]">
            Task queue
          </p>
          <h2 className="mt-2 text-xl font-semibold text-white">
            Execution tasks
          </h2>
        </div>
        <ListChecks className="h-5 w-5 text-[#00D4FF]" />
      </div>

      {tasks.length > 0 ? (
        <div className="mt-5 space-y-3">
          {tasks.map((task, index) => (
            <TaskCard key={task.id} task={task} index={index} total={tasks.length} />
          ))}
        </div>
      ) : (
        <div className="mt-5 rounded-2xl border border-dashed border-[#4f7ca7]/25 bg-[rgba(255,255,255,0.025)] p-5">
          <p className="text-sm font-semibold text-white">No tasks saved yet</p>
          <p className="mt-2 text-sm leading-6 text-[#c7d8ea]/72">
            Generate a plan from Mentor and Prospra will turn the recommended
            steps into a trackable queue here.
          </p>
        </div>
      )}
    </ShellCard>
  );
}

function FirstPlanGuidanceCard({ hasTasks }: { hasTasks: boolean }) {
  return (
    <ShellCard>
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8fb8d8]">
        First action plan guidance
      </p>
      <h2 className="mt-2 text-xl font-semibold text-white">
        Keep the plan narrow enough to finish.
      </h2>
      <div className="mt-4 space-y-3 text-sm leading-6 text-[#c7d8ea]/76">
        <p>
          Start with one founder objective, one measurable outcome, and the
          next few tasks that move the business forward this week.
        </p>
        <p>
          {hasTasks
            ? "Use the first open task as today's execution checkpoint, then update the plan from Mentor when the context changes."
            : "Ask Mentor for a focused plan tied to the decision, blocker, or growth lever that matters most right now."}
        </p>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <ActionButton href="/mentor?intent=action-plan" primary>
          <Sparkles className="h-4 w-4" />
          Generate an action plan
        </ActionButton>
        <ActionButton href="/site-strategist/website-coach">
          <Compass className="h-4 w-4" />
          Run Site Strategist
        </ActionButton>
      </div>
    </ShellCard>
  );
}

function TaskCard({
  task,
  index,
  total,
}: {
  task: ActionPlanTask;
  index: number;
  total: number;
}) {
  const priority = getTaskPriority(index, total, task.status);
  const StatusIcon = task.status === "completed" ? CheckCircle2 : CircleDashed;

  return (
    <div className="rounded-2xl border border-[#4f7ca7]/18 bg-[#07111f]/62 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <StatusIcon className="mt-0.5 h-4 w-4 shrink-0 text-[#00D4FF]" />
          <div>
            <p className="text-sm font-semibold leading-6 text-white">
              {task.title}
            </p>
            {task.notes ? (
              <p className="mt-1 text-xs leading-5 text-[#c7d8ea]/66">
                {task.notes}
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Badge className={priorityStyles[priority]}>{priority}</Badge>
          <Badge className={statusStyles[task.status]}>
            {statusLabels[task.status]}
          </Badge>
        </div>
      </div>
    </div>
  );
}

function ActionPlansEmptyState() {
  return (
    <ShellCard>
      <div className="grid gap-6 lg:grid-cols-[1fr_0.78fr] lg:items-center">
        <div>
          <div className="mb-4 inline-flex items-center rounded-full border border-[#ffe521]/20 bg-[#ffe521]/[0.06] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#fff3a6]">
            Ready for your first execution lane
          </div>
          <h2 className="text-2xl font-semibold tracking-tight text-white">
            No action plans yet
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[#c7d8ea]/76">
            Start in AI Mentor with one focused objective. Prospra will save the
            plan here as a practical queue with priorities, status labels, and
            the next step to take.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <ActionButton href="/mentor?intent=action-plan" primary>
              <Sparkles className="h-4 w-4" />
              Generate an action plan
            </ActionButton>
            <ActionButton href="/mentor">
              <MessageSquare className="h-4 w-4" />
              Go to AI Mentor
            </ActionButton>
            <ActionButton href="/site-strategist/website-coach">
              <Compass className="h-4 w-4" />
              Run Site Strategist
            </ActionButton>
          </div>
        </div>

        <div className="rounded-2xl border border-[#4f7ca7]/18 bg-[#07111f]/62 p-5">
          <p className="text-sm font-semibold text-white">
            Suggested first prompt
          </p>
          <p className="mt-3 text-sm leading-6 text-[#c7d8ea]/74">
            Help me turn my current founder priority into a 7-day action plan
            with the highest impact next steps, blockers to watch, and a clear
            first task for today.
          </p>
        </div>
      </div>
    </ShellCard>
  );
}

function ActionPlansErrorState({ message }: { message: string }) {
  return (
    <ShellCard>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex gap-3">
          <TriangleAlert className="mt-1 h-5 w-5 shrink-0 text-[#ffe521]" />
          <div>
            <p className="text-base font-semibold text-white">
              Action plans are unavailable
            </p>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#c7d8ea]/74">
              {message}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <ActionButton href="/dashboard/action-plans" primary>
            Retry
          </ActionButton>
          <ActionButton href="/mentor">
            <MessageSquare className="h-4 w-4" />
            AI Mentor
          </ActionButton>
        </div>
      </div>
    </ShellCard>
  );
}

function PlanSection({
  icon: Icon,
  label,
  value,
  badgeClassName,
  className = "",
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  badgeClassName?: string;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-[#4f7ca7]/18 bg-[#07111f]/62 p-4 ${className}`}>
      <div className="flex items-center gap-2 text-[#8fb8d8]">
        <Icon className="h-4 w-4" />
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em]">
          {label}
        </p>
      </div>
      {badgeClassName ? (
        <Badge className={`mt-3 ${badgeClassName}`}>{value}</Badge>
      ) : (
        <p className="mt-3 text-sm font-semibold leading-6 text-white">
          {value}
        </p>
      )}
    </div>
  );
}

function MetricTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-[#4f7ca7]/18 bg-[#07111f]/62 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8fb8d8]">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

function ShellCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card
      className={`relative overflow-hidden rounded-[28px] border border-[#4f7ca7]/20 bg-[rgba(10,20,38,0.72)] shadow-[0_20px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl ${className}`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#00D4FF]/55 to-transparent" />
      <CardContent className="p-5 md:p-6">{children}</CardContent>
    </Card>
  );
}

function ActionButton({
  href,
  children,
  primary = false,
}: {
  href: string;
  children: ReactNode;
  primary?: boolean;
}) {
  return (
    <Button
      asChild
      variant="outline"
      className={
        primary
          ? "h-10 rounded-full border-[#00D4FF]/25 bg-[#0f223d] px-4 text-sm font-semibold text-white shadow-[0_0_24px_rgba(0,212,255,0.12)] hover:border-[#00D4FF]/45 hover:bg-[#143055] hover:text-white"
          : "h-10 rounded-full border-white/10 bg-white/5 px-4 text-sm font-medium text-[#dce9f7] hover:bg-white/10 hover:text-white"
      }
    >
      <Link href={href}>
        {children}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </Button>
  );
}

function getPlanPriority(tasks: ActionPlanTask[]): Priority {
  if (tasks.some((task) => task.status === "blocked")) return "High";
  if (tasks.some((task) => task.status === "in_progress")) return "High";
  if (tasks.length >= 4) return "Medium";
  return "Low";
}

function getTaskPriority(
  index: number,
  total: number,
  status: ActionPlanTaskStatus
): Priority {
  if (status === "blocked" || status === "in_progress") return "High";
  if (index === 0 || total <= 3) return "High";
  if (index <= 3) return "Medium";
  return "Low";
}

function getEstimatedImpact(tasks: ActionPlanTask[]): string {
  if (tasks.some((task) => task.status === "blocked")) {
    return "High leverage once blocker is removed";
  }
  if (tasks.length >= 5) return "High founder momentum";
  if (tasks.length >= 2) return "Focused execution lift";
  return "Single next-move clarity";
}

function getSuggestedTimeline(tasks: ActionPlanTask[]): string {
  if (tasks.length >= 7) return "10-14 days";
  if (tasks.length >= 4) return "5-7 days";
  if (tasks.length >= 1) return "48-72 hours";
  return "Start today";
}
