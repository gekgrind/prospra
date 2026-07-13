import { createClient } from "@/lib/supabase/server";
import { getLatestWebsiteIntelligence } from "@/lib/web-intelligence/get-latest-website-intelligence";
import WebIntelligencePageClient from "./WebIntelligencePageClient";

export default async function WebIntelligencePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const initialSnapshot = user
    ? await getLatestWebsiteIntelligence(user.id)
    : null;

  return <WebIntelligencePageClient initialSnapshot={initialSnapshot} />;
}
