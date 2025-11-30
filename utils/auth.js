/**
 * Authentication utility for Atunluto Group admin login
 * Handles email/password authentication with Supabase
 */

import useAuthStore from "@/lib/store";
import { createClient } from "@/supabase/client";

/**
 * Login function for administrators
 * @param {string} email - User's email address
 * @param {string} password - User's password
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function loginAdmin(email, password) {
  try {
    // === Input validation (unchanged) ===
    if (!email || !email.trim())
      return { success: false, error: "Email is required" };
    if (!password || !password.trim())
      return { success: false, error: "Password is required" };

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email))
      return { success: false, error: "Invalid email format" };
    if (password.length < 6)
      return {
        success: false,
        error: "Password must be at least 6 characters",
      };

    const supabase = createClient();

    // === Step 1: Sign in with email/password ===
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        return { success: false, error: "Invalid email or password" };
      }
      if (error.message.includes("Email not confirmed")) {
        return { success: false, error: "Please verify your email address" };
      }
      return { success: false, error: "Login failed. Please try again." };
    }

    console.log("Login successful:", data);
    // === Step 2: Fetch user profile from `users` table using auth ID ===
    const { data: profile, error: profileError } = await supabase
      .from("admins")
      .select("*")
      .eq("id", data.user.id)
      .single();

    if (profileError) {
      console.error("Profile fetch error:", profileError);
      // Still log in, but without role (fallback)
      useAuthStore.getState().setAuth(data.user, data.session, null);
    } else {
      // Success: Save user, session, and profile (with role)
      useAuthStore
        .getState()
        .setAuth(data.user, data.session, profile, profile.role);
    }

    return {
      success: true,
      data: {
        user: data.user,
        session: data.session,
        profile: profile || null,
      },
    };
  } catch (err) {
    console.error("Unexpected login error:", err);
    return { success: false, error: "An unexpected error occurred." };
  }
}

/**
 * Logout function for administrators
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function logoutAdmin() {
  try {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();

    if (!error) {
      // Clear Zustand
      useAuthStore.getState().logout();
    }

    return { success: !error, error: error?.message };
  } catch (err) {
    return { success: false, error: "Unexpected error" };
  }
}

/**
 * Get current authenticated user
 * @returns {Promise<{user: object | null}>}
 */
export async function getCurrentUser() {
  try {
    const supabase = createClient();

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      console.error("Get user error:", error);
      return { user: null };
    }

    return { user };
  } catch (err) {
    console.error("Unexpected error getting user:", err);
    return { user: null };
  }
}

/**
 * Check if user is authenticated
 * @returns {Promise<boolean>}
 */
export async function isAuthenticated() {
  const { user } = await getCurrentUser();
  return user !== null;
}
