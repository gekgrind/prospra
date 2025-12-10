"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client"; // 🔥 ADD THIS

export function AppSidebar({ user }: { user: any }) {
  const pathname = usePathname();
  const supabase = createClient(); // 🔥 Initialize browser client

  // 🔹 SIGN OUT FUNCTION
  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      window.location.href = "/login"; // redirect after logout
    } catch (error) {
      console.error("Sign-out error:", error);
    }
  };

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: "📊" },
    { name: "AI Mentor", href: "/chat", icon: "🤖" },
    { name: "Journal", href: "/journal", icon: "📝" },
    { name: "Documents", href: "/documents", icon: "📂" },
    { name: "Settings", href: "/settings", icon: "⚙️" },
  ];

  return (
    <aside className="ai-sidebar w-64 h-full flex flex-col px-4 py-6">
      {/* Logo */}
      <div className="mb-10 text-center">
        <h1 className="text-xl font-semibold text-brandBlueLight tracking-wide">
          Prospra
        </h1>
        <p className="text-xs text-brandBlueLight/60">AI Mentorship System</p>
      </div>

      {/* Navigation */}
      <nav className="space-y-2">
        <p className="ai-section-title">Main Menu</p>

        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.name} href={item.href}>
              <div
                className={`ai-nav-item ${
                  isActive ? "ai-nav-active" : ""
                }`}
              >
                <span className="mr-3 text-lg">{item.icon}</span>
                {item.name}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="ai-user-card mt-auto">
        <p className="text-sm font-medium text-brandBlueLight">
          {user?.fullName || "User"}
        </p>
        <p className="text-xs text-brandBlueLight/50">{user?.email}</p>

        {/* 🔥 UPDATED SIGN OUT BUTTON */}
        <button
          onClick={handleSignOut}
          className="mt-4 w-full ai-nav-item text-left text-red-300 hover:text-red-400 flex items-center gap-2"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
