"use server";

import { createClient } from "@/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { ROLE_HIERARCHY } from "@/lib/permissions";

// ─── Two clients ──────────────────────────────────────────────────────────────
// userClient  — cookie-based SSR client, respects RLS, identifies the actor
// serviceClient — service role key, bypasses RLS, required for auth.admin.*
//
// Required env vars:
//   NEXT_PUBLIC_SUPABASE_URL            (already set)
//   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (already set — used by userClient)
//   SUPABASE_SERVICE_ROLE_KEY           ← add this to .env.local if missing
// ─────────────────────────────────────────────────────────────────────────────

function makeServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set. " +
        "Add it to .env.local — never expose it to the browser.",
    );
  }
  return createServiceClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// ─── Identify the currently logged-in actor ───────────────────────────────────
// Always uses the cookie-based client — NOT the service role client.
async function getCurrentAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("admins")
    .select("id, email, role, lga, full_name, is_active")
    .eq("id", user.id)
    .single();

  return data ?? null;
}

// ─────────────────────────────────────────────────────────────────────────────
// createAdminAccount
// ─────────────────────────────────────────────────────────────────────────────
export async function createAdminAccount(formData) {
  const actor = await getCurrentAdmin();
  if (!actor || !actor.is_active) return { error: "Unauthorised." };

  const email = formData.get("email")?.toString().trim().toLowerCase();
  const full_name = formData.get("full_name")?.toString().trim();
  const phone = formData.get("phone")?.toString().trim() || null;
  const role = formData.get("role")?.toString().trim();
  const lga = formData.get("lga")?.toString().trim() || null;

  if (!email || !full_name || !role) {
    return { error: "Email, full name, and role are required." };
  }

  const allowedRoles = ROLE_HIERARCHY[actor.role] || [];
  if (!allowedRoles.includes(role)) {
    return { error: `You cannot create a ${role} account.` };
  }

  if (actor.role === "super_user" && lga && lga !== actor.lga) {
    return { error: "You can only create admins for your own LGA." };
  }

  if (role === "super_user" && !lga) {
    return { error: "LGA is required for super_user accounts." };
  }

  const tempPassword = generateTempPassword();
  const service = makeServiceClient();

  // Create auth user — requires service role
  const { data: authData, error: authError } =
    await service.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { full_name, role, lga },
    });

  if (authError) {
    console.error("[createAdminAccount] auth:", authError.message);
    if (authError.message?.includes("already registered")) {
      return { error: "An account with this email already exists." };
    }
    return { error: "Failed to create auth account. Please try again." };
  }

  // Insert profile row
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
    // Roll back the auth user to avoid orphan records
    await service.auth.admin.deleteUser(authData.user.id);
    console.error("[createAdminAccount] db:", dbError.message);
    return { error: "Failed to save account record. Please try again." };
  }

  revalidatePath("/dashboard/admins");
  return {
    success: true,
    tempPassword,
    adminId: authData.user.id,
    message: `Account created for ${full_name}. Share the temporary password securely.`,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// toggleAdminStatus
// ─────────────────────────────────────────────────────────────────────────────
export async function toggleAdminStatus(adminId, newStatus) {
  const actor = await getCurrentAdmin();
  if (!actor || !actor.is_active) return { error: "Unauthorised." };

  const service = makeServiceClient();
  const { data: target, error: fetchError } = await service
    .from("admins")
    .select("id, role, lga")
    .eq("id", adminId)
    .single();

  if (fetchError || !target) return { error: "Admin not found." };

  if (actor.role === "super_user") {
    if (
      target.lga !== actor.lga ||
      ["super_user", "state_admin"].includes(target.role)
    ) {
      return { error: "You cannot modify this account." };
    }
  } else if (actor.role !== "state_admin") {
    return { error: "Unauthorised." };
  }

  const { error } = await service
    .from("admins")
    .update({ is_active: newStatus })
    .eq("id", adminId);

  if (error) return { error: "Failed to update status." };

  revalidatePath("/dashboard/admins");
  return { success: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// deleteAdminAccount
// ─────────────────────────────────────────────────────────────────────────────
export async function deleteAdminAccount(adminId) {
  const actor = await getCurrentAdmin();
  if (!actor) return { error: "Unauthorised." };

  const service = makeServiceClient();
  const { data: target } = await service
    .from("admins")
    .select("id, role, lga, email")
    .eq("id", adminId)
    .single();

  if (!target) return { error: "Admin not found." };

  if (actor.role === "super_user") {
    if (
      target.lga !== actor.lga ||
      ["super_user", "state_admin"].includes(target.role)
    ) {
      return { error: "You cannot delete this account." };
    }
  } else if (actor.role !== "state_admin") {
    return { error: "Unauthorised." };
  }

  // Deleting from auth cascades to admins table via FK on delete
  const { error } = await service.auth.admin.deleteUser(adminId);
  if (error) return { error: "Failed to delete account." };

  revalidatePath("/dashboard/admins");
  return { success: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// getAdminsForActor
// ─────────────────────────────────────────────────────────────────────────────
export async function getAdminsForActor() {
  const actor = await getCurrentAdmin();
  if (!actor) return { error: "Unauthorised.", data: [] };

  const service = makeServiceClient();
  let query = service
    .from("admins")
    .select(
      "id, email, full_name, role, lga, phone, is_active, created_at, last_login, created_by",
    )
    .order("created_at", { ascending: false });

  if (actor.role === "super_user") {
    query = query.eq("lga", actor.lga).neq("role", "state_admin");
  } else if (actor.role === "administrator") {
    query = query.eq("lga", actor.lga).in("role", ["registration", "manager"]);
  } else if (actor.role !== "state_admin") {
    return { data: [], actor };
  }

  const { data, error } = await query;
  if (error) return { error: error.message, data: [] };
  return { data, actor };
}

// ─────────────────────────────────────────────────────────────────────────────
// generateTempPassword — guaranteed uppercase + lowercase + digit + symbol
// ─────────────────────────────────────────────────────────────────────────────
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
