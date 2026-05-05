import type { ComponentType } from "react";
import {
  ArrowLeftToLine,
  Bot,
  Compass,
  Flame,
  FolderKanban,
  Globe,
  LayoutDashboard,
} from "lucide-react";

export type DashboardNavItem = {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  matchPrefixes?: string[];
  badge?: string;
};

export const DASHBOARD_NAV_ITEMS: DashboardNavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    matchPrefixes: ["/dashboard"],
  },
  {
    label: "AI Mentor",
    href: "/mentor",
    icon: Bot,
    matchPrefixes: ["/mentor"],
  },
  {
    label: "Site Strategist",
    href: "/dashboard/web-intelligence",
    icon: Globe,
    matchPrefixes: ["/dashboard/web-intelligence", "/site-strategist"],
    badge: "New",
  },
  {
    label: "FounderFuel",
    href: "/tools/founderfuel",
    icon: Flame,
    matchPrefixes: ["/tools/founderfuel"],
    badge: "New",
  },
  {
    label: "Action Plans",
    href: "/dashboard/action-plans",
    icon: Compass,
    matchPrefixes: ["/dashboard/action-plans"],
  },
  {
    label: "Toolkit",
    href: "/dashboard/resources",
    icon: FolderKanban,
    matchPrefixes: ["/dashboard/resources"],
  },
  {
    label: "Command Center",
    href: "",
    icon: ArrowLeftToLine,
  },
];
