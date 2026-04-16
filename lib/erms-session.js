/**
 * lib/erms-session.js
 *
 * Pure async utility — no "use server" directive.
 * Importable by Route Handlers, middleware, or any server-side code.
 * Returns the currently authenticated ERMS admin or null.
 */

import { createAdminClient } from "@/supabase/admin";
import { createErmsClient } from "@/supabase/erms-server";

export async function getResultsSession() {
  try {
    const ermsClient = await createErmsClient();

    // getClaims() reads the JWT from erms_sb-* cookies without a network call.
    const { data } = await ermsClient.auth.getClaims();
    const userId = data?.claims?.sub;

    if (!userId) return null;

    const supabase = createAdminClient();
    const { data: admin, error } = await supabase
      .from("election_admins")
      .select(
        "id, email, full_name, role, lga, ward, polling_unit, must_change_password, is_active",
      )
      .eq("id", userId)
      .single();

    if (error || !admin || !admin.is_active) return null;

    return admin;
  } catch {
    return null;
  }
}
