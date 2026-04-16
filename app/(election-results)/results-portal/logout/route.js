import { createErmsClient } from "@/supabase/erms-server";
import { NextResponse } from "next/server";

const LOGIN_URL = "/results-portal/login";

function getPublicOrigin(request) {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }
  const host =
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    new URL(request.url).host;
  const proto =
    request.headers.get("x-forwarded-proto")?.split(",")[0].trim() ||
    new URL(request.url).protocol.replace(":", "");
  return `${proto}://${host}`;
}

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
  return NextResponse.redirect(new URL(LOGIN_URL, getPublicOrigin(request)), { status: 302 });
}

/**
 * POST /results-portal/logout
 * Programmatic logout endpoint for fetch-based callers.
 */
export async function POST() {
  await performSignOut();
  return NextResponse.json({ ok: true });
}
