import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardResourcesPage() {
  return (
    <Card className="bg-brandNavy border-brandBlue/40">
      <CardHeader>
        <CardTitle className="text-brandBlueLight">Resources</CardTitle>
        <CardDescription className="text-brandBlueLight/70">
          Founder playbooks, templates, and recommended tools will be organized here.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-brandBlueLight/70">No recommended resources yet.</CardContent>
    </Card>
  );
}
