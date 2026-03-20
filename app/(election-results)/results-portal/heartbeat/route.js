import { createErmsClient } from "@/supabase/erms-server";
import { NextResponse } from "next/server";

const ERMS_PATH = "/results-portal";

/**
 * POST /results-portal/heartbeat
 * Called every 60 seconds by useHeartbeat while the user is active.
 * Validates the ERMS session and refreshes the erms_last_active cookie so
 * the middleware can enforce a server-side 15-minute idle timeout.
 */
export async function POST() {
  try {
    const supabase = await createErmsClient();
    const { data } = await supabase.auth.getClaims();
    if (!data?.claims?.sub) return new NextResponse(null, { status: 401 });

    const response = new NextResponse(null, { status: 204 });
    response.cookies.set("erms_last_active", String(Date.now()), {
      path: ERMS_PATH,
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
