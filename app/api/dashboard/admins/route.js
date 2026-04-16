/**
 * GET  /api/dashboard/admins              — getAdminsForActor
 * POST /api/dashboard/admins              — createAdminAccount
 * POST /api/dashboard/admins?type=state   — createStateAdmin
 */

import { createClient } from "@/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { ROLE_HIERARCHY } from "@/lib/permissions";
import { NextResponse } from "next/server";

function makeServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set.");
  return createServiceClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function getCurrentAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("admins")
    .select("id, email, role, lga, full_name, is_active")
    .eq("id", user.id)
    .single();

  return data ?? null;
}

function generateTempPassword(length = 12) {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghjkmnpqrstuvwxyz";
  const digits = "23456789";
  const symbols = "!@#$%";
  const all = upper + lower + digits + symbols;
  const pwd = [
    upper[Math.floor(Math.random() * upper.length)],
    lower[Math.floor(Math.random() * lower.length)],
    digits[Math.floor(Math.random() * digits.length)],
    symbols[Math.floor(Math.random() * symbols.length)],
  ];
  for (let i = 4; i < length; i++) {
    pwd.push(all[Math.floor(Math.random() * all.length)]);
  }
  return pwd.sort(() => Math.random() - 0.5).join("");
}

export async function GET() {
  const actor = await getCurrentAdmin();
  if (!actor) return NextResponse.json({ error: "Unauthorised.", data: [] }, { status: 401 });

  const service = makeServiceClient();
  let query = service
    .from("admins")
    .select("id, email, full_name, role, lga, phone, is_active, created_at, last_login, created_by")
    .order("created_at", { ascending: false });

  if (actor.role === "super_user") {
    query = query.eq("lga", actor.lga).neq("role", "state_admin");
  } else if (actor.role === "administrator") {
    query = query.eq("lga", actor.lga).in("role", ["registration", "manager"]);
  } else if (actor.role !== "state_admin") {
    return NextResponse.json({ data: [], actor });
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message, data: [] }, { status: 500 });
  return NextResponse.json({ data, actor });
}

export async function POST(request) {
  const actor = await getCurrentAdmin();
  if (!actor || !actor.is_active) {
    return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");

  const body = await request.json().catch(() => ({}));
  const email = body.email?.trim().toLowerCase();
  const full_name = body.full_name?.trim();
  const phone = body.phone?.trim() || null;
  const role = body.role?.trim();
  const lga = body.lga?.trim() || null;

  if (!email || !full_name) {
    return NextResponse.json({ error: "Email and full name are required." }, { status: 400 });
  }

  // createStateAdmin path
  if (type === "state") {
    if (actor.role !== "state_admin") {
      return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
    }

    const tempPassword = generateTempPassword();
    const service = makeServiceClient();

    const { data: authData, error: authError } = await service.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { full_name, role: "state_admin" },
    });

    if (authError) {
      if (authError.message?.includes("already registered")) {
        return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
      }
      return NextResponse.json({ error: "Failed to create auth account. Please try again." }, { status: 500 });
    }

    const { error: dbError } = await service.from("admins").insert({
      id: authData.user.id,
      email,
      full_name,
      phone,
      role: "state_admin",
      lga: null,
      created_by: actor.id,
      is_active: true,
    });

    if (dbError) {
      await service.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json({ error: "Failed to save account record. Please try again." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      tempPassword,
      message: `State Admin account created for ${full_name}.`,
    });
  }

  // createAdminAccount path
  if (!role) {
    return NextResponse.json({ error: "Role is required." }, { status: 400 });
  }

  const allowedRoles = ROLE_HIERARCHY[actor.role] || [];
  if (!allowedRoles.includes(role)) {
    return NextResponse.json({ error: `You cannot create a ${role} account.` }, { status: 403 });
  }

  if (actor.role === "super_user" && lga && lga !== actor.lga) {
    return NextResponse.json({ error: "You can only create admins for your own LGA." }, { status: 403 });
  }

  if (role === "super_user" && !lga) {
    return NextResponse.json({ error: "LGA is required for super_user accounts." }, { status: 400 });
  }

  const tempPassword = generateTempPassword();
  const service = makeServiceClient();

  const { data: authData, error: authError } = await service.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { full_name, role, lga },
  });

  if (authError) {
    if (authError.message?.includes("already registered")) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create auth account. Please try again." }, { status: 500 });
  }

  const { error: dbError } = await service.from("admins").insert({
    id: authData.user.id,
    email,
    full_name,
    phone,
    role,
    lga: lga || null,
    created_by: actor.id,
    is_active: true,
  });

  if (dbError) {
    await service.auth.admin.deleteUser(authData.user.id);
    return NextResponse.json({ error: "Failed to save account record. Please try again." }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    tempPassword,
    adminId: authData.user.id,
    message: `Account created for ${full_name}. Share the password securely.`,
  });
}
