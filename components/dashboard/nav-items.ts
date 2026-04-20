import type { ComponentType } from "react";
import {
  Bot,
  Compass,
  Flame,
  FolderKanban,
  Globe,
  LayoutDashboard,
  Settings,
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
    matchPrefixes: ["/dashboard/web-intelligence"],
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
];

export const DASHBOARD_ACCOUNT_ITEM: DashboardNavItem = {
  label: "Settings",
  href: "/dashboard/settings",
  icon: Settings,
  matchPrefixes: ["/dashboard/settings"],
};