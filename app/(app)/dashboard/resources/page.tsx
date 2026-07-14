import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const dynamic = "force-dynamic";

type ResourceRow = {
  id: string;
  url: string;
  title: string | null;
  summary: string | null;
  updated_at: string | null;
};

async function loadResources(): Promise<
  | { resources: ResourceRow[]; error: null }
  | { resources: null; error: string }
> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { resources: null, error: "Sign in again to view resources." };
    }

    const { data, error } = await supabase
      .from("resource_documents")
      .select("id, url, title, summary, updated_at")
      .order("updated_at", { ascending: false })
      .limit(30);

    if (error) {
      throw error;
    }

    return { resources: (data ?? []) as ResourceRow[], error: null };
  } catch (error) {
    console.error("[RESOURCES_PAGE_LOAD_ERROR]", error);
    return {
      resources: null,
      error: "Prospra could not load resources. Retry the page shortly.",
    };
  }
}

function hostnameFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export default async function DashboardResourcesPage() {
  const { resources, error } = await loadResources();

  return (
    <div className="space-y-6">
      <Card className="bg-brandNavy border-brandBlue/40">
        <CardHeader>
          <CardTitle className="text-brandBlueLight">Resources</CardTitle>
          <CardDescription className="text-brandBlueLight/70">
            Curated founder resources from trusted sources (SBA, SCORE, Y
            Combinator, IRS), summarized and kept in sync automatically.
          </CardDescription>
        </CardHeader>
        {error ? (
          <CardContent className="text-sm text-red-400">{error}</CardContent>
        ) : resources && resources.length === 0 ? (
          <CardContent className="text-sm text-brandBlueLight/70">
            No recommended resources yet. The resource library syncs in the
            background — check back soon.
          </CardContent>
        ) : null}
      </Card>

      {resources && resources.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {resources.map((resource) => (
            <a
              key={resource.id}
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Card className="h-full bg-brandNavy border-brandBlue/40 transition-colors hover:border-brandBlue/70">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-brandBlueLight">
                    {resource.title || hostnameFromUrl(resource.url)}
                  </CardTitle>
                  <CardDescription className="text-xs text-brandBlueLight/60">
                    {hostnameFromUrl(resource.url)}
                  </CardDescription>
                </CardHeader>
                {resource.summary ? (
                  <CardContent className="pt-0 text-sm leading-6 text-brandBlueLight/80">
                    {resource.summary.length > 280
                      ? `${resource.summary.slice(0, 280)}…`
                      : resource.summary}
                  </CardContent>
                ) : null}
              </Card>
            </a>
          ))}
        </div>
      ) : null}
    </div>
  );
}
