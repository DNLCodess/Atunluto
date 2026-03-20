// supabase/middleware.js
import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

const IDLE_TIMEOUT = 15 * 60 * 1000; // 15 minutes

export async function updateSession(request) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options = {} }) => {
            // Strip maxAge/expires so dashboard auth cookies are session cookies
            // (cleared on browser close, not on soft refresh).
            const { maxAge, expires, ...rest } = options;
            const isRemoval = maxAge === 0;
            supabaseResponse.cookies.set(name, value, {
              ...rest,
              ...(isRemoval ? { maxAge: 0 } : {}),
            });
          });
        },
      },
    },
  );

  // IMPORTANT: Don't remove getClaims()
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  const { pathname } = request.nextUrl;
  const isLoginPage = pathname === "/login";
  const isDashboard = pathname.startsWith("/dashboard");

  // Not authenticated → redirect to login
  if (!user && isDashboard) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Authenticated → check server-side idle timeout via last_active cookie.
  // The cookie is set by POST /api/heartbeat/dashboard every 60 seconds.
  // If it exists and is stale, the session has been idle for > 15 minutes
  // server-side — sign out and redirect to login.
  if (user && isDashboard) {
    const lastActive = request.cookies.get("dashboard_last_active")?.value;
    if (lastActive && Date.now() - Number(lastActive) > IDLE_TIMEOUT) {
      const url = request.nextUrl.clone();
      url.pathname = "/api/logout/dashboard";
      return NextResponse.redirect(url);
    }
  }

  // Authenticated → trying to visit login page (back-button guard)
  if (user && isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
