/**
 * POST /results-portal/api/auth/change-password
 * Replaces the changeResultsPassword server action.
 * Returns { success, redirect } on success or { error } on failure.
 */

import { createAdminClient } from "@/supabase/admin";
import { createErmsClient } from "@/supabase/erms-server";
import { createClient } from "@supabase/supabase-js";
import { getResultsSession } from "@/lib/erms-session";
import { validatePasswordStrength } from "@/utils/password-generator";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

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

  const ermsClient = await createErmsClient();
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

  if (session.must_change_password) {
    const dest =
      session.role === "state_admin"
        ? "/results-portal/admin"
        : session.role === "polling_unit_admin"
          ? "/results-portal/pu"
          : "/results-portal/lga";
    return NextResponse.json({ success: true, redirect: dest });
  }

  return NextResponse.json({ success: true });
}
