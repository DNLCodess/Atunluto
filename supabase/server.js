import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options = {} }) => {
              // Strip maxAge/expires so all auth cookies are session cookies
              // (cleared when the browser closes, not on soft refresh).
              const { maxAge, expires, ...rest } = options;
              const isRemoval = maxAge === 0;
              cookieStore.set(name, value, {
                ...rest,
                ...(isRemoval ? { maxAge: 0 } : {}),
              });
            });
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}
