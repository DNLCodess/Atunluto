import { cookies } from "next/headers";
import { createAdminClient } from "@/supabase/admin";
import { NextResponse } from "next/server";

const SESSION_COOKIE = "erms_session";

/**
 * POST /results-portal/logout
 * Called by sendBeacon on tab/window close, and by the idle-timeout handler.
 * Must live under /results-portal/ so the browser includes the erms_session
 * cookie (which is scoped to path: "/results-portal").
 */
export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;

    if (token) {
      const supabase = createAdminClient();
      await supabase
        .from("admin_sessions")
        .update({ is_revoked: true })
        .eq("session_token", token);
    }
  } catch {
    // best effort
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.delete({
    name: SESSION_COOKIE,
    path: "/results-portal",
  });
  return response;
}
