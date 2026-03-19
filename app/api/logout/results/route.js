import { createErmsClient } from "@/supabase/erms-server";
import { NextResponse } from "next/server";

/**
 * POST /api/logout/results
 * Programmatic ERMS logout endpoint.
 * Signs out the current ERMS session by clearing the erms_sb-* cookies.
 */
export async function POST() {
  try {
    const supabase = await createErmsClient();
    await supabase.auth.signOut();
  } catch {
    // best effort
  }

  return NextResponse.json({ ok: true });
}
