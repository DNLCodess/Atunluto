// lib/hooks/useAuth.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { createClient } from "@/supabase/client";
import useAuthStore from "@/lib/store";

const supabase = createClient();

async function fetchAuthUser() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("admins")
    .select("*")
    .eq("id", session.user.id)
    .single();

  return {
    user: session.user,
    session,
    profile,
    role: profile?.role || null,
  };
}

async function loginUser({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error) {
    if (error.message.includes("Invalid login credentials")) {
      throw new Error("Invalid email or password");
    }
    if (error.message.includes("Email not confirmed")) {
      throw new Error("Please verify your email address");
    }
    throw new Error("Login failed. Please try again.");
  }

  const { data: profile } = await supabase
    .from("admins")
    .select("*")
    .eq("id", data.user.id)
    .single();

  return {
    user: data.user,
    session: data.session,
    profile,
    role: profile?.role || null,
  };
}

async function logoutUser() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  return true;
}

export function useAuth() {
  const queryClient = useQueryClient();
  const { setAuth, logout: clearStore } = useAuthStore();
  const listenerSetup = useRef(false);

  const {
    data: authData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["auth"],
    queryFn: fetchAuthUser,
    retry: false,
    staleTime: Infinity, // Auth doesn't go stale
    cacheTime: Infinity,
    onSuccess: (data) => {
      if (data) {
        setAuth(data.user, data.session, data.profile);
      } else {
        clearStore();
      }
    },
  });

  // Set up auth listener ONCE
  useEffect(() => {
    if (listenerSetup.current) return;
    listenerSetup.current = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth event:", event);

      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        // Refetch auth data
        refetch();
      } else if (event === "SIGNED_OUT") {
        queryClient.setQueryData(["auth"], null);
        queryClient.clear();
        clearStore();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [refetch, queryClient, clearStore]);

  const loginMutation = useMutation({
    mutationFn: loginUser,
    onSuccess: (data) => {
      queryClient.setQueryData(["auth"], data);
      setAuth(data.user, data.session, data.profile);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: logoutUser,
    onSuccess: () => {
      queryClient.setQueryData(["auth"], null);
      queryClient.clear();
      clearStore();
    },
  });

  return {
    user: authData?.user || null,
    profile: authData?.profile || null,
    role: authData?.role || null,
    isLoading,
    isAuthenticated: !!authData?.user,
    error,
    login: loginMutation.mutate,
    logout: logoutMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    loginError: loginMutation.error?.message,
    refetch,
  };
}

export function useRequireAuth() {
  const { isAuthenticated, isLoading } = useAuth();
  return { isAuthenticated, isLoading };
}
