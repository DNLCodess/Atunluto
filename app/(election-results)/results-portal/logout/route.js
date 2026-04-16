/**
 * GET  /results-portal/logout  — browser navigation (inactivity timer, logout button)
 * POST /results-portal/logout  — programmatic fetch-based logout
 *
 * Guaranteed logout strategy:
 *  1. Invalidate the Supabase session server-side.
 *  2. Explicitly clear every erms_* cookie on the response using
 *     response.cookies.set() — the only pattern that reliably works in
 *     Route Handlers (cookieStore.set() from next/headers is not reliable here).
 *  3. GET returns a bare-HTML interstitial (no React, no JS chunks) that
 *     unregisters the service worker, wipes all caches, then does a hard
 *     window.location.replace() to the login page.  This breaks any stale
 *     cached-chunk cycle on Plesk / reverse-proxy environments.
 *  4. POST returns { ok: true } with the same cookie clearing.
 */

import { createServerClient } from "@supabase/ssr";
import { createAdminClient } from "@/supabase/admin";
import { NextResponse } from "next/server";

const ERMS_PREFIX = "erms_";
const ERMS_PATH = "/results-portal";
const LOGIN_PATH = "/results-portal/login";

// Known ERMS cookie names (prefixed) to force-clear even if signOut()
// doesn't enumerate them (e.g. when the session is already expired).
const KNOWN_ERMS_COOKIES = [
  "erms_sb-access-token",
  "erms_sb-refresh-token",
  "erms_sb-auth-token",
  "erms_last_active",
];

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

/**
 * Sign out via Supabase and collect any cookies it wants to set/clear.
 * Uses request.cookies for reading and captures setAll into pendingCookies
 * so the caller can apply them to the NextResponse.
 */
async function signOutAndCollectCookies(request) {
  let pendingCookies = [];
  try {
    const ermsClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      {
        cookies: {
          getAll() {
            return request.cookies
              .getAll()
              .filter((c) => c.name.startsWith(ERMS_PREFIX))
              .map((c) => ({ name: c.name.slice(ERMS_PREFIX.length), value: c.value }));
          },
          setAll(cookiesToSet) {
            pendingCookies = cookiesToSet;
          },
        },
      },
    );
    await ermsClient.auth.signOut();

    // Also invalidate via admin client (best effort — kills the token server-side)
    try {
      const { data } = await ermsClient.auth.getClaims();
      if (data?.claims?.sub) {
        const admin = createAdminClient();
        await admin.auth.admin.signOut(data.claims.sub, "global").catch(() => {});
      }
    } catch {
      // non-fatal
    }
  } catch {
    // non-fatal
  }
  return pendingCookies;
}

/** Apply Supabase-collected cookies + force-clear all known ERMS cookies. */
function applyCookieClear(response, pendingCookies) {
  const clearOpts = {
    path: ERMS_PATH,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
  };

  // Apply whatever Supabase asked to set (typically empty values with maxAge 0)
  pendingCookies.forEach(({ name, value, options = {} }) => {
    response.cookies.set(ERMS_PREFIX + name, value ?? "", {
      ...options,
      ...clearOpts,
    });
  });

  // Force-clear known cookie names regardless
  KNOWN_ERMS_COOKIES.forEach((name) => {
    response.cookies.set(name, "", clearOpts);
  });

  // Also clear any erms_* cookies present in the current request
  // that weren't covered above
  response.request?.cookies?.getAll?.()
    .filter((c) => c.name.startsWith(ERMS_PREFIX))
    .forEach((c) => {
      response.cookies.set(c.name, "", clearOpts);
    });
}

// ---------------------------------------------------------------------------
// GET — browser navigates here directly (inactivity redirect, logout button)
// ---------------------------------------------------------------------------
export async function GET(request) {
  const pendingCookies = await signOutAndCollectCookies(request);
  const origin = getPublicOrigin(request);
  const loginUrl = `${origin}${LOGIN_PATH}`;

  // Return a bare-HTML page — no React, no JS chunks required.
  // The inline script clears the service worker + all caches, then
  // hard-navigates to the login page so the browser fetches a fully
  // fresh HTML + chunk set (no stale-cache application error).
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Signing out…</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{display:flex;align-items:center;justify-content:center;
         min-height:100vh;font-family:system-ui,sans-serif;
         background:#f0fdf4;color:#166534}
    p{font-size:15px;opacity:.7}
  </style>
</head>
<body>
  <p>Signing out…</p>
  <script>
    (async () => {
      try {
        if ('serviceWorker' in navigator) {
          const regs = await navigator.serviceWorker.getRegistrations();
          await Promise.all(regs.map(r => r.unregister()));
        }
        if ('caches' in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map(k => caches.delete(k)));
        }
        localStorage.removeItem('erms-session');
        sessionStorage.clear();
      } catch (_) {}
      window.location.replace(${JSON.stringify(loginUrl)});
    })();
  </script>
</body>
</html>`;

  const response = new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });

  applyCookieClear(response, pendingCookies);
  return response;
}

// ---------------------------------------------------------------------------
// POST — fetch-based programmatic logout
// ---------------------------------------------------------------------------
export async function POST(request) {
  const pendingCookies = await signOutAndCollectCookies(request);
  const response = NextResponse.json({ ok: true });
  applyCookieClear(response, pendingCookies);
  return response;
}
