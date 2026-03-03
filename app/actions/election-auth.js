"use server";

/**
 * app/actions/election-auth.js
 * Server actions for the Election Results Management System auth layer.
 * Operates entirely on the election_admins + admin_sessions tables.
 * Does NOT use Supabase Auth — credentials are managed manually with bcrypt.
 */

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { createAdminClient } from "@/supabase/admin";
import {
  generateSecurePassword,
  validatePasswordStrength,
} from "@/utils/password-generator";

const SESSION_COOKIE = "erms_session";
const SESSION_DURATION = 8 * 60 * 60 * 1000;
const BCRYPT_ROUNDS = 12;

// ─────────────────────────────────────────
// DEBUG LOGGER
// ─────────────────────────────────────────

function log(fn, msg, data = undefined) {
  const prefix = `[ERMS:${fn}]`;
  data !== undefined
    ? console.log(`${prefix} ${msg}`, data)
    : console.log(`${prefix} ${msg}`);
}

function logError(fn, msg, err = undefined) {
  const prefix = `[ERMS:${fn}] ❌`;
  err !== undefined
    ? console.error(`${prefix} ${msg}`, err)
    : console.error(`${prefix} ${msg}`);
}

// ─────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────

export async function loginResultsAdmin(formData) {
  log("loginResultsAdmin", "▶ Action invoked");

  const email = formData.get("email")?.toString().trim().toLowerCase();
  const password = formData.get("password")?.toString();
  const from = formData.get("from")?.toString().trim() || null;

  if (!email || !password) {
    log("loginResultsAdmin", "Validation failed — missing email or password");
    return { error: "Email and password are required." };
  }

  const supabase = createAdminClient();

  const hdrs = await headers();
  const ipAddress = hdrs.get("x-forwarded-for") || "unknown";
  const userAgent = hdrs.get("user-agent") || "unknown";

  log("loginResultsAdmin", `Querying election_admins for email: ${email}`);
  const { data: admin, error: fetchError } = await supabase
    .from("election_admins")
    .select(
      "id, email, full_name, role, lga, password_hash, must_change_password, is_active",
    )
    .eq("email", email)
    .single();

  if (fetchError) logError("loginResultsAdmin", "DB fetch error:", fetchError);

  if (fetchError || !admin) {
    await logAuthEvent(
      supabase,
      null,
      "LOGIN_FAILED",
      ipAddress,
      userAgent,
      `No account: ${email}`,
    );
    return { error: "Invalid email or password." };
  }

  log("loginResultsAdmin", "Admin record found:", {
    id: admin.id,
    role: admin.role,
    lga: admin.lga,
    is_active: admin.is_active,
    must_change_password: admin.must_change_password,
    has_password_hash: !!admin.password_hash,
  });

  if (!admin.is_active) {
    await logAuthEvent(
      supabase,
      admin.id,
      "LOGIN_FAILED",
      ipAddress,
      userAgent,
      "Account deactivated",
    );
    return {
      error: "Your account has been deactivated. Contact the State Admin.",
    };
  }

  const passwordMatch = await bcrypt.compare(password, admin.password_hash);
  log("loginResultsAdmin", "Password match result:", passwordMatch);

  if (!passwordMatch) {
    await logAuthEvent(
      supabase,
      admin.id,
      "LOGIN_FAILED",
      ipAddress,
      userAgent,
      "Bad password",
    );
    return { error: "Invalid email or password." };
  }

  const sessionToken = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION);

  const { error: sessionError } = await supabase.from("admin_sessions").insert({
    admin_id: admin.id,
    session_token: sessionToken,
    ip_address: ipAddress,
    user_agent: userAgent,
    expires_at: expiresAt.toISOString(),
  });

  if (sessionError) {
    logError("loginResultsAdmin", "Session insert failed:", sessionError);
    return { error: "Login failed. Please try again." };
  }

  const { error: lastLoginError } = await supabase
    .from("election_admins")
    .update({ last_login: new Date().toISOString() })
    .eq("id", admin.id);

  if (lastLoginError)
    logError(
      "loginResultsAdmin",
      "last_login update failed (non-fatal):",
      lastLoginError,
    );

  await logAuthEvent(supabase, admin.id, "LOGIN_SUCCESS", ipAddress, userAgent);
  log("loginResultsAdmin", "Audit event LOGIN_SUCCESS written ✓");

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/results-portal",
  });
  log("loginResultsAdmin", "Cookie set ✓");

  if (admin.must_change_password) {
    redirect("/results-portal/change-password");
  }

  const roleDest =
    admin.role === "state_admin"
      ? "/results-portal/admin"
      : "/results-portal/lga";

  // Honour original destination if it's a safe internal ERMS path
  const isSafe =
    from &&
    from.startsWith("/results-portal/") &&
    !from.includes("//") &&
    !from.startsWith("/results-portal/login");

  log("loginResultsAdmin", `Redirecting to: ${isSafe ? from : roleDest}`);
  redirect(isSafe ? from : roleDest);
}
// ─────────────────────────────────────────
// LOGOUT
// ─────────────────────────────────────────

export async function logoutResultsAdmin() {
  log("logoutResultsAdmin", "▶ Action invoked");

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    const supabase = createAdminClient(); // ← was createClient()
    const { error } = await supabase
      .from("admin_sessions")
      .update({ is_revoked: true })
      .eq("session_token", token);

    if (error)
      logError(
        "logoutResultsAdmin",
        "Session revoke failed (non-fatal):",
        error,
      );
    else log("logoutResultsAdmin", "Session revoked in DB ✓");

    cookieStore.delete(SESSION_COOKIE);
    log("logoutResultsAdmin", "Cookie deleted ✓");
  }

  redirect("/results-portal/login");
}

// ─────────────────────────────────────────
// GET CURRENT SESSION
// ─────────────────────────────────────────

export async function getResultsSession() {
  log("getResultsSession", "▶ Called");

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    log("getResultsSession", "No session cookie found → returning null");
    return null;
  }

  const supabase = createAdminClient(); // ← was createClient()

  const { data: session, error: sessionErr } = await supabase
    .from("admin_sessions")
    .select("admin_id, expires_at, is_revoked")
    .eq("session_token", token)
    .single();

  if (sessionErr)
    logError("getResultsSession", "Session query error:", sessionErr);
  if (!session) return null;
  if (session.is_revoked) return null;

  if (new Date(session.expires_at) < new Date()) {
    log("getResultsSession", "Session expired → returning null");
    return null;
  }

  const { data: admin, error: adminErr } = await supabase
    .from("election_admins")
    .select("id, email, full_name, role, lga, must_change_password, is_active")
    .eq("id", session.admin_id)
    .single();

  if (adminErr) logError("getResultsSession", "Admin fetch error:", adminErr);
  if (!admin || !admin.is_active) return null;

  log("getResultsSession", "Session valid, admin:", {
    id: admin.id,
    role: admin.role,
    lga: admin.lga,
    must_change_password: admin.must_change_password,
  });

  return { ...admin, sessionToken: token };
}

// ─────────────────────────────────────────
// CHANGE PASSWORD
// ─────────────────────────────────────────

export async function changeResultsPassword(formData) {
  log("changeResultsPassword", "▶ Action invoked");

  const currentPassword = formData.get("current_password")?.toString();
  const newPassword = formData.get("new_password")?.toString();
  const confirmPassword = formData.get("confirm_password")?.toString();

  if (!newPassword || !confirmPassword) {
    return { error: "All fields are required." };
  }

  if (newPassword !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  const { valid, errors } = validatePasswordStrength(newPassword);
  if (!valid) return { error: errors[0] };

  const session = await getResultsSession();
  if (!session) return { error: "Session expired. Please log in again." };

  const supabase = createAdminClient(); // ← was createClient()
  const hdrs = await headers();
  const ipAddress = hdrs.get("x-forwarded-for") || "unknown";
  const userAgent = hdrs.get("user-agent") || "unknown";

  if (currentPassword) {
    const { data: adminRow, error: fetchErr } = await supabase
      .from("election_admins")
      .select("password_hash")
      .eq("id", session.id)
      .single();

    if (fetchErr)
      logError(
        "changeResultsPassword",
        "Failed to fetch current hash:",
        fetchErr,
      );

    const match =
      adminRow &&
      (await bcrypt.compare(currentPassword, adminRow.password_hash));
    if (!match) return { error: "Current password is incorrect." };
    if (currentPassword === newPassword) {
      return {
        error: "New password must be different from your current password.",
      };
    }
  }

  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

  const { error } = await supabase
    .from("election_admins")
    .update({ password_hash: passwordHash, must_change_password: false })
    .eq("id", session.id);

  if (error) {
    logError("changeResultsPassword", "DB update failed:", error);
    return { error: "Failed to update password. Please try again." };
  }

  await logAuthEvent(
    supabase,
    session.id,
    "PASSWORD_CHANGE",
    ipAddress,
    userAgent,
  );
  log("changeResultsPassword", "Audit event PASSWORD_CHANGE written ✓");

  if (session.must_change_password) {
    const dest =
      session.role === "state_admin"
        ? "/results-portal/admin"
        : "/results-portal/lga";
    redirect(dest);
  }

  return { success: true };
}

// ─────────────────────────────────────────
// CREATE LGA ADMIN
// ─────────────────────────────────────────

export async function createLGAAdmin(formData) {
  const session = await getResultsSession();
  if (!session || session.role !== "state_admin")
    return { error: "Unauthorised." };

  const fullName = formData.get("full_name")?.toString().trim();
  const email = formData.get("email")?.toString().trim().toLowerCase();
  const phone = formData.get("phone")?.toString().trim();
  const lga = formData.get("lga")?.toString().trim();

  if (!fullName || !email || !lga)
    return { error: "Full name, email, and LGA are required." };

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
  if (!VALID_LGAS.includes(lga)) return { error: "Invalid LGA selected." };

  const plainPassword = generateSecurePassword(12);
  const passwordHash = await bcrypt.hash(plainPassword, BCRYPT_ROUNDS);

  const supabase = createAdminClient();
  const hdrs = await headers();
  const ipAddress = hdrs.get("x-forwarded-for") || "unknown";
  const userAgent = hdrs.get("user-agent") || "unknown";

  // Step 1 — Create in Supabase Auth first to satisfy the FK constraint
  log("createLGAAdmin", "Creating user in Supabase Auth...");
  const { data: authUser, error: authError } =
    await supabase.auth.admin.createUser({
      email,
      password: plainPassword,
      email_confirm: true, // skip confirmation email
      user_metadata: { full_name: fullName, role: "lga_admin", lga },
    });

  if (authError) {
    if (authError.code === "email_exists" || authError.status === 422) {
      return { error: "An account with this email address already exists." };
    }
    logError("createLGAAdmin", "Supabase Auth creation failed:", authError);
    return {
      error: `Account creation failed: ${authError.message || "Unknown error"}`,
    };
  }

  log("createLGAAdmin", "Auth user created:", authUser.user.id);

  // Step 2 — Insert into election_admins using the auth user's ID
  const { data: newAdmin, error } = await supabase
    .from("election_admins")
    .insert({
      id: authUser.user.id, // ← use the auth UUID so FK is satisfied
      email,
      full_name: fullName,
      phone: phone || null,
      lga,
      role: "lga_admin",
      password_hash: passwordHash,
      must_change_password: true,
      created_by: session.id,
    })
    .select("id, email, full_name, lga")
    .single();

  if (error) {
    // Rollback — delete the auth user if election_admins insert fails
    await supabase.auth.admin.deleteUser(authUser.user.id);
    logError("createLGAAdmin", "Insert error:", error);
    return { error: "Failed to create account. Please try again." };
  }

  // Audit log
  await supabase.from("result_audit_log").insert({
    action: "INSERT",
    table_name: "election_admins",
    record_id: newAdmin.id,
    new_values: { email, full_name: fullName, lga, role: "lga_admin" },
    performed_by: session.id,
    ip_address: ipAddress,
    user_agent: userAgent,
    notes: "LGA Admin account created by State Admin",
  });

  return { success: true, admin: newAdmin, plainPassword };
}

// ─────────────────────────────────────────
// REGENERATE PASSWORD
// ─────────────────────────────────────────

export async function regenerateLGAAdminPassword(adminId) {
  const session = await getResultsSession();
  if (!session || session.role !== "state_admin")
    return { error: "Unauthorised." };

  const plainPassword = generateSecurePassword(12);
  const passwordHash = await bcrypt.hash(plainPassword, BCRYPT_ROUNDS);

  const supabase = createAdminClient();
  const hdrs = await headers();
  const ipAddress = hdrs.get("x-forwarded-for") || "unknown";
  const userAgent = hdrs.get("user-agent") || "unknown";

  // Update Supabase Auth password to keep them in sync
  const { error: authError } = await supabase.auth.admin.updateUserById(
    adminId,
    {
      password: plainPassword,
    },
  );

  if (authError) {
    logError(
      "regenerateLGAAdminPassword",
      "Auth password update failed:",
      authError,
    );
    // Non-fatal — continue updating election_admins
  }

  // Update election_admins
  const { error } = await supabase
    .from("election_admins")
    .update({ password_hash: passwordHash, must_change_password: true })
    .eq("id", adminId)
    .eq("role", "lga_admin");

  if (error) return { error: "Failed to regenerate password." };

  // Revoke all sessions
  await supabase
    .from("admin_sessions")
    .update({ is_revoked: true })
    .eq("admin_id", adminId);

  await logAuthEvent(
    supabase,
    adminId,
    "PASSWORD_REGENERATE",
    ipAddress,
    userAgent,
    `Regenerated by State Admin ${session.id}`,
  );

  return { success: true, plainPassword };
}
// ─────────────────────────────────────────
// TOGGLE ACCOUNT STATUS
// ─────────────────────────────────────────

export async function toggleLGAAdminStatus(adminId, activate) {
  log(
    "toggleLGAAdminStatus",
    `▶ Action invoked — adminId: ${adminId}, activate: ${activate}`,
  );

  const session = await getResultsSession();
  if (!session || session.role !== "state_admin")
    return { error: "Unauthorised." };

  const supabase = createAdminClient();
  const hdrs = await headers();
  const ipAddress = hdrs.get("x-forwarded-for") || "unknown";
  const userAgent = hdrs.get("user-agent") || "unknown";

  // Update election_admins
  const { error } = await supabase
    .from("election_admins")
    .update({ is_active: activate })
    .eq("id", adminId)
    .eq("role", "lga_admin");

  if (error) {
    logError("toggleLGAAdminStatus", "election_admins update failed:", error);
    return { error: "Failed to update account status." };
  }
  log("toggleLGAAdminStatus", "election_admins is_active updated ✓");

  // Sync with Supabase Auth — ban/unban the user
  const { error: authError } = await supabase.auth.admin.updateUserById(
    adminId,
    {
      ban_duration: activate ? "none" : "876600h", // unban or ban ~100 years
    },
  );

  if (authError) {
    logError(
      "toggleLGAAdminStatus",
      "Supabase Auth ban/unban failed (non-fatal):",
      authError,
    );
    // Non-fatal — election_admins is the authoritative gate for ERMS login
  } else {
    log(
      "toggleLGAAdminStatus",
      `Supabase Auth ban_duration set to ${activate ? "none" : "876600h"} ✓`,
    );
  }

  // On deactivation — revoke all active ERMS sessions
  if (!activate) {
    const { error: revokeErr } = await supabase
      .from("admin_sessions")
      .update({ is_revoked: true })
      .eq("admin_id", adminId);

    if (revokeErr) {
      logError(
        "toggleLGAAdminStatus",
        "Session revoke failed (non-fatal):",
        revokeErr,
      );
    } else {
      log("toggleLGAAdminStatus", "All ERMS sessions revoked ✓");
    }
  }

  const action = activate ? "ACCOUNT_ACTIVATED" : "ACCOUNT_DEACTIVATED";
  await logAuthEvent(
    supabase,
    adminId,
    action,
    ipAddress,
    userAgent,
    `${activate ? "Activated" : "Deactivated"} by State Admin ${session.id}`,
  );
  log("toggleLGAAdminStatus", `Audit event ${action} written ✓`);

  return { success: true };
}
// ─────────────────────────────────────────
// INTERNAL HELPERS
// ─────────────────────────────────────────

function generateSessionToken() {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function logAuthEvent(
  supabase,
  adminId,
  action,
  ipAddress,
  userAgent,
  notes = null,
) {
  log("logAuthEvent", `Writing audit event: ${action}`, { adminId, notes });
  try {
    const { error } = await supabase.from("result_audit_log").insert({
      action,
      table_name: "admin_sessions",
      performed_by: adminId,
      ip_address: ipAddress,
      user_agent: userAgent,
      notes,
    });
    if (error) logError("logAuthEvent", "Insert returned error:", error);
    else log("logAuthEvent", `Audit event ${action} written ✓`);
  } catch (err) {
    logError("logAuthEvent", "Unexpected exception:", err);
  }
}

// ─────────────────────────────────────────
// CREATE POLLING UNIT ADMIN
// ─────────────────────────────────────────

export async function createPUAdmin(formData) {
  const session = await getResultsSession();
  if (!session || !["state_admin", "lga_admin"].includes(session.role))
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

  // LGA admins can only create PU admins for their own LGA
  if (session.role === "lga_admin" && lga !== session.lga)
    return { error: "You can only create PU Admins for your assigned LGA." };

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
  if (!VALID_LGAS.includes(lga)) return { error: "Invalid LGA selected." };

  const plainPassword = generateSecurePassword(12);
  const passwordHash = await bcrypt.hash(plainPassword, BCRYPT_ROUNDS);

  const supabase = createAdminClient();
  const hdrs = await headers();
  const ipAddress = hdrs.get("x-forwarded-for") || "unknown";
  const userAgent = hdrs.get("user-agent") || "unknown";

  log("createPUAdmin", "Creating user in Supabase Auth...");
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
    if (authError.code === "email_exists" || authError.status === 422)
      return { error: "An account with this email address already exists." };
    logError("createPUAdmin", "Auth creation failed:", authError);
    return {
      error: `Account creation failed: ${authError.message || "Unknown error"}`,
    };
  }

  const { data: newAdmin, error } = await supabase
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

  if (error) {
    await supabase.auth.admin.deleteUser(authUser.user.id);
    logError("createPUAdmin", "Insert error:", error);
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
    notes: "PU Admin account created",
  });

  return { success: true, admin: newAdmin, plainPassword };
}

// ─────────────────────────────────────────
// REGENERATE PU ADMIN PASSWORD
// ─────────────────────────────────────────

export async function regeneratePUAdminPassword(adminId) {
  const session = await getResultsSession();
  if (!session || !["state_admin", "lga_admin"].includes(session.role))
    return { error: "Unauthorised." };

  const supabase = createAdminClient();
  const hdrs = await headers();
  const ipAddress = hdrs.get("x-forwarded-for") || "unknown";
  const userAgent = hdrs.get("user-agent") || "unknown";

  // LGA admin: verify target belongs to their LGA
  if (session.role === "lga_admin") {
    const { data: target } = await supabase
      .from("election_admins")
      .select("lga")
      .eq("id", adminId)
      .eq("role", "polling_unit_admin")
      .single();
    if (!target || target.lga !== session.lga)
      return { error: "You can only manage PU Admins in your LGA." };
  }

  const plainPassword = generateSecurePassword(12);
  const passwordHash = await bcrypt.hash(plainPassword, BCRYPT_ROUNDS);

  await supabase.auth.admin.updateUserById(adminId, {
    password: plainPassword,
  });

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
  await logAuthEvent(
    supabase,
    adminId,
    "PASSWORD_REGENERATE",
    ipAddress,
    userAgent,
    `Regenerated by ${session.role} ${session.id}`,
  );

  return { success: true, plainPassword };
}

// ─────────────────────────────────────────
// TOGGLE PU ADMIN STATUS
// ─────────────────────────────────────────

export async function togglePUAdminStatus(adminId, activate) {
  const session = await getResultsSession();
  if (!session || !["state_admin", "lga_admin"].includes(session.role))
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
      return { error: "You can only manage PU Admins in your LGA." };
  }

  const { error } = await supabase
    .from("election_admins")
    .update({ is_active: activate })
    .eq("id", adminId)
    .eq("role", "polling_unit_admin");

  if (error) return { error: "Failed to update account status." };

  await supabase.auth.admin.updateUserById(adminId, {
    ban_duration: activate ? "none" : "876600h",
  });

  if (!activate) {
    await supabase
      .from("admin_sessions")
      .update({ is_revoked: true })
      .eq("admin_id", adminId);
  }

  await logAuthEvent(
    supabase,
    adminId,
    activate ? "ACCOUNT_ACTIVATED" : "ACCOUNT_DEACTIVATED",
    ipAddress,
    userAgent,
    `By ${session.role} ${session.id}`,
  );

  return { success: true };
}
export async function updateResultStatus(resultId, status) {
  const session = await getResultsSession();
  if (!session || session.role !== "state_admin")
    return { error: "Unauthorised." };

  const VALID_STATUSES = ["pending", "verified", "disputed"];
  if (!VALID_STATUSES.includes(status)) return { error: "Invalid status." };

  const supabase = createAdminClient(); // service role — bypasses RLS
  const hdrs = await headers();
  const ipAddress = hdrs.get("x-forwarded-for") || "unknown";
  const userAgent = hdrs.get("user-agent") || "unknown";

  // Fetch old value for audit log
  const { data: old } = await supabase
    .from("election_results")
    .select("status")
    .eq("id", resultId)
    .single();

  const { error } = await supabase
    .from("election_results")
    .update({ status })
    .eq("id", resultId);

  if (error) return { error: error.message };

  // Audit log
  await supabase.from("result_audit_log").insert({
    action: "UPDATE",
    table_name: "election_results",
    record_id: resultId,
    old_values: { status: old?.status },
    new_values: { status },
    performed_by: session.id,
    ip_address: ipAddress,
    user_agent: userAgent,
    notes: `Status changed to ${status} by State Admin`,
  });

  return { success: true };
}
