"use server";

/**
 * app/actions/election-auth.js
 * Server actions for the Election Results Management System auth layer.
 *
 * Auth is now handled entirely by Supabase Auth (signInWithPassword /
 * signOut / updateUser). The election_admins table is kept as the source
 * of truth for ERMS-specific metadata: role, lga, ward, polling_unit,
 * is_active, must_change_password.
 *
 * Cookies are written by createErmsClient() which namespaces them as
 * "erms_sb-*" and scopes them to path /results-portal — they never
 * conflict with the dashboard's own Supabase session cookies.
 *
 * The admin_sessions table and bcrypt password hashing are no longer used.
 */

import { headers, cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/supabase/admin";
import { createErmsClient } from "@/supabase/erms-server";
import {
  generateSecurePassword,
  validatePasswordStrength,
} from "@/utils/password-generator";

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
// AUDIT LOGGER
// ─────────────────────────────────────────

async function logAuthEvent(supabase, adminId, action, ipAddress, userAgent, notes = null) {
  log("logAuthEvent", `Writing audit event: ${action}`, { adminId, notes });
  try {
    const { error } = await supabase.from("result_audit_log").insert({
      action,
      table_name: "election_admins",
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

  // Fetch ERMS profile first — cheaper than an auth round-trip for inactive accounts
  log("loginResultsAdmin", `Querying election_admins for email: ${email}`);
  const { data: admin, error: fetchError } = await supabase
    .from("election_admins")
    .select("id, email, full_name, role, lga, must_change_password, is_active")
    .eq("email", email)
    .single();

  if (fetchError) logError("loginResultsAdmin", "DB fetch error:", fetchError);

  if (fetchError || !admin) {
    await logAuthEvent(supabase, null, "LOGIN_FAILED", ipAddress, userAgent, `No account: ${email}`);
    return { error: "Invalid email or password." };
  }

  if (!admin.is_active) {
    await logAuthEvent(supabase, admin.id, "LOGIN_FAILED", ipAddress, userAgent, "Account deactivated");
    return { error: "Your account has been deactivated. Contact the State Admin." };
  }

  // Authenticate via Supabase Auth — this sets the erms_sb-* session cookies
  const ermsClient = await createErmsClient();
  const { error: signInError } = await ermsClient.auth.signInWithPassword({ email, password });

  if (signInError) {
    log("loginResultsAdmin", "signInWithPassword failed:", signInError.message);
    await logAuthEvent(supabase, admin.id, "LOGIN_FAILED", ipAddress, userAgent, "Bad password");
    return { error: "Invalid email or password." };
  }

  log("loginResultsAdmin", "signInWithPassword succeeded ✓");

  // Update last_login (non-fatal)
  const { error: lastLoginError } = await supabase
    .from("election_admins")
    .update({ last_login: new Date().toISOString() })
    .eq("id", admin.id);
  if (lastLoginError)
    logError("loginResultsAdmin", "last_login update failed (non-fatal):", lastLoginError);

  await logAuthEvent(supabase, admin.id, "LOGIN_SUCCESS", ipAddress, userAgent);
  log("loginResultsAdmin", "Audit event LOGIN_SUCCESS written ✓");

  // Seed the server-side idle-timeout cookie so the middleware can enforce
  // last_active checks immediately on the first authenticated request.
  const cookieStore = await cookies();
  cookieStore.set("erms_last_active", String(Date.now()), {
    path: "/results-portal",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  if (admin.must_change_password) {
    redirect("/results-portal/change-password");
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

  log("loginResultsAdmin", `Redirecting to: ${isSafe ? from : roleDest}`);
  redirect(isSafe ? from : roleDest);
}

// ─────────────────────────────────────────
// LOGOUT
// ─────────────────────────────────────────

export async function logoutResultsAdmin() {
  log("logoutResultsAdmin", "▶ Action invoked");

  try {
    const ermsClient = await createErmsClient();

    // Capture user ID before signing out for the audit log
    const { data: { user } } = await ermsClient.auth.getUser();

    if (user) {
      const supabase = createAdminClient();
      const hdrs = await headers();
      const ipAddress = hdrs.get("x-forwarded-for") || "unknown";
      const userAgent = hdrs.get("user-agent") || "unknown";
      await logAuthEvent(supabase, user.id, "LOGOUT", ipAddress, userAgent);
      log("logoutResultsAdmin", "Audit event LOGOUT written ✓");
    }

    await ermsClient.auth.signOut();
    log("logoutResultsAdmin", "signOut succeeded ✓");
  } catch (err) {
    logError("logoutResultsAdmin", "Unexpected error (non-fatal):", err);
  }

  redirect("/results-portal/login");
}

// ─────────────────────────────────────────
// GET CURRENT SESSION
// ─────────────────────────────────────────

export async function getResultsSession() {
  log("getResultsSession", "▶ Called");

  try {
    const ermsClient = await createErmsClient();

    // getClaims() reads the JWT from the erms_sb-* cookies without a network
    // call. Returns null if there is no valid token.
    const { data } = await ermsClient.auth.getClaims();
    const userId = data?.claims?.sub;

    if (!userId) {
      log("getResultsSession", "No valid JWT claim → returning null");
      return null;
    }

    const supabase = createAdminClient();
    const { data: admin, error: adminErr } = await supabase
      .from("election_admins")
      .select("id, email, full_name, role, lga, ward, polling_unit, must_change_password, is_active")
      .eq("id", userId)
      .single();

    if (adminErr) logError("getResultsSession", "Admin fetch error:", adminErr);
    if (!admin || !admin.is_active) return null;

    log("getResultsSession", "Session valid, admin:", {
      id: admin.id,
      role: admin.role,
      lga: admin.lga,
      must_change_password: admin.must_change_password,
    });

    return admin;
  } catch (err) {
    logError("getResultsSession", "Unexpected error:", err);
    return null;
  }
}

// ─────────────────────────────────────────
// CHANGE PASSWORD
// ─────────────────────────────────────────

export async function changeResultsPassword(formData) {
  log("changeResultsPassword", "▶ Action invoked");

  const currentPassword = formData.get("current_password")?.toString();
  const newPassword = formData.get("new_password")?.toString();
  const confirmPassword = formData.get("confirm_password")?.toString();

  if (!newPassword || !confirmPassword)
    return { error: "All fields are required." };

  if (newPassword !== confirmPassword)
    return { error: "Passwords do not match." };

  const { valid, errors } = validatePasswordStrength(newPassword);
  if (!valid) return { error: errors[0] };

  const session = await getResultsSession();
  if (!session) return { error: "Session expired. Please log in again." };

  const supabase = createAdminClient();
  const hdrs = await headers();
  const ipAddress = hdrs.get("x-forwarded-for") || "unknown";
  const userAgent = hdrs.get("user-agent") || "unknown";

  // Verify current password using a throw-away non-SSR client so no new
  // session cookies are written during the check.
  if (currentPassword) {
    const throwaway = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const { error: verifyError } = await throwaway.auth.signInWithPassword({
      email: session.email,
      password: currentPassword,
    });
    if (verifyError) return { error: "Current password is incorrect." };

    if (currentPassword === newPassword)
      return { error: "New password must be different from your current password." };
  }

  // Update the password via the ERMS SSR client (uses the active session JWT)
  const ermsClient = await createErmsClient();
  const { error: updateError } = await ermsClient.auth.updateUser({ password: newPassword });

  if (updateError) {
    logError("changeResultsPassword", "Auth updateUser failed:", updateError);
    return { error: "Failed to update password. Please try again." };
  }

  // Clear the must_change_password flag
  const { error: dbError } = await supabase
    .from("election_admins")
    .update({ must_change_password: false })
    .eq("id", session.id);

  if (dbError)
    logError("changeResultsPassword", "must_change_password clear failed (non-fatal):", dbError);

  await logAuthEvent(supabase, session.id, "PASSWORD_CHANGE", ipAddress, userAgent);
  log("changeResultsPassword", "Audit event PASSWORD_CHANGE written ✓");

  if (session.must_change_password) {
    const dest =
      session.role === "state_admin"
        ? "/results-portal/admin"
        : session.role === "polling_unit_admin"
          ? "/results-portal/pu"
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
    "Ibadan North", "Ibadan North-East", "Ibadan North-West",
    "Ibadan South-East", "Ibadan South-West", "Ibarapa Central",
    "Ibarapa East", "Ibarapa North", "Ido",
  ];
  if (!VALID_LGAS.includes(lga)) return { error: "Invalid LGA selected." };

  const plainPassword = generateSecurePassword(12);
  const supabase = createAdminClient();
  const hdrs = await headers();
  const ipAddress = hdrs.get("x-forwarded-for") || "unknown";
  const userAgent = hdrs.get("user-agent") || "unknown";

  log("createLGAAdmin", "Creating user in Supabase Auth...");
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email,
    password: plainPassword,
    email_confirm: true,
    user_metadata: { full_name: fullName, role: "lga_admin", lga },
  });

  if (authError) {
    if (authError.code === "email_exists" || authError.status === 422)
      return { error: "An account with this email address already exists." };
    logError("createLGAAdmin", "Supabase Auth creation failed:", authError);
    return { error: `Account creation failed: ${authError.message || "Unknown error"}` };
  }

  log("createLGAAdmin", "Auth user created:", authUser.user.id);

  const { data: newAdmin, error } = await supabase
    .from("election_admins")
    .insert({
      id: authUser.user.id,
      email,
      full_name: fullName,
      phone: phone || null,
      lga,
      role: "lga_admin",
      must_change_password: true,
      created_by: session.id,
    })
    .select("id, email, full_name, lga")
    .single();

  if (error) {
    await supabase.auth.admin.deleteUser(authUser.user.id);
    logError("createLGAAdmin", "Insert error:", error);
    return { error: "Failed to create account. Please try again." };
  }

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
// REGENERATE LGA ADMIN PASSWORD
// ─────────────────────────────────────────

export async function regenerateLGAAdminPassword(adminId) {
  const session = await getResultsSession();
  if (!session || session.role !== "state_admin")
    return { error: "Unauthorised." };

  const plainPassword = generateSecurePassword(12);
  const supabase = createAdminClient();
  const hdrs = await headers();
  const ipAddress = hdrs.get("x-forwarded-for") || "unknown";
  const userAgent = hdrs.get("user-agent") || "unknown";

  // Update password in Supabase Auth
  const { error: authError } = await supabase.auth.admin.updateUserById(adminId, {
    password: plainPassword,
  });
  if (authError)
    logError("regenerateLGAAdminPassword", "Auth password update failed:", authError);

  // Update election_admins — force password change on next login
  const { error } = await supabase
    .from("election_admins")
    .update({ must_change_password: true })
    .eq("id", adminId)
    .eq("role", "lga_admin");

  if (error) return { error: "Failed to regenerate password." };

  // Revoke all active sessions for this user
  const { error: signOutError } = await supabase.auth.admin.signOut(adminId);
  if (signOutError)
    logError("regenerateLGAAdminPassword", "Session revoke failed (non-fatal):", signOutError);

  await logAuthEvent(
    supabase, adminId, "PASSWORD_REGENERATE", ipAddress, userAgent,
    `Regenerated by State Admin ${session.id}`,
  );

  return { success: true, plainPassword };
}

// ─────────────────────────────────────────
// TOGGLE LGA ADMIN STATUS
// ─────────────────────────────────────────

export async function toggleLGAAdminStatus(adminId, activate) {
  log("toggleLGAAdminStatus", `▶ Action invoked — adminId: ${adminId}, activate: ${activate}`);

  const session = await getResultsSession();
  if (!session || session.role !== "state_admin")
    return { error: "Unauthorised." };

  const supabase = createAdminClient();
  const hdrs = await headers();
  const ipAddress = hdrs.get("x-forwarded-for") || "unknown";
  const userAgent = hdrs.get("user-agent") || "unknown";

  const { error } = await supabase
    .from("election_admins")
    .update({ is_active: activate })
    .eq("id", adminId)
    .eq("role", "lga_admin");

  if (error) {
    logError("toggleLGAAdminStatus", "election_admins update failed:", error);
    return { error: "Failed to update account status." };
  }

  // Sync with Supabase Auth — ban/unban
  const { error: authError } = await supabase.auth.admin.updateUserById(adminId, {
    ban_duration: activate ? "none" : "876600h",
  });
  if (authError)
    logError("toggleLGAAdminStatus", "Supabase Auth ban/unban failed (non-fatal):", authError);

  // On deactivation — force sign out all active sessions
  if (!activate) {
    const { error: signOutError } = await supabase.auth.admin.signOut(adminId);
    if (signOutError)
      logError("toggleLGAAdminStatus", "Session revoke failed (non-fatal):", signOutError);
  }

  const action = activate ? "ACCOUNT_ACTIVATED" : "ACCOUNT_DEACTIVATED";
  await logAuthEvent(
    supabase, adminId, action, ipAddress, userAgent,
    `${activate ? "Activated" : "Deactivated"} by State Admin ${session.id}`,
  );

  return { success: true };
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
    return { error: "Full name, email, LGA, ward, and polling unit are required." };

  if (session.role === "lga_admin" && lga !== session.lga)
    return { error: "You can only create PU Admins for your assigned LGA." };

  const VALID_LGAS = [
    "Ibadan North", "Ibadan North-East", "Ibadan North-West",
    "Ibadan South-East", "Ibadan South-West", "Ibarapa Central",
    "Ibarapa East", "Ibarapa North", "Ido",
  ];
  if (!VALID_LGAS.includes(lga)) return { error: "Invalid LGA selected." };

  const plainPassword = generateSecurePassword(12);
  const supabase = createAdminClient();
  const hdrs = await headers();
  const ipAddress = hdrs.get("x-forwarded-for") || "unknown";
  const userAgent = hdrs.get("user-agent") || "unknown";

  log("createPUAdmin", "Creating user in Supabase Auth...");
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email,
    password: plainPassword,
    email_confirm: true,
    user_metadata: { full_name: fullName, role: "polling_unit_admin", lga, ward, polling_unit: pollingUnit },
  });

  if (authError) {
    if (authError.code === "email_exists" || authError.status === 422)
      return { error: "An account with this email address already exists." };
    logError("createPUAdmin", "Auth creation failed:", authError);
    return { error: `Account creation failed: ${authError.message || "Unknown error"}` };
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
    new_values: { email, full_name: fullName, lga, ward, polling_unit: pollingUnit, role: "polling_unit_admin" },
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

  await supabase.auth.admin.updateUserById(adminId, { password: plainPassword });

  const { error } = await supabase
    .from("election_admins")
    .update({ must_change_password: true })
    .eq("id", adminId)
    .eq("role", "polling_unit_admin");

  if (error) return { error: "Failed to regenerate password." };

  await supabase.auth.admin.signOut(adminId);

  await logAuthEvent(
    supabase, adminId, "PASSWORD_REGENERATE", ipAddress, userAgent,
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

  if (!activate) await supabase.auth.admin.signOut(adminId);

  await logAuthEvent(
    supabase, adminId,
    activate ? "ACCOUNT_ACTIVATED" : "ACCOUNT_DEACTIVATED",
    ipAddress, userAgent,
    `By ${session.role} ${session.id}`,
  );

  return { success: true };
}

// ─────────────────────────────────────────
// CREATE ELECTION STATE ADMIN
// ─────────────────────────────────────────

export async function createElectionStateAdmin(formData) {
  const session = await getResultsSession();
  if (!session || session.role !== "state_admin")
    return { error: "Unauthorised." };

  const fullName = formData.get("full_name")?.toString().trim();
  const email = formData.get("email")?.toString().trim().toLowerCase();
  const phone = formData.get("phone")?.toString().trim();

  if (!fullName || !email)
    return { error: "Full name and email are required." };

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
    if (authError.code === "email_exists" || authError.status === 422)
      return { error: "An account with this email address already exists." };
    return { error: `Account creation failed: ${authError.message || "Unknown error"}` };
  }

  const { data: newAdmin, error } = await supabase
    .from("election_admins")
    .insert({
      id: authUser.user.id,
      email,
      full_name: fullName,
      phone: phone || null,
      role: "state_admin",
      must_change_password: true,
      created_by: session.id,
    })
    .select("id, email, full_name")
    .single();

  if (error) {
    await supabase.auth.admin.deleteUser(authUser.user.id);
    logError("createElectionStateAdmin", "Insert error:", error);
    return { error: "Failed to create account. Please try again." };
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

  return { success: true, admin: newAdmin, plainPassword };
}

// ─────────────────────────────────────────
// TOGGLE ELECTION STATE ADMIN STATUS
// ─────────────────────────────────────────

export async function toggleElectionStateAdminStatus(adminId, activate) {
  const session = await getResultsSession();
  if (!session || session.role !== "state_admin")
    return { error: "Unauthorised." };

  if (adminId === session.id)
    return { error: "You cannot change the status of your own account." };

  const supabase = createAdminClient();
  const hdrs = await headers();
  const ipAddress = hdrs.get("x-forwarded-for") || "unknown";
  const userAgent = hdrs.get("user-agent") || "unknown";

  const { error } = await supabase
    .from("election_admins")
    .update({ is_active: activate })
    .eq("id", adminId)
    .eq("role", "state_admin");

  if (error) return { error: "Failed to update account status." };

  await supabase.auth.admin.updateUserById(adminId, {
    ban_duration: activate ? "none" : "876600h",
  });

  if (!activate) await supabase.auth.admin.signOut(adminId);

  const action = activate ? "ACCOUNT_ACTIVATED" : "ACCOUNT_DEACTIVATED";
  await logAuthEvent(
    supabase, adminId, action, ipAddress, userAgent,
    `${activate ? "Activated" : "Deactivated"} by State Admin ${session.id}`,
  );

  return { success: true };
}

// ─────────────────────────────────────────
// REGENERATE ELECTION STATE ADMIN PASSWORD
// ─────────────────────────────────────────

export async function regenerateElectionStateAdminPassword(adminId) {
  const session = await getResultsSession();
  if (!session || session.role !== "state_admin")
    return { error: "Unauthorised." };

  const plainPassword = generateSecurePassword(12);
  const supabase = createAdminClient();
  const hdrs = await headers();
  const ipAddress = hdrs.get("x-forwarded-for") || "unknown";
  const userAgent = hdrs.get("user-agent") || "unknown";

  await supabase.auth.admin.updateUserById(adminId, { password: plainPassword });

  const { error } = await supabase
    .from("election_admins")
    .update({ must_change_password: true })
    .eq("id", adminId)
    .eq("role", "state_admin");

  if (error) return { error: "Failed to regenerate password." };

  await supabase.auth.admin.signOut(adminId);

  await logAuthEvent(
    supabase, adminId, "PASSWORD_REGENERATE", ipAddress, userAgent,
    `Regenerated by State Admin ${session.id}`,
  );

  return { success: true, plainPassword };
}

// ─────────────────────────────────────────
// UPDATE RESULT STATUS
// ─────────────────────────────────────────

export async function updateResultStatus(resultId, status) {
  const session = await getResultsSession();
  if (!session || session.role !== "state_admin")
    return { error: "Unauthorised." };

  const VALID_STATUSES = ["pending", "verified", "disputed"];
  if (!VALID_STATUSES.includes(status)) return { error: "Invalid status." };

  const supabase = createAdminClient();
  const hdrs = await headers();
  const ipAddress = hdrs.get("x-forwarded-for") || "unknown";
  const userAgent = hdrs.get("user-agent") || "unknown";

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
