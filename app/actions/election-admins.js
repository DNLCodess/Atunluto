"use server";

import { createAdminClient } from "@/supabase/admin";
import { getResultsSession } from "@/app/actions/election-auth";

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
