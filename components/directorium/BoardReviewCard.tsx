"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { DIRECTORIUM_ROLES } from "@/lib/directorium/roles";
import type { BoardReviewOutput } from "@/lib/directorium/board-review";

export function parseBoardReviewFromMessage(content: string): BoardReviewOutput | null {
  const match = content.match(/```board-review([\s\S]*?)```/i);
  if (!match) return null;

  try {
    const parsed = JSON.parse(match[1].trim());
    if (!parsed || typeof parsed !== "object") return null;
    if (!Array.isArray(parsed.roles) || typeof parsed.synthesis !== "string") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function BoardReviewCard({
  boardReview,
  onUseForActionPlan,
}: {
  boardReview: BoardReviewOutput;
  onUseForActionPlan: (prompt: string) => void;
}) {
  const actionPlanPrompt = [
    "Use this Directorium Board Review to create a 14-day action plan.",
    `Synthesis: ${boardReview.synthesis}`,
    ...boardReview.roles.map(
      (role) => `${role.roleName}: ${(role.recommendations || []).join("; ")}`
    ),
  ].join("\n");

  return (
    <Card className="bg-brandNavyDark border border-brandBlue text-brandBlueLight rounded-2xl p-4 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-brandOrangeLight" />
          <h3 className="text-sm font-semibold">Directorium Board Review</h3>
        </div>
        <Button
          type="button"
          onClick={() => onUseForActionPlan(actionPlanPrompt)}
          className="bg-brandOrange hover:bg-brandOrangeLight text-white rounded-lg px-3 py-1 h-auto text-xs"
        >
          Build Action Plan
        </Button>
      </div>

      <p className="text-sm text-brandBlueLight/90 leading-relaxed">{boardReview.synthesis}</p>

      <div className="space-y-3">
        {DIRECTORIUM_ROLES.map((role) => {
          const roleOutput = boardReview.roles.find((item) => item.roleId === role.id);
          if (!roleOutput) return null;

          return (
            <div key={role.id} className="rounded-xl border border-brandBlue/50 bg-brandNavy p-3 space-y-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-brandOrangeLight">{role.displayName}</p>
                <p className="text-xs text-brandBlueLight/70">{role.description}</p>
              </div>
              <p className="text-sm text-brandBlueLight/90">{roleOutput.analysis}</p>
              {roleOutput.recommendations.length > 0 && (
                <ul className="list-disc pl-5 text-xs text-brandBlueLight/80 space-y-1">
                  {roleOutput.recommendations.map((rec, index) => (
                    <li key={`${role.id}-${index}`}>{rec}</li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
