"use client";

import { useState } from "react";
import type { User } from "@supabase/supabase-js";
import type { FounderScoreResult } from "@/lib/founder/score-engine";
import type { BusinessHealthIndicator } from "@/lib/business/health";
import type { Goal } from "@/lib/goals";
import { motion } from "framer-motion";

// Animated ring component for Founder Score
function ScoreRing({ value }: { value: number }) {
  const circumference = 220;
  const progress = (value / 100) * circumference;

  return (
    <svg width="120" height="120" className="drop-shadow-lg">
      <circle
        cx="60"
        cy="60"
        r="35"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth="10"
        fill="none"
      />
      <motion.circle
        cx="60"
        cy="60"
        r="35"
        stroke="url(#scoreGradient)"
        strokeWidth="10"
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={circumference - progress}
        strokeLinecap="round"
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: circumference - progress }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      />
      <defs>
        <linearGradient id="scoreGradient" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#d27a2c" />
          <stop offset="100%" stopColor="#4f7ca7" />
        </linearGradient>
      </defs>
    </svg>
  );
}

interface DashboardClientProps {
  user: User;
  profile: any;
  recentEntries: any[];
  founderScore: FounderScoreResult;
  businessHealth: BusinessHealthIndicator[];
  goals: Goal[];
}

export default function DashboardClient({
  user,
  profile,
  recentEntries,
  founderScore,
  businessHealth,
  goals,
}: DashboardClientProps) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden text-white">

      {/* ============================= */}
      {/* BLUEPRINT BACKGROUND OVERLAY */}
      {/* ============================= */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[#050816]">
        <div
          className="absolute inset-0 bg-[url('/blueprint-grid.png')] opacity-10"
          style={{ backgroundSize: "280px" }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0f1d]/60 to-black"></div>
      </div>

      <div className="px-6 py-10">

        {/* ============================= */}
        {/* HEADER */}
        {/* ============================= */}
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-extrabold tracking-tight"
        >
          Welcome back, {profile?.full_name || user.email} 👋
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-2 text-slate-400"
        >
          Here’s your personalized founder dashboard.
        </motion.p>


        {/* ============================= */}
        {/* FOUNDER SCORE HERO CARD */}
        {/* ============================= */}
        <motion.section
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="mt-10 flex flex-col md:flex-row items-center justify-between rounded-3xl bg-black/30 border border-white/10 p-8 shadow-xl backdrop-blur-xl"
        >
          {/* SCORE RING */}
          <div className="flex flex-col items-center">
            <ScoreRing value={founderScore.totalScore} />
            <p className="mt-4 text-5xl font-bold text-orange-300">
              {founderScore.totalScore}
            </p>
            <p className="text-sm tracking-widest uppercase text-slate-400 mt-1">
              {founderScore.tier}
            </p>
          </div>

          {/* SUMMARY AREA */}
          <div className="mt-6 md:mt-0 max-w-xl">
            <h3 className="text-lg font-semibold text-slate-200">
              Your Founder Profile
            </h3>
            <p className="text-slate-400 mt-2 leading-relaxed">
              {founderScore.summary}
            </p>

            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(founderScore.subscores).map(([key, value]) => (
                <div
                  key={key}
                  className="rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-center"
                >
                  <p className="text-sm capitalize text-slate-400">{key}</p>
                  <p className="text-2xl font-bold text-white">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.section>


        {/* ============================= */}
        {/* BUSINESS HEALTH GRID */}
        {/* ============================= */}
        <section className="mt-12">
          <h2 className="text-xl font-semibold mb-4">Business Health</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {businessHealth.map((metric, i) => (
              <motion.div
                key={metric.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ scale: 1.03, rotate: 0.3 }}
                className="rounded-2xl bg-black/40 border border-white/10 p-6 shadow-lg backdrop-blur-md relative overflow-hidden"
              >
                {/* Orb Glow */}
                <div className="absolute -top-10 -right-10 h-28 w-28 rounded-full bg-gradient-to-br from-orange-500/20 to-blue-500/20 blur-2xl"></div>

                <p className="text-sm uppercase tracking-widest text-slate-400">
                  {metric.label}
                </p>

                <p className="text-4xl font-bold mt-3">{metric.score}</p>

                <div className="mt-3">
                  <span
                    className={`px-3 py-1 text-xs rounded-full ${
                      metric.status === "high"
                        ? "bg-emerald-400/20 text-emerald-300"
                        : metric.status === "medium"
                        ? "bg-yellow-400/20 text-yellow-300"
                        : "bg-red-400/20 text-red-300"
                    }`}
                  >
                    {metric.status.toUpperCase()}
                  </span>
                </div>

                <p className="mt-4 text-sm text-slate-400">
                  {metric.description}
                </p>
              </motion.div>
            ))}
          </div>
        </section>


        {/* ============================= */}
        {/* GOALS WITH MOTION BARS */}
        {/* ============================= */}
        <section className="mt-14">
          <h2 className="text-xl font-semibold mb-4">Your Goals</h2>

          <div className="space-y-5">
            {goals.map((goal, idx) => {
              const progress = (goal.current_value / goal.target_value) * 100 || 0;

              return (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="rounded-2xl bg-black/30 border border-white/10 p-5 backdrop-blur-xl relative overflow-hidden"
                >
                  {/* Glow Orb */}
                  <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-gradient-to-br from-blue-600/20 to-orange-500/20 rounded-full blur-2xl"></div>

                  <div className="flex justify-between items-center">
                    <p className="font-semibold text-lg">{goal.label}</p>
                    <p className="text-slate-300">
                      {goal.current_value} / {goal.target_value}
                    </p>
                  </div>

                  <div className="mt-3 h-3 bg-slate-700/40 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-orange-500 to-blue-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 1.2, ease: "easeOut" }}
                    />
                  </div>

                  <p className="mt-2 text-xs text-slate-400">
                    {progress.toFixed(0)}% complete
                  </p>
                </motion.div>
              );
            })}
          </div>
        </section>


        {/* ============================= */}
        {/* JOURNAL ENTRIES */}
        {/* ============================= */}
        <section className="mt-14">
          <h2 className="text-xl font-semibold mb-4">Recent Journal Entries</h2>

          {recentEntries.length === 0 ? (
            <p className="text-slate-400 text-sm">No entries yet.</p>
          ) : (
            <div className="space-y-4">
              {recentEntries.map((entry, idx) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="rounded-2xl bg-black/30 border border-white/10 p-5 backdrop-blur-xl"
                >
                  <p className="text-sm text-slate-300">
                    {new Date(entry.entry_date).toLocaleDateString()}
                  </p>
                  <p className="mt-2 text-slate-400 text-sm">
                    {entry.entry_text}
                  </p>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
