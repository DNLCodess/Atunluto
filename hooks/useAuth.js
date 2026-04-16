// lib/hooks/useAuth.js
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { createClient } from "@/supabase/client";

const supabase = createClient();

export const AUTH_QUERY_KEY = ["auth"];

function withTimeout(promise, ms = 8000) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error("AUTH_TIMEOUT")), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

async function fetchAuthUser() {
  const {
    data: { user },
    error: userError,
  } = await withTimeout(supabase.auth.getUser());

  if (userError) {
    if (
      userError.message === "AUTH_TIMEOUT" ||
      userError.message?.includes("fetch") ||
      userError.message?.includes("network") ||
      userError.status === 0
    ) {
      throw new Error("NETWORK_ERROR");
    }
    return null;
  }

  if (!user) return null;

  const { data: profile, error: profileError } = await withTimeout(
    supabase
      .from("admins")
      .select("id, role, email, is_active")
      .eq("id", user.id)
      .single(),
  );

  if (profileError) {
    if (
      profileError.message?.includes("fetch") ||
      profileError.message?.includes("network") ||
      profileError.code === "PGRST301"
    ) {
      throw new Error("NETWORK_ERROR");
    }
    return null;
  }

  if (!profile || profile.is_active === false) return null;

  return {
    user: { id: user.id, email: user.email },
    profile,
    role: profile.role,
  };
}

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
    retry: (failureCount, error) => {
      if (error?.message === "NETWORK_ERROR") return failureCount < 3;
      return false;
    },
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
    staleTime: 5 * 60 * 1000,
    gcTime: Infinity,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

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

  // Login — calls /api/auth/login instead of the server action
  const loginMutation = useMutation({
    mutationFn: async (credentials) => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Login failed.");
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(AUTH_QUERY_KEY, {
        user: { id: data.profile.id, email: data.profile.email },
        profile: data.profile,
        role: data.profile.role,
      });
    },
  });

  const isResolvingAuth = isLoading && fetchStatus === "fetching";
  const isNetworkError = isError && authError?.message === "NETWORK_ERROR";
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
