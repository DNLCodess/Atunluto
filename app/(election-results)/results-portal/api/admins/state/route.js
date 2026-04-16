/**
 * GET  /results-portal/api/admins/state  — fetchElectionStateAdmins
 * POST /results-portal/api/admins/state  — createElectionStateAdmin
 */

import { createAdminClient } from "@/supabase/admin";
import { getResultsSession } from "@/lib/erms-session";
import { generateSecurePassword } from "@/utils/password-generator";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getResultsSession();
  if (!session || session.role !== "state_admin") {
    return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("election_admins")
    .select(
      `id, email, full_name, phone, role,
       is_active, must_change_password,
       last_login, created_at,
       creator:created_by ( full_name )`,
    )
    .eq("role", "state_admin")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request) {
  const session = await getResultsSession();
  if (!session || session.role !== "state_admin") {
    return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const fullName = body.full_name?.trim();
  const email = body.email?.trim().toLowerCase();
  const phone = body.phone?.trim() || null;

  if (!fullName || !email) {
    return NextResponse.json(
      { error: "Full name and email are required." },
      { status: 400 },
    );
  }

  const plainPassword = generateSecurePassword(12);
  const supabase = createAdminClient();
  const hdrs = await headers();
  const ipAddress = hdrs.get("x-forwarded-for") || "unknown";
  const userAgent = hdrs.get("user-agent") || "unknown";

  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email,
    password: plainPassword,
    email_confirm: true,
    user_metadata: { full_name: fullName, role: "state_admin" },
  });

  if (authError) {
    if (authError.code === "email_exists" || authError.status === 422) {
      return NextResponse.json(
        { error: "An account with this email address already exists." },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: `Account creation failed: ${authError.message || "Unknown error"}` },
      { status: 500 },
    );
  }

  const { data: newAdmin, error } = await supabase
    .from("election_admins")
    .insert({
      id: authUser.user.id,
      email,
      full_name: fullName,
      phone,
      role: "state_admin",
      must_change_password: true,
      created_by: session.id,
    })
    .select("id, email, full_name")
    .single();

  if (error) {
    await supabase.auth.admin.deleteUser(authUser.user.id);
    return NextResponse.json(
      { error: "Failed to create account. Please try again." },
      { status: 500 },
    );
  }

  await supabase.from("result_audit_log").insert({
    action: "INSERT",
    table_name: "election_admins",
    record_id: newAdmin.id,
    new_values: { email, full_name: fullName, role: "state_admin" },
    performed_by: session.id,
    ip_address: ipAddress,
    user_agent: userAgent,
    notes: "State Admin account created by State Admin",
  });

  return NextResponse.json({ success: true, admin: newAdmin, plainPassword });
}
