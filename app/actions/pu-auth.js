"use server";

/**
 * app/actions/pu-auth.js
 * Server actions for Polling Unit Admin account management.
 * Both State Admin and LGA Admin can create PU admins.
 * LGA Admin can only create PU admins within their own LGA.
 */

import { headers } from "next/headers";
import bcrypt from "bcryptjs";
import { createAdminClient } from "@/supabase/admin";
import { getResultsSession } from "@/app/actions/election-auth";
import { generateSecurePassword } from "@/utils/password-generator";

const BCRYPT_ROUNDS = 12;

function log(fn, msg, data) {
  data !== undefined
    ? console.log(`[ERMS:${fn}] ${msg}`, data)
    : console.log(`[ERMS:${fn}] ${msg}`);
}
function logError(fn, msg, err) {
  console.error(`[ERMS:${fn}] ❌ ${msg}`, err ?? "");
}

const VALID_LGAS = [
  "Ibadan North",
  "Ibadan North-East",
  "Ibadan North-West",
  "Ibadan South-East",
  "Ibadan South-West",
  "Ibarapa Central",
  "Ibarapa East",
  "Ibarapa North",
  "Ido",
];

// ─────────────────────────────────────────
// FETCH PU ADMINS
// ─────────────────────────────────────────

export async function fetchPUAdmins(lgaFilter) {
  const session = await getResultsSession();
  if (!session) return { error: "Unauthorised." };
  if (session.role !== "state_admin" && session.role !== "lga_admin")
    return { error: "Unauthorised." };

  const supabase = createAdminClient();
  let query = supabase
    .from("election_admins")
    .select(
      `
      id, email, full_name, phone, lga, ward, polling_unit,
      role, is_active, must_change_password,
      last_login, created_at,
      creator:created_by ( full_name ),
      parent:parent_admin_id ( full_name, lga )
    `,
    )
    .eq("role", "polling_unit_admin")
    .order("lga")
    .order("ward")
    .order("created_at", { ascending: false });

  if (session.role === "lga_admin") {
    query = query.eq("lga", session.lga);
  } else if (lgaFilter) {
    query = query.eq("lga", lgaFilter);
  }

  const { data, error } = await query;
  if (error) return { error: error.message };
  return data;
}

// ─────────────────────────────────────────
// CREATE PU ADMIN
// ─────────────────────────────────────────

export async function createPUAdmin(formData) {
  const session = await getResultsSession();
  if (!session) return { error: "Unauthorised." };
  if (session.role !== "state_admin" && session.role !== "lga_admin")
    return { error: "Unauthorised." };

  const fullName = formData.get("full_name")?.toString().trim();
  const email = formData.get("email")?.toString().trim().toLowerCase();
  const phone = formData.get("phone")?.toString().trim();
  const lga = formData.get("lga")?.toString().trim();
  const ward = formData.get("ward")?.toString().trim();
  const pollingUnit = formData.get("polling_unit")?.toString().trim();

  if (!fullName || !email || !lga || !ward || !pollingUnit)
    return {
      error: "Full name, email, LGA, ward, and polling unit are required.",
    };

  if (session.role === "lga_admin" && lga !== session.lga)
    return {
      error: `You can only create Polling Unit Admins for ${session.lga}.`,
    };

  if (!VALID_LGAS.includes(lga)) return { error: "Invalid LGA selected." };

  const plainPassword = generateSecurePassword(12);
  const passwordHash = await bcrypt.hash(plainPassword, BCRYPT_ROUNDS);
  const supabase = createAdminClient();
  const hdrs = await headers();
  const ipAddress = hdrs.get("x-forwarded-for") || "unknown";
  const userAgent = hdrs.get("user-agent") || "unknown";

  log("createPUAdmin", "Creating Supabase Auth user...");
  const { data: authUser, error: authError } =
    await supabase.auth.admin.createUser({
      email,
      password: plainPassword,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role: "polling_unit_admin",
        lga,
        ward,
        polling_unit: pollingUnit,
      },
    });

  if (authError) {
    if (authError.message?.includes("already registered"))
      return { error: "An account with this email already exists." };
    logError("createPUAdmin", "Auth creation failed:", authError);
    return { error: "Failed to create account. Please try again." };
  }

  const { data: newAdmin, error: insertError } = await supabase
    .from("election_admins")
    .insert({
      id: authUser.user.id,
      email,
      full_name: fullName,
      phone: phone || null,
      lga,
      ward,
      polling_unit: pollingUnit,
      role: "polling_unit_admin",
      password_hash: passwordHash,
      must_change_password: true,
      created_by: session.id,
      parent_admin_id: session.role === "lga_admin" ? session.id : null,
    })
    .select("id, email, full_name, lga, ward, polling_unit")
    .single();

  if (insertError) {
    await supabase.auth.admin.deleteUser(authUser.user.id);
    logError("createPUAdmin", "Insert error:", insertError);
    return { error: "Failed to create account. Please try again." };
  }

  await supabase.from("result_audit_log").insert({
    action: "INSERT",
    table_name: "election_admins",
    record_id: newAdmin.id,
    new_values: {
      email,
      full_name: fullName,
      lga,
      ward,
      polling_unit: pollingUnit,
      role: "polling_unit_admin",
    },
    performed_by: session.id,
    ip_address: ipAddress,
    user_agent: userAgent,
    notes: `PU Admin created by ${session.role === "lga_admin" ? "LGA Admin" : "State Admin"}`,
  });

  return { success: true, admin: newAdmin, plainPassword };
}

// ─────────────────────────────────────────
// REGENERATE PU ADMIN PASSWORD
// ─────────────────────────────────────────

export async function regeneratePUAdminPassword(adminId) {
  const session = await getResultsSession();
  if (!session) return { error: "Unauthorised." };
  if (session.role !== "state_admin" && session.role !== "lga_admin")
    return { error: "Unauthorised." };

  const supabase = createAdminClient();
  const hdrs = await headers();
  const ipAddress = hdrs.get("x-forwarded-for") || "unknown";
  const userAgent = hdrs.get("user-agent") || "unknown";

  if (session.role === "lga_admin") {
    const { data: target } = await supabase
      .from("election_admins")
      .select("lga")
      .eq("id", adminId)
      .eq("role", "polling_unit_admin")
      .single();
    if (!target || target.lga !== session.lga)
      return { error: "You can only manage Polling Unit Admins in your LGA." };
  }

  const plainPassword = generateSecurePassword(12);
  const passwordHash = await bcrypt.hash(plainPassword, BCRYPT_ROUNDS);

  const { error: authError } = await supabase.auth.admin.updateUserById(
    adminId,
    { password: plainPassword },
  );
  if (authError)
    logError(
      "regeneratePUAdminPassword",
      "Auth update failed (non-fatal):",
      authError,
    );

  const { error } = await supabase
    .from("election_admins")
    .update({ password_hash: passwordHash, must_change_password: true })
    .eq("id", adminId)
    .eq("role", "polling_unit_admin");

  if (error) return { error: "Failed to regenerate password." };

  await supabase
    .from("admin_sessions")
    .update({ is_revoked: true })
    .eq("admin_id", adminId);

  await supabase.from("result_audit_log").insert({
    action: "UPDATE",
    table_name: "election_admins",
    record_id: adminId,
    performed_by: session.id,
    ip_address: ipAddress,
    user_agent: userAgent,
    notes: `PU Admin password regenerated by ${session.role}`,
  });

  return { success: true, plainPassword };
}

// ─────────────────────────────────────────
// TOGGLE PU ADMIN STATUS
// ─────────────────────────────────────────

export async function togglePUAdminStatus(adminId, activate) {
  const session = await getResultsSession();
  if (!session) return { error: "Unauthorised." };
  if (session.role !== "state_admin" && session.role !== "lga_admin")
    return { error: "Unauthorised." };

  const supabase = createAdminClient();
  const hdrs = await headers();
  const ipAddress = hdrs.get("x-forwarded-for") || "unknown";
  const userAgent = hdrs.get("user-agent") || "unknown";

  if (session.role === "lga_admin") {
    const { data: target } = await supabase
      .from("election_admins")
      .select("lga")
      .eq("id", adminId)
      .eq("role", "polling_unit_admin")
      .single();
    if (!target || target.lga !== session.lga)
      return { error: "You can only manage Polling Unit Admins in your LGA." };
  }

  const { error } = await supabase
    .from("election_admins")
    .update({ is_active: activate })
    .eq("id", adminId)
    .eq("role", "polling_unit_admin");

  if (error) return { error: "Failed to update account status." };

  const { error: authError } = await supabase.auth.admin.updateUserById(
    adminId,
    {
      ban_duration: activate ? "none" : "876600h",
    },
  );
  if (authError)
    logError("togglePUAdminStatus", "Auth ban failed (non-fatal):", authError);

  if (!activate) {
    await supabase
      .from("admin_sessions")
      .update({ is_revoked: true })
      .eq("admin_id", adminId);
  }

  await supabase.from("result_audit_log").insert({
    action: activate ? "ACCOUNT_ACTIVATED" : "ACCOUNT_DEACTIVATED",
    table_name: "election_admins",
    record_id: adminId,
    performed_by: session.id,
    ip_address: ipAddress,
    user_agent: userAgent,
    notes: `PU Admin ${activate ? "activated" : "deactivated"} by ${session.role}`,
  });

  return { success: true };
}
