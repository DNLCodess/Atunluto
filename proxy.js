// middleware.js (project root)
import { NextResponse } from "next/server";
import { updateSession } from "./supabase/middleware";
import { handleResultsRoutes } from "./middleware/results";

export async function proxy(request) {
  const { pathname } = request.nextUrl;

  // ── ERMS routes (/results/*) ──────────────────────────────
  // Handled entirely by the ERMS middleware — bypass Supabase auth.
  // The ERMS system uses its own session table (admin_sessions),
  // not Supabase Auth, so updateSession must not run on these paths.
  if (pathname.startsWith("/results-portal")) {
    return await handleResultsRoutes(request);
  }

  // ── Main platform routes ──────────────────────────────────
  // All other matched paths use the existing Supabase session guard.
  return await updateSession(request);
}

export const config = {
  matcher: [
    // Existing platform routes
    "/dashboard/:path*",
    "/login",

    // All ERMS routes — public login + both admin portals
    "/results-portal/:path*",
  ],
};
