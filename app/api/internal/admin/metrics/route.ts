import { NextResponse } from "next/server";

import { checkInternalAdminAccess } from "@/lib/auth/admin";
import { getAdminDashboardMetrics, type AdminTimeWindow } from "@/lib/admin/metrics";

export const dynamic = "force-dynamic";
export const revalidate = 120;

function normalizeWindow(window: string | null): AdminTimeWindow {
  if (window === "7d" || window === "30d" || window === "all") {
    return window;
  }
  return "30d";
}

export async function GET(request: Request) {
  const auth = await checkInternalAdminAccess();

  if (!auth.authorized) {
    const status = auth.reason === "unauthenticated" ? 401 : 403;
    return NextResponse.json({ error: auth.reason ?? "forbidden" }, { status });
  }

  const { searchParams } = new URL(request.url);
  const window = normalizeWindow(searchParams.get("window"));

  try {
    const metrics = await getAdminDashboardMetrics(window);
    return NextResponse.json(metrics);
  } catch (error) {
    console.error("admin metrics error", error);
    return NextResponse.json({ error: "failed_to_load_metrics" }, { status: 500 });
  }
}
