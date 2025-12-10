// app/dashboard/website-coach/page.tsx

import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Globe,
  Sparkles,
  Target,
  Route,
  FileText,
  ArrowRight,
} from "lucide-react";

export default async function WebsiteCoachPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-brandBlueLight">
          Website Coach
        </h1>
        <p className="text-brandBlueLight/70">
          You need to be logged in to use Website Coach.
        </p>
        <Link href="/auth/login">
          <Button className="bg-brandBlue text-white hover:bg-brandBlue/80">
            Go to login
          </Button>
        </Link>
      </div>
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "website_url, website_last_scanned, website_data"
    )
    .eq("id", user.id)
    .maybeSingle();

  const websiteUrl = profile?.website_url ?? "";
  const lastScanned = profile?.website_last_scanned
    ? new Date(profile.website_last_scanned).toLocaleString()
    : null;

  const hasWebsite = !!websiteUrl;

  const presetLink = (prompt: string) =>
    `/mentor?mode=website-coach&prompt=${encodeURIComponent(prompt)}`;

  return (
    <div className="space-y-10">
      {/* Header */}
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.2em] text-brandBlueLight/60">
          Prospra · Website Coach Mode
        </p>
        <h1 className="text-3xl font-bold text-brandBlueLight">
          Turn your website into a growth engine 🚀
        </h1>
        <p className="max-w-2xl text-sm text-brandBlueLight/70">
          Website Coach uses your live site content + Prospra&apos;s brain to
          review your homepage, offers, funnels, and copy—and gives you
          step-by-step upgrades instead of vague advice.
        </p>
      </header>

      {/* Website status + quick actions */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <Card className="bg-brandNavy border border-brandBlue/70 shadow-xl rounded-2xl">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="text-brandBlueLight text-lg flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Website Status
                </CardTitle>
                <CardDescription className="text-brandBlueLight/70">
                  Connected site & scan freshness
                </CardDescription>
              </div>
              <Link href="/dashboard/website-insights">
                <Button
                  variant="outline"
                  className="border-brandBlue/60 bg-transparent text-brandBlueLight hover:bg-brandBlue/20 hover:text-brandBlueLight"
                >
                  View Insights
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-brandBlueLight/80">
            {hasWebsite ? (
              <>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-brandBlueLight/60">
                    Connected URL
                  </p>
                  <p className="mt-1 truncate font-medium text-brandBlueLight">
                    {websiteUrl}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-brandBlueLight/60">
                    Last Scanned
                  </p>
                  <p className="mt-1">
                    {lastScanned ?? "Not scanned yet"}
                  </p>
                </div>
                <p className="mt-2 text-xs text-brandBlueLight/65">
                  Tip: If you&apos;ve made big changes recently, go to your
                  dashboard and hit &quot;Re-Scan Website&quot; before a deep
                  coaching session.
                </p>
              </>
            ) : (
              <>
                <p className="text-brandBlueLight/80">
                  You haven&apos;t connected a website yet. Add your site
                  during onboarding or in your profile settings to unlock full
                  Website Coach powers.
                </p>
                <div className="flex flex-wrap gap-3 mt-2">
                  <Link href="/onboarding/step-3">
                    <Button className="bg-brandBlue text-white hover:bg-brandBlue/80">
                      Add Website
                    </Button>
                  </Link>
                  <Link href="/dashboard">
                    <Button
                      variant="outline"
                      className="border-brandBlue/60 text-brandBlueLight hover:bg-brandBlue/20 hover:text-brandBlueLight"
                    >
                      Go to Dashboard
                    </Button>
                  </Link>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Coach Mode Explainer */}
        <Card className="bg-gradient-to-br from-brandNavy via-brandNavy/80 to-purple-900/40 border border-brandBlue/70 shadow-xl rounded-2xl">
          <CardHeader>
            <CardTitle className="text-brandBlueLight text-lg flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              How Website Coach Works
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-brandBlueLight/80">
            <p>
              When you use Website Coach, Prospra pulls in your website
              content, embeddings, and scoring signals to give you feedback
              that&apos;s grounded in your actual pages—not generic templates.
            </p>
            <ul className="list-disc list-inside space-y-1 text-brandBlueLight/80">
              <li>Understands your offers, messaging, & audience.</li>
              <li>Spotlights friction in your funnel & layout.</li>
              <li>Suggests copy tweaks that fit your current brand.</li>
              <li>Helps you prioritize changes that move the needle.</li>
            </ul>
            <p className="text-xs text-brandBlueLight/60">
              Pro tip: arrive with 1–2 specific goals (e.g. &quot;increase
              homepage conversions&quot; or &quot;clarify my main offer&quot;)
              for sharper guidance.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Coaching presets */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-brandBlueLight">
              Start a Website Coaching Session
            </h2>
            <p className="text-sm text-brandBlueLight/70">
              Pick a focus area and jump into a Prospra mentor session tuned
              for your website.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {/* Homepage Audit */}
          <Card className="bg-brandNavy border border-brandBlue/60 rounded-2xl flex flex-col">
            <CardHeader>
              <CardTitle className="text-brandBlueLight text-base flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Homepage Audit
              </CardTitle>
              <CardDescription className="text-brandBlueLight/70">
                Check clarity, above-the-fold messaging, and first-impression
                strength.
              </CardDescription>
            </CardHeader>
            <CardContent className="mt-auto flex flex-col gap-2">
              <p className="text-xs text-brandBlueLight/70">
                Great if you&apos;re not sure what visitors see or understand
                in the first 5 seconds.
              </p>
              <Link
                href={presetLink(
                  "Act as my Website Coach. Audit my homepage for clarity, value proposition, and first impression. Tell me what a new visitor likely understands, what they might miss, and what I should change first."
                )}
              >
                <Button className="w-full bg-brandBlue text-white hover:bg-brandBlue/80">
                  Start Homepage Audit
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Offer Clarity */}
          <Card className="bg-brandNavy border border-brandBlue/60 rounded-2xl flex flex-col">
            <CardHeader>
              <CardTitle className="text-brandBlueLight text-base flex items-center gap-2">
                <Target className="h-4 w-4" />
                Offer Clarity Check
              </CardTitle>
              <CardDescription className="text-brandBlueLight/70">
                Make sure your core offer is obvious, believable, and compelling.
              </CardDescription>
            </CardHeader>
            <CardContent className="mt-auto flex flex-col gap-2">
              <p className="text-xs text-brandBlueLight/70">
                Perfect if people keep asking &quot;So what do you actually
                do?&quot; or bounce quickly.
              </p>
              <Link
                href={presetLink(
                  "Act as my Website Coach. Review my site and diagnose how clear my core offer is. Explain what my offer currently sounds like, who it seems to be for, and how I can make it more specific and compelling."
                )}
              >
                <Button className="w-full bg-brandBlue text-white hover:bg-brandBlue/80">
                  Improve Offer Clarity
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Funnel Mapping */}
          <Card className="bg-brandNavy border border-brandBlue/60 rounded-2xl flex flex-col">
            <CardHeader>
              <CardTitle className="text-brandBlueLight text-base flex items-center gap-2">
                <Route className="h-4 w-4" />
                Funnel Mapping
              </CardTitle>
              <CardDescription className="text-brandBlueLight/70">
                Map the journey from landing on your site to becoming a client.
              </CardDescription>
            </CardHeader>
            <CardContent className="mt-auto flex flex-col gap-2">
              <p className="text-xs text-brandBlueLight/70">
                Use this when you want a clear, step-by-step path through your
                pages and CTAs.
              </p>
              <Link
                href={presetLink(
                  "Act as my Website Coach. Analyze my website and map out the funnel from first visit to becoming a customer. Show me the current path, where drop-offs are likely, and how to simplify or strengthen it."
                )}
              >
                <Button className="w-full bg-brandBlue text-white hover:bg-brandBlue/80">
                  Map My Funnel
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* CTA & Copy Tone */}
          <Card className="bg-brandNavy border border-brandBlue/60 rounded-2xl flex flex-col">
            <CardHeader>
              <CardTitle className="text-brandBlueLight text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                CTAs & Copy Tone
              </CardTitle>
              <CardDescription className="text-brandBlueLight/70">
                Tune your calls-to-action and overall voice for conversions.
              </CardDescription>
            </CardHeader>
            <CardContent className="mt-auto flex flex-col gap-2">
              <p className="text-xs text-brandBlueLight/70">
                Great when you feel your copy is &quot;okay&quot; but not yet
                persuasive or aligned with your vibe.
              </p>
              <Link
                href={presetLink(
                  "Act as my Website Coach. Review my CTAs and overall copy tone. Tell me how my site currently sounds, how it might land with my ideal audience, and give me 3–5 upgraded CTA examples that fit my brand."
                )}
              >
                <Button className="w-full bg-brandBlue text-white hover:bg-brandBlue/80">
                  Improve CTAs & Tone
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* SEO & Discoverability */}
          <Card className="bg-brandNavy border border-brandBlue/60 rounded-2xl flex flex-col">
            <CardHeader>
              <CardTitle className="text-brandBlueLight text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                SEO & Discoverability
              </CardTitle>
              <CardDescription className="text-brandBlueLight/70">
                Spot easy wins for organic visibility and search intent.
              </CardDescription>
            </CardHeader>
            <CardContent className="mt-auto flex flex-col gap-2">
              <p className="text-xs text-brandBlueLight/70">
                Use this if you&apos;re not sure what keywords you&apos;re
                signaling or how search-friendly your pages are.
              </p>
              <Link
                href={presetLink(
                  "Act as my Website Coach and SEO-aware strategist. Based on my site, what search intent am I currently aligned with, what keywords or topics am I signaling, and what small changes could improve discoverability?"
                )}
              >
                <Button className="w-full bg-brandBlue text-white hover:bg-brandBlue/80">
                  Explore SEO Opportunities
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Custom Session */}
          <Card className="bg-brandNavy border border-brandBlue/60 rounded-2xl flex flex-col">
            <CardHeader>
              <CardTitle className="text-brandBlueLight text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Custom Website Session
              </CardTitle>
              <CardDescription className="text-brandBlueLight/70">
                Bring your own question, challenge, or idea.
              </CardDescription>
            </CardHeader>
            <CardContent className="mt-auto flex flex-col gap-2">
              <p className="text-xs text-brandBlueLight/70">
                Perfect when you have something specific in mind—like a new
                offer, rebrand, or page you&apos;re planning.
              </p>
              <Link
                href={presetLink(
                  "Act as my Website Coach. I have a custom question about my website strategy and pages. Ask me 3–5 clarifying questions, then give me a tailored plan based on my answers and my existing site."
                )}
              >
                <Button className="w-full bg-brandBlue text-white hover:bg-brandBlue/80">
                  Start Custom Session
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
