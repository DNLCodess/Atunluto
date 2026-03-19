import { cookies } from "next/headers";
import { createAdminClient } from "@/supabase/admin";
import { NextResponse } from "next/server";

const SESSION_COOKIE = "erms_session";

/**
 * POST /api/logout/results
 * Called by sendBeacon on tab/window close, and by the idle-timeout handler.
 * Revokes the ERMS session token in the database and clears the cookie.
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

      cookieStore.delete(SESSION_COOKIE);
    }
  } catch {
    // best effort
  }

  return NextResponse.json({ ok: true });
}
