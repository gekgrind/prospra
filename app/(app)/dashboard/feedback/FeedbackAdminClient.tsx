"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FEEDBACK_STATUSES, FEEDBACK_TYPES, type FeedbackStatus, type FeedbackType } from "@/lib/feedback";
import type { FeedbackAdminItem } from "./types";

const feedbackTypeLabels: Record<FeedbackType, string> = {
  bug: "Bug",
  feature_request: "Feature request",
  general_feedback: "General feedback",
};

export default function FeedbackAdminClient({
  initialItems,
}: {
  initialItems: FeedbackAdminItem[];
}) {
  const [items, setItems] = useState(initialItems);
  const [filterType, setFilterType] = useState<"all" | FeedbackType>("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const filteredItems = useMemo(() => {
    if (filterType === "all") return items;
    return items.filter((item) => item.feedback_type === filterType);
  }, [items, filterType]);

  const reload = async (type: "all" | FeedbackType) => {
    setLoading(true);
    setError(null);

    try {
      const query = type === "all" ? "" : `?type=${type}`;
      const response = await fetch(`/api/feedback${query}`);
      const payload = await response.json();

      if (!response.ok) {
        setError(payload?.error || "Could not load feedback items.");
        return;
      }

      setItems(payload.items ?? []);
    } catch (loadError) {
      console.error(loadError);
      setError("Network error while loading feedback.");
    } finally {
      setLoading(false);
    }
  };

  const onFilterChange = async (value: "all" | FeedbackType) => {
    setFilterType(value);
    await reload(value);
  };

  const updateStatus = async (id: string, status: FeedbackStatus) => {
    setSavingId(id);
    setError(null);

    try {
      const response = await fetch(`/api/feedback/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const payload = await response.json();
      if (!response.ok) {
        setError(payload?.error || "Could not update status.");
        return;
      }

      setItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                status,
                updated_at: new Date().toISOString(),
              }
            : item
        )
      );
    } catch (updateError) {
      console.error(updateError);
      setError("Network error while updating status.");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader>
        <CardTitle>Feedback triage</CardTitle>
        <CardDescription>Review and prioritize user feedback.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <select
            value={filterType}
            onChange={(event) => onFilterChange(event.target.value as "all" | FeedbackType)}
            className="h-10 rounded-md border border-slate-700 bg-slate-950 px-3 text-sm"
          >
            <option value="all">All types</option>
            {FEEDBACK_TYPES.map((type) => (
              <option key={type} value={type}>
                {feedbackTypeLabels[type]}
              </option>
            ))}
          </select>
          <Button type="button" variant="outline" onClick={() => reload(filterType)} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </Button>
        </div>

        {error ? <p className="text-sm text-red-300">{error}</p> : null}

        <div className="space-y-3">
          {filteredItems.map((item) => (
            <div key={item.id} className="rounded-lg border border-slate-800 bg-slate-950/60 p-4 space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                <span>{feedbackTypeLabels[item.feedback_type]}</span>
                <span>•</span>
                <span>{new Date(item.created_at).toLocaleString()}</span>
                {item.context?.route ? (
                  <>
                    <span>•</span>
                    <span>{String(item.context.route)}</span>
                  </>
                ) : null}
                {item.context?.feature_area ? (
                  <>
                    <span>•</span>
                    <span>{String(item.context.feature_area)}</span>
                  </>
                ) : null}
              </div>

              <p className="text-sm text-slate-100 whitespace-pre-wrap">{item.message}</p>

              <div className="flex items-center gap-2">
                <label htmlFor={`status-${item.id}`} className="text-xs text-slate-400">
                  Status
                </label>
                <select
                  id={`status-${item.id}`}
                  value={item.status}
                  onChange={(event) => updateStatus(item.id, event.target.value as FeedbackStatus)}
                  className="h-9 rounded-md border border-slate-700 bg-slate-950 px-2 text-sm"
                  disabled={savingId === item.id}
                >
                  {FEEDBACK_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}

          {filteredItems.length === 0 ? (
            <p className="text-sm text-slate-400">No feedback found for this filter.</p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
