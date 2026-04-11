import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardActionPlansPage() {
  return (
    <Card className="bg-brandNavy border-brandBlue/40">
      <CardHeader>
        <CardTitle className="text-brandBlueLight">Action Plans</CardTitle>
        <CardDescription className="text-brandBlueLight/70">
          Action plans will track priorities, deadlines, and accountability prompts.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-brandBlueLight/70">No action plans yet.</CardContent>
    </Card>
  );
}
