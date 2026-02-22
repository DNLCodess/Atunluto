/**
 * middleware/resultsMiddleware.js
 * Auth guard for all /results/* routes.
 *
 * HOW TO INTEGRATE:
 * In your root middleware.js, import and call handleResultsRoutes(request).
 * Add '/results/:path*' to your root middleware matcher.
 *
 * Route access matrix:
 *   /results-portal/login              — public
 *   /results/change-password    — any authenticated ERMS admin
 *   /results-portal/admin/**           — state_admin only
 *   /results/lga/**             — lga_admin only
 */

import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const SESSION_COOKIE = "erms_session";
const PUBLIC_PATHS = ["/results-portal/login"];
const CHANGE_PWD_PATH = "/results-portal/change-password";
const STATE_ADMIN_BASE = "/results-portal/admin";
const LGA_ADMIN_BASE = "/results-portal/lga";

export async function handleResultsRoutes(request) {
  const { pathname } = request.nextUrl;

  // Not a /results route — skip
  if (!pathname.startsWith("/results-portal")) {
    return NextResponse.next();
  }

  // Public paths — always allowed
  if (
    PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "?"))
  ) {
    return NextResponse.next();
  }

  const sessionToken = request.cookies.get(SESSION_COOKIE)?.value;

  // No session → redirect to login
  if (!sessionToken) {
    return redirectToLogin(request);
  }

  // Validate session against DB
  const session = await validateERMSSession(sessionToken, request);

  if (!session) {
    // Invalid/expired session → clear cookie + redirect
    const response = redirectToLogin(request);
    response.cookies.delete(SESSION_COOKIE);
    return response;
  }

  // Enforce must_change_password
  if (session.must_change_password && pathname !== CHANGE_PWD_PATH) {
    return NextResponse.redirect(new URL(CHANGE_PWD_PATH, request.url));
  }

  // Role-based route guards
  if (pathname.startsWith(STATE_ADMIN_BASE) && session.role !== "state_admin") {
    return NextResponse.redirect(new URL("/results-portal/lga", request.url));
  }

  if (pathname.startsWith(LGA_ADMIN_BASE) && session.role !== "lga_admin") {
    return NextResponse.redirect(new URL("/results-portal/admin", request.url));
  }

  // Redirect /results root to appropriate dashboard
  if (pathname === "/results-portal" || pathname === "/results-portal/") {
    const dest =
      session.role === "state_admin"
        ? "/results-portal/admin"
        : "/results-portal/lga";
    return NextResponse.redirect(new URL(dest, request.url));
  }

  // Inject admin info into request headers for use in server components
  const response = NextResponse.next();
  response.headers.set("x-erms-id", session.id);
  response.headers.set("x-erms-role", session.role);
  response.headers.set("x-erms-lga", session.lga || "");
  response.headers.set("x-erms-name", session.full_name || "");
  return response;
}

// ─────────────────────────────────────────
// Session validation (hits Supabase directly)
// ─────────────────────────────────────────

async function validateERMSSession(token, request) {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY, // ← service role, bypasses RLS
      {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: () => {},
        },
      },
    );

    const { data: sessionRow } = await supabase
      .from("admin_sessions")
      .select("admin_id, expires_at, is_revoked")
      .eq("session_token", token)
      .single();

    if (
      !sessionRow ||
      sessionRow.is_revoked ||
      new Date(sessionRow.expires_at) < new Date()
    ) {
      return null;
    }

    const { data: admin } = await supabase
      .from("election_admins")
      .select("id, full_name, role, lga, must_change_password, is_active") // full_name already there ✓
      .eq("id", sessionRow.admin_id)
      .single();

    if (!admin || !admin.is_active) return null;

    return admin;
  } catch (err) {
    console.error("[ERMS Middleware] Session validation error:", err);
    return null;
  }
}

function redirectToLogin(request) {
  const loginUrl = new URL("/results-portal/login", request.url);
  loginUrl.searchParams.set("from", request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}
