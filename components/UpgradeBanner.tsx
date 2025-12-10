"use client";

import { Sparkles, Crown } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";

export function UpgradeBanner() {
  const [usage, setUsage] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      const res = await fetch("/api/usage");
      const data = await res.json();
      setUsage(data);
    };
    load();
  }, []);

  if (!usage || usage.isPremium) {
    return null; // Premium users don't see the banner
  }

  const { remaining, limit } = usage;

  const shouldShow =
    remaining <= 5 || // Less than 5 messages left today
    remaining === 0;  // Out of messages already

  if (!shouldShow) return null;

  return (
    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 rounded-xl shadow-md flex items-center gap-4 my-4 border border-indigo-400/40">
      <Crown className="h-6 w-6" />

      <div className="flex-1">
        <p className="font-semibold text-sm">
          {remaining === 0
            ? "You're out of messages for today!"
            : `Only ${remaining} messages left today!`}
        </p>
        <p className="text-xs opacity-90">
          Upgrade to Prospra Pro for unlimited mentoring + advanced business tools.
        </p>
      </div>

      <Link
        href="/upgrade"
        className="px-4 py-2 text-sm font-bold bg-black/20 rounded-lg hover:bg-black/30 transition"
      >
        Upgrade
      </Link>

      <Sparkles className="h-5 w-5 opacity-80 animate-pulse" />
    </div>
  );
}
