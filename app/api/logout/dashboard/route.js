import { createClient } from "@/supabase/server";
import { NextResponse } from "next/server";

/**
 * Reconstruct the public-facing origin from request headers.
 * On Vercel/cloud: NEXT_PUBLIC_SITE_URL is set — use that.
 * On Plesk (reverse proxy): request.url is the internal bind address
 * (0.0.0.0:3000). Read x-forwarded-host + x-forwarded-proto instead.
 * On local dev: request.url is correct.
 */
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

export async function GET(request) {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch {
    // best effort
  }
  return NextResponse.redirect(new URL("/login", getPublicOrigin(request)));
}

export async function POST() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch {
    // best effort
  }
  return NextResponse.json({ ok: true });
}
