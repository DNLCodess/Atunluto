import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * ERMS-namespaced Supabase SSR client.
 *
 * All cookies are:
 *  - Prefixed with "erms_" so they never collide with the dashboard's sb-* cookies
 *  - Path-scoped to "/results-portal" so they're only sent on ERMS routes
 *  - Session cookies (maxAge/expires stripped) — cleared on browser/tab close
 *
 * getAll strips the "erms_" prefix when presenting cookies to the SDK so it
 * can locate its own tokens. setAll adds the prefix back when writing.
 */

const ERMS_PREFIX = "erms_";
const ERMS_PATH = "/results-portal";

export async function createErmsClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore
            .getAll()
            .filter((c) => c.name.startsWith(ERMS_PREFIX))
            .map((c) => ({
              name: c.name.slice(ERMS_PREFIX.length),
              value: c.value,
            }));
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options = {} }) => {
              const { maxAge, expires, ...rest } = options;
              const isRemoval = maxAge === 0;
              cookieStore.set(ERMS_PREFIX + name, value, {
                ...rest,
                ...(isRemoval ? { maxAge: 0 } : {}),
                path: ERMS_PATH,
                httpOnly: true,
                sameSite: "lax",
                secure: process.env.NODE_ENV === "production",
              });
            });
          } catch {
            // Called from a Server Component — safe to ignore
          }
        },
      },
    }
  );
}
