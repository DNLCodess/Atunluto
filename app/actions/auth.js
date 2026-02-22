"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Server Action: Login
 * Runs on the server — credentials never exposed in client bundles.
 * Sets the session cookie directly so the dashboard middleware
 * sees an authenticated session immediately (no client round-trip).
 */
export async function loginAction(formData) {
  const email = formData.email?.trim().toLowerCase();
  const { password } = formData;

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    },
  );

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // Never leak Supabase internals to the client
    if (
      error.message.includes("Invalid login credentials") ||
      error.message.includes("invalid_credentials")
    ) {
      return { error: "Invalid email or password. Please try again." };
    }
    if (error.message.includes("Email not confirmed")) {
      return { error: "Please verify your email address before logging in." };
    }
    if (error.message.includes("Too many requests")) {
      return { error: "Too many login attempts. Please wait a few minutes." };
    }
    return { error: "Login failed. Please try again." };
  }

  // Fetch admin profile to confirm this user exists in admins table
  const { data: profile, error: profileError } = await supabase
    .from("admins")
    .select("id, role, email, is_active")
    .eq("id", data.user.id)
    .single();

  if (profileError || !profile) {
    // Valid Supabase auth user but not an admin — sign them out immediately
    await supabase.auth.signOut();
    return {
      error:
        "Access denied. This account does not have administrator privileges.",
    };
  }

  if (profile.is_active === false) {
    await supabase.auth.signOut();
    return {
      error: "Your account has been deactivated. Contact a superuser.",
    };
  }

  // Session cookie is already set by createServerClient above.
  // Return minimal safe profile data to seed React Query cache.
  return {
    success: true,
    profile: {
      id: profile.id,
      role: profile.role,

      email: profile.email,
    },
  };
}
