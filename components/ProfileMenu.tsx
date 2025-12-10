"use client";

import { useState } from "react";
import { ChevronDown, LogOut } from "lucide-react";
import Link from "next/link";

export default function ProfileMenu() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      {/* Avatar Button */}
      <button
        onClick={() => setOpen(!open)}
        className="
          h-9 w-9 rounded-full
          bg-brandBlueLight text-brandNavy font-bold
          flex items-center justify-center
          border border-brandBlue/60 shadow-md
          hover:shadow-brandBlue/40 hover:scale-[1.03]
          transition-all
        "
      >
        M
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="
            absolute right-0 mt-2 w-44 z-50
            bg-brandNavyDark border border-brandBlue/40 rounded-xl
            shadow-xl backdrop-blur-xl
            py-2 animate-fadeIn
          "
        >
          <Link
            href="/settings"
            className="block px-4 py-2 text-sm hover:bg-brandNavy hover:text-brandBlueLight transition"
          >
            Account Settings
          </Link>

          <hr className="border-brandBlue/30 my-1" />

          <button
            className="w-full px-4 py-2 flex items-center gap-2 text-sm text-red-300 hover:text-red-400 hover:bg-red-950/20 transition"
            onClick={() => {
              window.location.href = "/auth/logout";
            }}
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
