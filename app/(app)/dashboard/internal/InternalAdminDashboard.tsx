"use client";

import { useMemo, useState } from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { AdminDashboardMetrics, AdminTimeWindow } from "@/lib/admin/metrics";

type Props = {
  initialMetrics: AdminDashboardMetrics;
};

function MetricCard({ label, value, helper }: { label: string; value: string | number; helper?: string }) {
  return (
    <Card className="bg-brandNavy border-brandBlue/40">
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl">{value}</CardTitle>
      </CardHeader>
      {helper ? (
        <CardContent className="pt-0 text-xs text-brandBlueLight/70">{helper}</CardContent>
      ) : null}
    </Card>
  );
}

function FunnelCard({ title, steps }: { title: string; steps: Array<{ label: string; value: number }> }) {
  const start = steps[0]?.value ?? 0;

  return (
    <Card className="bg-brandNavy border-brandBlue/40">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {steps.map((step, idx) => {
          const drop = idx === 0 ? 0 : Math.max(0, (steps[idx - 1]?.value ?? 0) - step.value);
          const ratio = start ? Math.round((step.value / start) * 100) : 0;
          return (
            <div key={`${title}-${step.label}`} className="rounded-md border border-brandBlue/30 p-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-brandBlueLight">{step.label}</span>
                <span className="text-sm font-semibold text-white">{step.value.toLocaleString()}</span>
              </div>
              <div className="mt-1 text-xs text-brandBlueLight/70">
                {idx === 0 ? `${ratio}% baseline` : `${ratio}% of first step · drop-off ${drop.toLocaleString()}`}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function StatList({
  title,
  items,
}: {
  title: string;
  items: Array<{ label: string; value: string | number }>;
}) {
  return (
    <Card className="bg-brandNavy border-brandBlue/40">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((item) => (
          <div key={`${title}-${item.label}`} className="flex items-center justify-between text-sm">
            <span className="text-brandBlueLight">{item.label}</span>
            <span className="font-medium text-white">{item.value}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function InternalAdminDashboard({ initialMetrics }: Props) {
  const [window, setWindow] = useState<AdminTimeWindow>(initialMetrics.window);
  const [metrics, setMetrics] = useState<AdminDashboardMetrics>(initialMetrics);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = async (nextWindow: AdminTimeWindow) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/internal/admin/metrics?window=${nextWindow}`, {
        method: "GET",
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error(`Unable to load metrics (${res.status})`);
      }

      const data = (await res.json()) as AdminDashboardMetrics;
      setMetrics(data);
      setWindow(nextWindow);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to load metrics");
    } finally {
      setLoading(false);
    }
  };

  const upgradeRateLabel = `${metrics.totals.upgradeConversionRate}%`;

  const engagementItems = useMemo(
    () => [
      { label: "Mentor conversations started", value: metrics.engagement.mentorConversationsStarted.toLocaleString() },
      { label: "Mentor messages sent", value: metrics.engagement.mentorMessagesSent.toLocaleString() },
      { label: "Returning users", value: metrics.engagement.returningUsers.toLocaleString() },
      { label: "Resumed conversations", value: metrics.engagement.resumedConversations.toLocaleString() },
      { label: "Weekly review signals", value: metrics.engagement.weeklyReviewSignals.toLocaleString() },
      { label: "Board review signals", value: metrics.engagement.boardReviewSignals.toLocaleString() },
    ],
    [metrics.engagement]
  );

  const executionItems = useMemo(
    () => [
      { label: "Action plan signals", value: metrics.execution.actionPlanSignals.toLocaleString() },
      { label: "Plans with task started signals", value: metrics.execution.plansWithTaskStartedSignals.toLocaleString() },
      { label: "Plans with task completed signals", value: metrics.execution.plansWithTaskCompletedSignals.toLocaleString() },
      { label: "Blocked task signals", value: metrics.execution.blockedTaskSignals.toLocaleString() },
    ],
    [metrics.execution]
  );

  const monetizationItems = useMemo(
    () => [
      { label: "Free users", value: metrics.monetization.freeUsers.toLocaleString() },
      { label: "Paid users", value: metrics.monetization.paidUsers.toLocaleString() },
      { label: "Trialing users", value: metrics.monetization.trialingUsers.toLocaleString() },
      { label: "Users hitting free limits", value: metrics.monetization.limitHitUsers.toLocaleString() },
      { label: "Upgrades", value: metrics.monetization.upgrades.toLocaleString() },
    ],
    [metrics.monetization]
  );

  const frictionItems = useMemo(
    () => [
      { label: "Limit-hit rate", value: `${metrics.friction.limitHitRate}%` },
      { label: "Empty conversations", value: metrics.friction.emptyConversations.toLocaleString() },
      { label: "Stalled conversations", value: metrics.friction.stalledConversations.toLocaleString() },
    ],
    [metrics.friction]
  );

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white">Internal Product Health</h1>
          <p className="text-sm text-brandBlueLight/70">
            Internal admin cockpit for product health, activation, execution, and monetization.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={window} onValueChange={(value) => refresh(value as AdminTimeWindow)}>
            <SelectTrigger className="w-[140px] bg-brandNavy border-brandBlue/50">
              <SelectValue placeholder="Window" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => refresh(window)} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      </div>

      {error ? (
        <Card className="bg-brandNavy border-red-500/40">
          <CardContent className="py-4 text-sm text-red-200">{error}</CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total signups" value={metrics.totals.totalSignups.toLocaleString()} />
        <MetricCard label="Onboarding completion" value={`${metrics.totals.onboardingCompletionRate}%`} />
        <MetricCard label="Activated users" value={metrics.totals.activatedUsers.toLocaleString()} helper="Users who reached mentor at least once" />
        <MetricCard label="Active paid subscriptions" value={metrics.totals.activePaidSubscriptions.toLocaleString()} helper={`Upgrade conversion ${upgradeRateLabel}`} />
        <MetricCard label="Action plan signals" value={metrics.totals.actionPlanSignals.toLocaleString()} />
        <MetricCard label="Task completion signals" value={metrics.totals.taskCompletionSignals.toLocaleString()} />
        <MetricCard label="Board review signals" value={metrics.totals.boardReviewSignals.toLocaleString()} />
        <MetricCard label="Upgrade conversion" value={upgradeRateLabel} />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <FunnelCard title="Signup → Onboarding → Mentor" steps={metrics.funnels.onboardingToMentor} />
        <FunnelCard title="Mentor → Action plan → Task completion" steps={metrics.funnels.mentorToExecution} />
        <FunnelCard title="Limit hit → Upgrade" steps={metrics.funnels.limitToUpgrade} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="bg-brandNavy border-brandBlue/40">
          <CardHeader>
            <CardTitle className="text-base">Trend snapshot</CardTitle>
            <CardDescription>Signups, mentor usage, and paid user direction.</CardDescription>
          </CardHeader>
          <CardContent className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics.trends}>
                <XAxis dataKey="label" stroke="#9ec6ff" fontSize={12} />
                <YAxis stroke="#9ec6ff" fontSize={12} />
                <Tooltip />
                <Line type="monotone" dataKey="signups" stroke="#60a5fa" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="mentorMessages" stroke="#f59e0b" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="paidUsers" stroke="#34d399" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-brandNavy border-brandBlue/40">
          <CardHeader>
            <CardTitle className="text-base">Sparse-data behavior</CardTitle>
            <CardDescription>
              If data is light, these metrics remain visible with explicit zero values for operator clarity.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-brandBlueLight">
            <p>• Metrics and funnels render even when counts are zero.</p>
            <p>• Internal view intentionally avoids exposing raw user message content.</p>
            <p>• Action and review metrics currently use keyword signals from user-authored mentor messages.</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-4">
        <StatList title="Engagement" items={engagementItems} />
        <StatList title="Execution" items={executionItems} />
        <StatList title="Monetization" items={monetizationItems} />
        <StatList title="Friction" items={frictionItems} />
      </div>
    </section>
  );
}
