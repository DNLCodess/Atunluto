import { createErmsClient } from "@/supabase/erms-server";
import { NextResponse } from "next/server";

const LOGIN_URL = "/results-portal/login";

async function performSignOut() {
  try {
    const supabase = await createErmsClient();
    await supabase.auth.signOut();
  } catch {
    // best effort
  }
}

/**
 * GET /results-portal/logout
 * Used by the inactivity timer — browser navigates here directly.
 * Signs out server-side (clears erms_sb-* cookies), redirects to login.
 */
export async function GET(request) {
  // Redirect immediately — cookies are cleared client-side by the browser
  // following the 302. The signOut() call invalidates the token server-side
  // in the background (best effort, non-blocking).
  performSignOut();
  return NextResponse.redirect(new URL(LOGIN_URL, request.url), { status: 302 });
}

/**
 * POST /results-portal/logout
 * Programmatic logout endpoint for fetch-based callers.
 */
export async function POST() {
  await performSignOut();
  return NextResponse.json({ ok: true });
}
