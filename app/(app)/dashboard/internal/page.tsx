export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";

import { checkInternalAdminAccess } from "@/lib/auth/admin";
import { getAdminDashboardMetrics } from "@/lib/admin/metrics";
import { InternalAdminDashboard } from "../../../(app)/dashboard/internal/InternalAdminDashboard";

export default async function InternalAdminDashboardPage() {
  const access = await checkInternalAdminAccess();

  if (!access.authorized) {
    redirect(access.reason === "unauthenticated" ? "/auth/login" : "/dashboard");
  }

  const initialMetrics = await getAdminDashboardMetrics("30d");

  return <InternalAdminDashboard initialMetrics={initialMetrics} />;
}
