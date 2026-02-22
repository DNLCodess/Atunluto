"use server";

/**
 * app/dev-tools/auth-users/actions.js
 * Server action: delete a single Supabase Auth user via the Admin API.
 * Uses SUPABASE_SERVICE_ROLE_KEY — never exposed to the client.
 */

import { createClient } from "@supabase/supabase-js";

export async function deleteAuthUser(userId) {
  if (!userId) return { error: "User ID is required." };

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return { error: "Server environment variables are not configured." };
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { error } = await adminClient.auth.admin.deleteUser(userId);

  if (error) {
    console.error("[DevTools] deleteAuthUser error:", error);
    return { error: error.message };
  }

  return { success: true, deletedId: userId };
}
