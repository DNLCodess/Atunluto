import { createClient } from "@/supabase/server";
import { NextResponse } from "next/server";

/**
 * POST /api/heartbeat/dashboard
 * Called every 60 seconds by useHeartbeat while the user is active.
 * Validates the session and refreshes the dashboard_last_active cookie so
 * the middleware can enforce a server-side 15-minute idle timeout.
 */
export async function POST() {
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    if (!data?.claims?.sub) return new NextResponse(null, { status: 401 });

    const response = new NextResponse(null, { status: 204 });
    response.cookies.set("dashboard_last_active", String(Date.now()), {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    return response;
  } catch {
    // best effort
    return new NextResponse(null, { status: 204 });
  }
}
