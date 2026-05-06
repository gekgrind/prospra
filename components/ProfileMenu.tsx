"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { buildReturnToHref } from "@/lib/auth/redirects";

type ProfileMenuProps = {
  children?: ReactNode;
};

type MenuPosition = {
  left: number;
  top: number;
};

export default function ProfileMenu({ children }: ProfileMenuProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const returnTo = pathname || "/dashboard";
  const accountHref = buildReturnToHref("/profile", returnTo);
  const settingsHref = buildReturnToHref("/dashboard/settings", returnTo);
  const menuId = "profile-menu";

  const closeMenu = useCallback((restoreFocus = false) => {
    setOpen(false);

    if (restoreFocus) {
      window.setTimeout(() => buttonRef.current?.focus(), 0);
    }
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    function updateMenuPosition() {
      const buttonRect = buttonRef.current?.getBoundingClientRect();
      const menuWidth = 192;
      const menuHeight = menuRef.current?.offsetHeight ?? 188;
      const viewportMargin = 12;
      const gap = 10;

      if (!buttonRect) {
        return;
      }

      const alignedLeft = buttonRect.right - menuWidth;
      const aboveTop = buttonRect.top - gap;

      setMenuPosition({
        left: Math.max(
          viewportMargin,
          Math.min(
            alignedLeft,
            window.innerWidth - menuWidth - viewportMargin
          )
        ),
        top: Math.max(
          menuHeight + viewportMargin,
          Math.min(
            aboveTop,
            window.innerHeight - viewportMargin
          )
        ),
      });
    }

    updateMenuPosition();
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);

    return () => {
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [open]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;

      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        closeMenu();
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeMenu(true);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [closeMenu]);

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
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

      {open && menuPosition && (
        <div
          id={menuId}
          ref={menuRef}
          role="menu"
          aria-label="Account menu"
          style={{
            left: `${menuPosition.left}px`,
            top: `${menuPosition.top}px`,
            transform: "translateY(-100%)",
          }}
          className="
            fixed z-50 w-48
            rounded-xl border border-brandBlue/40
            bg-brandNavyDark py-2 shadow-xl backdrop-blur-xl
            animate-fadeIn
          "
        >
          <Link
            href={accountHref}
            role="menuitem"
            className="block px-4 py-2 text-sm transition hover:bg-brandNavy hover:text-brandBlueLight"
            onClick={() => closeMenu()}
          >
            Account
          </Link>

          <Link
            href={settingsHref}
            role="menuitem"
            className="block px-4 py-2 text-sm transition hover:bg-brandNavy hover:text-brandBlueLight"
            onClick={() => closeMenu()}
          >
            Settings
          </Link>

          <Link
            href="/feedback"
            role="menuitem"
            className="block px-4 py-2 text-sm transition hover:bg-brandNavy hover:text-brandBlueLight"
            onClick={() => closeMenu()}
          >
            Give Feedback
          </Link>

          <hr className="my-1 border-brandBlue/30" />

          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-300 transition hover:bg-red-950/20 hover:text-red-400"
            onClick={() => {
              closeMenu();
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
