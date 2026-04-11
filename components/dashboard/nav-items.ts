import type { ComponentType } from "react";
import {
  Bot,
  ChartLine,
  Compass,
  FolderKanban,
  LayoutDashboard,
  MessageSquare,
  Settings,
} from "lucide-react";

export type DashboardNavItem = {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  matchPrefixes?: string[];
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
    label: "Conversations",
    href: "/dashboard/sessions",
    icon: MessageSquare,
    matchPrefixes: ["/dashboard/sessions"],
  },
  {
    label: "Insights",
    href: "/dashboard/insights",
    icon: ChartLine,
    matchPrefixes: ["/dashboard/insights"],
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
  href: "/dashboard/settings", // ✅ FIXED
  icon: Settings,
};