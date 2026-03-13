import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          if (typeof document === "undefined") return [];
          return document.cookie.split(";").reduce((acc, part) => {
            const idx = part.indexOf("=");
            if (idx < 0) return acc;
            const name = part.slice(0, idx).trim();
            const value = part.slice(idx + 1).trim();
            if (name) acc.push({ name, value: decodeURIComponent(value) });
            return acc;
          }, []);
        },
        setAll(cookiesToSet) {
          if (typeof document === "undefined") return;
          cookiesToSet.forEach(({ name, value, options = {} }) => {
            // Preserve maxAge: 0 for cookie removal, but strip maxAge/expires
            // for normal sets so the cookie is a session cookie (cleared on browser close).
            const isRemoval = !value;
            let str = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;
            const path = options.path ?? "/";
            const sameSite = options.sameSite ?? "lax";
            str += `; Path=${path}; SameSite=${sameSite}`;
            if (options.domain) str += `; Domain=${options.domain}`;
            if (options.secure) str += `; Secure`;
            if (isRemoval) str += `; Max-Age=0`;
            // No Max-Age or Expires for normal sets → session cookie
            document.cookie = str;
          });
        },
      },
    }
  );
}
