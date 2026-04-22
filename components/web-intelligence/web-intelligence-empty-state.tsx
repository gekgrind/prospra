import { Activity, ArrowUpRight, Flag, Gauge, Radar } from "lucide-react";

import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InteractiveGlowCard } from "@/components/ui/interactive-glow";

export function WebIntelligenceEmptyState() {
  return (
    <InteractiveGlowCard className="relative rounded-[24px] border border-[#4f7ca7]/20 bg-[rgba(10,20,38,0.66)] shadow-[0_18px_48px_rgba(0,0,0,0.26)] backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#00D4FF]/55 to-transparent" />
      <CardHeader className="relative z-10 pb-3">
        <CardTitle className="text-lg font-semibold text-white">
          Latest intelligence
        </CardTitle>
      </CardHeader>
      <CardContent className="relative z-10 space-y-5 pt-0">
        <p className="max-w-3xl text-sm leading-6 text-[#c7d8ea]/76">
          Once you run an analysis, this command surface will show your live site
          snapshot, priority friction points, scoring trends, and next actions.
        </p>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { title: "Site snapshot", icon: Radar },
            { title: "Top issues", icon: Flag },
            { title: "Highest leverage fixes", icon: ArrowUpRight },
            { title: "Scores", icon: Gauge },
            { title: "Next actions", icon: Activity },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="rounded-xl border border-[#4f7ca7]/20 bg-[#07111f]/70 p-3"
              >
                <div className="mb-2 inline-flex rounded-lg border border-[#00D4FF]/25 bg-[#00D4FF]/10 p-2 text-[#9eefff]">
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <p className="text-xs font-medium text-[#d6e5f5]">{item.title}</p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </InteractiveGlowCard>
  );
}
