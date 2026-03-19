import { createClient } from "@/supabase/server";
import { NextResponse } from "next/server";

/**
 * POST /api/logout/dashboard
 * Called by sendBeacon on tab/window close, and by the idle-timeout handler.
 * Signs the admin out of Supabase Auth.
 */
export async function POST() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch {
    // best effort
  }
  return NextResponse.json({ ok: true });
}
