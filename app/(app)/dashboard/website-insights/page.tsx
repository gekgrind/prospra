import { createClient } from "@/lib/supabase/server";
import { getLatestWebsiteIntelligence } from "@/lib/web-intelligence/get-latest-website-intelligence";
import { WebIntelligenceClient } from "@/components/web-intelligence/web-intelligence-client";

export default async function WebsiteInsightsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <p className="text-brandBlueLight/70">Not logged in.</p>;
  }

  const latestSnapshot = await getLatestWebsiteIntelligence(user.id);

  return <WebIntelligenceClient initialSnapshot={latestSnapshot} />;
}
