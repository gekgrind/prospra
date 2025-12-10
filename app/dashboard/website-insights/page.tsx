import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function WebsiteInsightsPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return <p>Not logged in.</p>;

  const { data: profile } = await supabase
    .from("profiles")
    .select("website_url, website_last_scored, website_scores")
    .eq("id", user.id)
    .maybeSingle();

  const scores = profile?.website_scores || {};
  const categories = [
    { key: "seo", label: "SEO Quality" },
    { key: "ux", label: "UX & Navigation" },
    { key: "clarity", label: "Offer Clarity" },
    { key: "cta", label: "Call-to-Action Strength" },
    { key: "trust", label: "Trust & Credibility" },
  ];

  async function rescore() {
    "use server";
    await fetch("/api/website/score", { method: "POST" });
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-brandBlueLight">
        Website Insights Dashboard
      </h1>

      <Card className="bg-brandNavy border border-brandBlue">
        <CardHeader>
          <CardTitle className="text-brandBlueLight text-xl">
            Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="text-brandBlueLight/80 space-y-2">
          <p><strong>URL:</strong> {profile?.website_url}</p>
          <p>
            <strong>Last Scored:</strong>{" "}
            {profile?.website_last_scored
              ? new Date(profile.website_last_scored).toLocaleString()
              : "Not yet scored"}
          </p>

          <form action={rescore}>
            <Button className="mt-4 bg-brandOrange text-white">
              Re-Score Website
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {categories.map(({ key, label }) => {
          const item = scores[key];

          return (
            <Card key={key} className="bg-brandNavy border border-brandBlue">
              <CardHeader>
                <CardTitle className="text-brandBlueLight text-lg">
                  {label}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-brandBlueLight/80 space-y-3">
                <div className="text-4xl font-bold">
                  {item?.score ?? "--"}/100
                </div>
                <p className="text-sm opacity-80">{item?.notes}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
