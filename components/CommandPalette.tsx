"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Command } from "lucide-react";

const COMMAND_ITEMS = [
  { label: "Go to Dashboard", shortcut: "D", href: "/dashboard" },
  { label: "Open Mentor", shortcut: "M", href: "/mentor" },
  { label: "Open Journal", shortcut: "J", href: "/journal" },
  { label: "Account Settings", shortcut: "S", href: "/settings" },
];

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  if (!open) return null;

  const filtered = COMMAND_ITEMS.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-24 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg mx-4 rounded-2xl bg-brandNavyDark border border-brandBlue/60 shadow-2xl animate-fadeIn">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-brandBlue/40">
          <Search className="h-4 w-4 text-brandBlueLight/70" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Jump to anything…"
            className="flex-1 bg-transparent outline-none text-sm text-brandBlueLight placeholder:text-brandBlueLight/50"
          />
          <div className="flex items-center gap-1 text-[10px] text-brandBlueLight/60 border border-brandBlue/50 rounded px-1.5 py-0.5">
            <Command className="h-3 w-3" />
            <span>K</span>
          </div>
        </div>

        <div className="max-h-64 overflow-y-auto py-1">
          {filtered.length === 0 ? (
            <div className="px-4 py-3 text-xs text-brandBlueLight/60">
              No matches. Try “Dashboard”, “Mentor”, “Journal”...
            </div>
          ) : (
            filtered.map((item) => (
              <button
                key={item.href}
                className="w-full flex items-center justify-between px-4 py-2 text-left text-sm hover:bg-brandNavy transition"
                onClick={() => {
                  setOpen(false);
                  router.push(item.href);
                }}
              >
                <span className="text-brandBlueLight">{item.label}</span>
                <span className="text-[10px] text-brandBlueLight/50 border border-brandBlue/50 rounded px-1.5 py-0.5">
                  {item.shortcut}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
