import type { ComponentType } from "react";
import {
  Bot,
  Compass,
  Flame,
  FolderKanban,
  Globe,
  HelpCircle,
  LayoutDashboard,
  Settings,
  UserCircle,
} from "lucide-react";

export type DashboardNavItem = {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  matchPrefixes?: string[];
  badge?: string;
};

export type DashboardNavGroup = {
  id: "core" | "growth" | "tools";
  label: string;
  items: DashboardNavItem[];
  defaultOpen?: boolean;
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

export const DASHBOARD_NAV_GROUPS: DashboardNavGroup[] = [
  {
    id: "core",
    label: "Core",
    defaultOpen: true,
    items: DASHBOARD_NAV_ITEMS.slice(0, 3),
  },
  {
    id: "growth",
    label: "Growth",
    items: DASHBOARD_NAV_ITEMS.slice(3, 5),
  },
  {
    id: "tools",
    label: "Tools",
    items: DASHBOARD_NAV_ITEMS.slice(5),
  },
];

export const DASHBOARD_ACCOUNT_ITEM: DashboardNavItem = {
  label: "Settings",
  href: "/dashboard/settings",
  icon: Settings,
  matchPrefixes: ["/dashboard/settings"],
};

export const DASHBOARD_UTILITY_ITEMS: DashboardNavItem[] = [
  {
    label: "Account",
    href: "/profile",
    icon: UserCircle,
    matchPrefixes: ["/profile", "/account"],
  },
  DASHBOARD_ACCOUNT_ITEM,
  {
    label: "Help",
    href: "/feedback",
    icon: HelpCircle,
    matchPrefixes: ["/feedback"],
  },
];
