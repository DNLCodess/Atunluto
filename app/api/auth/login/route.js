/**
 * POST /api/auth/login
 * Dashboard admin login — replaces the loginAction server action.
 * Sets Supabase auth session cookies + dashboard_last_active cookie.
 * Returns { success, profile } on success or { error } on failure.
 * Client handles role-based redirect after receiving the response.
 */

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const email = body.email?.trim().toLowerCase();
  const password = body.password;

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 },
    );
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
    if (
      error.message.includes("Invalid login credentials") ||
      error.message.includes("invalid_credentials")
    ) {
      return NextResponse.json(
        { error: "Invalid email or password. Please try again." },
        { status: 401 },
      );
    }
    if (error.message.includes("Email not confirmed")) {
      return NextResponse.json(
        { error: "Please verify your email address before logging in." },
        { status: 401 },
      );
    }
    if (error.message.includes("Too many requests")) {
      return NextResponse.json(
        { error: "Too many login attempts. Please wait a few minutes." },
        { status: 429 },
      );
    }
    return NextResponse.json(
      { error: "Login failed. Please try again." },
      { status: 401 },
    );
  }

  const { data: profile, error: profileError } = await supabase
    .from("admins")
    .select("id, role, email, is_active")
    .eq("id", data.user.id)
    .single();

  if (profileError || !profile) {
    await supabase.auth.signOut();
    return NextResponse.json(
      {
        error:
          "Access denied. This account does not have administrator privileges.",
      },
      { status: 403 },
    );
  }

  if (profile.is_active === false) {
    await supabase.auth.signOut();
    return NextResponse.json(
      { error: "Your account has been deactivated. Contact a superuser." },
      { status: 403 },
    );
  }

  // Seed the server-side idle-timeout cookie
  cookieStore.set("dashboard_last_active", String(Date.now()), {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return NextResponse.json({
    success: true,
    profile: { id: profile.id, role: profile.role, email: profile.email },
  });
}
