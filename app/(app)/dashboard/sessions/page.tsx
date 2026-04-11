import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardSessionsPage() {
  return (
    <Card className="bg-brandNavy border-brandBlue/40">
      <CardHeader>
        <CardTitle className="text-brandBlueLight">Sessions</CardTitle>
        <CardDescription className="text-brandBlueLight/70">
          This is where your conversation timeline and session summaries will appear.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-brandBlueLight/70">No sessions available yet.</CardContent>
    </Card>
  );
}
