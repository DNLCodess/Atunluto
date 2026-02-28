import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const SESSION_COOKIE = "erms_session";
const PUBLIC_PATHS = ["/results-portal/login"];
const CHANGE_PWD_PATH = "/results-portal/change-password";
const STATE_ADMIN_BASE = "/results-portal/admin";
const LGA_ADMIN_BASE = "/results-portal/lga";
const PU_ADMIN_BASE = "/results-portal/pu";

export async function handleResultsRoutes(request) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/results-portal")) return NextResponse.next();

  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "?")))
    return NextResponse.next();

  const sessionToken = request.cookies.get(SESSION_COOKIE)?.value;
  if (!sessionToken) return redirectToLogin(request);

  const session = await validateERMSSession(sessionToken, request);
  if (!session) {
    const response = redirectToLogin(request);
    response.cookies.delete(SESSION_COOKIE);
    return response;
  }

  // Force password change
  if (session.must_change_password && pathname !== CHANGE_PWD_PATH)
    return NextResponse.redirect(new URL(CHANGE_PWD_PATH, request.url));

  // Role-based route guards
  if (pathname.startsWith(STATE_ADMIN_BASE) && session.role !== "state_admin")
    return NextResponse.redirect(
      new URL(dashboardForRole(session.role), request.url),
    );

  if (pathname.startsWith(LGA_ADMIN_BASE) && session.role !== "lga_admin")
    return NextResponse.redirect(
      new URL(dashboardForRole(session.role), request.url),
    );

  if (
    pathname.startsWith(PU_ADMIN_BASE) &&
    session.role !== "polling_unit_admin"
  )
    return NextResponse.redirect(
      new URL(dashboardForRole(session.role), request.url),
    );

  // Root redirect
  if (pathname === "/results-portal" || pathname === "/results-portal/") {
    return NextResponse.redirect(
      new URL(dashboardForRole(session.role), request.url),
    );
  }

  // Inject session info into headers for server components
  const response = NextResponse.next();
  response.headers.set("x-erms-id", session.id);
  response.headers.set("x-erms-role", session.role);
  response.headers.set("x-erms-lga", session.lga || "");
  response.headers.set("x-erms-ward", session.ward || "");
  response.headers.set("x-erms-polling-unit", session.polling_unit || "");
  response.headers.set("x-erms-name", session.full_name || "");
  return response;
}

function dashboardForRole(role) {
  if (role === "state_admin") return "/results-portal/admin";
  if (role === "lga_admin") return "/results-portal/lga";
  return "/results-portal/pu";
}

async function validateERMSSession(token, request) {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { cookies: { getAll: () => request.cookies.getAll(), setAll: () => {} } },
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
    )
      return null;

    const { data: admin } = await supabase
      .from("election_admins")
      .select(
        "id, full_name, role, lga, ward, polling_unit, must_change_password, is_active",
      )
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
