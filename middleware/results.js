import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

const ERMS_PREFIX = "erms_";
const ERMS_PATH = "/results-portal";
const PUBLIC_PATHS = ["/results-portal/login", "/results-portal/logout"];
// API routes handle their own authentication — never redirect them to the login page.
const API_PREFIX = "/results-portal/api/";
const IDLE_TIMEOUT = 15 * 60 * 1000; // 15 minutes
const CHANGE_PWD_PATH = "/results-portal/change-password";
const STATE_ADMIN_BASE = "/results-portal/admin";
const LGA_ADMIN_BASE = "/results-portal/lga";
const PU_ADMIN_BASE = "/results-portal/pu";

export async function handleResultsRoutes(request) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/results-portal")) return NextResponse.next();

  // Public paths — no session required
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "?")))
    return NextResponse.next();

  // API routes manage their own auth — let them through without a redirect
  if (pathname.startsWith(API_PREFIX)) return NextResponse.next();

  // ── ERMS-namespaced Supabase client ───────────────────────────────────────
  // Reads erms_sb-* cookies (strips prefix for the SDK), writes refreshed
  // tokens back with the erms_ prefix and path /results-portal as session cookies.
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies
            .getAll()
            .filter((c) => c.name.startsWith(ERMS_PREFIX))
            .map((c) => ({
              name: c.name.slice(ERMS_PREFIX.length),
              value: c.value,
            }));
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(ERMS_PREFIX + name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options = {} }) => {
            const { maxAge, expires, ...rest } = options;
            const isRemoval = maxAge === 0;
            supabaseResponse.cookies.set(ERMS_PREFIX + name, value, {
              ...rest,
              ...(isRemoval ? { maxAge: 0 } : {}),
              path: ERMS_PATH,
              httpOnly: true,
              sameSite: "lax",
              secure: process.env.NODE_ENV === "production",
            });
          });
        },
      },
    },
  );

  // getClaims() reads the JWT from cookies locally — also refreshes the
  // access token via the refresh token if it is close to expiry.
  // IMPORTANT: do NOT remove or skip this call.
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;

  if (!userId) return redirectToLogin(request);

  // Server-side idle timeout: if erms_last_active is set and stale, the session
  // has been idle for > 15 minutes without a heartbeat — redirect to logout.
  // If the cookie is absent (e.g. first load after login), allow through.
  const lastActive = request.cookies.get("erms_last_active")?.value;
  if (lastActive && Date.now() - Number(lastActive) > IDLE_TIMEOUT) {
    return NextResponse.redirect(new URL("/results-portal/logout", getPublicOrigin(request)));
  }

  // ── Fetch ERMS profile from election_admins ───────────────────────────────
  // The Supabase JWT does not carry role/lga/ward/is_active/must_change_password,
  // so we always look them up from the DB on every protected request.
  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const { data: admin } = await adminSupabase
    .from("election_admins")
    .select(
      "id, full_name, role, lga, ward, polling_unit, must_change_password, is_active",
    )
    .eq("id", userId)
    .single();

  if (!admin || !admin.is_active) return redirectToLogin(request);

  // Force password change before any protected page
  const origin = getPublicOrigin(request);

  if (admin.must_change_password && pathname !== CHANGE_PWD_PATH)
    return NextResponse.redirect(new URL(CHANGE_PWD_PATH, origin));

  // ── Role-based route guards ───────────────────────────────────────────────
  if (pathname.startsWith(STATE_ADMIN_BASE) && admin.role !== "state_admin")
    return NextResponse.redirect(new URL(dashboardForRole(admin.role), origin));

  if (pathname.startsWith(LGA_ADMIN_BASE) && admin.role !== "lga_admin")
    return NextResponse.redirect(new URL(dashboardForRole(admin.role), origin));

  if (pathname.startsWith(PU_ADMIN_BASE) && admin.role !== "polling_unit_admin")
    return NextResponse.redirect(new URL(dashboardForRole(admin.role), origin));

  // Root redirect
  if (pathname === "/results-portal" || pathname === "/results-portal/")
    return NextResponse.redirect(new URL(dashboardForRole(admin.role), origin));

  // ── Inject session context into response headers ──────────────────────────
  // Server-component layouts read these to display user info without a DB call.
  // Must be set on supabaseResponse (which carries any refreshed token cookies).
  supabaseResponse.headers.set("x-erms-id", admin.id);
  supabaseResponse.headers.set("x-erms-role", admin.role);
  supabaseResponse.headers.set("x-erms-lga", admin.lga || "");
  supabaseResponse.headers.set("x-erms-ward", admin.ward || "");
  supabaseResponse.headers.set("x-erms-polling-unit", admin.polling_unit || "");
  supabaseResponse.headers.set("x-erms-name", admin.full_name || "");
  return supabaseResponse;
}

function dashboardForRole(role) {
  if (role === "state_admin") return "/results-portal/admin";
  if (role === "lga_admin") return "/results-portal/lga";
  return "/results-portal/pu";
}

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

function redirectToLogin(request) {
  const loginUrl = new URL("/results-portal/login", getPublicOrigin(request));
  loginUrl.searchParams.set("from", request.nextUrl.pathname);
  // 302 converts POST → GET on redirect, preventing a POST to the login page (405).
  return NextResponse.redirect(loginUrl, { status: 302 });
}
