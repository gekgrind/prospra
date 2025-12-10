"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useMotionValue, animate } from "framer-motion";
import {
  Home,
  NotebookPen,
  Bot,
  BarChart3,
  Settings,
  Lock,
  Menu as MenuIcon,
  X,
} from "lucide-react";
import { useState } from "react";

// -------------------------------------------------------------
// AI PULSE ORB (center glowing orb)
// -------------------------------------------------------------
function AIPulseOrb() {
  return (
    <motion.div
      className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-gradient-to-br from-brandOrange to-pink-600 shadow-[0_0_30px_10px_rgba(255,115,0,0.4)]"
      animate={{
        scale: [1, 1.15, 1],
        opacity: [0.7, 1, 0.7],
        rotate: [0, 10, -10, 0],
      }}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
}

// -------------------------------------------------------------
// MAGNETIC HOVER WRAPPER
// -------------------------------------------------------------
function Magnetic({ children }: { children: React.ReactNode }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const move = (event: any) => {
    const { currentTarget, clientX, clientY } = event;
    const rect = currentTarget.getBoundingClientRect();

    const offsetX = clientX - (rect.left + rect.width / 2);
    const offsetY = clientY - (rect.top + rect.height / 2);

    animate(x, offsetX * 0.2, { type: "spring", stiffness: 150, damping: 12 });
    animate(y, offsetY * 0.2, { type: "spring", stiffness: 150, damping: 12 });
  };

  const reset = () => {
    animate(x, 0);
    animate(y, 0);
  };

  return (
    <motion.div style={{ x, y }} onMouseMove={move} onMouseLeave={reset}>
      {children}
    </motion.div>
  );
}

// -------------------------------------------------------------
// MAIN MENU (now hidden unless toggled)
// -------------------------------------------------------------
export function ProspraMenu() {
  const pathname = usePathname();

  // Hide menu entirely on onboarding pages
  if (pathname.startsWith("/onboarding")) return null;

  const [open, setOpen] = useState(false);

  const navItems = [
  { href: "/", label: "Home", icon: Home, premium: false },

  // Core app
  { href: "/journal", label: "Journal", icon: NotebookPen, premium: false },
  { href: "/mentor", label: "Mentor", icon: Bot, premium: false },

  // Dashboard sections you built
  {
    href: "/dashboard/business-roadmap",
    label: "Roadmap",
    icon: BarChart3,
    premium: false,
  },
  {
    href: "/dashboard/tools-library",
    label: "Tools",
    icon: Settings, // swap icon if you want
    premium: false,
  },
  {
    href: "/dashboard/growth-coach",
    label: "Coach",
    icon: Bot, // or choose something unique
    premium: false,
  },

  // General settings
  { href: "/settings", label: "Settings", icon: Settings, premium: false },
];

  return (
    <>
      {/* Floating FAB Button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-[60] bg-brandOrange text-white p-4 rounded-full shadow-xl hover:scale-110 transition"
      >
        {open ? <X size={24} /> : <MenuIcon size={24} />}
      </button>

      {/* Slide-up menu panel */}
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ type: "spring", stiffness: 140, damping: 18 }}
          className="fixed bottom-24 left-4 right-4 z-50 mx-auto max-w-md rounded-3xl backdrop-blur-2xl bg-white/10 border border-white/20 shadow-[0_8px_40px_rgba(0,0,0,0.35)] p-6"
        >
          <div className="relative">
            {/* AI Orb */}
            <AIPulseOrb />

            {/* Navigation Icons */}
            <div className="flex justify-between items-center">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;

                return (
                  <Magnetic key={item.href}>
                    <Link href={item.href} onClick={() => setOpen(false)}>
                      <motion.div
                        whileHover={{ scale: 1.25 }}
                        whileTap={{ scale: 0.9 }}
                        className="relative flex flex-col items-center"
                      >
                        {/* Glow Under Active Icon */}
                        {active && (
                          <motion.div
                            layoutId="glow"
                            className="absolute -inset-4 rounded-full bg-brandOrange/30 blur-xl"
                          />
                        )}

                        {/* Premium Badge */}
                        {item.premium && (
                          <motion.div
                            className="absolute -top-2 -right-2 text-yellow-300"
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: "easeInOut",
                            }}
                          >
                            <Lock className="w-3 h-3" />
                          </motion.div>
                        )}

                        {/* Icon */}
                        <Icon
                          className={`w-7 h-7 drop-shadow-md transition-all ${
                            active
                              ? "text-brandOrange"
                              : "text-white/80 hover:text-white"
                          }`}
                        />

                        {/* Label */}
                        <span
                          className={`text-[11px] mt-1 ${
                            active
                              ? "text-brandOrange font-semibold"
                              : "text-white/70"
                          }`}
                        >
                          {item.label}
                        </span>
                      </motion.div>
                    </Link>
                  </Magnetic>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}
    </>
  );
}
