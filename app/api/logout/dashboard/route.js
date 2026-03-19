import { createClient } from "@/supabase/server";
import { NextResponse } from "next/server";

/**
 * GET /api/logout/dashboard
 * Used by the inactivity timer — browser navigates here directly.
 * Signs out server-side, clears Supabase cookies, redirects to login.
 * No client-side signOut() needed, so onAuthStateChange never fires
 * and the layout never renders null (no blank page).
 */
export async function GET(request) {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch {
    // best effort
  }
  return NextResponse.redirect(new URL("/login", request.url));
}

/**
 * POST /api/logout/dashboard
 * Programmatic logout endpoint for fetch-based callers.
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
