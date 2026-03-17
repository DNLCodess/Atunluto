"use server";

import { createAdminClient } from "@/supabase/admin";
import { getResultsSession } from "@/app/actions/election-auth";
import { revalidatePath } from "next/cache";

// ─── State Admins ─────────────────────────────────────────────────────────────

export async function fetchElectionStateAdmins() {
  const session = await getResultsSession();
  if (!session || session.role !== "state_admin")
    return { error: "Unauthorised." };

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("election_admins")
    .select(
      `
      id, email, full_name, phone, role,
      is_active, must_change_password,
      last_login, created_at,
      creator:created_by ( full_name )
    `,
    )
    .eq("role", "state_admin")
    .order("created_at", { ascending: false });

  if (error) return { error: error.message };
  return data;
}

export async function deleteElectionAdmin(adminId) {
  const session = await getResultsSession();
  if (!session || session.role !== "state_admin")
    return { error: "Unauthorised." };

  if (adminId === session.id)
    return { error: "You cannot delete your own account." };

  const supabase = createAdminClient();

  // Revoke all sessions first
  await supabase
    .from("admin_sessions")
    .update({ is_revoked: true })
    .eq("admin_id", adminId);

  // Delete from election_admins
  const { error: dbError } = await supabase
    .from("election_admins")
    .delete()
    .eq("id", adminId);

  if (dbError) return { error: "Failed to delete account." };

  // Remove from Supabase Auth
  await supabase.auth.admin.deleteUser(adminId);

  revalidatePath("/results-portal/admin/admins");
  return { success: true };
}

// ─── LGA Admins ───────────────────────────────────────────────────────────────

export async function fetchLGAAdmins() {
  const session = await getResultsSession();
  if (!session || session.role !== "state_admin")
    return { error: "Unauthorised." };

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("election_admins")
    .select(
      `
      id, email, full_name, phone, lga,
      role, is_active, must_change_password,
      last_login, created_at,
      creator:created_by ( full_name )
    `,
    )
    .eq("role", "lga_admin")
    .order("created_at", { ascending: false });

  if (error) return { error: error.message };
  return data;
}

export async function fetchPUAdmins(lgaFilter) {
  const session = await getResultsSession();
  if (!session || !["state_admin", "lga_admin"].includes(session.role))
    return { error: "Unauthorised." };

  // LGA admin can only see their own LGA's PU admins
  const effectiveLga = session.role === "lga_admin" ? session.lga : lgaFilter;

  const supabase = createAdminClient();
  let query = supabase
    .from("election_admins")
    .select(
      `
      id, email, full_name, phone, lga, ward, polling_unit,
      role, is_active, must_change_password,
      last_login, created_at,
      creator:created_by ( full_name )
    `,
    )
    .eq("role", "polling_unit_admin")
    .order("lga")
    .order("ward")
    .order("created_at", { ascending: false });

  if (effectiveLga) query = query.eq("lga", effectiveLga);

  const { data, error } = await query;
  if (error) return { error: error.message };
  return data;
}
