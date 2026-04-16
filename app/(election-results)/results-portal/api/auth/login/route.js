/**
 * POST /results-portal/api/auth/login
 * ERMS login — replaces the loginResultsAdmin server action.
 *
 * Placed under /results-portal/ so the browser sends erms_sb-* cookies
 * (which are path-scoped to /results-portal) on all subsequent API calls.
 *
 * Returns { success, redirect } on success or { error } on failure.
 * Client handles the redirect via router.push().
 */

import { createAdminClient } from "@/supabase/admin";
import { createErmsClient } from "@/supabase/erms-server";
import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";

async function logAuthEvent(supabase, adminId, action, ipAddress, userAgent, notes = null) {
  try {
    await supabase.from("result_audit_log").insert({
      action,
      table_name: "election_admins",
      performed_by: adminId,
      ip_address: ipAddress,
      user_agent: userAgent,
      notes,
    });
  } catch {
    // non-fatal
  }
}

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const email = body.email?.trim().toLowerCase();
  const password = body.password?.toString();
  const from = body.from?.trim() || null;

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();
  const hdrs = await headers();
  const ipAddress = hdrs.get("x-forwarded-for") || "unknown";
  const userAgent = hdrs.get("user-agent") || "unknown";

  // Fetch ERMS profile first — cheaper than an auth round-trip for inactive accounts
  const { data: admin, error: fetchError } = await supabase
    .from("election_admins")
    .select("id, email, full_name, role, lga, must_change_password, is_active")
    .eq("email", email)
    .single();

  if (fetchError || !admin) {
    await logAuthEvent(supabase, null, "LOGIN_FAILED", ipAddress, userAgent, `No account: ${email}`);
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  if (!admin.is_active) {
    await logAuthEvent(supabase, admin.id, "LOGIN_FAILED", ipAddress, userAgent, "Account deactivated");
    return NextResponse.json(
      { error: "Your account has been deactivated. Contact the State Admin." },
      { status: 403 },
    );
  }

  // Authenticate via Supabase Auth — sets erms_sb-* session cookies
  const ermsClient = await createErmsClient();
  const { error: signInError } = await ermsClient.auth.signInWithPassword({ email, password });

  if (signInError) {
    await logAuthEvent(supabase, admin.id, "LOGIN_FAILED", ipAddress, userAgent, "Bad password");
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  // Update last_login (non-fatal)
  supabase
    .from("election_admins")
    .update({ last_login: new Date().toISOString() })
    .eq("id", admin.id)
    .then(() => {})
    .catch(() => {});

  await logAuthEvent(supabase, admin.id, "LOGIN_SUCCESS", ipAddress, userAgent);

  // Seed the server-side idle-timeout cookie
  const cookieStore = await cookies();
  cookieStore.set("erms_last_active", String(Date.now()), {
    path: "/results-portal",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  if (admin.must_change_password) {
    return NextResponse.json({
      success: true,
      redirect: "/results-portal/change-password",
    });
  }

  const roleDest =
    admin.role === "state_admin"
      ? "/results-portal/admin"
      : admin.role === "polling_unit_admin"
        ? "/results-portal/pu"
        : "/results-portal/lga";

  const isSafe =
    from &&
    from.startsWith("/results-portal/") &&
    !from.includes("//") &&
    !from.startsWith("/results-portal/login");

  return NextResponse.json({
    success: true,
    redirect: isSafe ? from : roleDest,
  });
}
