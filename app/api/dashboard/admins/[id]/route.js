/**
 * PATCH  /api/dashboard/admins/[id]  — toggleAdminStatus
 * DELETE /api/dashboard/admins/[id]  — deleteAdminAccount
 */

import { createClient } from "@/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
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
    .select("id, email, role, lga, is_active")
    .eq("id", user.id)
    .single();

  return data ?? null;
}

export async function PATCH(request, { params }) {
  const actor = await getCurrentAdmin();
  if (!actor || !actor.is_active) {
    return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  }

  const { id: adminId } = await params;
  const body = await request.json().catch(() => ({}));
  const { newStatus } = body;

  const service = makeServiceClient();
  const { data: target, error: fetchError } = await service
    .from("admins")
    .select("id, role, lga")
    .eq("id", adminId)
    .single();

  if (fetchError || !target) {
    return NextResponse.json({ error: "Admin not found." }, { status: 404 });
  }

  if (actor.role === "super_user") {
    if (target.lga !== actor.lga || ["super_user", "state_admin"].includes(target.role)) {
      return NextResponse.json({ error: "You cannot modify this account." }, { status: 403 });
    }
  } else if (actor.role !== "state_admin") {
    return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  }

  const { error } = await service
    .from("admins")
    .update({ is_active: newStatus })
    .eq("id", adminId);

  if (error) return NextResponse.json({ error: "Failed to update status." }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(request, { params }) {
  const actor = await getCurrentAdmin();
  if (!actor) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });

  const { id: adminId } = await params;
  const service = makeServiceClient();

  const { data: target } = await service
    .from("admins")
    .select("id, role, lga, email")
    .eq("id", adminId)
    .single();

  if (!target) return NextResponse.json({ error: "Admin not found." }, { status: 404 });

  if (actor.role === "super_user") {
    if (target.lga !== actor.lga || ["super_user", "state_admin"].includes(target.role)) {
      return NextResponse.json({ error: "You cannot delete this account." }, { status: 403 });
    }
  } else if (actor.role !== "state_admin") {
    return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  }

  const { error } = await service.auth.admin.deleteUser(adminId);
  if (error) return NextResponse.json({ error: "Failed to delete account." }, { status: 500 });

  return NextResponse.json({ success: true });
}
