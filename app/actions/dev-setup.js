"use server";

// app/actions/devSetup.js
// ─────────────────────────────────────────────────────────────────────────────
// Developer bootstrap actions for state_admin account management.
//
// All three actions share the same two guards:
//   1. DEV_SETUP_ENABLED env var must be "true"
//   2. role_key must match server-side DEV_ROLE_KEY
//
// createStateAdmin  — runs once; blocked if state_admin already exists
// updateStateAdminEmail    — updates email in auth.users + admins table
// updateStateAdminPassword — updates password in auth.users only
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from "@supabase/supabase-js";

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

// Shared guards — returns { error } or null
function checkGuards(formData) {
  if (process.env.NEXT_PUBLIC_DEV_SETUP_ENABLED !== "true") {
    return { error: "Setup is disabled on this environment." };
  }
  const key = process.env.DEV_ROLE_KEY;
  if (!key) return { error: "DEV_ROLE_KEY is not configured on the server." };
  if (formData.get("role_key")?.toString().trim() !== key) {
    return { error: "Invalid role key." };
  }
  return null;
}

// Fetch the existing state_admin row — returns { admin } or { error }
async function getStateAdmin(supabase) {
  const { data, error } = await supabase
    .from("admins")
    .select("id, email, full_name")
    .eq("role", "state_admin")
    .single();

  if (error || !data) {
    return { error: "No state_admin account found. Create one first." };
  }
  return { admin: data };
}

// ── 1. Create ─────────────────────────────────────────────────────────────────
export async function createStateAdmin(formData) {
  const guardErr = checkGuards(formData);
  if (guardErr) return guardErr;

  const email = formData.get("email")?.toString().trim().toLowerCase();
  const full_name = formData.get("full_name")?.toString().trim();
  const phone = formData.get("phone")?.toString().trim() || null;
  const password = formData.get("password")?.toString();

  if (!email || !full_name || !password) {
    return { error: "Email, full name, and password are required." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const supabase = serviceClient();

  // Block if state_admin already exists
  const { count } = await supabase
    .from("admins")
    .select("id", { count: "exact", head: true })
    .eq("role", "state_admin");

  if (count > 0) {
    return {
      error:
        "A state_admin already exists. Use the Update tab to change credentials.",
    };
  }

  const { data: authData, error: authError } =
    await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, role: "state_admin" },
    });

  if (authError) {
    return {
      error: authError.message?.includes("already registered")
        ? "An account with this email already exists."
        : "Failed to create auth account.",
    };
  }

  const { error: dbError } = await supabase.from("admins").insert({
    id: authData.user.id,
    email,
    full_name,
    phone,
    role: "state_admin",
    lga: null,
    is_active: true,
    created_by: null,
  });

  if (dbError) {
    await supabase.auth.admin.deleteUser(authData.user.id);
    return { error: "Failed to save account record. Auth user rolled back." };
  }

  return { success: true, email, full_name };
}

// ── 2. Update Email ───────────────────────────────────────────────────────────
export async function updateStateAdminEmail(formData) {
  const guardErr = checkGuards(formData);
  if (guardErr) return guardErr;

  const newEmail = formData.get("new_email")?.toString().trim().toLowerCase();
  if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
    return { error: "A valid new email address is required." };
  }

  const supabase = serviceClient();
  const { admin, error: fetchErr } = await getStateAdmin(supabase);
  if (fetchErr) return { error: fetchErr };

  // Update auth.users
  const { error: authError } = await supabase.auth.admin.updateUserById(
    admin.id,
    { email: newEmail, email_confirm: true },
  );
  if (authError) {
    return {
      error: authError.message?.includes("already registered")
        ? "That email is already in use by another account."
        : "Failed to update email in auth.",
    };
  }

  // Mirror to admins table
  const { error: dbError } = await supabase
    .from("admins")
    .update({ email: newEmail })
    .eq("id", admin.id);

  if (dbError) {
    // Best-effort rollback
    await supabase.auth.admin.updateUserById(admin.id, {
      email: admin.email,
      email_confirm: true,
    });
    return {
      error: "Failed to update email in database. Auth change rolled back.",
    };
  }

  return { success: true, email: newEmail };
}

// ── 3. Update Password ────────────────────────────────────────────────────────
export async function updateStateAdminPassword(formData) {
  const guardErr = checkGuards(formData);
  if (guardErr) return guardErr;

  const newPassword = formData.get("new_password")?.toString();
  if (!newPassword || newPassword.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (!/(?=.*[A-Z])(?=.*[a-z])(?=.*\d)/.test(newPassword)) {
    return { error: "Must include uppercase, lowercase, and a number." };
  }

  const supabase = serviceClient();
  const { admin, error: fetchErr } = await getStateAdmin(supabase);
  if (fetchErr) return { error: fetchErr };

  const { error: authError } = await supabase.auth.admin.updateUserById(
    admin.id,
    { password: newPassword },
  );

  if (authError) {
    return { error: "Failed to update password." };
  }

  return { success: true };
}
