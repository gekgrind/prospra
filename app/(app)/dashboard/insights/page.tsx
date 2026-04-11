import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardInsightsPage() {
  return (
    <Card className="bg-brandNavy border-brandBlue/40">
      <CardHeader>
        <CardTitle className="text-brandBlueLight">Insights</CardTitle>
        <CardDescription className="text-brandBlueLight/70">
          Insights will combine growth signals, execution patterns, and recommendation quality.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-brandBlueLight/70">No insight data yet. Complete a session to start generating trends.</CardContent>
    </Card>
  );
}
