"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { LogOut } from "lucide-react";
import Link from "next/link";

type ProfileMenuProps = {
  children?: ReactNode;
};

export default function ProfileMenu({ children }: ProfileMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="block w-full text-left"
      >
        {children ?? (
          <div
            className="
              flex h-9 w-9 items-center justify-center rounded-full
              border border-brandBlue/60 bg-brandBlueLight
              font-bold text-brandNavy shadow-md transition-all
              hover:scale-[1.03] hover:shadow-brandBlue/40
            "
          >
            M
          </div>
        )}
      </button>

      {open && (
        <div
          className="
            absolute right-0 mt-2 z-50 w-44
            rounded-xl border border-brandBlue/40
            bg-brandNavyDark py-2 shadow-xl backdrop-blur-xl
            animate-fadeIn
          "
        >
          <Link
            href="/settings"
            className="block px-4 py-2 text-sm transition hover:bg-brandNavy hover:text-brandBlueLight"
            onClick={() => setOpen(false)}
          >
            Account Settings
          </Link>

          <Link
            href="/feedback"
            className="block px-4 py-2 text-sm transition hover:bg-brandNavy hover:text-brandBlueLight"
            onClick={() => setOpen(false)}
          >
            Give Feedback
          </Link>

          <hr className="my-1 border-brandBlue/30" />

          <button
            type="button"
            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-300 transition hover:bg-red-950/20 hover:text-red-400"
            onClick={() => {
              setOpen(false);
              window.location.href = "/logout";
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