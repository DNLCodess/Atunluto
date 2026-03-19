// lib/hooks/useAuth.js
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useCallback } from "react";
import { createClient } from "@/supabase/client";
import { loginAction } from "@/app/actions/auth";

const supabase = createClient();

export const AUTH_QUERY_KEY = ["auth"];

// ─── Timeout wrapper ──────────────────────────────────────────────────────────
// Supabase network calls can hang indefinitely on no connection.
// This races the call against a timeout so we always resolve.
function withTimeout(promise, ms = 8000) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error("AUTH_TIMEOUT")), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

// ─── Fetcher ──────────────────────────────────────────────────────────────────
async function fetchAuthUser() {
  // getUser() validates JWT server-side — never returns a false null on refresh.
  // Wrapped in a timeout so offline/slow networks fail fast instead of hanging.
  const {
    data: { user },
    error: userError,
  } = await withTimeout(supabase.auth.getUser());

  if (userError) {
    // AUTH_TIMEOUT or network error — throw so React Query can retry/show error
    // but don't treat it as "logged out"
    if (
      userError.message === "AUTH_TIMEOUT" ||
      userError.message?.includes("fetch") ||
      userError.message?.includes("network") ||
      userError.status === 0
    ) {
      throw new Error("NETWORK_ERROR");
    }
    // Actual auth error (expired token, invalid JWT) — user is genuinely out
    return null;
  }

  if (!user) return null;

  // Fetch admin profile — also timeout-guarded
  const { data: profile, error: profileError } = await withTimeout(
    supabase
      .from("admins")
      .select("id, role, email, is_active")
      .eq("id", user.id)
      .single(),
  );

  // Profile fetch failed due to network — don't log user out, throw instead
  if (profileError) {
    if (
      profileError.message?.includes("fetch") ||
      profileError.message?.includes("network") ||
      profileError.code === "PGRST301" // Supabase connection error
    ) {
      throw new Error("NETWORK_ERROR");
    }
    // Profile doesn't exist or inactive — genuinely not an admin
    return null;
  }

  if (!profile || profile.is_active === false) return null;

  return {
    user: { id: user.id, email: user.email },
    profile,
    role: profile.role,
  };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useAuth() {
  const queryClient = useQueryClient();
  const listenerRef = useRef(false);

  const {
    data: authData,
    isLoading,
    fetchStatus,
    error: authError,
    isError,
  } = useQuery({
    queryKey: AUTH_QUERY_KEY,
    queryFn: fetchAuthUser,
    // Retry on NETWORK_ERROR (transient), but not on auth errors (permanent)
    retry: (failureCount, error) => {
      if (error?.message === "NETWORK_ERROR") return failureCount < 3;
      return false;
    },
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000), // exponential: 1s, 2s, 4s
    staleTime: 5 * 60 * 1000,
    gcTime: Infinity,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true, // re-validate when network comes back
  });

  // Auth state listener — only handles token refresh.
  // Logout is handled server-side via /api/logout/dashboard (hard redirect).
  // The SIGNED_OUT handler was removed because it set isAuthenticated = false
  // synchronously, causing AdminLayoutWrapper to render null (blank page)
  // before the page navigation completed.
  useEffect(() => {
    if (listenerRef.current) return;
    listenerRef.current = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "TOKEN_REFRESHED") {
        queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY });
      }
    });

    return () => subscription.unsubscribe();
  }, [queryClient]);

  // Login
  const loginMutation = useMutation({
    mutationFn: async (credentials) => {
      const result = await loginAction(credentials);
      if (result.error) throw new Error(result.error);
      return result;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(AUTH_QUERY_KEY, {
        user: { id: data.profile.id, email: data.profile.email },
        profile: data.profile,
        role: data.profile.role,
      });
    },
  });

  // isResolvingAuth: true only when genuinely no data and actively fetching.
  // Prevents spinner from flashing during background refetches.
  const isResolvingAuth = isLoading && fetchStatus === "fetching";

  // Network error state: query threw NETWORK_ERROR and all retries exhausted.
  // In this case we DON'T know if user is logged in — show a specific message.
  const isNetworkError = isError && authError?.message === "NETWORK_ERROR";

  // If we have cached auth data from a previous successful fetch and we're now
  // getting a network error, keep treating user as authenticated (optimistic).
  // Only fully de-auth if the server explicitly says they're not valid.
  const hasStaleAuth =
    isNetworkError && !!queryClient.getQueryData(AUTH_QUERY_KEY);

  const effectiveAuthData = hasStaleAuth
    ? queryClient.getQueryData(AUTH_QUERY_KEY)
    : authData;

  return {
    user: effectiveAuthData?.user ?? null,
    profile: effectiveAuthData?.profile ?? null,
    role: effectiveAuthData?.role ?? null,

    isLoading: isResolvingAuth,
    isAuthenticated: !!effectiveAuthData?.user,

    // Expose network error so layout can show a banner instead of blank screen
    isNetworkError: isNetworkError && !hasStaleAuth,

    login: loginMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error?.message ?? null,
  };
}

export function useRequireAuth() {
  const { isAuthenticated, isLoading, role, isNetworkError } = useAuth();
  return { isAuthenticated, isLoading, role, isNetworkError };
}
