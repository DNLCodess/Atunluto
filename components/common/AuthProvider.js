// lib/providers/auth-provider.jsx
"use client";

import { createContext, useContext, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/supabase/client";
import useAuthStore from "@/lib/store";

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  const { setAuth, logout: clearStore } = useAuthStore();
  const supabase = createClient();
  const subscriptionRef = useRef(null);

  useEffect(() => {
    // Prevent duplicate subscriptions
    if (subscriptionRef.current) {
      return;
    }

    const setupAuthListener = async () => {
      // Initial session check
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        const { data: profile } = await supabase
          .from("admins")
          .select("*")
          .eq("id", session.user.id)
          .single();

        const authData = {
          user: session.user,
          session,
          profile,
          role: profile?.role || null,
        };

        queryClient.setQueryData(["auth"], authData);
        setAuth(session.user, session, profile);
      }

      // Listen for auth changes
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log("Auth event:", event);

        if (event === "SIGNED_IN" && session?.user) {
          const { data: profile } = await supabase
            .from("admins")
            .select("*")
            .eq("id", session.user.id)
            .single();

          const authData = {
            user: session.user,
            session,
            profile,
            role: profile?.role || null,
          };

          queryClient.setQueryData(["auth"], authData);
          setAuth(session.user, session, profile);
        } else if (event === "SIGNED_OUT") {
          queryClient.setQueryData(["auth"], null);
          queryClient.removeQueries({ queryKey: ["members"] });
          queryClient.removeQueries({ queryKey: ["gallery"] });
          queryClient.removeQueries({ queryKey: ["stats"] });
          clearStore();
        } else if (event === "TOKEN_REFRESHED") {
          // Session token was refreshed
          const { data: profile } = await supabase
            .from("admins")
            .select("*")
            .eq("id", session.user.id)
            .single();

          const authData = {
            user: session.user,
            session,
            profile,
            role: profile?.role || null,
          };

          queryClient.setQueryData(["auth"], authData);
          setAuth(session.user, session, profile);
        }
      });

      subscriptionRef.current = subscription;
    };

    setupAuthListener();

    return () => {
      // Proper cleanup
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, []); // Empty deps - only run once

  return <AuthContext.Provider value={{}}>{children}</AuthContext.Provider>;
}

export const useAuthContext = () => useContext(AuthContext);
