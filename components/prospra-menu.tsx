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
import { useState, type MouseEvent, type ReactNode } from "react";

// -------------------------------------------------------------
// AI PULSE ORB (center glowing orb)
// -------------------------------------------------------------
function AIPulseOrb() {
  return (
    <motion.div
      className="absolute -top-6 left-1/2 h-12 w-12 -translate-x-1/2 rounded-full bg-gradient-to-br from-brandOrange to-pink-600 shadow-[0_0_30px_10px_rgba(255,115,0,0.4)]"
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
function Magnetic({ children }: { children: ReactNode }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const move = (event: MouseEvent<HTMLDivElement>) => {
    const { currentTarget, clientX, clientY } = event;
    const rect = currentTarget.getBoundingClientRect();

    const offsetX = clientX - (rect.left + rect.width / 2);
    const offsetY = clientY - (rect.top + rect.height / 2);

    animate(x, offsetX * 0.2, {
      type: "spring",
      stiffness: 150,
      damping: 12,
    });
    animate(y, offsetY * 0.2, {
      type: "spring",
      stiffness: 150,
      damping: 12,
    });
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
export default function ProspraMenu() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Hide menu entirely on onboarding pages
  if (pathname.startsWith("/onboarding")) {
    return null;
  }

  const navItems = [
    { href: "/", label: "Home", icon: Home, premium: false },
    { href: "/journal", label: "Journal", icon: NotebookPen, premium: false },
    { href: "/mentor", label: "Mentor", icon: Bot, premium: false },
    {
      href: "/dashboard/business-roadmap",
      label: "Roadmap",
      icon: BarChart3,
      premium: false,
    },
    {
      href: "/dashboard/tools-library",
      label: "Tools",
      icon: Settings,
      premium: false,
    },
    {
      href: "/dashboard/growth-coach",
      label: "Coach",
      icon: Bot,
      premium: false,
    },
    {
      href: "/settings",
      label: "Settings",
      icon: Settings,
      premium: false,
    },
  ];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((prevOpen) => !prevOpen)}
        className="fixed bottom-6 right-6 z-[60] rounded-full bg-brandOrange p-4 text-white shadow-xl transition hover:scale-110"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
      >
        {open ? <X size={24} /> : <MenuIcon size={24} />}
      </button>

      {open && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ type: "spring", stiffness: 140, damping: 18 }}
          className="fixed bottom-24 left-4 right-4 z-50 mx-auto max-w-md rounded-3xl border border-white/20 bg-white/10 p-6 shadow-[0_8px_40px_rgba(0,0,0,0.35)] backdrop-blur-2xl"
        >
          <div className="relative">
            <AIPulseOrb />

            <div className="flex items-center justify-between">
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
                        {active && (
                          <motion.div
                            layoutId="glow"
                            className="absolute -inset-4 rounded-full bg-brandOrange/30 blur-xl"
                          />
                        )}

                        {item.premium && (
                          <motion.div
                            className="absolute -right-2 -top-2 text-yellow-300"
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: "easeInOut",
                            }}
                          >
                            <Lock className="h-3 w-3" />
                          </motion.div>
                        )}

                        <Icon
                          className={`h-7 w-7 drop-shadow-md transition-all ${
                            active
                              ? "text-brandOrange"
                              : "text-white/80 hover:text-white"
                          }`}
                        />

                        <span
                          className={`mt-1 text-[11px] ${
                            active
                              ? "font-semibold text-brandOrange"
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