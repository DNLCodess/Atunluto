// app/layout.js
"use client";

import { useEffect } from "react";
import useAuthStore from "@/lib/store";
import { createClient } from "@/supabase/client";

export default function RootLayout({ children }) {
  const setAuth = useAuthStore((state) => state.setAuth);
  const setLoading = useAuthStore((state) => state.setLoading);
  const supabase = createClient();

  useEffect(() => {
    const syncAuth = async () => {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const {
        data: { session },
      } = await supabase.auth.getSession();

      // ✅ Fetch profile with role if user exists
      let profile = null;
      if (user) {
        const { data: profileData } = await supabase
          .from("admins")
          .select("*")
          .eq("id", user.id)
          .single();

        profile = profileData;
      }

      setAuth(user, session, profile);
      setLoading(false);
    };

    syncAuth();

    // Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const user = session?.user ?? null;

        // Fetch profile on auth change
        let profile = null;
        if (user) {
          const { data: profileData } = await supabase
            .from("admins")
            .select("*")
            .eq("id", user.id)
            .single();

          profile = profileData;
        }

        setAuth(user, session, profile);
      }
    );

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, [setAuth, setLoading]);

  return children;
}
