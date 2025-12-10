"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

interface UsageData {
  used: number;
  limit: number;
  isPremium: boolean;
}

export function UsageBar({
  onUsageUpdate,
}: {
  onUsageUpdate?: (data: UsageData & { remaining: number; limitReached: boolean }) => void;
}) {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCredits = async () => {
    try {
      const res = await fetch("/api/credits");
      if (!res.ok) throw new Error(`Credits fetch failed: ${res.status}`);

      const data = await res.json();
      setUsage(data);

      if (onUsageUpdate && data) {
        const remaining = Math.max(0, data.limit - data.used);
        const limitReached = remaining <= 0 && !data.isPremium;

        onUsageUpdate({
          ...data,
          remaining,
          limitReached,
        });
      }
    } catch (err) {
      console.error("UsageBar fetch error:", err);
      setUsage(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCredits();

    const interval = setInterval(fetchCredits, 20000); // refresh every 20s
    return () => clearInterval(interval);
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="w-full h-6 bg-brandNavyDark border border-brandBlue/40 rounded-lg flex items-center justify-center">
        <Loader2 className="h-4 w-4 text-brandBlueLight animate-spin" />
      </div>
    );
  }

  if (!usage) {
    return (
      <div className="w-full py-2 text-center text-brandBlueLight/60 bg-brandNavyDark border border-brandBlue/40 rounded-lg">
        Usage unavailable
      </div>
    );
  }

  // Premium unlimited bar
  if (usage.isPremium) {
    return (
      <div className="w-full py-2 text-center text-brandBlueLight bg-brandNavyDark border border-brandBlue/40 rounded-lg">
        Unlimited messages — You’re Pro ⭐
      </div>
    );
  }

  // Free user usage bar
  const remaining = Math.max(0, usage.limit - usage.used);
  const percent = Math.min(100, (usage.used / usage.limit) * 100);
  const limitReached = remaining <= 0;

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-brandBlueLight/70 px-1">
        <span>
          {limitReached ? "No messages left today" : `${remaining} messages left today`}
        </span>
        <span>
          {usage.used}/{usage.limit}
        </span>
      </div>

      <div className="w-full h-3 bg-brandNavyDark border border-brandBlue/40 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 
            ${limitReached
              ? "bg-brandOrange"
              : "bg-gradient-to-r from-brandBlue to-brandBlueLight"
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>

      {limitReached && (
        <p className="text-xs text-brandOrangeLight text-center mt-1">
          Daily limit reached — upgrade for unlimited access
        </p>
      )}
    </div>
  );
}
