/**
 * GET  /results-portal/api/admins/pu?lga=...  — fetchPUAdmins
 * POST /results-portal/api/admins/pu           — createPUAdmin
 */

import { createAdminClient } from "@/supabase/admin";
import { getResultsSession } from "@/lib/erms-session";
import { generateSecurePassword } from "@/utils/password-generator";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

const VALID_LGAS = [
  "Ibadan North", "Ibadan North-East", "Ibadan North-West",
  "Ibadan South-East", "Ibadan South-West", "Ibarapa Central",
  "Ibarapa East", "Ibarapa North", "Ido",
];

export async function GET(request) {
  const session = await getResultsSession();
  if (!session || !["state_admin", "lga_admin"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const lgaFilter = searchParams.get("lga") || null;

  // LGA admin can only see their own LGA
  const effectiveLga = session.role === "lga_admin" ? session.lga : lgaFilter;

  const supabase = createAdminClient();
  let query = supabase
    .from("election_admins")
    .select(
      `id, email, full_name, phone, lga, ward, polling_unit,
       role, is_active, must_change_password,
       last_login, created_at,
       creator:created_by ( full_name ),
       parent:parent_admin_id ( full_name, lga )`,
    )
    .eq("role", "polling_unit_admin")
    .order("lga")
    .order("ward")
    .order("created_at", { ascending: false });

  if (effectiveLga) query = query.eq("lga", effectiveLga);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request) {
  const session = await getResultsSession();
  if (!session || !["state_admin", "lga_admin"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const fullName = body.full_name?.trim();
  const email = body.email?.trim().toLowerCase();
  const phone = body.phone?.trim() || null;
  const lga = body.lga?.trim();
  const ward = body.ward?.trim();
  const pollingUnit = body.polling_unit?.trim();

  if (!fullName || !email || !lga || !ward || !pollingUnit) {
    return NextResponse.json(
      { error: "Full name, email, LGA, ward, and polling unit are required." },
      { status: 400 },
    );
  }

  if (session.role === "lga_admin" && lga !== session.lga) {
    return NextResponse.json(
      { error: `You can only create Polling Unit Admins for ${session.lga}.` },
      { status: 403 },
    );
  }

  if (!VALID_LGAS.includes(lga)) {
    return NextResponse.json({ error: "Invalid LGA selected." }, { status: 400 });
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
    user_metadata: { full_name: fullName, role: "polling_unit_admin", lga, ward, polling_unit: pollingUnit },
  });

  if (authError) {
    if (authError.code === "email_exists" || authError.status === 422 ||
        authError.message?.includes("already registered")) {
      return NextResponse.json(
        { error: "An account with this email address already exists." },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: "Failed to create account. Please try again." },
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
      lga,
      ward,
      polling_unit: pollingUnit,
      role: "polling_unit_admin",
      must_change_password: true,
      created_by: session.id,
      parent_admin_id: session.role === "lga_admin" ? session.id : null,
    })
    .select("id, email, full_name, lga, ward, polling_unit")
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
    new_values: { email, full_name: fullName, lga, ward, polling_unit: pollingUnit, role: "polling_unit_admin" },
    performed_by: session.id,
    ip_address: ipAddress,
    user_agent: userAgent,
    notes: `PU Admin created by ${session.role === "lga_admin" ? "LGA Admin" : "State Admin"}`,
  });

  return NextResponse.json({ success: true, admin: newAdmin, plainPassword });
}
