import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type IssuesListProps = {
  issues: string[];
};

export function IssuesList({ issues }: IssuesListProps) {
  return (
    <Card className="bg-brandNavy border-brandBlue/40">
      <CardHeader>
        <CardTitle className="text-base text-brandBlueLight">Key issues</CardTitle>
      </CardHeader>
      <CardContent>
        {issues.length === 0 ? (
          <p className="text-sm text-brandBlueLight/70">No major issues detected in this first-pass scan.</p>
        ) : (
          <ul className="space-y-2 text-sm text-brandBlueLight/80">
            {issues.map((issue, index) => (
              <li key={`${issue}-${index}`} className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-cyan-400" />
                <span>{issue}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
