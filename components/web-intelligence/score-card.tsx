import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ScoreCardProps = {
  label: string;
  score: number | null | undefined;
};

function scoreLabel(score: number | null | undefined): string {
  if (typeof score !== "number") return "No score yet";
  if (score >= 80) return "Strong";
  if (score >= 60) return "Mixed";
  return "Needs work";
}

export function ScoreCard({ label, score }: ScoreCardProps) {
  const safeScore = typeof score === "number" ? Math.max(0, Math.min(100, score)) : null;

  return (
    <Card className="bg-brandNavy border-brandBlue/40">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-brandBlueLight/80">{label}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <p className="text-3xl font-semibold text-brandBlueLight">{safeScore ?? "--"}</p>
          <p className="text-xs uppercase tracking-[0.2em] text-brandBlueLight/60">{scoreLabel(safeScore)}</p>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-brandBlue/15">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-500/80 to-blue-500/80"
            style={{ width: `${safeScore ?? 0}%` }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
