"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

type FounderScoreRingProps = {
  score: number;
  tier?: string;
};

export function FounderScoreRing({
  score,
  tier,
}: FounderScoreRingProps) {
  const [progress, setProgress] = useState(0);

  const safeScore = Math.max(0, Math.min(100, score));
  const size = 110;
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (progress / 100) * circumference;

  useEffect(() => {
    const timeout = window.setTimeout(() => setProgress(safeScore), 150);
    return () => window.clearTimeout(timeout);
  }, [safeScore]);

  const pulseStrength =
    safeScore >= 85
      ? "0 0 26px rgba(0,212,255,0.24)"
      : safeScore >= 65
      ? "0 0 20px rgba(0,212,255,0.18)"
      : safeScore >= 40
      ? "0 0 14px rgba(0,212,255,0.14)"
      : "0 0 10px rgba(0,212,255,0.10)";

  const auraOpacity =
    safeScore >= 85 ? 0.26 : safeScore >= 65 ? 0.2 : safeScore >= 40 ? 0.16 : 0.12;

  return (
    <div className="relative flex h-[110px] w-[110px] items-center justify-center">
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle, rgba(0,212,255,${auraOpacity}) 0%, transparent 65%)`,
          filter: "blur(16px)",
        }}
        animate={{
          scale: [1, 1.045, 1],
          opacity: [0.8, 1, 0.8],
        }}
        transition={{
          duration: safeScore >= 80 ? 2.2 : safeScore >= 50 ? 2.8 : 3.4,
          ease: "easeInOut",
          repeat: Infinity,
        }}
      />

      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="relative z-10 -rotate-90"
      >
        <circle
          stroke="rgba(255,255,255,0.10)"
          fill="transparent"
          strokeWidth={stroke}
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />

        <circle
          stroke="#00D4FF"
          fill="transparent"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{
            transition: "stroke-dashoffset 1s ease-out",
            filter: `drop-shadow(${pulseStrength})`,
          }}
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>

      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center">
        <motion.span
          className="text-2xl font-semibold text-white"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.15 }}
        >
          {safeScore}
        </motion.span>

        <motion.span
          className="text-[10px] uppercase tracking-[0.25em] text-[#8fb8d8]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.35 }}
        >
          score
        </motion.span>

        {tier ? (
          <motion.span
            className="mt-1 max-w-[84px] text-[10px] leading-tight text-[#00D4FF]/80"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.95 }}
          >
            {tier}
          </motion.span>
        ) : null}
      </div>
    </div>
  );
}