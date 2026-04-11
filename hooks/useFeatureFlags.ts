"use client";

import { useEffect, useState } from "react";
import { FeatureFlagKey } from "@/lib/experiments/definitions";
import { FlagEvaluation } from "@/lib/experiments/types";

type FlagsResponse = {
  flags: Record<FeatureFlagKey, FlagEvaluation>;
};

export function useFeatureFlags() {
  const [flags, setFlags] = useState<Partial<Record<FeatureFlagKey, FlagEvaluation>>>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const response = await fetch("/api/experiments", {
          method: "GET",
          credentials: "include",
        });

        if (!response.ok) {
          setReady(true);
          return;
        }

        const data = (await response.json()) as FlagsResponse;
        if (mounted) {
          setFlags(data.flags ?? {});
        }
      } catch {
        // ignore and fall back to defaults
      } finally {
        if (mounted) {
          setReady(true);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return { flags, ready };
}
