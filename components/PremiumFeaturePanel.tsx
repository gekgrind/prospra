"use client";

import { useState, useEffect } from "react";
import {
  Sparkles,
  BarChart3,
  Layers,
  Target,
  Briefcase,
  Lock,
} from "lucide-react";

export function PremiumFeaturePanel({
  onFeatureSelect,
}: {
  onFeatureSelect: (text: string) => void;
}) {
  const [isPremium, setIsPremium] = useState<boolean | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/credits");
        const data = await res.json();
        setIsPremium(data.isPremium);
      } catch (error) {
        console.error("Failed to load premium status:", error);
      }
    };
    load();
  }, []);

  if (isPremium === null) return null; // still loading

  const features = [
    {
      title: "Generate SWOT Analysis",
      prompt: "Generate a full SWOT analysis for my business.",
      icon: Layers,
      premium: true,
    },
    {
      title: "Create 90-Day Roadmap",
      prompt: "Create a complete 90-day business execution roadmap.",
      icon: Target,
      premium: true,
    },
    {
      title: "Build Business Model",
      prompt: "Build a detailed business model canvas for my idea.",
      icon: Briefcase,
      premium: true,
    },
    {
      title: "Market Analysis",
      prompt: "Run a quick target market analysis.",
      icon: BarChart3,
      premium: true,
    },
    {
      title: "Pricing Strategy",
      prompt: "Create a pricing strategy for my product.",
      icon: Sparkles,
      premium: true,
    },
  ];

  const handleClick = (feature: any) => {
    if (feature.premium && !isPremium) {
      onFeatureSelect(
        "Upgrade to Prospra Premium to unlock this advanced feature."
      );
      return;
    }
    onFeatureSelect(feature.prompt);
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 bg-brandNavyDark border border-brandBlue/50 rounded-xl p-4 mb-4 shadow-lg">
      {features.map((feature) => {
        const Icon = feature.icon;
        const locked = feature.premium && !isPremium;

        return (
          <button
            key={feature.title}
            onClick={() => handleClick(feature)}
            disabled={locked}
            className={`relative flex items-center gap-3 p-3 rounded-lg border transition-all
              ${
                locked
                  ? "bg-brandNavy/60 border-brandBlue/30 opacity-60 cursor-pointer hover:opacity-70"
                  : "bg-brandNavy border-brandBlue hover:border-brandOrangeLight hover:bg-brandNavyDark"
              }
            `}
          >
            {/* Lock overlay */}
            {locked && (
              <div className="absolute inset-0 bg-brandNavy/40 backdrop-blur-[2px] rounded-lg flex items-center justify-center pointer-events-none">
                <Lock className="h-5 w-5 text-brandOrangeLight opacity-80" />
              </div>
            )}

            {/* Icon box */}
            <div
              className={`h-8 w-8 rounded-md flex items-center justify-center transition-all
                ${
                  locked
                    ? "bg-brandBlue/20 border border-brandBlue/30"
                    : "bg-gradient-to-br from-brandBlueLight to-brandBlue shadow-md"
                }
              `}
            >
              <Icon
                className={`h-4 w-4 ${
                  locked ? "text-brandBlueLight/70" : "text-white"
                }`}
              />
            </div>

            {/* Text */}
            <span
              className={`text-sm text-left leading-tight transition ${
                locked ? "text-brandBlueLight/70" : "text-brandBlueLight"
              }`}
            >
              {feature.title}

              {locked && (
                <span className="ml-1 text-brandOrangeLight text-xs font-medium">
                  (Premium)
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
