/**
 * POST /results-portal/api/auth/change-password
 * Replaces the changeResultsPassword server action.
 * Returns { success, redirect } on success or { error } on failure.
 *
 * Uses request.cookies + response.cookies.set() so updated session tokens
 * are reliably attached to the outgoing response.
 */

import { createServerClient } from "@supabase/ssr";
import { createAdminClient } from "@/supabase/admin";
import { createClient } from "@supabase/supabase-js";
import { getResultsSession } from "@/lib/erms-session";
import { validatePasswordStrength } from "@/utils/password-generator";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

const ERMS_PREFIX = "erms_";
const ERMS_PATH = "/results-portal";

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const { current_password, new_password, confirm_password } = body;

  if (!new_password || !confirm_password) {
    return NextResponse.json({ error: "All fields are required." }, { status: 400 });
  }

  if (new_password !== confirm_password) {
    return NextResponse.json({ error: "Passwords do not match." }, { status: 400 });
  }

  const { valid, errors } = validatePasswordStrength(new_password);
  if (!valid) {
    return NextResponse.json({ error: errors[0] }, { status: 400 });
  }

  const session = await getResultsSession();
  if (!session) {
    return NextResponse.json(
      { error: "Session expired. Please log in again." },
      { status: 401 },
    );
  }

  const supabase = createAdminClient();
  const hdrs = await headers();
  const ipAddress = hdrs.get("x-forwarded-for") || "unknown";
  const userAgent = hdrs.get("user-agent") || "unknown";

  // Verify current password using a throw-away non-SSR client
  if (current_password) {
    const throwaway = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const { error: verifyError } = await throwaway.auth.signInWithPassword({
      email: session.email,
      password: current_password,
    });
    if (verifyError) {
      return NextResponse.json(
        { error: "Current password is incorrect." },
        { status: 400 },
      );
    }

    if (current_password === new_password) {
      return NextResponse.json(
        { error: "New password must be different from your current password." },
        { status: 400 },
      );
    }
  }

  // Build ERMS client that captures cookies to apply to the response
  let pendingCookies = [];

  const ermsClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies
            .getAll()
            .filter((c) => c.name.startsWith(ERMS_PREFIX))
            .map((c) => ({ name: c.name.slice(ERMS_PREFIX.length), value: c.value }));
        },
        setAll(cookiesToSet) {
          pendingCookies = cookiesToSet;
        },
      },
    },
  );

  const { error: updateError } = await ermsClient.auth.updateUser({ password: new_password });

  if (updateError) {
    return NextResponse.json(
      { error: "Failed to update password. Please try again." },
      { status: 500 },
    );
  }

  await supabase
    .from("election_admins")
    .update({ must_change_password: false })
    .eq("id", session.id);

  try {
    await supabase.from("result_audit_log").insert({
      action: "PASSWORD_CHANGE",
      table_name: "election_admins",
      performed_by: session.id,
      ip_address: ipAddress,
      user_agent: userAgent,
    });
  } catch {
    // non-fatal
  }

  const dest =
    session.role === "state_admin"
      ? "/results-portal/admin"
      : session.role === "polling_unit_admin"
        ? "/results-portal/pu"
        : "/results-portal/lga";

  const response = NextResponse.json({
    success: true,
    ...(session.must_change_password ? { redirect: dest } : {}),
  });

  // Apply any refreshed session cookies to the response
  pendingCookies.forEach(({ name, value, options = {} }) => {
    const { maxAge, expires, ...rest } = options;
    const isRemoval = maxAge === 0;
    response.cookies.set(ERMS_PREFIX + name, value, {
      ...rest,
      ...(isRemoval ? { maxAge: 0 } : {}),
      path: ERMS_PATH,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  });

  return response;
}
