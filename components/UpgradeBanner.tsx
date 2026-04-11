"use client";

import { Sparkles, Crown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { getAnalyticsAnonymousId, trackClientEvent } from "@/lib/analytics/client";

export function UpgradeBanner() {
  const [usage, setUsage] = useState<any>(null);
  const trackedImpression = useRef(false);
  const remaining = usage?.remaining;
  const limit = usage?.limit;
  const shouldShow = !!usage && !usage.isPremium && (remaining <= 5 || remaining === 0);

  useEffect(() => {
    const load = async () => {
      const res = await fetch("/api/usage");
      const data = await res.json();
      setUsage(data);
    };
    load();
  }, []);

  useEffect(() => {
    if (!shouldShow || trackedImpression.current || remaining == null || limit == null) return;
    trackedImpression.current = true;
    trackClientEvent(ANALYTICS_EVENTS.UPGRADE_CTA_VIEWED, {
      anonymous_id: getAnalyticsAnonymousId(),
      source: "usage_banner",
      remaining,
      limit,
    });
  }, [shouldShow, remaining, limit]);

  if (!usage || usage.isPremium) {
    return null; // Premium users don't see the banner
  }

  if (!shouldShow) return null;

  return (
    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 rounded-xl shadow-md flex items-center gap-4 my-4 border border-indigo-400/40">
      <Crown className="h-6 w-6" />

      <div className="flex-1">
        <p className="font-semibold text-sm">
          {remaining === 0
            ? "You're out of mentor messages for this month!"
            : `Only ${remaining} mentor messages left this month!`}
        </p>
        <p className="text-xs opacity-90">
          Upgrade to Prospra Pro for unlimited mentoring + advanced business tools.
        </p>
      </div>

      <Link
        href="/upgrade"
        onClick={() =>
          trackClientEvent(ANALYTICS_EVENTS.UPGRADE_CTA_CLICKED, {
            anonymous_id: getAnalyticsAnonymousId(),
            source: "usage_banner",
            remaining,
            limit,
          })
        }
        className="px-4 py-2 text-sm font-bold bg-black/20 rounded-lg hover:bg-black/30 transition"
      >
        Upgrade
      </Link>

      <Sparkles className="h-5 w-5 opacity-80 animate-pulse" />
    </div>
  );
}
